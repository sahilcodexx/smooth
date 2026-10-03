import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * Public, non-secret runtime config for the native app.
 *
 * Lets one build of the app point at any deployment (prod/staging/local)
 * without a rebuild, and exposes whether Google sign-in is configured at all.
 */
export const GET: APIRoute = async () => {
  const neonAuthUrl =
    import.meta.env.NEON_AUTH_BASE_URL || process.env.NEON_AUTH_BASE_URL || '';

  return new Response(
    JSON.stringify({
      neonAuthUrl,
      googleEnabled: Boolean(neonAuthUrl),
      mobileCallback: '/auth/mobile',
      appScheme: 'smooth://auth/callback'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    }
  );
};