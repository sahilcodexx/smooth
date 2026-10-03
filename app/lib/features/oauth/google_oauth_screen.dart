import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import 'package:material_3_expressive/material_3_expressive.dart';

import '../../app.dart';
import '../../core/config.dart';
import '../../core/theme.dart';

/// Google sign-in hosted in an in-app WebView.
///
/// Why not the system browser? Neon Auth resolves the session with a *session
/// challenge cookie* scoped to its own domain. Resolving it from
/// `unmindful.vercel.app` means a third-party cookie, and Chrome blocks those:
///
///   GET {neonAuthUrl}/get-session?neon_auth_session_verifier=...
///   -> {"code":"SESSION_CHALLENGE_COOKIE_NOT_FOUND"}
///
/// Neon's own callback then fails too, with `error=state_mismatch`, because
/// the cookie carrying the OAuth state never comes back.
///
/// A WebView has its own cookie jar, and Android WebView accepts third-party
/// cookies by default, so the round trip completes without depending on the
/// user's browser settings. The user also stays inside the app instead of
/// bouncing out to Chrome and back.
///
/// The whole handshake happens inside `/auth/mobile`:
///   ?start=google -> initiates sign-in, lands back on the same URL carrying
///   the verifier -> resolves the session -> redirects to `smooth://auth/callback`.
class GoogleOAuthScreen extends StatefulWidget {
  const GoogleOAuthScreen({super.key});

  @override
  State<GoogleOAuthScreen> createState() => _GoogleOAuthScreenState();
}

class _GoogleOAuthScreenState extends State<GoogleOAuthScreen> {
  late final WebViewController _controller;

  /// Guards against reporting twice: the deep link is seen by both
  /// `onNavigationRequest` and `onPageStarted`.
  bool _settled = false;

  @override
  void initState() {
    super.initState();

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (NavigationRequest request) async {
            final url = Uri.tryParse(request.url);
            if (url != null && url.scheme == AppConfig.appScheme) {
              await _handleCallback(url);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
          onPageStarted: (String url) async {
            final uri = Uri.tryParse(url);
            if (uri != null && uri.scheme == AppConfig.appScheme) {
              await _handleCallback(uri);
            }
          },
          onWebResourceError: (WebResourceError error) {
            // Sub-resource failures are noisy; only main-frame matters.
            if (error.isForMainFrame == false) return;
            if (!mounted) return;
            showAppSnack(context, 'Could not load the sign-in page.',
                isError: true);
          },
        ),
      )
      ..loadRequest(
        Uri.parse(
          '${AppConfig.apiBaseUrl}${AppConfig.mobileCallbackPath}?start=google',
        ),
      );

    // webview_flutter's Android implementation defaults third-party cookies to
    // **false**, so this must be enabled explicitly or Neon Auth's session
    // challenge cookie is dropped and sign-in fails with
    // SESSION_CHALLENGE_COOKIE_NOT_FOUND.
    AndroidWebViewCookieManager(
      const PlatformWebViewCookieManagerCreationParams(),
    ).setAcceptThirdPartyCookies(
      _controller.platform as AndroidWebViewController,
      true,
    );
  }

  Future<void> _handleCallback(Uri uri) async {
    if (_settled) return;
    _settled = true;

    final params = uri.queryParameters;
    final flow = AppScope.of(context).oauth;

    if (!mounted) return;

    if (params['status'] == 'ok') {
      final token = params['token'];
      final id = params['id'];
      final email = params['email'];
      if (token == null || id == null || email == null) {
        flow.reportError('Sign-in finished but the session was incomplete.');
        if (mounted) Navigator.of(context).pop();
        return;
      }
      await flow.adoptToken(token: token, id: id, email: email);
      if (mounted) Navigator.of(context).pop();
      return;
    }

    final message = params['message'];
    if (mounted) Navigator.of(context).pop();
    flow.reportError(
      message == null || message.isEmpty
          ? 'Google sign-in was cancelled.'
          : message,
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: true,
      onPopInvokedWithResult: (didPop, _) {
        // Only report if the user backed out before a result arrived.
        if (didPop && !_settled) {
          AppScope.of(context).oauth.reportError('Google sign-in was cancelled.');
        }
      },
      child: Scaffold(
        appBar: M3EAppBar.top(titleText: 'Sign in with Google'),
        body: Stack(
          children: [
            WebViewWidget(controller: _controller),
            const Align(
              alignment: Alignment.topCenter,
              child: LinearProgressIndicator(minHeight: 3),
            ),
          ],
        ),
      ),
    );
  }
}