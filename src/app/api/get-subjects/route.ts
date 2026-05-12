import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const result = await db.execute('SELECT DISTINCT subject FROM questions ORDER BY subject');
    const subjects = result.rows.map((r: any) => r.subject).filter(Boolean);
    return NextResponse.json(subjects);
  } catch (error: any) {
    console.error('Get Subjects Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
