import 'dart:async';

import 'package:material_ui/material_ui.dart';
import 'package:flutter/services.dart';
import 'package:material_3_expressive/material_3_expressive.dart';

import '../../app.dart';
import '../../core/config.dart';
import '../../core/theme.dart';
import '../../data/local_store.dart';
import '../../data/models.dart';
import '../../data/posts_repository.dart';
import '../auth/auth_screen.dart';
import '../markdown/markdown_view.dart';

enum _EditorMode { write, preview }

/// Markdown editor with a live preview.
///
/// Storage is markdown on both ends (the DB column *and* the guest drafts), so
/// there is no rich-text <-> markdown conversion step and no way for an
/// existing post to be mangled by a round trip.
class EditorScreen extends StatefulWidget {
  const EditorScreen({super.key, this.postId});

  /// Null means "compose a new note".
  final String? postId;

  @override
  State<EditorScreen> createState() => _EditorScreenState();
}

class _EditorScreenState extends State<EditorScreen> with WidgetsBindingObserver {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  final _titleController = ScrollController();

  late String _postId;
  _EditorMode _mode = _EditorMode.write;
  SaveState _saveState = SaveState.idle;
  int _wordCount = 0;
  bool _loading = true;

  Timer? _debounce;
  Timer? _wordTick;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _debounce?.cancel();
    _wordTick?.cancel();
    _controller.dispose();
    _focusNode.dispose();
    _titleController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Persist immediately when the app is backgrounded; the debounce may not
    // have fired and the process can be killed without further notice.
    if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.paused) {
      unawaited(_persist());
    }
  }

  Future<void> _load() async {
    final scope = AppScope.of(context);
    final store = scope.store;
    final isSignedIn = scope.auth.isSignedIn;

    String? id = widget.postId;
    String initial = '';

    if (id == null) {
      // Resume the in-progress draft, exactly like the web Editor does.
      if (!isSignedIn) {
        id = store.readCurrentDraftId();
        final existing =
            id == null ? null : store.readGuestPosts().where((p) => p.id == id).firstOrNull;
        if (existing != null) initial = existing.content;
      }
      _postId = id ?? DateTime.now().millisecondsSinceEpoch.toString();
    } else {
      _postId = id;
      final post = await scope.posts.loadPost(id, isSignedIn: isSignedIn);
      if (post != null) initial = post.content;
    }

    _controller.text = initial;
    _controller.addListener(_onChanged);
    _setWordCount(initial);

    if (!isSignedIn) {
      await store.writeCurrentDraftId(_postId);
    }

    if (!mounted) return;
    setState(() => _loading = false);
  }

  void _onChanged() {
    _scheduleSave();

    // Word count is cosmetic, so throttle it well below the save cadence.
    _wordTick ??= Timer(const Duration(milliseconds: 300), () {
      _wordTick = null;
      _setWordCount(_controller.text);
    });
  }

  void _setWordCount(String value) {
    final count = Post.countWords(value);
    if (count != _wordCount && mounted) {
      setState(() => _wordCount = count);
    }
  }

  void _scheduleSave() {
    _debounce?.cancel();
    setState(() => _saveState = SaveState.saving);
    _debounce = Timer(const Duration(milliseconds: 1000), () => _persist());
  }

  Future<void> _persist() async {
    final scope = AppScope.of(context);
    final content = _controller.text;

    // Nothing typed yet: don't create empty rows.
    if (content.trim().isEmpty && widget.postId == null) {
      if (mounted) setState(() => _saveState = SaveState.idle);
      return;
    }

    try {
      final state = await scope.posts.savePost(
        id: _postId,
        content: content,
        isSignedIn: scope.auth.isSignedIn,
      );
      if (!mounted) return;
      setState(() => _saveState = state);
    } on GuestLimitReached {
      if (!mounted) return;
      setState(() => _saveState = SaveState.idle);
      _showLimitSheet();
    } catch (_) {
      if (!mounted) return;
      setState(() => _saveState = SaveState.failed);
    }
  }

  void _showLimitSheet() {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) {
        final theme = M3ETheme.of(context);
        return Padding(
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(M3EIcons.lock, color: theme.colorScheme.primary),
              const SizedBox(height: 12),
              Text('Free notes used up',
                  style: theme.typography.baseline.titleLarge),
              const SizedBox(height: 8),
              Text(
                'You have written ${AppConfig.maxGuestPosts} local notes. '
                'Sign in to sync them to the cloud, unlock unlimited writing, '
                'and keep them safe forever.',
                style: theme.typography.baseline.bodyMedium,
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  M3EButton.text(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Not now'),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: M3EButton(
                      onPressed: () {
                        Navigator.of(context).pop();
                        Navigator.of(this.context).pushReplacement(
                          AppPageTransitions.fadeThrough<void>(
                            const AuthScreenRef(),
                            name: 'auth',
                          ),
                        );
                      },
                      child: const Text('Sign in'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  String _statusLabel() {
    switch (_saveState) {
      case SaveState.idle:
        return _wordCount == 0 ? 'New note' : 'Draft';
      case SaveState.saving:
        return 'Saving…';
      case SaveState.saved:
        return 'Saved';
      case SaveState.local:
        return 'Saved on device';
      case SaveState.failed:
        return 'Save failed';
    }
  }

  @override
  Widget build(BuildContext context) {
    final scope = AppScope.of(context);
    final theme = M3ETheme.of(context);
    final settings = scope.store.readSettings();
    final isPreview = _mode == _EditorMode.preview;

    return Scaffold(
      extendBodyBehindAppBar: true,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : GestureDetector(
              // Tapping the margin returns focus to the keyboard-friendly view.
              onTap: () => FocusScope.of(context).unfocus(),
              child: CustomScrollView(
                controller: _titleController,
                keyboardDismissBehavior:
                    ScrollViewKeyboardDismissBehavior.onDrag,
                slivers: [
                  // A sliver app bar lives in the scroll view, so it collapses
                  // 1:1 with the content (Scaffold.appBar wants a RenderBox).
                  M3EAppBar.sliver(
                    titleText:
                        widget.postId == null ? 'New note' : 'Edit note',
                    actions: [
                      M3EIconButton(
                        icon:
                            Icon(isPreview ? M3EIcons.edit : M3EIcons.visibility),
                        tooltip: isPreview ? 'Edit' : 'Preview',
                        isSelected: isPreview,
                        onPressed: _loading
                            ? null
                            : () => setState(() => _mode = isPreview
                                ? _EditorMode.write
                                : _EditorMode.preview),
                      ),
                      M3EIconButton(
                        icon: const Icon(M3EIcons.more_vert),
                        tooltip: 'Note options',
                        onPressed: _loading ? null : () => _showMenu(context),
                      ),
                    ],
                  ),

                  // Live status + stats strip.
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                      child: Row(
                        children: [
                          _StatusChip(state: _saveState, label: _statusLabel()),
                          const Spacer(),
                          if (_wordCount > 0) ...[
                            Text(
                              '$_wordCount ${_wordCount == 1 ? 'word' : 'words'}',
                              style: theme.typography.baseline.labelMedium
                                  .copyWith(color: theme.colorScheme.outline),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${(_wordCount / 200).ceil().clamp(1, 9999)} min read',
                              style: theme.typography.baseline.labelMedium
                                  .copyWith(color: theme.colorScheme.outline),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),

                  if (isPreview)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(20, 8, 20, 140),
                        child: MarkdownView(
                          source: _controller.text,
                          font: settings.fontFamily == ReaderFont.serif
                              ? ReaderFontKind.serif
                              : ReaderFontKind.sans,
                          fontSize: settings.fontSize.toDouble(),
                        ),
                      ),
                    )
                  else
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(20, 4, 20, 140),
                        child: TextField(
                          controller: _controller,
                          focusNode: _focusNode,
                          autofocus: true,
                          maxLines: null,
                          expands: false,
                          keyboardType: TextInputType.multiline,
                          textCapitalization: TextCapitalization.sentences,
                          textInputAction: TextInputAction.newline,
                          cursorWidth: 2,
                          style: theme.typography.baseline.bodyLarge.copyWith(
                            fontSize: settings.fontSize.toDouble(),
                            height: 1.65,
                            fontFamily: settings.fontFamily == ReaderFont.serif
                                ? 'serif'
                                : null,
                          ),
                          decoration: InputDecoration(
                            border: InputBorder.none,
                            hintText: 'Start writing…',
                            hintStyle: theme.typography.baseline.bodyLarge.copyWith(
                              fontSize: settings.fontSize.toDouble(),
                              color: theme.colorScheme.outline,
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
      // Quick markdown inserts — the mobile equivalent of the web toolbar.
      bottomNavigationBar: isPreview
          ? null
          : _QuickBar(controller: _controller),
    );
  }

  void _showMenu(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(M3EIcons.add),
              title: const Text('New note'),
              onTap: () async {
                // Capture this State's navigator before awaiting.
                final navigator = Navigator.of(context);
                Navigator.of(sheetContext).pop();
                await _persist();
                if (!mounted) return;
                navigator.pushReplacement(
                  AppPageTransitions.fadeThrough<void>(
                    const EditorScreen(),
                    name: 'editor',
                  ),
                );
              },
            ),
            ListTile(
              leading: Icon(
                M3EIcons.delete,
                color: M3ETheme.of(context).colorScheme.error,
              ),
              title: const Text('Delete note'),
              onTap: () async {
                final navigator = Navigator.of(context);
                final messenger = ScaffoldMessenger.of(context);
                final scope = AppScope.of(context);
                final errorColor =
                    M3ETheme.of(context).colorScheme.error;
                Navigator.of(sheetContext).pop();
                try {
                  await scope.posts.deletePosts(
                    [_postId],
                    isSignedIn: scope.auth.isSignedIn,
                  );
                  if (!mounted) return;
                  navigator.pop();
                } catch (_) {
                  if (!mounted) return;
                  messenger.showSnackBar(
                    SnackBar(
                      content: Text(
                        'Could not delete that note.',
                        style: TextStyle(color: errorColor),
                      ),
                    ),
                  );
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.state, required this.label});

  final SaveState state;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = M3ETheme.of(context);
    final (color, icon) = switch (state) {
      SaveState.failed => (theme.colorScheme.error, M3EIcons.error),
      SaveState.saving => (theme.colorScheme.outline, M3EIcons.more_horiz),
      SaveState.saved => (theme.colorScheme.primary, M3EIcons.cloud_done),
      SaveState.local => (theme.colorScheme.primary, M3EIcons.phone_android),
      SaveState.idle => (theme.colorScheme.outline, M3EIcons.edit),
    };

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 6),
        Text(
          label,
          style: theme.typography.baseline.labelMedium.copyWith(color: color),
        ),
      ],
    );
  }
}

/// Markdown syntax shortcuts along the bottom of the editor.
class _QuickBar extends StatelessWidget {
  const _QuickBar({required this.controller});

  final TextEditingController controller;

  static const _actions = <({String label, String before, String after, IconData icon})>[
    (label: 'Bold', before: '**', after: '**', icon: M3EIcons.format_bold),
    (label: 'Italic', before: '_', after: '_', icon: M3EIcons.format_italic),
    (label: 'Heading', before: '## ', after: '', icon: M3EIcons.title),
    (label: 'List', before: '- ', after: '', icon: M3EIcons.format_list_bulleted),
    (label: 'Quote', before: '> ', after: '', icon: M3EIcons.format_quote),
    (label: 'Code', before: '`', after: '`', icon: M3EIcons.code),
    (label: 'Link', before: '[', after: '](url)', icon: M3EIcons.link),
  ];

  void _apply(String before, String after) {
    final value = controller.value;
    final selection = value.selection;
    final text = value.text;

    // Valid selection: wrap it. Otherwise insert the markers and place the
    // caret between them.
    final start = selection.start < 0 ? text.length : selection.start;
    final end = selection.end < 0 ? text.length : selection.end;

    if (selection.isCollapsed) {
      final inserted = '$before$after';
      final next = text.replaceRange(start, end, inserted);
      controller.value = TextEditingValue(
        text: next,
        selection: TextSelection.collapsed(
          offset: start + before.length,
        ),
      );
    } else {
      final selected = text.substring(start, end);
      final next = text.replaceRange(start, end, '$before$selected$after');
      controller.value = TextEditingValue(
        text: next,
        selection: TextSelection(
          baseOffset: start + before.length,
          extentOffset: end + before.length,
        ),
      );
    }
    HapticFeedback.selectionClick();
  }

  @override
  Widget build(BuildContext context) {
    final theme = M3ETheme.of(context);

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainer,
        border: Border(
          top: BorderSide(color: theme.colorScheme.outlineVariant),
        ),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 48,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 8),
            itemCount: _actions.length,
            separatorBuilder: (_, _) => const SizedBox(width: 2),
            itemBuilder: (context, index) {
              final action = _actions[index];
              return IconButton(
                tooltip: action.label,
                icon: Icon(action.icon, size: 20),
                onPressed: () => _apply(action.before, action.after),
              );
            },
          ),
        ),
      ),
    );
  }
}

/// Indirection so the limit sheet can push the auth screen without a cycle.
class AuthScreenRef extends StatelessWidget {
  const AuthScreenRef({super.key});

  @override
  Widget build(BuildContext context) => const AuthScreen();
}

extension _FirstOrNull<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}