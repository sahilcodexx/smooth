import type { APIRoute } from 'astro';
import { provisionSession, resolveNeonSession } from '../../../lib/auth';

export const prerender = false;

// The native app registers `smooth://auth/callback` as its redirect target.
// Neon Auth bounces the browser here as a top-level navigation, so the browser
// presents the Better Auth cookie to *this* server. That lets us resolve the
// Neon session here (no third-party cookie needed), mint a first-party session
// token, and hand it straight to the app over the custom scheme.
const APP_SCHEME = 'smooth://auth/callback';

function redirectToApp(params: Record<string, string>): Response {
  const qs = new URLSearchParams(params).toString();
  return new Response(null, {
    status: 302,
    headers: { Location: `${APP_SCHEME}?${qs}` },
  });
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const cookieHeader = request.headers.get('Cookie');

  const oauthError = url.searchParams.get('error');
  if (oauthError) {
    return redirectToApp({
      status: 'error',
      message:
        url.searchParams.get('error_description') ||
        decodeURIComponent(oauthError) ||
        'Google sign-in failed.',
    });
  }

  const verifier = url.searchParams.get('neon_auth_session_verifier');

  // Also accept the verifier on a POST, some OAuth clients use response_mode=form_post.
  let postVerifier: string | null = null;
  if (!verifier && request.method === 'POST') {
    try {
      const form = await request.formData();
      postVerifier = (form.get('neon_auth_session_verifier') as string) || null;
    } catch {
      /* not a form post */
    }
  }

  const session = await resolveNeonSession(
    cookieHeader,
    verifier ?? postVerifier,
  );

  if (!session) {
    return redirectToApp({
      status: 'error',
      message:
        'Could not verify the Google session. Return to the app and try again.',
    });
  }

  try {
    const { token, maxAge, userId, email } = await provisionSession(session);
    return redirectToApp({
      status: 'ok',
      token,
      maxAge: String(maxAge),
      id: userId,
      email,
    });
  } catch (err: any) {
    console.error('mobile-callback provisioning failed:', err);
    return redirectToApp({
      status: 'error',
      message: err?.message || 'Failed to create a session.',
    });
  }
};