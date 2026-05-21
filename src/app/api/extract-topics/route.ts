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

        if (!isPremium && !isOwner) {
            return new Response(JSON.stringify({ error: "Premium feature only. Please upgrade." }), { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        if (!file) return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const prompt = `Extract all weekly topics from this document. Output ONLY a JSON array of objects: [ { "topic": "Name", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "objectives": "..." } ]`;

        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
            { inlineData: { data: buffer.toString('base64'), mimeType: file.type || "application/pdf" } },
            { text: prompt }
        ], {
            generationConfig: { responseMimeType: 'application/json' }
        } as any);

        const parsed = JSON.parse(result.response.text() || "[]");
        return new Response(JSON.stringify(parsed), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error: any) {
        console.error("Extraction Error:", error);
        return new Response(JSON.stringify({ error: error.message || 'Extraction failed' }), { status: 500 });
    }
}
