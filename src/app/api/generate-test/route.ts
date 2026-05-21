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
    const modelName = (isPremium || isOwner) ? 'gemini-2.5-flash' : 'gemini-2.5-flash-lite';

    const { title, subject, classGrade, items, planContext, bloomLevel, duration, types, teacherName, schoolName } = await req.json();

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

STRICT ALIGNMENT & DUMMY TEXT INSTRUCTIONS:
1. SUBJECT INTEGRITY: All questions must be strictly and 100% relevant to the subject of "${subject}". Do NOT include or mix in questions from unrelated subjects (e.g. absolutely NO computer/ICT/information technology questions inside a test for Agricultural Science or Mathematics).
2. NO DUMMY NAME LEAKS: Do NOT use the teacher's name ("${teacherName || ''}") or school name ("${schoolName || ''}") as fictional characters, examples, or word problem placeholders inside any question or option. If you need names in word problems, use common Nigerian names (like "Tunde", "Amina", "Chidi", "Yinka", etc.) instead.
3. SVG GEOMETRY DRAWINGS (FOR MATHEMATICS): If the subject is Mathematics and any question involves geometric shapes (such as triangles, circles, cylinders, angles, or grids), you can draw them using clean, standard SVG code inside the question text! Wrap the SVG code inside an xml code block like:
\`\`\`xml
<svg viewBox="0 0 200 200" width="200" height="200" style="margin: 0 auto; display: block;">
  <!-- SVG drawing here (e.g. circle, rect, polygon, line, text for labels) -->
</svg>
\`\`\`
Ensure all shapes have clean styling (e.g. stroke="black" stroke-width="2" fill="none") and clearly labeled dimensions using <text> elements so teachers can easily print them.

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
