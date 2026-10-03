import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/widgets.dart';

import '../core/config.dart';
import 'api_client.dart';
import 'local_store.dart';
import 'models.dart';

enum AuthStatus { unknown, signedOut, signedIn }

/// Owns the signed-in identity and drives guest -> member post migration.
class AuthRepository extends ChangeNotifier {
  AuthRepository({required this._api, required this._store});

  final ApiClient _api;
  final LocalStore _store;

  AuthStatus _status = AuthStatus.unknown;
  AppUser? _user;
  bool _migrating = false;

  AuthStatus get status => _status;
  AppUser? get user => _user;
  bool get isSignedIn => _status == AuthStatus.signedIn && _user != null;
  bool get isMigrating => _migrating;

  /// Restore the token from the keystore and validate it against the server.
  Future<void> bootstrap() async {
    await _api.loadToken();
    if (_api.token == null) {
      _status = AuthStatus.signedOut;
      notifyListeners();
      return;
    }
    try {
      final res = await _api.get<Map<String, dynamic>>('/api/auth/session');
      final raw = res.data?['user'];
      if (raw is Map<String, dynamic>) {
        _user = AppUser.fromJson(raw);
        _status = AuthStatus.signedIn;
      } else {
        await _api.adoptToken(null);
        _status = AuthStatus.signedOut;
      }
    } catch (_) {
      // Offline or server down: trust the stored token optimistically so the
      // user still sees their (locally cached) feed instead of a logged-out app.
      _status = AuthStatus.signedIn;
    }
    notifyListeners();
  }

  Future<void> _adopt(String? token, AppUser? user) async {
    await _api.adoptToken(token);
    _user = user;
    _status = user == null ? AuthStatus.signedOut : AuthStatus.signedIn;
    notifyListeners();
  }

  Future<void> signIn({required String email, required String password}) async {
    final res = await _api.post<dynamic>('/api/auth/login',
        data: {'email': email.trim(), 'password': password});
    final payload = _decodeMap(res);
    final token = ApiClient.extractSessionCookie(res);
    await _adopt(token, AppUser.fromJson(payload['user'] as Map<String, dynamic>));
    await migrateGuestPosts();
  }

  Future<void> register({required String email, required String password}) async {
    final res = await _api.post<dynamic>('/api/auth/register',
        data: {'email': email.trim(), 'password': password});
    final payload = _decodeMap(res);
    final token = ApiClient.extractSessionCookie(res);
    await _adopt(token, AppUser.fromJson(payload['user'] as Map<String, dynamic>));
    await migrateGuestPosts();
  }

  Future<void> signOut() async {
    try {
      await _api.post<dynamic>('/api/auth/logout');
    } catch (_) {
      /* revoke server-side best effort; local token is dropped regardless */
    }
    await _adopt(null, null);
  }

  /// Adopt a token handed to the app over the custom scheme after OAuth.
  Future<void> adoptSocialSession({
    required String token,
    required String id,
    required String email,
  }) async {
    await _adopt(token, AppUser(id: id, email: email));
    await migrateGuestPosts();
  }

  /// Push locally stored guest notes to the cloud, then clear them.
  ///
  /// Mirrors AuthCard's `syncGuestPostsBeforeRedirect`. Never throws: a failed
  /// migration must not block sign-in, and the drafts stay on disk to retry.
  Future<void> migrateGuestPosts() async {
    final guestPosts = _store.readGuestPosts(prune: false);
    if (guestPosts.isEmpty) return;

    _migrating = true;
    notifyListeners();
    try {
      await _api.post<dynamic>(
        '/api/posts/sync-local',
        data: {
          'posts': guestPosts
              .map((p) => {'id': p.id, 'title': p.title, 'content': p.content})
              .toList()
        },
      );
      await _store.clearGuestPosts();
    } catch (_) {
      // Keep drafts; they will be retried on the next successful auth.
    } finally {
      _migrating = false;
      notifyListeners();
    }
  }

  String get oauthCallbackUrl =>
      '${AppConfig.apiBaseUrl}${AppConfig.mobileCallbackPath}';

  static Map<String, dynamic> _decodeMap(Response res) {
    final data = res.data;
    if (data is Map<String, dynamic>) return data;
    if (data is String && data.isNotEmpty) {
      try {
        final decoded = jsonDecode(data);
        if (decoded is Map<String, dynamic>) return decoded;
      } catch (_) {
        /* non-JSON error page */
      }
    }
    return const {};
  }
}