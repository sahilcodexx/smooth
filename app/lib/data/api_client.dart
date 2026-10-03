import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../core/config.dart';

/// Raised for any non-2xx response so repositories can branch on [statusCode].
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  bool get isUnauthorized => statusCode == 401;

  @override
  String toString() => message;
}

/// Session token holder backed by the Android Keystore via EncryptedSharedPreferences.
class TokenStore {
  TokenStore(this._storage);

  static const _key = 'smooth_session_token';

  final FlutterSecureStorage _storage;

  Future<String?> read() async {
    try {
      return await _storage.read(key: _key);
    } catch (_) {
      return null;
    }
  }

  Future<void> write(String token) async {
    try {
      await _storage.write(key: _key, value: token);
    } catch (_) {
      /* keystore unavailable (e.g. corrupt keystore) — session stays in memory */
    }
  }

  Future<void> clear() => _storage.delete(key: _key).catchError((_) {});
}

/// Thin HTTP layer over the Astro API.
///
/// The backend authenticates with an HttpOnly `session_token` cookie. A native
/// client cannot rely on a shared cookie jar, so we capture the token from
/// `Set-Cookie` once and replay it as an explicit header afterwards.
class ApiClient {
  ApiClient({required this._tokenStore, Dio? dio})
      : _dio = dio ?? Dio() {
    _dio.options
      ..baseUrl = AppConfig.apiBaseUrl
      ..connectTimeout = const Duration(seconds: 20)
      ..receiveTimeout = const Duration(seconds: 30)
      ..sendTimeout = const Duration(seconds: 30)
      // We inspect status codes ourselves rather than throwing.
      ..validateStatus = (status) => status != null && status < 500;

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final token = _cachedToken ?? _pendingToken;
          if (token != null && token.isNotEmpty) {
            options.headers['Cookie'] = 'session_token=$token';
          }
          options.headers['Accept'] = 'application/json';
          handler.next(options);
        },
      ),
    );
  }

  final Dio _dio;
  final TokenStore _tokenStore;

  String? _cachedToken;
  String? _pendingToken;

  /// Lets the auth flow read the cookie handed back by /api/auth/login etc.
  /// Lets the auth flow read the cookie handed back by /api/auth/login etc.
  ///
  /// Dio joins multiple `Set-Cookie` headers into one comma-separated string,
  /// so the header is split on commas that begin a new `name=value` pair
  /// (never on the commas inside an `Expires=...` attribute).
  static String? extractSessionCookie(Response response) {
    final raw = response.headers.value('set-cookie');
    if (raw == null || raw.isEmpty) return null;

    for (final chunk in raw.split(RegExp(r',(?=\s*[A-Za-z0-9_-]+=)'))) {
      final pair = chunk.split(';').first.trim();
      final eq = pair.indexOf('=');
      if (eq <= 0) continue;
      if (pair.substring(0, eq).trim() == 'session_token') {
        final value = pair.substring(eq + 1).trim();
        if (value.isNotEmpty) return value;
      }
    }
    return null;
  }

  String? get token => _cachedToken;

  /// Public runtime config from the backend (Neon Auth URL, OAuth callback
  /// path). Cached for the process lifetime — it only changes on deploy.
  String? _neonAuthUrl;

  Future<String?> neonAuthUrl() async {
    if (_neonAuthUrl != null) return _neonAuthUrl;
    try {
      final res = await get<Map<String, dynamic>>('/api/config');
      final url = res.data?['neonAuthUrl'] as String?;
      if (url != null && url.isNotEmpty) {
        _neonAuthUrl = url;
        return url;
      }
    } catch (_) {
      // Offline: fall back to whatever we cached, if anything.
    }
    return _neonAuthUrl;
  }

  Future<void> loadToken() async {
    _cachedToken = await _tokenStore.read();
  }

  Future<void> adoptToken(String? token) async {
    if (token == null || token.isEmpty) {
      _cachedToken = null;
      await _tokenStore.clear();
      return;
    }
    _cachedToken = token;
    await _tokenStore.write(token);
  }

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? query,
    CancelToken? cancelToken,
  }) async {
    final res = await _dio.get<T>(path, queryParameters: query, cancelToken: cancelToken);
    _throwIfNeeded(res);
    return res;
  }

  Future<Response<T>> post<T>(
    String path, {
    Object? data,
    Map<String, dynamic>? query,
    Map<String, dynamic>? headers,
  }) async {
    final res = await _dio.post<T>(
      path,
      data: data,
      queryParameters: query,
      options: headers == null ? null : Options(headers: headers),
    );
    _throwIfNeeded(res);
    return res;
  }

  Future<Response<T>> delete<T>(String path, {Object? data}) async {
    final res = await _dio.delete<T>(path, data: data);
    _throwIfNeeded(res);
    return res;
  }

  void _throwIfNeeded(Response res) {
    final status = res.statusCode ?? 0;
    if (status >= 200 && status < 300) return;

    String message = 'Request failed ($status)';
    final data = res.data;
    if (data is Map && data['error'] is String) {
      message = data['error'] as String;
    } else if (data is String && data.isNotEmpty) {
      message = data;
    }
    throw ApiException(message, statusCode: status);
  }

  void dispose() => _dio.close(force: true);
}