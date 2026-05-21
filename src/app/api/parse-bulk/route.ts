import { GoogleGenerativeAI } from '@google/generative-ai';
import { currentUser } from '@clerk/nextjs/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const user = await currentUser();
        const isOwner = user?.primaryEmailAddress?.emailAddress === 'felixalabi26@gmail.com';
        if (user?.publicMetadata?.isPremium !== true && !isOwner) {
            return new Response(JSON.stringify({ error: "Premium feature only. Please upgrade." }), { status: 403 });
        }

        const { text } = await req.json();

        if (!text) {
            return new Response(JSON.stringify({ error: "No text provided" }), { status: 400 });
        }

        const currentYear = new Date().getFullYear();

        const prompt = `
You are a parser. The user pasted a list of topics that includes date ranges. 
Extract the weekly structure. The current year is ${currentYear}.
Output ONLY a JSON array of objects with the exact structure:
[
  {
    "topic": "Name of the topic here (Do not include objectives in this field)",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "objectives": "Any explicit objectives provided in the text for this topic. Leave as empty string if none."
  }
]
If a date is impossible to infer or find, leave it as an empty string "". 
Ensure it is only valid JSON data.
Input Text:
${text}
`;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
        });

        const parsed = JSON.parse(result.response.text() || "[]");
        return new Response(JSON.stringify(parsed), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error: any) {
        console.error("AI Parse Error", error);
        return new Response(JSON.stringify({ error: error.message || 'Generation failed' }), { status: 500 });
    }
}
