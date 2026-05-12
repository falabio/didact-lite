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

        if (!isPremium && !isOwner) {
            return new Response(JSON.stringify({ error: "Premium feature only. Please upgrade." }), { status: 403 });
        }

        const { originalText, instruction, originalContent, prompt: bulkPrompt } = await req.json();

        if (originalContent && bulkPrompt) {
            // Global Bulk Refinement Mode
            const prompt = `
You are Didact, a master pedagogy AI. Update this complete Lesson Plan JSON object.
Instruction: ${bulkPrompt}

Original JSON:
${originalContent}

Output ONLY the raw updated JSON. Do not include markdown code blocks.
`;
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            return new Response(JSON.stringify({ updatedContent: result.response.text()?.trim() || "" }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        if (!originalText || !instruction) {
            return new Response(JSON.stringify({ error: 'Missing text or instructions' }), { status: 400 });
        }

        const prompt = `
You are an expert AI revision assistant (Didact). Rewrite the text precisely according to the instruction.
Original Text: ${originalText}
Instruction: ${instruction}

Output ONLY the raw replacement text.
`;

        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return new Response(JSON.stringify({ refinedText: result.response.text()?.trim() || "" }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message || 'Generation failed' }), { status: 500 });
    }
}
