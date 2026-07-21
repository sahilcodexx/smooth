import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import crypto from 'node:crypto';
import { buildSessionCookie, initAuthTables, hashPassword } from '../../../lib/auth';

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

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters long' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await initAuthTables();
    const dbUrl = import.meta.env.DATABASE_URL;
    const sql = neon(dbUrl);

    // Check if user already exists
    const existing = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1;
    `;

    if (existing.length > 0) {
      return new Response(JSON.stringify({ error: 'A user with this email already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = crypto.randomUUID();
    const passwordHash = hashPassword(password);

    // Insert user
    await sql`
      INSERT INTO users (id, email, password_hash)
      VALUES (${userId}, ${email.toLowerCase().trim()}, ${passwordHash});
    `;

    // Create session token
    const token = crypto.randomBytes(32).toString('hex');
    const sessionId = crypto.randomUUID();
    const maxAge = 30 * 24 * 60 * 60; // 30 days
    const expiresAt = new Date(Date.now() + maxAge * 1000);

    await sql`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (${sessionId}, ${userId}, ${token}, ${expiresAt});
    `;

    return new Response(JSON.stringify({ success: true, user: { id: userId, email } }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': buildSessionCookie(token, maxAge, request.url)
      }
    });

  } catch (error) {
    console.error('Error during registration:', error);
    return new Response(JSON.stringify({ error: 'Registration failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
