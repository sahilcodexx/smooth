import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import crypto from 'node:crypto';
import { buildSessionCookie, initAuthTables } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { email, id } = data;

    if (!email || !id) {
      return new Response(JSON.stringify({ error: 'Email and ID are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await initAuthTables();
    const dbUrl = import.meta.env.DATABASE_URL;
    const sql = neon(dbUrl);

    // 1. Check if user already exists
    const users = await sql`
      SELECT id, email FROM users WHERE id = ${id} OR email = ${email.toLowerCase().trim()} LIMIT 1;
    `;

    let userId = id;

    if (users.length === 0) {
      // 2. Create the user if they don't exist
      await sql`
        INSERT INTO users (id, email, password_hash)
        VALUES (${id}, ${email.toLowerCase().trim()}, 'social-login-google');
      `;
    } else {
      // Use the existing user ID from our table if there's a match
      userId = users[0].id;
    }

    // 3. Create session token
    const token = crypto.randomBytes(32).toString('hex');
    const sessionId = crypto.randomUUID();
    const maxAge = 30 * 24 * 60 * 60; // 30 days
    const expiresAt = new Date(Date.now() + maxAge * 1000);

    await sql`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (${sessionId}, ${userId}, ${token}, ${expiresAt});
    `;

    return new Response(JSON.stringify({ success: true, user: { id: userId, email } }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': buildSessionCookie(token, maxAge, request.url)
      }
    });
  } catch (err: any) {
    console.error('Error in login-social API:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
