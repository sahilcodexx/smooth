import 'package:flutter/services.dart';
import 'package:material_3_expressive/material_3_expressive.dart';
import 'package:material_ui/material_ui.dart';

import 'core/theme.dart';
import 'data/api_client.dart';
import 'data/auth_repository.dart';
import 'data/local_store.dart';
import 'data/posts_repository.dart';
import 'features/auth/auth_screen.dart';
import 'features/oauth/oauth_flow.dart';
import 'features/shell/home_shell.dart';

/// Root widget.
///
/// `M3EMaterialApp` is the kit's shell: it owns dynamic colour (Material You)
/// and brightness resolution. We hand it a single light `M3EThemeData` and let
/// it derive the dark template, then drive brightness through its
/// `M3EThemeController` — rather than hand-rolling a ThemeMode switch.
class SmoothApp extends StatefulWidget {
  const SmoothApp({
    super.key,
    required this.api,
    required this.store,
    required this.auth,
    required this.posts,
  });

  final ApiClient api;
  final LocalStore store;
  final AuthRepository auth;
  final PostsRepository posts;

  @override
  State<SmoothApp> createState() => _SmoothAppState();
}

class _SmoothAppState extends State<SmoothApp> {
  // Held here rather than inside AppScope so they keep a stable identity
  // across rebuilds — AppScope is recreated whenever the theme changes.
  late final ThemeController _themeController = ThemeController(widget.store);
  late final OAuthFlow _oauth = OAuthFlow(widget.auth, widget.api);

  @override
  void dispose() {
    _themeController.dispose();
    _oauth.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _themeController,
      builder: (context, _) {
        final theme = _themeController;

        return M3EMaterialApp(
          title: 'unmindful',
          data: AppTheme.light(seed: theme.seed),
          controller: theme.brightnessController,
          // autoTheming = follow the system; the settings toggle switches it
          // off and pins an absolute brightness instead.
          autoTheming: theme.followSystem,
          initialTheme: theme.followSystem
              ? null
              : theme.isDark
                  ? Brightness.dark
                  : Brightness.light,
          dynamicColoring: theme.useDynamicColor,
          drawUnderSystemBars: true,
          debugShowCheckedModeBanner: false,
          fontFamily: 'Geist',
          // Required since Material moved to its own package: without these
          // delegates any TextField throws "No MaterialLocalizations found".
          localizationsDelegates: GlobalMaterialLocalizations.delegates,
          supportedLocales: const [Locale('en', 'US')],
          // `appBuilder` sits above the Navigator, so every pushed route — and
          // therefore AppScope.of(context) — resolves to the same scope.
          appBuilder: (context, child) => AppScope(
            api: widget.api,
            store: widget.store,
            auth: widget.auth,
            posts: widget.posts,
            themeController: theme,
            oauth: _oauth,
            child: child ?? const SizedBox.shrink(),
          ),
          home: const _Root(),
        );
      },
    );
  }
}

class _Root extends StatefulWidget {
  const _Root();

  @override
  State<_Root> createState() => _RootState();
}

class _RootState extends State<_Root> {
  @override
  Widget build(BuildContext context) {
    final scope = AppScope.of(context);
    return ListenableBuilder(
      listenable: scope.auth,
      builder: (context, _) {
        switch (scope.auth.status) {
          case AuthStatus.unknown:
            return const _Splash();
          case AuthStatus.signedOut:
            return const AuthScreen();
          case AuthStatus.signedIn:
            return const HomeShell();
        }
      },
    );
  }
}

class _Splash extends StatelessWidget {
  const _Splash();

  @override
  Widget build(BuildContext context) {
    final scheme = M3ETheme.of(context).colorScheme;
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Matches the web app's rotated-diamond mark.
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: scheme.surfaceContainerHigh,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Center(
                child: Transform.rotate(
                  angle: 0.785398, // 45 degrees
                  child: Container(
                    width: 14,
                    height: 14,
                    decoration: BoxDecoration(
                      color: scheme.primary,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'unmindful',
              style: M3ETheme.of(context)
                  .typography
                  .baseline
                  .headlineSmall
                  .copyWith(
                    fontFamily: 'serif',
                    fontStyle: FontStyle.italic,
                    fontWeight: FontWeight.w400,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Dependency container exposed to the widget tree.
class AppScope extends InheritedWidget {
  const AppScope({
    super.key,
    required this.api,
    required this.store,
    required this.auth,
    required this.posts,
    required this.themeController,
    required this.oauth,
    required super.child,
  });

  final ApiClient api;
  final LocalStore store;
  final AuthRepository auth;
  final PostsRepository posts;
  final ThemeController themeController;

  /// Stable across rebuilds, so the deep-link listener is registered once.
  final OAuthFlow oauth;

  static AppScope of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AppScope>();
    assert(scope != null, 'AppScope missing from the widget tree');
    return scope!;
  }

  @override
  bool updateShouldNotify(AppScope oldWidget) => false;
}

/// User-facing appearance settings, persisted across launches.
class ThemeController extends ChangeNotifier {
  ThemeController(LocalStore store) : _store = store {
    _load();
  }

  final LocalStore _store;

  static const _kMode = 'smooth_theme_mode';
  static const _kDynamic = 'smooth_dynamic_color';

  /// Bridges our persisted preference onto the kit's brightness controller.
  final M3EThemeController brightnessController = M3EThemeController();

  /// `'system'`, `'light'` or `'dark'`.
  late String _mode;
  late bool _useDynamicColor;

  bool get useDynamicColor => _useDynamicColor;
  bool get followSystem => _mode == 'system';
  bool get isDark => _mode == 'dark';

  /// Seed used when dynamic colour is off.
  Color get seed => AppTheme.brandSeed;

  void _load() {
    final prefs = _store.prefs;
    _mode = prefs.getString(_kMode) ?? 'dark';
    _useDynamicColor = prefs.getBool(_kDynamic) ?? true;
    _apply();
  }

  void _apply() {
    if (followSystem) {
      brightnessController.followSystem();
    } else {
      brightnessController.setBrightness(
        _mode == 'dark' ? Brightness.dark : Brightness.light,
      );
    }
  }

  Future<void> setMode(String mode) async {
    _mode = mode;
    await _store.prefs.setString(_kMode, mode);
    _apply();
    notifyListeners();
  }

  Future<void> setDark(bool value) =>
      setMode(value ? 'dark' : 'light');

  Future<void> setDynamicColor(bool value) async {
    _useDynamicColor = value;
    await _store.prefs.setBool(_kDynamic, value);
    notifyListeners();
  }
}

/// Keeps system bar icon tints in step with the current brightness.
extension SystemBarsX on BuildContext {
  void syncSystemBars() {
    final isDark = M3ETheme.of(this).brightness == Brightness.dark;
    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
        statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
        systemNavigationBarColor: Colors.transparent,
        systemNavigationBarIconBrightness:
            isDark ? Brightness.light : Brightness.dark,
      ),
    );
  }
}