import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { topic, classGrade } = await req.json();

        if (!topic) {
            return NextResponse.json({ error: "Topic is required" }, { status: 400 });
        }

        // We fetch up to 15 questions that loosely match the topic
        // We use LIKE %topic% on both subject, question_text and academic_topics
        const queryTerm = `%${topic}%`;
        const result = await db.execute({
            sql: `
                SELECT * FROM questions 
                WHERE (academic_topics LIKE ? OR question_text LIKE ? OR subject LIKE ?)
                AND year BETWEEN 2018 AND 2025
                LIMIT 15
            `,
            args: [queryTerm, queryTerm, queryTerm]
        });

        if (result.rows.length === 0) {
            return NextResponse.json({ 
                error: "No matching BECE questions found for this topic.",
                data: []
            }, { status: 404 });
        }

        // Format into a structured exam format similar to what generate-test provides
        const formattedQuestions = result.rows.map(r => ({
            question: r.question_text,
            options: r.option_a ? {
                "A": r.option_a,
                "B": r.option_b,
                "C": r.option_c,
                "D": r.option_d
            } : undefined,
            correctAnswer: r.correct_answer,
            year: r.year,
            subject: r.subject,
            topic: r.academic_topics
        }));

        const responseData = {
            title: `BECE Topic Exam: ${topic}`,
            instructions: "Answer all questions. These are real past BECE questions from 2018-2025.",
            sections: [
                {
                    sectionTitle: `Section A: ${topic} (Past Questions)`,
                    type: "mcq",
                    questions: formattedQuestions
                }
            ]
        };

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error("Topic Exam Generation Error:", error);
        return NextResponse.json({ error: "Failed to generate topic exam" }, { status: 500 });
    }
}
