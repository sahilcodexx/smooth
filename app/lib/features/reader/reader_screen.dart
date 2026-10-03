import 'package:material_ui/material_ui.dart';
import 'package:material_3_expressive/material_3_expressive.dart';

import '../../app.dart';
import '../../core/theme.dart';
import '../../data/local_store.dart';
import '../../data/models.dart';
import '../editor/editor_screen.dart';
import '../markdown/markdown_view.dart';
import '../share/share_card_screen.dart';

/// Read-only view of a single note.
///
/// Uses a sliver app bar that hides on scroll, so long-form writing gets the
/// full screen once the reader settles in.
class ReaderScreen extends StatefulWidget {
  const ReaderScreen({super.key, required this.postId});

  final String postId;

  @override
  State<ReaderScreen> createState() => _ReaderScreenState();
}

class _ReaderScreenState extends State<ReaderScreen> {
  final _appBarController = M3EAppBarController();

  Post? _post;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final scope = AppScope.of(context);
    try {
      final post = await scope.posts.loadPost(
        widget.postId,
        isSignedIn: scope.auth.isSignedIn,
      );
      if (!mounted) return;
      setState(() {
        _post = post;
        _loading = false;
        _error = post == null ? 'That note could not be found.' : null;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Could not load that note.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final scope = AppScope.of(context);
    final theme = M3ETheme.of(context);
    context.syncSystemBars();

    final settings = scope.store.readSettings();
    final post = _post;

    return Scaffold(
      extendBodyBehindAppBar: true,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _ErrorView(message: _error!, onRetry: _load)
              : CustomScrollView(
                  slivers: [
                    // Sliver app bar inside the scroll view, so it collapses
                    // with the article instead of the text sliding under it.
                    M3EAppBar.sliver(
                      controller: _appBarController,
                      hideMode: M3EAppBarHideMode.entire,
                      titleText: post?.title.trim().isNotEmpty == true
                          ? post!.title.trim()
                          : 'Untitled note',
                      actions: [
                        if (post != null)
                          M3EIconButton(
                            icon: const Icon(M3EIcons.edit),
                            tooltip: 'Edit',
                            onPressed: () async {
                              await Navigator.of(context).pushReplacement(
                                AppPageTransitions.fadeThrough<void>(
                                  EditorScreen(postId: post.id),
                                  name: 'editor',
                                ),
                              );
                              if (!mounted) return;
                              await _load();
                            },
                          ),
                        if (post != null)
                          M3EIconButton(
                            icon: const Icon(M3EIcons.image),
                            tooltip: 'Share as image',
                            onPressed: () => Navigator.of(context).push(
                              AppPageTransitions.fadeThrough<void>(
                                ShareCardScreen(post: post),
                                name: 'share-card',
                              ),
                            ),
                          ),
                      ],
                    ),
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                      sliver: SliverList.list(
                        children: [
                          Text(
                            '${post!.wordCount} ${post.wordCount == 1 ? 'word' : 'words'}'
                            ' • ${post.readMinutes} min read',
                            style: theme.typography.baseline.labelMedium
                                .copyWith(color: theme.colorScheme.outline),
                          ),
                          const SizedBox(height: 20),
                          MarkdownView(
                            source: post.content,
                            font: settings.fontFamily == ReaderFont.serif
                                ? ReaderFontKind.serif
                                : ReaderFontKind.sans,
                            fontSize: settings.fontSize.toDouble(),
                          ),
                          const SizedBox(height: 80),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = M3ETheme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(M3EIcons.error_outline, size: 44, color: theme.colorScheme.error),
            const SizedBox(height: 16),
            Text(message, textAlign: TextAlign.center,
                style: theme.typography.baseline.bodyLarge),
            const SizedBox(height: 20),
            M3EButton(onPressed: onRetry, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }
}