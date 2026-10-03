import 'package:material_ui/material_ui.dart';
import 'package:material_3_expressive/material_3_expressive.dart';

/// Builds the Material 3 Expressive theme.
///
/// Dynamic colour is the primary path: on Android 12+ the scheme is derived
/// from the user's wallpaper, which is what makes the app feel native to them.
/// A brand seed is kept as the fallback (and for the optional "brand" toggle)
/// so the app never renders with Google's default purple.
class AppTheme {
  const AppTheme._();

  /// Editorial fallback seed. Zinc-leaning, matches the web app's monochrome.
  static const Color brandSeed = Color(0xFF6E6E73);

  /// Accent pulled from the web design (amber/orange highlights).
  static const Color accentSeed = Color(0xFFFF9500);

  static M3EThemeData light({Color? seed}) =>
      M3EThemeData.light(seedColor: seed ?? brandSeed);

  static M3EThemeData dark({Color? seed}) =>
      M3EThemeData.dark(seedColor: seed ?? brandSeed);
}

/// Reading-typography helpers shared by the editor and reader.
class ReaderTextStyle {
  const ReaderTextStyle._();

  /// Body style for rendered markdown, honouring the user's font choice.
  static TextStyle body({
    required Color color,
    required ReaderFontKind font,
    required double fontSize,
    double height = 1.7,
  }) =>
      TextStyle(
        color: color,
        fontSize: fontSize,
        height: height,
        fontFamily: font == ReaderFontKind.serif ? 'serif' : null,
        fontFamilyFallback: font == ReaderFontKind.serif
            ? const ['Georgia', 'Cambria', 'Times New Roman']
            : null,
      );
}

/// Mirrors `ReaderFont` without importing the data layer into UI code.
enum ReaderFontKind { sans, serif }

/// Page-level transition used across the app.
///
/// M3E ships springs via `motor`; for route changes we use a shared
/// fade-through + slight rise, which reads as "expressive" without the
/// sluggishness of a full spatial morph on every push.
class AppPageTransitions {
  const AppPageTransitions._();

  static Route<T> fadeThrough<T>(Widget page, {String? name}) {
    return PageRouteBuilder<T>(
      settings: RouteSettings(name: name),
      transitionDuration: const Duration(milliseconds: 320),
      reverseTransitionDuration: const Duration(milliseconds: 240),
      pageBuilder: (_, _, _) => page,
      transitionsBuilder: (_, animation, _, child) {
        final curved = CurvedAnimation(
          parent: animation,
          curve: Curves.easeOutCubic,
          reverseCurve: Curves.easeInCubic,
        );
        return FadeTransition(
          opacity: curved,
          child: SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0, 0.035),
              end: Offset.zero,
            ).animate(curved),
            child: child,
          ),
        );
      },
    );
  }
}

/// Snackbar helper so every surface reports results the same Material 3 way.
void showAppSnack(
  BuildContext context,
  String message, {
  bool isError = false,
  SnackBarAction? action,
}) {
  final theme = M3ETheme.of(context);
  final messenger = ScaffoldMessenger.of(context);
  messenger
    ..clearSnackBars()
    ..showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: isError
              ? TextStyle(color: theme.colorScheme.onErrorContainer)
              : null,
        ),
        action: action,
        behavior: SnackBarBehavior.floating,
        showCloseIcon: true,
        backgroundColor:
            isError ? theme.colorScheme.errorContainer : null,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
}