import * as GenerativeAI from '@google/generative-ai';
import { currentUser } from '@clerk/nextjs/server';

const genAI = new GenerativeAI.GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    const premiumUntil = user?.publicMetadata?.premiumUntil;
    const isPremiumFlag = user?.publicMetadata?.isPremium === true;
    const isPremium = isPremiumFlag || (premiumUntil && new Date(String(premiumUntil)) > new Date());
    const isOwner = user?.primaryEmailAddress?.emailAddress === 'felixalabi26@gmail.com';
    const modelName = (isPremium || isOwner) ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';

    const { title, subject, classGrade, items, planContext, bloomLevel, duration, types } = await req.json();

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'No items provided' }), { status: 400 });
    }

    const topicsString = items.map((i: any) => `- Week ${i.week}: ${i.topic}`).join('\n');
    const detailedContext = JSON.stringify(planContext);

    const prompt = `
You are an expert Nigerian secondary school examiner. 
Generate a Continuous Assessment test titled "${title}".
Subject: ${subject}
Class: ${classGrade}

SOURCE MATERIAL:
${detailedContext}

TEST TOPICS:
${topicsString}

Configuration:
- Bloom's Level: ${bloomLevel}
- Duration: ${duration}
- MUST include these types: ${types.join(', ')}

Output MUST be strictly JSON:
{
  "title": "${title}",
  "instructions": "...",
  "sections": [
    {
      "sectionTitle": "Section A: Multiple Choice",
      "type": "mcq",
      "questions": [ { "question": "...", "options": {"A":"...", "B":"...", "C":"...", "D":"..."} } ]
    },
    {
      "sectionTitle": "Section B: Fill in the Gap",
      "type": "fill_in_gap",
      "questions": [ { "question": "..." } ]
    }
  ],
  "answerKey": { "mcq": [...], "fill_in_gap": [...] }
}
`;

    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });
    const parsed = JSON.parse(result.response.text() || "{}");
    return new Response(JSON.stringify(parsed), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Generation failed' }), { status: 500 });
  }
}
