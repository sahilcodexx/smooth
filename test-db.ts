import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const result = await sql`SELECT 1 as connected`;
  console.log('Database connection successful!', result);
}

main().catch(console.error);
