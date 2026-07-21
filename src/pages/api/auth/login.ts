import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import crypto from 'node:crypto';
import { buildSessionCookie, initAuthTables, verifyPassword } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { email, password } = data;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await initAuthTables();
    const dbUrl = import.meta.env.DATABASE_URL;
    const sql = neon(dbUrl);

    // Fetch user
    const users = await sql`
      SELECT id, email, password_hash FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1;
    `;

    if (users.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = users[0];
    const isValid = verifyPassword(password, user.password_hash);

    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create session token
    const token = crypto.randomBytes(32).toString('hex');
    const sessionId = crypto.randomUUID();
    const maxAge = 30 * 24 * 60 * 60; // 30 days
    const expiresAt = new Date(Date.now() + maxAge * 1000);

    await sql`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (${sessionId}, ${user.id}, ${token}, ${expiresAt});
    `;

    return new Response(JSON.stringify({ success: true, user: { id: user.id, email: user.email } }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': buildSessionCookie(token, maxAge, request.url)
      }
    });

  } catch (error) {
    console.error('Error during login:', error);
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
