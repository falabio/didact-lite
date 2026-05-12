import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as GenerativeAI from '@google/generative-ai';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Server Configuration Error", detail: "GEMINI_API_KEY is missing." }, { status: 500 });
    
    const genAI = new GenerativeAI.GoogleGenerativeAI(apiKey);
    const user = await currentUser();
    
    const premiumUntil = user?.publicMetadata?.premiumUntil;
    const isPremiumFlag = user?.publicMetadata?.isPremium === true;
    const isPremium = isPremiumFlag || (premiumUntil && new Date(String(premiumUntil)) > new Date());
    const isOwner = user?.primaryEmailAddress?.emailAddress === 'felixalabi26@gmail.com';
    
    const modelName = (isPremium || isOwner) ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';

    const body = await req.json();
    const { topic, subject } = body;
    
    if (!topic || !subject) {
        return NextResponse.json({ error: 'Input Error', detail: 'Topic and Subject are required for search.' }, { status: 400 });
    }

    const safetySettings = [
      { category: GenerativeAI.HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: GenerativeAI.HarmBlockThreshold.BLOCK_NONE },
      { category: GenerativeAI.HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: GenerativeAI.HarmBlockThreshold.BLOCK_NONE },
      { category: GenerativeAI.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: GenerativeAI.HarmBlockThreshold.BLOCK_NONE },
      { category: GenerativeAI.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: GenerativeAI.HarmBlockThreshold.BLOCK_NONE },
    ];
    
    const model = genAI.getGenerativeModel({ model: modelName, safetySettings });

    const query = `
      SELECT * FROM questions 
      WHERE (LOWER(subject) = LOWER(?) OR LOWER(?) LIKE '%' || LOWER(subject) || '%' OR LOWER(subject) LIKE '%' || LOWER(?) || '%')
      AND (question_text LIKE ? OR academic_topics LIKE ?) 
      ORDER BY year DESC, id ASC
      LIMIT 50
    `;

    const subWild = `%${subject}%`;
    const searchWild = `%${topic}%`;
    
    const initialRes = await db.execute({ sql: query, args: [subject, subject, subject, searchWild, searchWild] });
    let questions = [...initialRes.rows];

    if (questions.length === 0) {
      const fallbackRes = await db.execute({
        sql: `SELECT * FROM questions WHERE (question_text LIKE ? OR academic_topics LIKE ?) LIMIT 50`,
        args: [searchWild, searchWild]
      });
      questions = [...fallbackRes.rows];
    }

    if (questions.length < 10) {
      try {
        const expansionPrompt = `Generate 5-8 comma-separated keywords related to "${topic}" in BECE ${subject}. Return ONLY the keywords.`;
        const result = await model.generateContent(expansionPrompt);
        const keywordsText = result.response.text();
        const keywords = keywordsText.split(',').map(t => `%${t.trim()}%`);
        
        for (const k of keywords) {
          if (questions.length >= 50) break;
          const res = await db.execute({ sql: query, args: [subject, subject, subject, k, k] });
          for (const row of res.rows) {
            if (!questions.find(q => (q as any).id === (row as any).id)) questions.push(row);
          }
        }
      } catch (err) { }
    }

    // Only solve the first 5 questions if they missing answers to avoid timeouts/rate-limits
    const topQuestions = questions.filter((q:any) => {
        const qSub = (q.subject || "").toLowerCase().trim();
        const sSub = (subject || "").toLowerCase().trim();
        return qSub.includes(sSub) || sSub.includes(qSub) || qSub.length === 0;
    }).slice(0, 10);

    const solvedQuestions = await Promise.all(topQuestions.map(async (q: any) => {
      if (!q.correct_answer) {
        try {
          const prompt = `Solve this BECE ${q.subject} question. Return ONLY 0 for A, 1 for B, 2 for C, or 3 for D.\n\n${q.question_text}\n\nA: ${q.option_a}\nB: ${q.option_b}\nC: ${q.option_c}\nD: ${q.option_d}`;
          const res = await model.generateContent(prompt);
          const ans = res.response.text().trim();
          if (/^[0-3]$/.test(ans)) return { ...q, correct_answer: ans, is_ai_generated: true };
        } catch (err) { }
      }
      return { ...q, is_ai_generated: false };
    }));

    return NextResponse.json(solvedQuestions);
  } catch (error: any) {
    console.error('SEARCH ERROR:', error);
    return NextResponse.json({ 
        error: "Search Failed", 
        detail: `[DB/AI Error]: ${error.message}`
    }, { status: 500 });
  }
}
