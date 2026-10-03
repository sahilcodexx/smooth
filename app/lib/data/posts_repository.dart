import 'package:flutter/foundation.dart';

import '../core/config.dart';
import 'api_client.dart';
import 'local_store.dart';
import 'models.dart';

enum SaveState { idle, saving, saved, local, failed }

/// Raised when a guest writer is at the local cap.
class GuestLimitReached implements Exception {
  const GuestLimitReached();
}

/// Single source of truth for the feed.
///
/// Signed-in users read/write through the API; guests read/write the same
/// [Post] shape against SharedPreferences. Every method takes an `isSignedIn`
/// flag so callers never branch on where the data lives.
class PostsRepository extends ChangeNotifier {
  PostsRepository({required this._api, required this._store});

  final ApiClient _api;
  final LocalStore _store;

  List<Post> _posts = const [];
  bool _loading = false;
  String? _error;
  String _query = '';
  int _total = 0;

  List<Post> get posts => _posts;
  bool get isLoading => _loading;
  String? get error => _error;
  int get total => _total;
  String get query => _query;

  /// Guest writers are capped; members are not.
  bool guestAtLimit(bool isSignedIn) =>
      !isSignedIn && _store.readGuestPosts().length >= AppConfig.maxGuestPosts;

  int guestRemaining(bool isSignedIn) {
    if (isSignedIn) return -1;
    final remaining = AppConfig.maxGuestPosts - _store.readGuestPosts().length;
    return remaining < 0 ? 0 : remaining;
  }

  // ------------------------------------------------------------------ loading

  Future<void> refresh({required bool isSignedIn}) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      if (isSignedIn) {
        final res = await _api.get<Map<String, dynamic>>(
          '/api/posts',
          query: {
            'limit': 200,
            if (_query.isNotEmpty) 'q': _query,
          },
        );
        final page = PostPage.fromJson(res.data ?? const {});
        _posts = page.posts;
        _total = page.total;
      } else {
        _posts = _store.readGuestPosts();
        _total = _posts.length;
      }
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = 'Could not load your notes.';
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> search(String query, {required bool isSignedIn}) async {
    _query = query.trim();
    await refresh(isSignedIn: isSignedIn);
  }

  // ------------------------------------------------------------------ reading

  /// Full post body. Guests resolve from local storage; members hit the API.
  Future<Post?> loadPost(String id, {required bool isSignedIn}) async {
    if (!isSignedIn) {
      for (final p in _store.readGuestPosts()) {
        if (p.id == id) return p;
      }
      return null;
    }
    try {
      final res = await _api.get<Map<String, dynamic>>(
        '/api/posts',
        query: {'id': id},
      );
      final raw = res.data?['post'];
      if (raw is Map<String, dynamic>) return Post.fromJson(raw);
    } catch (_) {
      /* fall through to null */
    }
    return null;
  }

  // ------------------------------------------------------------------- saving

  /// Upserts a post. [content] is markdown; the title is derived the same way
  /// the web editor derives it (first non-blank line, '#' stripped).
  Future<SaveState> savePost({
    required String id,
    required String content,
    required bool isSignedIn,
    DateTime? createdAt,
  }) async {
    final title = Post.deriveTitle(content, id);
    notifyListeners();

    if (isSignedIn) {
      try {
        await _api.post<dynamic>(
          '/api/posts',
          data: {'id': id, 'title': title, 'content': content},
        );
        await refresh(isSignedIn: true);
        return SaveState.saved;
      } catch (_) {
        return SaveState.failed;
      }
    }

    // Guest path: keep the newest note first, matching the web feed order.
    final existing = _store.readGuestPosts();
    final isNew = existing.every((p) => p.id != id);
    if (isNew && existing.length >= AppConfig.maxGuestPosts) {
      notifyListeners();
      throw const GuestLimitReached();
    }

    final now = DateTime.now();
    await _store.upsertGuestPost(Post(
      id: id,
      title: title,
      content: content,
      createdAt: createdAt ?? now,
      updatedAt: now,
      lastActiveAt: now,
    ));
    await _store.writeCurrentDraftId(id);
    _posts = _store.readGuestPosts();
    _total = _posts.length;
    notifyListeners();
    return SaveState.local;
  }

  // ----------------------------------------------------------------- deleting

  Future<void> deletePosts(List<String> ids, {required bool isSignedIn}) async {
    if (ids.isEmpty) return;
    if (isSignedIn) {
      await _api.delete<dynamic>(
        '/api/posts',
        data: {'ids': ids},
      );
      await refresh(isSignedIn: true);
    } else {
      await _store.deleteGuestPosts(ids);
      _posts = _store.readGuestPosts();
      _total = _posts.length;
      notifyListeners();
    }
  }

  // ------------------------------------------------------------ import/export

  /// Merge externally supplied notes (from a .json backup or .md files).
  Future<int> importPosts(
    List<Post> incoming, {
    required bool isSignedIn,
  }) async {
    if (incoming.isEmpty) return 0;

    if (isSignedIn) {
      await _api.post<dynamic>(
        '/api/posts/sync-local',
        data: {
          'posts': incoming
              .map((p) => {'id': p.id, 'title': p.title, 'content': p.content})
              .toList()
        },
      );
      await refresh(isSignedIn: true);
      return incoming.length;
    }

    final existing = _store.readGuestPosts().toList();
    final room = AppConfig.maxGuestPosts - existing.length;
    if (room <= 0) throw const GuestLimitReached();
    final accepted = incoming.take(room).toList();
    for (final post in accepted) {
      await _store.upsertGuestPost(post);
    }
    _posts = _store.readGuestPosts();
    _total = _posts.length;
    notifyListeners();
    return accepted.length;
  }

  /// Full bodies for export. Feed rows only carry a title, so fetch on demand.
  Future<List<Post>> exportablePosts({required bool isSignedIn}) async {
    if (!isSignedIn) return _store.readGuestPosts();
    final result = <Post>[];
    for (final summary in _posts) {
      final full = await loadPost(summary.id, isSignedIn: true);
      if (full != null) result.add(full);
    }
    return result;
  }
}