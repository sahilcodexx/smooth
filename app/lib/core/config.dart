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

  /// Custom scheme registered by the Android manifest for OAuth return.
  static const String appScheme = 'smooth';

  /// Host + path the browser is redirected to after Google sign-in.
  /// Neon Auth bounces here; the server resolves the session and redirects
  /// back into the app with a one-time token.
  static const String mobileCallbackPath = '/api/auth/mobile-callback';

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