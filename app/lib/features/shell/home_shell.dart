import 'package:material_ui/material_ui.dart';
import 'package:material_3_expressive/material_3_expressive.dart';

import '../../app.dart';
import '../../core/theme.dart';
import '../editor/editor_screen.dart';
import '../feed/feed_screen.dart';
import '../settings/settings_screen.dart';

/// Two-destination shell: notes plus settings.
///
/// Compose is an extended FAB rather than a third tab: a dedicated "write"
/// tab is mostly dead space, whereas the editor wants the whole viewport.
///
/// Each tab renders its own *sliver* app bar, so the bar is part of the
/// scroll content and collapses 1:1 with the list. `M3ESelection` was not used
/// here because it insists on owning the Scaffold, which would collide with
/// the navigation bar below.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  void _openEditor({String? postId}) {
    final scope = AppScope.of(context);
    final navigator = Navigator.of(context);
    navigator
        .push(AppPageTransitions.fadeThrough<void>(
          EditorScreen(postId: postId),
          name: 'editor',
        ))
        .then((_) {
      if (!mounted) return;
      scope.posts.refresh(isSignedIn: scope.auth.isSignedIn);
    });
  }

  @override
  Widget build(BuildContext context) {
    context.syncSystemBars();

    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: [
          FeedScreen(onOpenEditor: _openEditor),
          const SettingsScreen(),
        ],
      ),
      bottomNavigationBar: M3ENavigationBar(
        destinations: const [
          M3ENavigationBarDestination(
            icon: Icon(M3EIcons.notes),
            selectedIcon: Icon(M3EIcons.notes),
            label: 'Notes',
          ),
          M3ENavigationBarDestination(
            icon: Icon(M3EIcons.settings),
            selectedIcon: Icon(M3EIcons.settings),
            label: 'Settings',
          ),
        ],
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
      ),
      floatingActionButton: _index == 0
          ? M3EExtendedFab(
              icon: const Icon(M3EIcons.add),
              label: 'New note',
              onPressed: () => _openEditor(),
            )
          : null,
    );
  }
}