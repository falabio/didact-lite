import { createClient } from "@libsql/client";

import path from 'path';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const localPath = path.join(process.cwd(), "questions.db");

export const db = createClient({
  url: url || `file:${localPath}`,
  authToken: authToken,
});
