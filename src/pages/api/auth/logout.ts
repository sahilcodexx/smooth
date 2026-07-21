import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  headers.append('Set-Cookie', 'session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure');
  headers.append('Set-Cookie', 'better-auth.session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure');

  try {
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
      // 1. Terminate Neon Auth session if present
      if (cookieHeader.includes('better-auth.session_token')) {
        const authUrl = import.meta.env.NEON_AUTH_BASE_URL || process.env.NEON_AUTH_BASE_URL;
        if (authUrl) {
          try {
            await fetch(`${authUrl}/sign-out`, {
              method: 'POST',
              headers: {
                'Cookie': cookieHeader
              }
            });
          } catch (err) {
            console.error('Error signing out from Neon Auth:', err);
          }
        }
      }

      // 2. Terminate local custom session if present
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => c.trim().split('='))
      );
      const token = cookies['session_token'];
      
      if (token) {
        const dbUrl = import.meta.env.DATABASE_URL;
        if (dbUrl) {
          const sql = neon(dbUrl);
          await sql`
            DELETE FROM sessions WHERE token = ${token};
          `;
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error during logout:', error);
    return new Response(JSON.stringify({ error: 'Logout failed' }), {
      status: 500,
      headers
    });
  }
};
