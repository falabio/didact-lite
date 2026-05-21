import * as GenerativeAI from '@google/generative-ai';
import { currentUser } from '@clerk/nextjs/server';
import { runPlanner, runVerifier, runRefiner } from '@/lib/agents';
import { db } from '@/lib/db';
export const maxDuration = 300; // Allow up to 5 minutes for the multi-agent loop

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server Error", detail: "Missing GEMINI_API_KEY" }), { status: 500 });
  }

  const encoder = new TextEncoder();
  const body = await req.json();
  const { term, subject, classGrade, items, periodConfig, contentLength, session, teacherName } = body;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
      };

      try {
        const genAI = new GenerativeAI.GoogleGenerativeAI(apiKey);
        const user = await currentUser();
        
        const isPremium = user?.publicMetadata?.isPremium === true || 
                        (user?.publicMetadata?.premiumUntil && new Date(String(user.publicMetadata.premiumUntil)) > new Date());
        const isOwner = user?.primaryEmailAddress?.emailAddress === 'felixalabi26@gmail.com';
        
        const primaryModel = (isPremium || isOwner) ? 'gemini-2.5-flash' : 'gemini-2.5-flash-lite';

        if (!isPremium && !isOwner && user?.id) {
          const result = await db.execute({
            sql: "SELECT free_plans_generated FROM users WHERE clerk_id = ?",
            args: [user.id]
          });
          
          let usage = 0;
          if (result.rows.length > 0) {
            usage = result.rows[0].free_plans_generated as number;
          }
          
          if (usage >= 5) {
            send({ status: 'error', upgradeRequired: true, message: 'Free usage limit reached. Please upgrade to Premium.' });
            controller.close();
            return;
          }
          
          if (result.rows.length === 0) {
            await db.execute({
              sql: "INSERT INTO users (clerk_id, free_plans_generated) VALUES (?, 1)",
              args: [user.id]
            });
          } else {
            await db.execute({
              sql: "UPDATE users SET free_plans_generated = free_plans_generated + 1 WHERE clerk_id = ?",
              args: [user.id]
            });
          }
        }


        if (!items || items.length === 0) {
          send({ status: 'error', message: 'No topics provided.' });
          controller.close();
          return;
        }

        const p1Duration = periodConfig?.p1 || "80 mins";
        const p2Duration = periodConfig?.p2 || "40 mins";

        // --- STEP 1: SCHEME OF WORK ---
        send({ status: 'planning', step: 1, message: 'Structuring the Scheme of Work...' });
        const sowPrompt = `
You are an expert curriculum architect for Nigerian schools.
Generate a Scheme of Work JSON for:
Subject: ${subject} | Class: ${classGrade} | Term: ${term} | Session: ${session}

Input Topics:
${items.map((i: any) => `- Week ${i.week}: ${i.topic}`).join('\n')}

Output MUST be strictly JSON:
{
  "schemeOfWork": [ { "week": "1", "topic": "...", "objectives": "..." } ]
}
`;
        const sowData = await runPlanner(genAI, primaryModel, sowPrompt);

        // --- STEP 2: BATCHED PARALLEL WEEKLY PLANS (STABILITY + SPEED) ---
        send({ status: 'generating', step: 2, message: 'Architecting curriculum in optimized batches...', progress: 10 });
        
        const weeklyPlans = [];
        const CHUNK_SIZE = 4;
        
        for (let i = 0; i < items.length; i += CHUNK_SIZE) {
          const chunk = items.slice(i, i + CHUNK_SIZE);
          const chunkPromises = chunk.map(async (item: any, idxInChunk: number) => {
            const globalIdx = i + idxInChunk;

            // Fetch a real active online educational resource URL via Google Search Grounding
            let fetchedUrl = '';
            try {
              const searchModel = genAI.getGenerativeModel({ 
                model: 'gemini-2.5-flash', 
                tools: [{ googleSearch: {} } as any] 
              });
              const searchPrompt = `Find a highly relevant, real, active online learning resource, interactive lesson, simulation, or video (from reputable platforms like Khan Academy, PhET, Wikipedia, BBC Bitesize, CK-12, or YouTube) for teaching this school topic:
Subject: ${subject} | Topic: ${item.topic} | Class: ${classGrade}

Respond with ONLY the single primary URL. Do not include any other text or markdown or backticks.`;
              const searchResult = await searchModel.generateContent(searchPrompt);
              const textResult = searchResult.response.text().trim();
              if (textResult && (textResult.startsWith('http://') || textResult.startsWith('https://') || textResult.includes('http'))) {
                // Extract clean URL in case the model added markdown or formatting
                const match = textResult.match(/https?:\/\/[^\s`"]+/);
                if (match) {
                  fetchedUrl = match[0];
                }
              }
            } catch (searchErr) {
              console.error(`Search grounding failed for Week ${item.week}`, searchErr);
            }

            const realUrlInstruction = fetchedUrl 
              ? `For this week, the primary recommended online learning resource is: "${fetchedUrl}". You MUST include this specific URL ("${fetchedUrl}") inside both the "period1.reference" and "period2.reference" JSON fields along with any relevant standard textbook references.`
              : `You MUST provide a real, active, specific online educational learning URL (like Khan Academy, PhET, CK-12, or YouTube) inside the "period1.reference" and "period2.reference" fields.`;

            const weekPrompt = `
You are ${teacherName || 'a Master Teacher'}, a Master Teacher at a top Nigerian Private School.
Generate an exceptionally detailed Lesson Plan for Week ${item.week}.

CONTEXT:
Subject: ${subject} | Class: ${classGrade} | Topic: ${item.topic}
Timing: Period 1 (${p1Duration}), Period 2 (${p2Duration})
Pedagogy: Use "I Do, We Do, You Do", Creative Hook, Detailed Content, specific Evaluation questions.
DEPTH: ${contentLength}.

STRICT ALIGNMENT & DUMMY TEXT INSTRUCTIONS:
1. SUBJECT INTEGRITY: Content must be strictly and 100% relevant to the subject of "${subject}". Do NOT include or mix in content/examples from unrelated subjects (e.g. absolutely NO computer/ICT/information technology elements inside Agricultural Science or Mathematics plans).
2. NO DUMMY NAME LEAKS: Do NOT use the teacher's name ("${teacherName || ''}") or school name as fictional characters, examples, or word problem placeholders inside any part of the plan. If you need names in word problems or class activities, use common Nigerian names (like "Tunde", "Amina", "Chidi", "Yinka", etc.) instead.
3. SVG GEOMETRY DRAWINGS (FOR MATHEMATICS): If the subject is Mathematics and the week's topic involves geometric shapes, diagrams, graphs, angles, shapes, or grids, you MUST draw them in the "content" or "activities" arrays using clean, standard vector SVG code! Wrap the SVG code inside an xml code block like:
\`\`\`xml
<svg viewBox="0 0 200 200" width="200" height="200" style="margin: 0 auto; display: block;">
  <!-- SVG drawing here (e.g. circle, rect, polygon, line, text for labels) -->
</svg>
\`\`\`
Ensure all shapes have clean styling (e.g. stroke="black" stroke-width="2" fill="none") and clearly labeled dimensions using <text> elements so they are perfectly legible and print clean.
4. MANDATORY REAL REFERENCES & ONLINE SOURCES:
   ${realUrlInstruction}
   In addition to this URL, you may also cite a standard West African/Nigerian textbook (like STAN, Macmillan, Evans, New General Mathematics, Prescribed Agricultural Science, etc.). Specify the exact book title, publisher/author, and chapter/page range. Do NOT use generic placeholders like "NERDC curriculum" or "Reference books".

Output MUST be strictly JSON:
{
  "week": "${item.week}",
  "topic": "${item.topic}",
  "period1": { 
    "periodTitle": "...",
    "duration": "${p1Duration}", 
    "objectives": ["..."], 
    "materials": "...", 
    "reference": "...", 
    "content": ["Detailed pedagogical content...", "..."], 
    "activities": ["Starter: ...", "Instruction: ...", "Guided Practice: ...", "Independent Work: ...", "Plenary: ..."], 
    "strategies": "...", 
    "evaluation": ["..."], 
    "summary": "...", 
    "assignment": "..." 
  },
  "period2": { 
    "periodTitle": "...",
    "duration": "${p2Duration}", 
    "objectives": ["..."], 
    "materials": "...", 
    "reference": "...", 
    "content": ["..."], 
    "activities": ["..."], 
    "strategies": "...", 
    "evaluation": ["..."], 
    "summary": "...", 
    "assignment": "..." 
  }
}
`;
            const plan = await runPlanner(genAI, primaryModel, weekPrompt);
            send({ 
              status: 'generating', 
              step: 2, 
              message: `Finished Week ${item.week}: ${item.topic}`,
              progress: Math.round(((globalIdx + 1) / items.length) * 80) + 10
            });
            return plan;
          });

          const chunkResults = await Promise.all(chunkPromises);
          weeklyPlans.push(...chunkResults);
          
          // Optional: Small cooling delay between batches to respect RPM
          if (i + CHUNK_SIZE < items.length) {
            await new Promise(r => setTimeout(r, 1000));
          }
        }

        // --- STEP 4: COMPLETE ---
        const finalPlan = {
          ...sowData,
          weeklyPlans: weeklyPlans.sort((a: any, b: any) => Number(a.week) - Number(b.week))
        };
        
        send({ status: 'complete', step: 4, data: finalPlan });
        controller.close();

      } catch (error: any) {
        console.error("STREAM ERROR", error);
        send({ status: 'error', message: error.message || "Generation failed." });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: { 
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
