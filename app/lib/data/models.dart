/// Domain models mirroring the Astro API payloads.
library;

class AppUser {
  const AppUser({required this.id, required this.email});

  final String id;
  final String email;

  /// Username fragment used in greetings and share cards, matching the web app.
  String get handle => email.split('@').first;

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'] as String,
        email: json['email'] as String,
      );

  Map<String, dynamic> toJson() => {'id': id, 'email': email};
}

/// A note. The same shape is used for cloud posts and local guest drafts so
/// the feed can render a single list regardless of where the data lives.
class Post {
  const Post({
    required this.id,
    required this.title,
    required this.content,
    required this.createdAt,
    this.updatedAt,
    this.lastActiveAt,
  });

  final String id;
  final String title;
  final String content;
  final DateTime createdAt;
  final DateTime? updatedAt;

  /// Only meaningful for guest drafts; drives the 30-day prune.
  final DateTime? lastActiveAt;

  int get wordCount => countWords(content);

  int get readMinutes => (wordCount / 200).ceil().clamp(1, 9999);

  /// Strips markdown syntax the way the web share card does.
  String get plainText {
    final stripped = content
        .replaceAll(RegExp(r'<[^>]*>?'), '')
        .replaceAll(RegExp(r'[#*`_\[\]]'), '')
        .trim();
    return stripped;
  }

  static int countWords(String source) {
    final stripped = source.replaceAll(RegExp(r'<[^>]*>?'), '');
    final trimmed = stripped.trim();
    if (trimmed.isEmpty) return 0;
    return trimmed.split(RegExp(r'\s+')).length;
  }

  /// Mirrors Editor.tsx: first non-blank line, minus any leading '#'s.
  static String deriveTitle(String content, String fallbackId) {
    for (final line in content.split('\n')) {
      if (line.trim().isEmpty) continue;
      return line.replaceFirst(RegExp(r'^#+\s*'), '').trim();
    }
    return 'Note $fallbackId';
  }

  factory Post.fromJson(Map<String, dynamic> json) => Post(
        id: json['id'] as String,
        title: (json['title'] as String?) ?? '',
        content: (json['content'] as String?) ?? '',
        createdAt:
            DateTime.tryParse((json['created_at'] ?? '') as String)?.toLocal() ??
                DateTime.now(),
        updatedAt:
            DateTime.tryParse((json['updated_at'] ?? '') as String)?.toLocal(),
        lastActiveAt:
            DateTime.tryParse((json['last_active_at'] ?? '') as String)?.toLocal(),
      );

  /// List rows come back without `content` — the feed only shows the title.
  factory Post.summaryFromJson(Map<String, dynamic> json) => Post(
        id: json['id'] as String,
        title: (json['title'] as String?) ?? '',
        content: '',
        createdAt:
            DateTime.tryParse((json['created_at'] ?? '') as String)?.toLocal() ??
                DateTime.now(),
        updatedAt:
            DateTime.tryParse((json['updated_at'] ?? '') as String)?.toLocal(),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'content': content,
        'created_at': createdAt.toUtc().toIso8601String(),
        if (updatedAt != null)
          'updated_at': updatedAt!.toUtc().toIso8601String(),
        if (lastActiveAt != null)
          'last_active_at': lastActiveAt!.toUtc().toIso8601String(),
      };

  Post copyWith({String? title, String? content, DateTime? lastActiveAt}) => Post(
        id: id,
        title: title ?? this.title,
        content: content ?? this.content,
        createdAt: createdAt,
        updatedAt: updatedAt,
        lastActiveAt: lastActiveAt ?? this.lastActiveAt,
      );
}

/// Result of a feed page: items plus the server-side total.
class PostPage {
  const PostPage({required this.posts, required this.total});

  final List<Post> posts;
  final int total;

  factory PostPage.fromJson(Map<String, dynamic> json) => PostPage(
        posts: (json['posts'] as List<dynamic>? ?? const [])
            .map((e) => Post.summaryFromJson(e as Map<String, dynamic>))
            .toList(),
        total: (json['total'] as num?)?.toInt() ?? 0,
      );
}