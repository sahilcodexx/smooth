export const prerender = false;

import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { id, title, content } = data;

    if (!id || !content) {
      return new Response(JSON.stringify({ error: 'ID and content are required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const sql = neon(import.meta.env.DATABASE_URL);

    // Upsert the post into the Neon database
    await sql`
      INSERT INTO posts (id, title, content, updated_at)
      VALUES (${id}, ${title}, ${content}, CURRENT_TIMESTAMP)
      ON CONFLICT (id) 
      DO UPDATE SET 
        title = EXCLUDED.title, 
        content = EXCLUDED.content, 
        updated_at = CURRENT_TIMESTAMP;
    `;

    return new Response(JSON.stringify({ success: true, id }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error saving post to DB:', error);
    return new Response(JSON.stringify({ error: 'Failed to save post' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
