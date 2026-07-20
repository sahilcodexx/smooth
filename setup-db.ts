import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  console.log('Posts table created successfully.');
}

main().catch(console.error);
