import type { APIRoute } from 'astro';
import { provisionSession } from '../../../lib/auth';

export const prerender = false;

/**
 * Exchanges a verified social identity for a first-party session token that
 * can be handed to the native app.
 *
 * Why this exists
 * ---------------
 * Neon Auth's `/get-session` needs a *session challenge cookie* that is scoped
 * to the Neon domain. Chrome will not send it to `unmindful.vercel.app`
 * (cross-site), so the app's server cannot resolve the OAuth return on its own:
 *
 *   GET {neonAuthUrl}/get-session?neon_auth_session_verifier=...
 *   -> {"code":"SESSION_CHALLENGE_COOKIE_NOT_FOUND"}
 *
 * The browser *can* resolve it, because it holds that cookie — that is exactly
 * what the web `AuthCard` does. So `/auth/mobile` runs in the browser, resolves
 * the session with `credentials: 'include'`, and calls this endpoint to turn
 * the verified identity into a token the native app can store.
 *
 * Security note: this mirrors the trust model of the existing
 * `/api/auth/login-social` — both provision a session for a supplied
 * identity and rely on the caller having verified it upstream. Tightening that
 * requires Neon Auth to expose a server-verifiable session token.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { email, id } = data ?? {};

    if (!email || !id) {
      return new Response(JSON.stringify({ error: 'Email and ID are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { token, maxAge, userId, email: normEmail } = await provisionSession({
      id,
      email,
    });

    return new Response(
      JSON.stringify({
        success: true,
        token,
        maxAge,
        user: { id: userId, email: normEmail },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('mobile-exchange failed:', err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Failed to create a session.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};