import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:material_ui/material_ui.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/config.dart';
import '../../data/api_client.dart';
import '../../data/auth_repository.dart';

/// Bridges [AuthRepository] into the widget tree and owns the Google OAuth
/// round trip.
///
/// Flow:
///   1. Ask Neon Auth for a Google authorization URL.
///   2. Open it in the system browser, leaving the app.
///   3. Google -> Neon Auth -> our `/api/auth/mobile-callback`. That step is a
///      top-level navigation, so the browser presents its Better Auth cookie
///      to *our* server.
///   4. The endpoint resolves the Neon session, mints a first-party token and
///      redirects to `smooth://auth/callback?token=...`.
///   5. Android routes the deep link back into the app and [handleDeepLink]
///      adopts the token.
///
/// No WebView and no third-party cookies, which is why this works from a
/// native shell at all.
class OAuthFlow extends ChangeNotifier {
  OAuthFlow(this._auth, this._api) {
    _listen();
  }

  final AuthRepository _auth;
  final ApiClient _api;

  final _appLinks = AppLinks();
  StreamSubscription<Uri>? _linkSub;
  Timer? _pendingTimeout;

  bool _busy = false;
  String? _error;

  bool get busy => _busy;
  String? get error => _error;

  Future<void> _listen() async {
    _linkSub = _appLinks.uriLinkStream.listen(handleDeepLink, onError: (_) {});
    // Cold start: the link that launched the app is only available here.
    try {
      final initial = await _appLinks.getInitialLink();
      if (initial != null) handleDeepLink(initial);
    } catch (_) {
      /* no launch link */
    }
  }

  // ------------------------------------------------------- credential sign-in

  Future<void> signIn({required String email, required String password}) =>
      _guard(() => _auth.signIn(email: email, password: password));

  Future<void> register({required String email, required String password}) =>
      _guard(() => _auth.register(email: email, password: password));

  /// Runs an auth action with busy/error bookkeeping applied.
  Future<void> _guard(Future<void> Function() action) async {
    if (_busy) return;
    _set(busy: true, error: null);
    try {
      await action();
      _set(busy: false, error: null);
    } catch (e) {
      _set(busy: false, error: _cleanError(e));
    }
  }

  // ------------------------------------------------------------------- google

  Future<void> signInWithGoogle() async {
    if (_busy) return;
    _set(busy: true, error: null);

    try {
      final neonAuthUrl = await _api.neonAuthUrl();
      if (neonAuthUrl == null || neonAuthUrl.isEmpty) {
        throw Exception('Google sign-in is not configured on this server.');
      }
      if (_api.configUnavailable) {
        // The backend answered, but not with our config endpoint. That is
        // almost always an undeployed build rather than a real misconfiguration,
        // and the OAuth callback will 404 too, so say so plainly instead of
        // sending the user into a browser that cannot come back.
        throw Exception(
          'This backend is out of date.\n\n'
          'Sign in needs these endpoints:\n'
          '  GET  /api/config\n'
          '  GET  /api/auth/mobile-callback\n\n'
          'Deploy the latest backend, then try again.\n'
          '(${AppConfig.apiBaseUrl})',
        );
      }

      // Neon Auth hands back the Google authorization URL to visit.
      //
      // `Origin` is mandatory: Neon rejects the request with MISSING_ORIGIN
      // when a callbackURL is not an absolute *newUser* URL. Browsers send it
      // automatically; a native client does not, so we send the API's own
      // origin (already on Neon's allowlist because the web app uses it).
      final res = await _api.post<Map<String, dynamic>>(
        '$neonAuthUrl/sign-in/social',
        data: {
          'provider': 'google',
          // Neon bounces here; our server then hands a token to the app.
          'callbackURL': _auth.oauthCallbackUrl,
        },
        headers: {'Origin': Uri.parse(AppConfig.apiBaseUrl).origin},
      );

      final url = res.data?['url'] as String?;
      if (url == null || url.isEmpty) {
        // Neon rejects the redirect when the app's callback is not on its
        // allowlist. Surface exactly what needs registering rather than a
        // bare server string.
        if (res.data?['code'] == 'INVALID_CALLBACKURL') {
          throw Exception(
            'Google sign-in is not registered for the app yet.\n\n'
            'Add this URL to the Neon Auth redirect allowlist:\n'
            '${_auth.oauthCallbackUrl}\n\n'
            'Sign-in cannot complete until it is added.',
          );
        }
        throw Exception(
          (res.data?['message'] ??
              res.data?['error'] ??
              'Could not start Google sign-in') as String,
        );
      }

      final launched = await launchUrl(
        Uri.parse(url),
        mode: LaunchMode.externalApplication,
      );
      if (!launched) {
        throw Exception('No browser available to complete sign-in.');
      }

      // If the user abandons the browser, drop back to the form instead of
      // spinning forever.
      _pendingTimeout?.cancel();
      _pendingTimeout = Timer(const Duration(minutes: 5), () {
        if (_busy) _set(busy: false, error: null);
      });
    } catch (e) {
      _set(busy: false, error: _cleanError(e));
    }
  }

  // -------------------------------------------------------- in-app webview

  /// Adopt a session handed back by the in-app WebView (see
  /// [GoogleOAuthScreen]).
  Future<void> adoptToken({
    required String token,
    required String id,
    required String email,
  }) async {
    _set(busy: true, error: null);
    try {
      await _auth.adoptSocialSession(token: token, id: id, email: email);
      _set(busy: false, error: null);
    } catch (e) {
      _set(busy: false, error: _cleanError(e));
    }
  }

  /// Show (or clear, when [message] is empty) an error raised while the
  /// WebView was driving the OAuth handshake.
  void reportError(String message) {
    _set(busy: false, error: message.isEmpty ? null : message);
  }

  // --------------------------------------------------------------- deep link

  Future<void> handleDeepLink(Uri uri) async {
    if (uri.scheme != AppConfig.appScheme) return;
    if (!uri.toString().startsWith('${AppConfig.appScheme}://auth')) return;

    _pendingTimeout?.cancel();
    final params = uri.queryParameters;

    if (params['status'] != 'ok') {
      _set(
        busy: false,
        error: params['message'] ?? 'Google sign-in failed.',
      );
      return;
    }

    final token = params['token'];
    final id = params['id'];
    final email = params['email'];

    if (token == null || id == null || email == null) {
      _set(
        busy: false,
        error: 'Sign-in finished but the session was incomplete.',
      );
      return;
    }

    _set(busy: true, error: null);
    try {
      await _auth.adoptSocialSession(
        token: token,
        id: id,
        email: email,
      );
      _set(busy: false, error: null);
    } catch (e) {
      _set(busy: false, error: _cleanError(e));
    }
  }

  void _set({bool? busy, String? error}) {
    final nextError = error;
    if (_busy == busy && _error == nextError) return;
    _busy = busy ?? _busy;
    _error = nextError;
    notifyListeners();
  }

  /// Strips the `Exception: ` prefix Dio/our repositories wrap messages in.
  static String _cleanError(Object error) {
    var text = error.toString();
    if (text.startsWith('Exception: ')) {
      text = text.substring('Exception: '.length);
    }
    if (text.startsWith('ApiException: ')) {
      text = text.substring('ApiException: '.length);
    }
    return text;
  }

  @override
  void dispose() {
    _linkSub?.cancel();
    _pendingTimeout?.cancel();
    super.dispose();
  }
}