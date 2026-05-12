import * as GenerativeAI from '@google/generative-ai';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const genAI = new GenerativeAI.GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const user = await currentUser();
        const isPremium = user?.publicMetadata?.isPremium === true || 
                        (user?.publicMetadata?.premiumUntil && new Date(String(user?.publicMetadata?.premiumUntil)) > new Date());
        
        if (!isPremium && user?.primaryEmailAddress?.emailAddress !== 'felixalabi26@gmail.com') {
            return NextResponse.json({ error: "Premium feature: Upgrade to predict future questions." }, { status: 403 });
        }

        const { topic, pastQuestions } = await req.json();

        if (!topic || !pastQuestions || pastQuestions.length === 0) {
            return NextResponse.json({ error: "Topic and past questions are required" }, { status: 400 });
        }

        // Limit context to the last 5 questions for cost efficiency
        const contextQuestions = pastQuestions.slice(0, 5).map((q: any, i: number) => 
            `Q${i+1}: ${q.question} \nOptions: ${JSON.stringify(q.options)} \nAnswer: ${q.correctAnswer || 'Unknown'} \nYear: ${q.year}`
        ).join('\n\n');

        const prompt = `
You are an expert Chief Examiner for the Nigerian NECO/BECE board.
We are preparing for the upcoming 2026 BECE Exam.
The topic is: "${topic}".

Here are the actual past BECE questions on this topic from recent years:
${contextQuestions}

Your task:
Analyze the difficulty, structure, language style, and typical distractors of these past BECE questions. 
Then, generate exactly ONE highly probable, simulated 2026 BECE question that fits this exact mold but introduces a slight modern twist or new angle expected in 2026.

Output MUST be strictly JSON:
{
  "question": "The simulated 2026 question text here...",
  "options": {
    "A": "...",
    "B": "...",
    "C": "...",
    "D": "..."
  },
  "correctAnswer": "A",
  "explanation": "Briefly explain why this is the likely 2026 approach and the rationale for the answer."
}
`;

        const model = genAI.getGenerativeModel({ model: 'gemini-3.1-pro-preview' });
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
        });

        const parsed = JSON.parse(result.response.text() || "{}");
        return NextResponse.json(parsed, { status: 200 });

    } catch (error: any) {
        console.error("Predict Question Error:", error);
        return NextResponse.json({ error: error.message || "Prediction failed" }, { status: 500 });
    }
}
