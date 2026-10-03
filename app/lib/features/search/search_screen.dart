import 'dart:async';

import 'package:material_ui/material_ui.dart';
import 'package:intl/intl.dart';
import 'package:material_3_expressive/material_3_expressive.dart';

import '../../app.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../reader/reader_screen.dart';

/// Search across notes.
///
/// Members search server-side (the endpoint does `ILIKE` over title and
/// content); guests filter their local drafts in memory.
class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key, required this.searchController});

  final M3ESearchController searchController;

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  late final M3ESearchController _controller;
  Timer? _debounce;
  List<Post> _results = const [];
  bool _searching = false;

  @override
  void initState() {
    super.initState();
    _controller = widget.searchController;
    _controller.addListener(_onChanged);
    if (_controller.text.isNotEmpty) _run(_controller.text);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.removeListener(_onChanged);
    super.dispose();
  }

  void _onChanged() {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      if (mounted) _run(_controller.text);
    });
  }

  Future<void> _run(String raw) async {
    final query = raw.trim();
    final scope = AppScope.of(context);

    if (query.isEmpty) {
      setState(() {
        _results = const [];
        _searching = false;
      });
      return;
    }

    setState(() => _searching = true);

    if (scope.auth.isSignedIn) {
      await scope.posts.search(query, isSignedIn: true);
      if (!mounted) return;
      setState(() {
        _results = scope.posts.posts;
        _searching = false;
      });
      return;
    }

    // Guest: match locally on title + body.
    final needle = query.toLowerCase();
    final local = scope.store
        .readGuestPosts()
        .where((p) =>
            p.title.toLowerCase().contains(needle) ||
            p.plainText.toLowerCase().contains(needle))
        .toList();

    if (!mounted) return;
    setState(() {
      _results = local;
      _searching = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = M3ETheme.of(context);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: M3EAppBar.search(
        searchController: _controller,
        barHintText: 'Search your notes',
        // The list is driven by our own debounced query, so the anchor offers
        // no suggestions of its own.
        suggestionsBuilder: (_, _) => const <Widget>[],
      ),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: SizedBox(height: MediaQuery.paddingOf(context).top + 72),
          ),
          if (_searching)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: CircularProgressIndicator()),
              ),
            )
          else if (_controller.text.trim().isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(M3EIcons.search,
                          size: 44, color: theme.colorScheme.outline),
                      const SizedBox(height: 12),
                      Text(
                        'Search titles and text',
                        style: theme.typography.baseline.bodyMedium
                            .copyWith(color: theme.colorScheme.outline),
                      ),
                    ],
                  ),
                ),
              ),
            )
          else if (_results.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Text(
                    'No notes match "${_controller.text.trim()}".',
                    textAlign: TextAlign.center,
                    style: theme.typography.baseline.bodyLarge
                        .copyWith(color: theme.colorScheme.outline),
                  ),
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              sliver: SliverList.builder(
                itemCount: _results.length,
                itemBuilder: (context, index) {
                  final post = _results[index];
                  return M3EListItem(
                    headline:
                        post.title.trim().isEmpty ? 'Untitled note' : post.title,
                    supportingText: DateFormat.yMMMd().format(post.createdAt),
                    onTap: () => Navigator.of(context).push(
                      AppPageTransitions.fadeThrough<void>(
                        ReaderScreen(postId: post.id),
                        name: 'reader',
                      ),
                    ),
                  );
                },
              ),
            ),
          const SliverToBoxAdapter(child: SizedBox(height: 48)),
        ],
      ),
    );
  }
}