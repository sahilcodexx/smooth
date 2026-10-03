import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../core/config.dart';
import 'models.dart';

/// Reading preferences surfaced by the reader-settings sheet.
class ReaderSettings {
  const ReaderSettings({
    this.fontFamily = ReaderFont.sans,
    this.fontSize = AppConfig.defaultFontSize,
    this.measureEm = 37,
  });

  final ReaderFont fontFamily;
  final int fontSize;

  /// Content measure in `em`. Meaningless on a phone (the viewport is the
  /// limit) but kept so settings round-trip between web and app.
  final int measureEm;

  ReaderSettings copyWith({ReaderFont? fontFamily, int? fontSize, int? measureEm}) =>
      ReaderSettings(
        fontFamily: fontFamily ?? this.fontFamily,
        fontSize: fontSize ?? this.fontSize,
        measureEm: measureEm ?? this.measureEm,
      );

  Map<String, dynamic> toJson() => {
        'font_family': fontFamily.name,
        'font_size': fontSize,
        'measure_em': measureEm,
      };

  factory ReaderSettings.fromJson(Map<String, dynamic> json) => ReaderSettings(
        fontFamily: ReaderFont.values.firstWhere(
          (f) => f.name == json['font_family'],
          orElse: () => ReaderFont.sans,
        ),
        fontSize: (json['font_size'] as num?)?.toInt() ?? AppConfig.defaultFontSize,
        measureEm: (json['measure_em'] as num?)?.toInt() ?? 37,
      );
}

enum ReaderFont {
  sans('Sans-Serif'),
  serif('Serif');

  const ReaderFont(this.label);
  final String label;
}

/// Local persistence for guest drafts and reading preferences.
///
/// Guest drafts intentionally mirror the web app's `smooth_guest_posts` shape
/// so a shared backup file works on both platforms.
class LocalStore {
  LocalStore(this._prefs);

  static const _kGuestPosts = 'smooth_guest_posts';
  static const _kReaderSettings = 'smooth_reader_settings';
  static const _kDraftId = 'smooth_current_draft_id';

  final SharedPreferences _prefs;

  /// Exposed so UI-level controllers (theme, etc.) can persist their own keys
  /// without every new setting needing a hand-written accessor.
  SharedPreferences get prefs => _prefs;

  static Future<LocalStore> open() async =>
      LocalStore(await SharedPreferences.getInstance());

  // ---------------------------------------------------------------- settings

  ReaderSettings readSettings() {
    final raw = _prefs.getString(_kReaderSettings);
    if (raw == null) return const ReaderSettings();
    try {
      return ReaderSettings.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return const ReaderSettings();
    }
  }

  Future<void> writeSettings(ReaderSettings settings) =>
      _prefs.setString(_kReaderSettings, jsonEncode(settings.toJson()));

  // ------------------------------------------------------------ guest drafts

  List<Post> readGuestPosts({bool prune = true}) {
    final raw = _prefs.getString(_kGuestPosts);
    if (raw == null) return const [];
    List<Post> posts;
    try {
      final decoded = jsonDecode(raw) as List<dynamic>;
      posts = decoded
          .whereType<Map<String, dynamic>>()
          .map(Post.fromJson)
          .toList();
    } catch (_) {
      return const [];
    }

    if (!prune) return posts;

    final cutoff = DateTime.now()
        .subtract(const Duration(days: AppConfig.guestDraftTtlDays));
    final kept = posts.where((p) {
      final lastActive = p.lastActiveAt ?? p.createdAt;
      return lastActive.isAfter(cutoff);
    }).toList();

    if (kept.length != posts.length) {
      // Fire-and-forget: the caller re-reads synchronously anyway.
      writeGuestPosts(kept);
    }
    return kept;
  }

  Future<void> writeGuestPosts(List<Post> posts) =>
      _prefs.setString(_kGuestPosts, jsonEncode(posts.map((p) => p.toJson()).toList()));

  Future<void> upsertGuestPost(Post post) async {
    final posts = readGuestPosts().toList();
    final index = posts.indexWhere((p) => p.id == post.id);
    if (index >= 0) {
      posts[index] = post;
    } else {
      posts.insert(0, post);
    }
    await writeGuestPosts(posts);
  }

  Future<void> deleteGuestPosts(Iterable<String> ids) async {
    final idSet = ids.toSet();
    final posts = readGuestPosts().where((p) => !idSet.contains(p.id)).toList();
    await writeGuestPosts(posts);
  }

  Future<void> clearGuestPosts() async {
    await _prefs.remove(_kGuestPosts);
    await _prefs.remove(_kDraftId);
  }

  // ------------------------------------------------------- in-progress draft

  /// Tracks which post the editor is currently writing, so reopening the app
  /// returns to the same note (mirrors the web Editor's draft keys).
  String? readCurrentDraftId() => _prefs.getString(_kDraftId);

  Future<void> writeCurrentDraftId(String id) => _prefs.setString(_kDraftId, id);
}