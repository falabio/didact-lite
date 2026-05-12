
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const diagnostic: any = {
    env: {
      TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? "SET" : "MISSING",
      HAS_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? "YES" : "NO",
      CWD: process.cwd(),
    },
    files: {},
    dbTest: null
  };

  try {
    const dbPath = path.join(process.cwd(), "questions.db");
    diagnostic.files["questions.db"] = {
        exists: fs.existsSync(dbPath),
        path: dbPath
    };
  } catch (e: any) { diagnostic.files.error = e.message; }

  try {
    const res = await db.execute("SELECT count(*) as count FROM questions");
    diagnostic.dbTest = {
        success: true,
        count: (res.rows[0] as any).count
    };
  } catch (e: any) {
    diagnostic.dbTest = {
        success: false,
        error: e.message,
        stack: e.stack?.substring(0, 200)
    };
  }

  return NextResponse.json(diagnostic);
}
