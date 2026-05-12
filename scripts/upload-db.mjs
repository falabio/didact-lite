import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';

// Load Env
dotenv.config({ path: '.env.local' });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("❌ Missing Turso credentials in .env.local");
  process.exit(1);
}

const localDb = new Database('questions.db');
const remoteDb = createClient({ url, authToken });

async function migrate() {
  console.log("🚀 Starting Migration to Turso...");

  // 1. Create Schema
  console.log("📝 Creating schema on Turso...");
  await remoteDb.execute(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY,
      subject TEXT,
      year INTEGER,
      page_number INTEGER,
      question_number INTEGER,
      question_text TEXT,
      option_a TEXT,
      option_b TEXT,
      option_c TEXT,
      option_d TEXT,
      has_diagram BOOLEAN,
      diagram_image_path TEXT,
      correct_answer TEXT,
      academic_topics TEXT
    )
  `);

  // 2. Fetch Data
  const rows = localDb.prepare("SELECT * FROM questions").all();
  console.log(`📦 Found ${rows.length} rows in local database.`);

  // 3. Batch Upload
  const BATCH_SIZE = 50;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    
    // Prepare batch statements
    const statements = batch.map(row => ({
      sql: `INSERT OR REPLACE INTO questions (
        id, subject, year, page_number, question_number, question_text, 
        option_a, option_b, option_c, option_d, 
        has_diagram, diagram_image_path, correct_answer, academic_topics
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        row.id, row.subject, row.year, row.page_number, row.question_number, row.question_text,
        row.option_a, row.option_b, row.option_c, row.option_d,
        row.has_diagram ? 1 : 0, row.diagram_image_path, row.correct_answer, row.academic_topics
      ]
    }));

    try {
      await remoteDb.batch(statements);
      console.log(`✅ Uploaded batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(rows.length / BATCH_SIZE)}`);
    } catch (err) {
      console.error(`❌ Error in batch ${i}:`, err.message);
    }
  }

  console.log("🏁 Migration Complete!");
  process.exit(0);
}

migrate().catch(err => {
  console.error("🔥 Fatal Migration Error:", err);
  process.exit(1);
});
