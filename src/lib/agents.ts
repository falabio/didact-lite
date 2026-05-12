import * as GenerativeAI from '@google/generative-ai';

const safetySettings = [
  { category: GenerativeAI.HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: GenerativeAI.HarmBlockThreshold.BLOCK_NONE },
  { category: GenerativeAI.HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: GenerativeAI.HarmBlockThreshold.BLOCK_NONE },
  { category: GenerativeAI.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: GenerativeAI.HarmBlockThreshold.BLOCK_NONE },
  { category: GenerativeAI.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: GenerativeAI.HarmBlockThreshold.BLOCK_NONE },
];

async function runWithRetry(fn: () => Promise<any>, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            const isRateLimit = error.message?.includes('429') || error.message?.includes('Too Many Requests');
            const isTransient = error.message?.includes('500') || error.message?.includes('503') || error.message?.includes('fetch');
            
            if ((isRateLimit || isTransient) && i < maxRetries - 1) {
                const waitTime = isRateLimit ? (i + 1) * 3000 : (i + 1) * 1000;
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }
            throw error;
        }
    }
}

export async function runPlanner(genAI: GenerativeAI.GoogleGenerativeAI, modelName: string, prompt: string) {
  return runWithRetry(async () => {
    const model = genAI.getGenerativeModel({ model: modelName, safetySettings });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });
    return JSON.parse(result.response.text());
  });
}

export async function runVerifier(genAI: GenerativeAI.GoogleGenerativeAI, modelName: string, originalData: any, generatedPlan: any) {
  const prompt = `
You are an expert Auditor for Nigerian Lesson Plans. 
Your task is to verify if the generated lesson plan JSON strictly follows the requirements.

REQUIREMENTS:
- Expected Session: ${originalData.session}
- Period 1 Duration: ${originalData.p1Duration}
- Period 2 Duration: ${originalData.p2Duration}

GENERATED JSON:
${JSON.stringify(generatedPlan, null, 2)}

AUDIT RULES:
1. YEAR CHECK: Does the JSON contain the string "2024/2025" anywhere? If yes, it is an error because the session MUST be "${originalData.session}".
2. FIELD COMPLETENESS: Check "materials", "reference", "evaluation", "assignment", and "summary". If any of these are empty strings ("") or placeholders like "...", it is an error.
3. TIMING CHECK: Verify that activity times (e.g. 20 mins) in each period sum up EXACTLY to the specified duration (${originalData.p1Duration} or ${originalData.p2Duration}).

Output MUST be strictly JSON:
{
  "isPerfect": boolean,
  "errors": [
    { "week": number, "period": 1|2, "errorType": "hallucinated_year" | "missing_content" | "duration_mismatch", "details": "..." }
  ]
}
`;

  return runWithRetry(async () => {
    const model = genAI.getGenerativeModel({ model: modelName, safetySettings });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });
    return JSON.parse(result.response.text());
  });
}

export async function runRefiner(genAI: GenerativeAI.GoogleGenerativeAI, modelName: string, originalPlan: any, errors: any[], targetSession: string) {
  const prompt = `
You are an expert Editor. Fix the following Lesson Plan JSON based on the errors found.

TARGET SESSION: ${targetSession} (MANDATORY: Every mention of the year MUST be this)

ERRORS FOUND:
${JSON.stringify(errors, null, 2)}

INSTRUCTIONS:
1. Fix the session year to ${targetSession} everywhere.
2. If fields like "materials", "reference", or "evaluation" are empty, CREATE high-quality pedagogical content for them based on the topic. DO NOT leave them blank.
3. Fix any timing mismatches.

Output MUST be the FULL corrected JSON object.
`;

  return runWithRetry(async () => {
    const model = genAI.getGenerativeModel({ model: modelName, safetySettings });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { 
          responseMimeType: 'application/json',
          temperature: 0.1 
      }
    });
    return JSON.parse(result.response.text());
  });
}
