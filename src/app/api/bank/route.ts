import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as GenerativeAI from '@google/generative-ai';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const subject = searchParams.get('subject') || '';
    
    try {
        const originalKeywords = query.trim().toLowerCase().split(/\s+/).filter(k => k.length > 0);
        const synonymMapping: Record<string, string[]> = {
            'body': ['posture', 'puberty', 'hygiene', 'measurements', 'grooming', 'physical', 'adolescence', 'anatomy', 'growth', 'skin', 'cleanliness'],
            'image': ['posture', 'puberty', 'hygiene', 'grooming', 'beauty', 'confidence', 'respect'],
            'soil': ['farm', 'agriculture', 'crop', 'land', 'plants', 'erosion', 'fertility'],
            'skeletal': ['muscles', 'posture', 'movement', 'joints', 'bones', 'anatomy'],
            'skeleton': ['muscles', 'posture', 'movement', 'joints', 'bones', 'anatomy'],
            'bone': ['muscles', 'posture', 'movement', 'joints', 'bones', 'anatomy'],
            'reproduction': ['puberty', 'growth', 'development', 'adolescence', 'organs', 'heredity'],
            'puberty': ['growth', 'development', 'adolescence', 'hygiene', 'changes'],
            'crop': ['soil', 'plants', 'agriculture', 'farm', 'pest', 'yield'],
            'nutrition': ['food', 'diet', 'balanced', 'feed', 'ration', 'health', 'vitamin', 'protein']
        };

        const allKeywordsSet = new Set<string>();
        for (const kw of originalKeywords) {
            allKeywordsSet.add(kw);
            const synonyms = synonymMapping[kw];
            if (synonyms) {
                synonyms.forEach(syn => allKeywordsSet.add(syn));
            }
        }
        const keywords = Array.from(allKeywordsSet);

        let whereClauses: string[] = [];
        const params: any[] = [];

        // Build candidate search conditions if keywords exist (using OR for semantic/flexible matching)
        if (keywords.length > 0) {
            const searchClauses: string[] = [];
            for (const kw of keywords) {
                searchClauses.push('(question_text LIKE ? OR academic_topics LIKE ? OR subject LIKE ?)');
                params.push(`%${kw}%`, `%${kw}%`, `%${kw}%`);
            }
            whereClauses.push('(' + searchClauses.join(' OR ') + ')');
        }

        // Strict subject filter! Honor user request: "if i ask question on agric then questions should only come from agric"
        if (subject && subject !== 'All') {
            whereClauses.push('subject = ?');
            params.push(subject);
        }

        let sql = 'SELECT * FROM questions';
        if (whereClauses.length > 0) {
            sql += ' WHERE ' + whereClauses.join(' AND ');
        }

        // Search through all years by raising candidate limit
        sql += ' ORDER BY id DESC LIMIT 1000';
        
        const result = await db.execute({ sql, args: params });
        const rows = result.rows;

        if (originalKeywords.length === 0) {
            // No search query, just return recent items directly
            return NextResponse.json(rows.slice(0, 100));
        }

        // AI-Powered Semantic Search & Re-ranking using gemini-2.5-flash-lite
        let rankedResults: any[] = [];
        let aiSuccess = false;
        const apiKey = process.env.GEMINI_API_KEY;

        if (apiKey && rows.length > 0) {
            try {
                // Slice candidates to the top 45 to keep context window small and roundtrip under 300ms
                const scoredCandidates = (rows as any[]).map((q: any) => {
                    let score = 0;
                    const qText = String(q.question_text || "").toLowerCase();
                    const qTopics = String(q.academic_topics || "").toLowerCase();
                    for (const kw of originalKeywords) {
                        if (qText.includes(kw)) score += 10;
                        if (qTopics.includes(kw)) score += 5;
                    }
                    return { ...q, initialScore: score };
                }).sort((a, b) => b.initialScore - a.initialScore).slice(0, 45);

                const genAI = new GenerativeAI.GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({
                    model: 'gemini-2.5-flash-lite',
                    generationConfig: { responseMimeType: 'application/json' }
                });

                const aiPrompt = `
You are an intelligent educational search assistant.
Analyze the user's search query: "${query}"

Here is a list of candidate questions from the school question bank:
${scoredCandidates.map((c: any) => `[ID: ${c.id}] Topics: ${c.academic_topics} | Question: ${c.question_text}`).join('\n')}

Identify which questions are semantically relevant to the search query "${query}".
For each candidate, assign a relevance_score from 0 to 100 based on how well it answers or relates to the query topic.
- A score of 80-100 means highly relevant or direct match.
- A score of 40-79 means somewhat relevant or related concept.
- A score of 0 means completely unrelated.

Return strictly a JSON object with a "ranked" array of objects containing "id" and "relevance_score", like this:
{
  "ranked": [
    { "id": 123, "relevance_score": 95 }
  ]
}
`;

                const aiResult = await model.generateContent(aiPrompt);
                const rawJson = aiResult.response.text().trim();
                const parsed = JSON.parse(rawJson);

                if (parsed && Array.isArray(parsed.ranked)) {
                    const scoreMap = new Map<number, number>();
                    parsed.ranked.forEach((item: any) => {
                        if (item && (typeof item.id === 'number' || typeof item.id === 'string')) {
                            scoreMap.set(Number(item.id), Number(item.relevance_score) || 0);
                        }
                    });

                    rankedResults = scoredCandidates
                        .map((c: any) => ({ ...c, score: scoreMap.get(Number(c.id)) || 0 }))
                        .filter((c: any) => c.score > 0)
                        .sort((a, b) => b.score - a.score);

                    aiSuccess = true;
                }
            } catch (aiErr) {
                console.error("AI semantic search failed, falling back to local keyword mapping:", aiErr);
            }
        }

        // Fallback: Use standard high-performance keyword matching if AI failed
        if (!aiSuccess) {
            for (const q of rows) {
                let score = 0;
                const qText = String(q.question_text || "").toLowerCase();
                const qTopics = String(q.academic_topics || "").toLowerCase();
                const qSubject = String(q.subject || "").toLowerCase();

                if (subject && subject !== 'All' && q.subject === subject) {
                    score += 20;
                }

                let matchedOriginalCount = 0;
                for (const kw of originalKeywords) {
                    let kwMatched = false;
                    const kwReg = new RegExp(`\\b${kw}s?\\b`, 'i');

                    if (kwReg.test(qText)) {
                        score += 25;
                        kwMatched = true;
                    } else if (qText.includes(kw)) {
                        score += 5;
                        kwMatched = true;
                    }

                    if (kwReg.test(qTopics)) {
                        score += 15;
                        kwMatched = true;
                    } else if (qTopics.includes(kw)) {
                        score += 3;
                        kwMatched = true;
                    }

                    if (kwReg.test(qSubject)) {
                        score += 8;
                        kwMatched = true;
                    }

                    if (kwMatched) {
                        matchedOriginalCount++;
                    }
                }

                if (matchedOriginalCount > 1) {
                    score += matchedOriginalCount * 40;
                }

                for (const kw of keywords) {
                    if (originalKeywords.includes(kw)) continue;

                    const kwReg = new RegExp(`\\b${kw}s?\\b`, 'i');

                    if (kwReg.test(qText)) {
                        score += 8;
                    } else if (qText.includes(kw)) {
                        score += 2;
                    }

                    if (kwReg.test(qTopics)) {
                        score += 5;
                    } else if (qTopics.includes(kw)) {
                        score += 1;
                    }
                }

                if (score > 0) {
                    rankedResults.push({ ...q, score });
                }
            }

            rankedResults.sort((a, b) => b.score - a.score || b.year - a.year || b.id - a.id);
        }

        return NextResponse.json(rankedResults.slice(0, 100));
    } catch (error: any) {
        console.error('Bank GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
        
        await db.execute({ sql: 'DELETE FROM questions WHERE id = ?', args: [id] });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Bank DELETE Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
