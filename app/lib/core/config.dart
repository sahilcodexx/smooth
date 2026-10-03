/// Build-time configuration for the unmindful native app.
///
/// Override at build time, e.g.
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4321
library;

class AppConfig {
  const AppConfig._();

  /// Base URL of the Astro backend (no trailing slash).
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://unmindful.vercel.app',
  );

  /// Fallback Neon Auth URL, used when `/api/config` cannot be reached (for
  /// example on a deployment that predates that endpoint). It is public
  /// information -- the same value `/api/config` returns -- so embedding it
  /// leaks nothing, and it keeps Google sign-in working without a rebuild.
  static const String fallbackNeonAuthUrl =
      'https://ep-late-violet-azfo9j5h.neonauth.c-3.ap-southeast-1.aws.neon.tech/neondb/auth';

  /// Custom scheme registered by the Android manifest for OAuth return.
  static const String appScheme = 'smooth';

  /// Host + path the browser is redirected to after Google sign-in.
  ///
  /// This is a *page*, not an API route, on purpose: Neon Auth's
  /// `/get-session` requires a session challenge cookie scoped to the Neon
  /// domain, which Chrome will not send to our own origin. Only the browser
  /// holds that cookie, so the browser has to resolve the session and then
  /// hand the app a token. See src/pages/auth/mobile.astro.
  static const String mobileCallbackPath = '/auth/mobile';

  static const String authCallbackUri = '$appScheme://auth/callback';

  /// Guest writers are capped so signing in stays attractive.
  static const int maxGuestPosts = 10;

  /// Guest drafts untouched for this long are pruned on launch.
  static const int guestDraftTtlDays = 30;

  /// Reading preferences.
  static const int minFontSize = 13;
  static const int maxFontSize = 22;
  static const int defaultFontSize = 15;
}