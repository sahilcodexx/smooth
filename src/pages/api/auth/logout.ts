import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import { clearSessionCookie } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  headers.append('Set-Cookie', clearSessionCookie('session_token', request.url));
  headers.append('Set-Cookie', clearSessionCookie('better-auth.session_token', request.url));

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
                Cookie: cookieHeader,
                Origin: new URL(request.url).origin,
              },
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
