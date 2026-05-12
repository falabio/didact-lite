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

    const { subject, classGrade, term, topics, planContent, bloomLevel, duration } = await req.json();

    const topicsString = topics?.map((t: any) => `- Week ${t.week}: ${t.topic}`).join('\n') || "All topics";
    const detailedPlan = JSON.stringify(planContent);

    const prompt = `
You are a senior Nigerian secondary school examiner. 
Generate a comprehensive Term Examination.
Subject: ${subject}
Class: ${classGrade}
Term: ${term}

SOURCE MATERIAL:
${detailedPlan}

EXAM TOPICS:
${topicsString}

Requirements:
- Bloom's Level: ${bloomLevel}
- Duration: ${duration}
- Sections: Section A (MCQ 15-20), Section B (Short Answer), Section C (Theory)

Output strictly JSON:
{
  "title": "${classGrade} ${subject} - ${term} Exam",
  "instructions": "...",
  "sections": [ { "sectionTitle": "...", "type": "mcq", "questions": [...] } ],
  "answerKey": { ... }
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
