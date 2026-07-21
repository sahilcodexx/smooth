import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import { getSessionUser } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await getSessionUser(request.headers.get('Cookie'));
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Please sign in.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await request.json();
    const { posts } = data; // Array of guest posts

    if (!Array.isArray(posts) || posts.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No posts to sync.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(import.meta.env.DATABASE_URL);

    // Batch upsert posts scoped to the authenticated user
    for (const post of posts) {
      const { id, title, content } = post;
      if (!id || !content) continue;

      await sql`
        INSERT INTO posts (id, title, content, user_id, updated_at)
        VALUES (${id}, ${title || 'Untitled Note'}, ${content}, ${user.id}, CURRENT_TIMESTAMP)
        ON CONFLICT (id) 
        DO UPDATE SET 
          title = EXCLUDED.title, 
          content = EXCLUDED.content, 
          user_id = EXCLUDED.user_id,
          updated_at = CURRENT_TIMESTAMP;
      `;
    }

    return new Response(JSON.stringify({ success: true, message: `${posts.length} posts synced successfully.` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error syncing local posts:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to sync posts.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
