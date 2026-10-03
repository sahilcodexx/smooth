import 'package:material_ui/material_ui.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:material_3_expressive/material_3_expressive.dart';

import '../../app.dart';
import '../../core/config.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../auth/auth_screen.dart';
import '../data_transfer/data_sheet.dart';
import '../reader/reader_screen.dart';
import '../search/search_screen.dart';
import '../share/share_card_screen.dart';

/// The notes list.
///
/// Long-press enters multi-select. Selection is plain local state rather than
/// `M3ESelection`, because that widget brings its own Scaffold and would fight
/// the shell's navigation bar.
class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key, required this.onOpenEditor});

  final void Function({String? postId}) onOpenEditor;

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final Set<int> _selected = <int>{};
  final _searchController = M3ESearchController();

  bool get _selecting => _selected.isNotEmpty;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _clearSelection() => setState(_selected.clear);

  Future<void> _deleteSelected(AppScope scope) async {
    final posts = scope.posts.posts;
    final ids = _selected
        .where((i) => i >= 0 && i < posts.length)
        .map((i) => posts[i].id)
        .toList();
    if (ids.isEmpty) return;

    final count = ids.length;
    try {
      await scope.posts.deletePosts(ids, isSignedIn: scope.auth.isSignedIn);
      if (!mounted) return;
      _clearSelection();
      showAppSnack(context, 'Deleted $count ${count == 1 ? 'note' : 'notes'}');
    } catch (_) {
      if (!mounted) return;
      showAppSnack(context, 'Could not delete. Please try again.',
          isError: true);
    }
  }

  void _toggle(int index) {
    setState(() {
      if (!_selected.remove(index)) _selected.add(index);
    });
    HapticFeedback.selectionClick();
  }

  @override
  Widget build(BuildContext context) {
    final scope = AppScope.of(context);

    return PopScope(
      // Back clears an active selection before it leaves the screen.
      canPop: !_selecting,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _clearSelection();
      },
      child: ListenableBuilder(
        listenable: Listenable.merge([scope.posts, scope.auth]),
        builder: (context, _) {
          final posts = scope.posts.posts;
          final isSignedIn = scope.auth.isSignedIn;
          final isLoading = scope.posts.isLoading && posts.isEmpty;

          return CustomScrollView(
            slivers: [
              if (_selecting)
                M3EAppBar.sliver(
                  titleText:
                      '${_selected.length} selected',
                  leading: M3EIconButton(
                    icon: const Icon(M3EIcons.close),
                    tooltip: 'Cancel',
                    onPressed: _clearSelection,
                  ),
                  actions: [
                    M3EIconButton(
                      icon: const Icon(M3EIcons.select_all),
                      tooltip: 'Select all',
                      onPressed: () => setState(() {
                        _selected
                          ..clear()
                          ..addAll(List.generate(posts.length, (i) => i));
                      }),
                    ),
                    M3EIconButton(
                      icon: const Icon(M3EIcons.delete),
                      tooltip: 'Delete ${_selected.length}',
                      onPressed: () => _deleteSelected(scope),
                    ),
                  ],
                )
              else
                _NotesAppBar(
                  searchController: _searchController,
                  scope: scope,
                ),

              if (!isSignedIn)
                SliverToBoxAdapter(
                  child: _GuestBanner(
                    remaining: scope.posts.guestRemaining(false),
                  ),
                ),

              if (scope.posts.error != null)
                SliverToBoxAdapter(
                  child: _ErrorBanner(
                    message: scope.posts.error!,
                    onRetry: () => scope.posts.refresh(isSignedIn: isSignedIn),
                  ),
                ),

              if (isLoading)
                const SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (posts.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: _EmptyState(onCompose: () => widget.onOpenEditor()),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  sliver: SliverList.builder(
                    itemCount: posts.length,
                    itemBuilder: (context, index) => _PostTile(
                      post: posts[index],
                      selected: _selected.contains(index),
                      selecting: _selecting,
                      onTap: () {
                        if (_selecting) {
                          _toggle(index);
                          return;
                        }
                        Navigator.of(context).push(
                          AppPageTransitions.fadeThrough<void>(
                            ReaderScreen(postId: posts[index].id),
                            name: 'reader',
                          ),
                        );
                      },
                      onLongPress: () => _toggle(index),
                      onMenu: () => _showActions(context, scope, posts[index]),
                    ),
                  ),
                ),

              // Clearance for the extended FAB.
              const SliverToBoxAdapter(child: SizedBox(height: 96)),
            ],
          );
        },
      ),
    );
  }

  void _showActions(BuildContext context, AppScope scope, Post post) {
    final isSignedIn = scope.auth.isSignedIn;
    final theme = M3ETheme.of(context);

    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(M3EIcons.edit),
              title: const Text('Edit'),
              onTap: () {
                Navigator.of(sheetContext).pop();
                widget.onOpenEditor(postId: post.id);
              },
            ),
            ListTile(
              leading: const Icon(M3EIcons.image),
              title: const Text('Share as image'),
              onTap: () {
                Navigator.of(sheetContext).pop();
                Navigator.of(context).push(
                  AppPageTransitions.fadeThrough<void>(
                    ShareCardScreen(post: post),
                    name: 'share-card',
                  ),
                );
              },
            ),
            ListTile(
              leading: Icon(M3EIcons.delete, color: theme.colorScheme.error),
              title: const Text('Delete'),
              onTap: () async {
                Navigator.of(sheetContext).pop();
                try {
                  await scope.posts
                      .deletePosts([post.id], isSignedIn: isSignedIn);
                  if (!context.mounted) return;
                  showAppSnack(context, 'Deleted "${post.title}"');
                } catch (_) {
                  if (!context.mounted) return;
                  showAppSnack(context, 'Could not delete that note.',
                      isError: true);
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}

/// Sliver app bar for the notes tab. The serif-italic wordmark carries the web
/// app's editorial identity into the Material shell.
class _NotesAppBar extends StatelessWidget {
  const _NotesAppBar({
    required this.searchController,
    required this.scope,
  });

  final M3ESearchController searchController;
  final AppScope scope;

  @override
  Widget build(BuildContext context) {
    final theme = M3ETheme.of(context);

    return M3EAppBar.sliver(
      // A widget title so the serif-italic wordmark matches the web app's
      // editorial identity instead of the app bar's default sans.
      title: Text(
        'unmindful',
        style: theme.typography.baseline.headlineMedium.copyWith(
          fontFamily: 'serif',
          fontStyle: FontStyle.italic,
          fontWeight: FontWeight.w400,
          letterSpacing: -0.5,
        ),
      ),
      subtitleText: scope.auth.isSignedIn
          ? 'Welcome back, ${scope.auth.user!.handle}'
          : 'write your random thought',
      actions: [
        M3EIconButton(
          icon: const Icon(M3EIcons.search),
          tooltip: 'Search notes',
          onPressed: () => Navigator.of(context).push(
            AppPageTransitions.fadeThrough<void>(
              SearchScreen(searchController: searchController),
              name: 'search',
            ),
          ),
        ),
        M3EIconButton(
          icon: const Icon(M3EIcons.import_export),
          tooltip: 'Import & export',
          onPressed: () => showDataSheet(context),
        ),
        if (scope.auth.isSignedIn)
          M3EIconButton(
            icon: const Icon(M3EIcons.account_circle),
            tooltip: 'Account',
            onPressed: () => _showAccountSheet(context),
          )
        else
          M3EIconButton(
            icon: const Icon(M3EIcons.login),
            tooltip: 'Sign in',
            onPressed: () => Navigator.of(context).push(
              AppPageTransitions.fadeThrough<void>(
                const AuthScreen(),
                name: 'auth',
              ),
            ),
          ),
      ],
    );
  }

  void _showAccountSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (_) => const _AccountSheet(),
    );
  }
}

class _AccountSheet extends StatelessWidget {
  const _AccountSheet();

  @override
  Widget build(BuildContext context) {
    final scope = AppScope.of(context);
    final theme = M3ETheme.of(context);

    return SafeArea(
      child: ListenableBuilder(
        listenable: scope.auth,
        builder: (context, _) => Padding(
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(scope.auth.user?.email ?? '',
                  style: theme.typography.baseline.titleMedium),
              if (scope.auth.isMigrating) ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    const SizedBox(width: 10),
                    Text('Syncing your notes…',
                        style: theme.typography.baseline.bodySmall),
                  ],
                ),
              ],
              const SizedBox(height: 12),
              M3EDivider(),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(M3EIcons.logout),
                title: const Text('Sign out'),
                onTap: () async {
                  Navigator.of(context).pop();
                  await scope.auth.signOut();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PostTile extends StatelessWidget {
  const _PostTile({
    required this.post,
    required this.selected,
    required this.selecting,
    required this.onTap,
    required this.onLongPress,
    required this.onMenu,
  });

  final Post post;
  final bool selected;
  final bool selecting;
  final VoidCallback onTap;
  final VoidCallback onLongPress;
  final VoidCallback onMenu;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onLongPress: onLongPress,
      child: M3EListItem(
        headline: post.title.trim().isEmpty ? 'Untitled note' : post.title,
        supportingText: DateFormat.yMMMd().format(post.createdAt),
        selected: selected,
        trailing: M3EIconButton(
          icon: const Icon(M3EIcons.more_vert),
          tooltip: 'Note options',
          onPressed: onMenu,
        ),
        onTap: onTap,
      ),
    );
  }
}

class _GuestBanner extends StatelessWidget {
  const _GuestBanner({required this.remaining});

  final int remaining;

  @override
  Widget build(BuildContext context) {
    final theme = M3ETheme.of(context);

    if (remaining <= 0) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        child: M3ECard(
          variant: M3ECardVariant.filled,
          color: theme.colorScheme.errorContainer,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(M3EIcons.lock,
                      size: 18, color: theme.colorScheme.onErrorContainer),
                  const SizedBox(width: 8),
                  Text(
                    'Guest limit reached',
                    style: theme.typography.baseline.titleSmall
                        .copyWith(color: theme.colorScheme.onErrorContainer),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'You have written ${AppConfig.maxGuestPosts} local notes. '
                'Sign in to sync them to the cloud, unlock unlimited writing, '
                'and keep them safe forever.',
                style: theme.typography.baseline.bodySmall
                    .copyWith(color: theme.colorScheme.onErrorContainer),
              ),
              const SizedBox(height: 12),
              M3EButton(
                onPressed: () => Navigator.of(context).push(
                  AppPageTransitions.fadeThrough<void>(
                    const AuthScreen(),
                    name: 'auth',
                  ),
                ),
                child: const Text('Sign in to continue'),
              ),
            ],
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Row(
        children: [
          Icon(M3EIcons.cloud_off, size: 14, color: theme.colorScheme.outline),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              '$remaining of ${AppConfig.maxGuestPosts} free notes left — '
              'sign in to keep them forever.',
              style: theme.typography.baseline.bodySmall
                  .copyWith(color: theme.colorScheme.outline),
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = M3ETheme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: M3ECard(
        variant: M3ECardVariant.outlined,
        child: Row(
          children: [
            Icon(M3EIcons.error, color: theme.colorScheme.error),
            const SizedBox(width: 12),
            Expanded(child: Text(message)),
            const SizedBox(width: 8),
            M3EButton.text(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onCompose});

  final VoidCallback onCompose;

  @override
  Widget build(BuildContext context) {
    final scope = AppScope.of(context);
    final theme = M3ETheme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(M3EIcons.edit_note, size: 48, color: theme.colorScheme.outline),
            const SizedBox(height: 16),
            Text('No notes yet', style: theme.typography.baseline.titleMedium),
            const SizedBox(height: 8),
            Text(
              scope.auth.isSignedIn
                  ? 'Tap New note to write your first one.'
                  : 'Tap New note to write something. Notes stay on this '
                      'device until you sign in.',
              textAlign: TextAlign.center,
              style: theme.typography.baseline.bodyMedium
                  .copyWith(color: theme.colorScheme.outline),
            ),
            const SizedBox(height: 24),
            M3EButton(
              icon: const Icon(M3EIcons.add),
              onPressed: onCompose,
              child: const Text('Write your first note'),
            ),
          ],
        ),
      ),
    );
  }
}