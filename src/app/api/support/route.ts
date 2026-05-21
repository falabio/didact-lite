import { NextResponse } from 'next/server';
import * as GenerativeAI from '@google/generative-ai';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    
    const genAI = new GenerativeAI.GoogleGenerativeAI(apiKey);
    const user = await currentUser();
    const premiumUntil = user?.publicMetadata?.premiumUntil;
    const isPremiumFlag = user?.publicMetadata?.isPremium === true;
    const isPremium = isPremiumFlag || (premiumUntil && new Date(String(premiumUntil)) > new Date());
    const isOwner = user?.primaryEmailAddress?.emailAddress === 'felixalabi26@gmail.com';
    
    const modelName = (isPremium || isOwner) ? 'gemini-2.5-flash' : 'gemini-2.5-flash-lite';
    const systemPrompt = `You are "Didact Support", a helpful assistant for the Didact Lesson Planner. 
Your ONLY roles are:
1. Help users navigate the website features (Lesson Planner, Question Bank, Assessments).
2. Collect user feedback about the app.
3. Troubleshooting basic platform issues.

STRICT LIMITATIONS:
- BE EXTREMELY BRIEF AND DIRECT. No unnecessary fluff or introductory filler.
- DO NOT answer general knowledge questions.
- DO NOT write essays, stories, or code.
- DO NOT provide pedagogical advice outside of how to use the tool.
- If asked for something outside these roles, politely state: "I am designed specifically to assist with the Didact platform. How can I help you navigate our features today?"`;

    const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: systemPrompt,
        safetySettings: [
            { category: GenerativeAI.HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: GenerativeAI.HarmBlockThreshold.BLOCK_NONE },
            { category: GenerativeAI.HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: GenerativeAI.HarmBlockThreshold.BLOCK_NONE },
            { category: GenerativeAI.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: GenerativeAI.HarmBlockThreshold.BLOCK_NONE },
            { category: GenerativeAI.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: GenerativeAI.HarmBlockThreshold.BLOCK_NONE },
        ]
    });

    const { messages } = await req.json();

    // Gemini requires the first message in 'history' to be from 'user'.
    // We filter the history to ensure it starts with a 'user' message.
    let history = messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
    }));

    const firstUserIndex = history.findIndex((h: any) => h.role === 'user');
    if (firstUserIndex !== -1) {
        history = history.slice(firstUserIndex);
    } else {
        history = []; // If no user message found, start fresh
    }

    const chat = model.startChat({ history });

    const result = await chat.sendMessage(messages[messages.length - 1].content);
    return NextResponse.json({ content: result.response.text() });
  } catch (error: any) {
    console.error('Support API Error:', error);
    return NextResponse.json({ error: `[GoogleGenerativeAI Error]: ${error.message}` }, { status: 500 });
  }
}
