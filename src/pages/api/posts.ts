import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import { getSessionUser } from '../../lib/auth';

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
    const { id, title, content } = data;

    if (!id || !content) {
      return new Response(JSON.stringify({ error: 'ID and content are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(import.meta.env.DATABASE_URL);

    // Verify ownership of the post if it already exists
    const existing = await sql`SELECT user_id FROM posts WHERE id = ${id} LIMIT 1;`;
    if (existing.length > 0) {
      const ownerId = existing[0].user_id;
      // If the post has an owner and it doesn't match the current logged-in user
      if (ownerId && ownerId !== user.id) {
        return new Response(JSON.stringify({ error: 'Forbidden. You do not own this post.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Upsert the post with user_id mapping
    await sql`
      INSERT INTO posts (id, title, content, user_id, updated_at)
      VALUES (${id}, ${title}, ${content}, ${user.id}, CURRENT_TIMESTAMP)
      ON CONFLICT (id) 
      DO UPDATE SET 
        title = EXCLUDED.title, 
        content = EXCLUDED.content, 
        updated_at = CURRENT_TIMESTAMP;
    `;

    return new Response(JSON.stringify({ success: true, id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error saving post to DB:', error);
    return new Response(JSON.stringify({ error: 'Failed to save post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const user = await getSessionUser(request.headers.get('Cookie'));
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Please sign in.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await request.json();
    const { id, ids } = data;

    if (!id && (!ids || ids.length === 0)) {
      return new Response(JSON.stringify({ error: 'ID or IDs array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(import.meta.env.DATABASE_URL);
    
    // Scoped delete to prevent unauthorized deletions
    if (ids && Array.isArray(ids)) {
      await sql`DELETE FROM posts WHERE id = ANY(${ids}) AND user_id = ${user.id}`;
    } else if (id) {
      await sql`DELETE FROM posts WHERE id = ${id} AND user_id = ${user.id}`;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting posts:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete posts' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await getSessionUser(request.headers.get('Cookie'));
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Please sign in.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(import.meta.env.DATABASE_URL);
    // Fetch only if it belongs to the logged-in user
    const posts = await sql`SELECT * FROM posts WHERE id = ${id} AND user_id = ${user.id}`;
    const post = posts[0];

    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found or unauthorized' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ post }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
