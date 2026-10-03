import type { APIRoute } from 'astro';
import { buildSessionCookie, provisionSession } from '../../../lib/auth';

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

    // Register-if-missing + mint a 30-day first-party session.
    const { token, maxAge, userId, email: normEmail } = await provisionSession({
      id,
      email
    });

    return new Response(
      JSON.stringify({ success: true, user: { id: userId, email: normEmail } }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': buildSessionCookie(token, maxAge, request.url)
        }
      }
    );
  } catch (err: any) {
    console.error('Error in login-social API:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};