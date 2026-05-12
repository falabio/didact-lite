import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const subject = searchParams.get('subject') || '';
    
    try {
        let sql = 'SELECT * FROM questions WHERE 1=1';
        const params: any[] = [];
        
        if (query) {
            sql += ' AND (question_text LIKE ? OR academic_topics LIKE ?)';
            params.push(`%${query}%`, `%${query}%`);
        }
        
        if (subject && subject !== 'All') {
            sql += ' AND subject = ?';
            params.push(subject);
        }
        
        sql += ' ORDER BY id DESC LIMIT 100';
        
        const result = await db.execute({ sql, args: params });
        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Bank GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
        
        await db.execute({ sql: 'DELETE FROM questions WHERE id = ?', args: [id] });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Bank DELETE Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
