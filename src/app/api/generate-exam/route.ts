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

    const { subject, classGrade, term, topics, planContent, bloomLevel, duration, teacherName, schoolName } = await req.json();

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

STRICT ALIGNMENT & DUMMY TEXT INSTRUCTIONS:
1. SUBJECT INTEGRITY: All questions must be strictly and 100% relevant to the subject of "${subject}". Do NOT include or mix in questions from unrelated subjects (e.g. absolutely NO computer/ICT/information technology questions inside a test/exam for Agricultural Science or Mathematics).
2. NO DUMMY NAME LEAKS: Do NOT use the teacher's name ("${teacherName || ''}") or school name ("${schoolName || ''}") as fictional characters, examples, or word problem placeholders inside any question or option. If you need names in word problems, use common Nigerian names (like "Tunde", "Amina", "Chidi", "Yinka", etc.) instead.
3. SVG GEOMETRY DRAWINGS (FOR MATHEMATICS): If the subject is Mathematics and any question involves geometric shapes (such as triangles, circles, cylinders, angles, or grids), you can draw them using clean, standard SVG code inside the question text! Wrap the SVG code inside an xml code block like:
\`\`\`xml
<svg viewBox="0 0 200 200" width="200" height="200" style="margin: 0 auto; display: block;">
  <!-- SVG drawing here (e.g. circle, rect, polygon, line, text for labels) -->
</svg>
\`\`\`
Ensure all shapes have clean styling (e.g. stroke="black" stroke-width="2" fill="none") and clearly labeled dimensions using <text> elements so teachers can easily print them.

Output strictly JSON:
{
  "title": "${classGrade} ${subject} - ${term} Exam",
  "instructions": "...",
  "sections": [ { "sectionTitle": "...", "type": "mcq", "questions": [...] } ],
  "answerKey": { }
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
