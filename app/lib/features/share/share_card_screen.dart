import 'dart:io';
import 'dart:ui' as ui;

import 'package:material_ui/material_ui.dart';
import 'package:flutter/rendering.dart';
import 'package:material_3_expressive/material_3_expressive.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../app.dart';
import '../../core/theme.dart';
import '../../data/models.dart';

/// Renders a note to a PNG and hands it to the native share sheet.
///
/// This is the native replacement for the web build's `html-to-image`
/// capture: `RepaintBoundary` gives the same "render this subtree to a
/// bitmap" primitive, and `share_plus` replaces the Web Share API.
class ShareCardScreen extends StatefulWidget {
  const ShareCardScreen({super.key, required this.post});

  final Post post;

  @override
  State<ShareCardScreen> createState() => _ShareCardScreenState();
}

enum _CardTheme { dark, sepia, light, midnight }

class _ShareCardScreenState extends State<ShareCardScreen> {
  final _boundaryKey = GlobalKey();

  _CardTheme _theme = _CardTheme.dark;
  bool _rendering = false;

  Future<void> _share() async {
    setState(() => _rendering = true);
    try {
      final file = await _capture();
      if (!mounted) return;
      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(file.path, mimeType: 'image/png')],
          fileNameOverrides: [_slug()],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      showAppSnack(context, 'Could not create the image.', isError: true);
    } finally {
      if (mounted) setState(() => _rendering = false);
    }
  }

  String _slug() {
    final base = widget.post.title.trim().isEmpty
        ? 'post'
        : widget.post.title.trim().toLowerCase().replaceAll(RegExp(r'\s+'), '-');
    return '$base-card.png';
  }

  /// Capture the card subtree at 3x for a crisp export.
  Future<File> _capture() async {
    final boundary = _boundaryKey.currentContext!.findRenderObject()
        as RenderRepaintBoundary;

    // 3x capture for a crisp export, but never below 2x (wastes memory) or
    // above 3x (OOM risk on large cards).
    final deviceRatio = MediaQuery.devicePixelRatioOf(context);
    final ratio = (boundary.size.width / deviceRatio).clamp(2.0, 3.0);

    final image = await boundary.toImage(pixelRatio: ratio);
    final data = await image.toByteData(format: ui.ImageByteFormat.png);
    image.dispose();
    if (data == null) throw StateError('PNG encode failed');

    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/${_slug()}');
    await file.writeAsBytes(data.buffer.asUint8List(), flush: true);
    return file;
  }

  @override
  Widget build(BuildContext context) {
    final theme = M3ETheme.of(context);
    final author = AppScope.of(context).auth.user?.handle ?? 'guest';

    return Scaffold(
      appBar: M3EAppBar.top(
        titleText: 'Share card',
        actions: [
          M3EIconButton(
            icon: const Icon(M3EIcons.share),
            tooltip: 'Share',
            onPressed: _rendering ? null : _share,
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: Row(
              children: [
                Text('Theme', style: theme.typography.baseline.labelLarge),
                const SizedBox(width: 12),
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        for (final t in _CardTheme.values) ...[
                          M3EChip(
                            label: t.name,
                            type: M3EChipType.filter,
                            selected: _theme == t,
                            onPressed: () => setState(() => _theme = t),
                          ),
                          const SizedBox(width: 8),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: RepaintBoundary(
                  key: _boundaryKey,
                  child: _ShareCard(
                    post: widget.post,
                    theme: _theme,
                    author: author,
                  ),
                ),
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: M3EButton(
                style: M3EButtonStyle.filled,
                icon: const Icon(M3EIcons.share),
                onPressed: _rendering ? null : _share,
                child: Text(_rendering ? 'Rendering…' : 'Share as image'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Palette {
  const _Palette({
    required this.background,
    required this.border,
    required this.text,
    required this.muted,
    required this.glow,
    required this.quoteMark,
    required this.authorBg,
    required this.authorBorder,
    required this.authorText,
  });

  final Color background;
  final Color border;
  final Color text;
  final Color muted;
  final Color glow;
  final Color quoteMark;
  final Color authorBg;
  final Color authorBorder;
  final Color authorText;

  static const _dark = _Palette(
    background: Color(0xFF09090B),
    border: Color(0xFF27272A),
    text: Color(0xFFF4F4F5),
    muted: Color(0xFFA1A1AA),
    glow: Color(0x1AF59E0B),
    quoteMark: Color(0x33F59E0B),
    authorBg: Color(0xFF18181B),
    authorBorder: Color(0xFF27272A),
    authorText: Color(0xFFD4D4D8),
  );

  static const _sepia = _Palette(
    background: Color(0xFF141210),
    border: Color(0xFF2B2520),
    text: Color(0xFFEDE5DD),
    muted: Color(0xFFAA9E93),
    glow: Color(0x26F97316),
    quoteMark: Color(0x33F97316),
    authorBg: Color(0xFF211D19),
    authorBorder: Color(0xFF362F28),
    authorText: Color(0xFFD4C8BD),
  );

  static const _light = _Palette(
    background: Color(0xFFFAF8F5),
    border: Color(0xFFE4E4E7),
    text: Color(0xFF18181B),
    muted: Color(0xFF52525B),
    glow: Color(0x4DFDE68A),
    quoteMark: Color(0x26F59E0B),
    authorBg: Color(0xFFFFFFFF),
    authorBorder: Color(0xFFE4E4E7),
    authorText: Color(0xFF3F3F46),
  );

  static const _midnight = _Palette(
    background: Color(0xFF060913),
    border: Color(0x661E3A8A),
    text: Color(0xFFEFF6FF),
    muted: Color(0xFF93C5FD),
    glow: Color(0x336366F1),
    quoteMark: Color(0x33818CF8),
    authorBg: Color(0x991E3A8A),
    authorBorder: Color(0x9934606A),
    authorText: Color(0xFFBFDBFE),
  );

  static _Palette of(_CardTheme theme) => switch (theme) {
        _CardTheme.dark => _dark,
        _CardTheme.sepia => _sepia,
        _CardTheme.light => _light,
        _CardTheme.midnight => _midnight,
      };
}

/// The exported artwork. Fixed 420dp width like the web card, with the radial
/// glow and oversized quote mark composited behind the text.
class _ShareCard extends StatelessWidget {
  const _ShareCard({
    required this.post,
    required this.theme,
    required this.author,
  });

  final Post post;
  final _CardTheme theme;
  final String author;

  @override
  Widget build(BuildContext context) {
    final p = _Palette.of(theme);

    final plain = post.plainText;
    final title = post.title.trim();
    final isTitleOnly = plain.isEmpty || plain == title;
    final excerpt = isTitleOnly
        ? ''
        : (plain.length > 220 ? '${plain.substring(0, 220)}…' : plain);

    return Container(
      width: 420,
      constraints: const BoxConstraints(minHeight: 260),
      decoration: BoxDecoration(
        color: p.background,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: p.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.35),
            blurRadius: 32,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          // Radial ambient glow.
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: const Alignment(0, -1.2),
                  radius: 1.1,
                  colors: [p.glow, Colors.transparent],
                ),
              ),
            ),
          ),

          // Oversized decorative quote mark.
          Positioned(
            top: -18,
            right: 6,
            child: Text(
              '“',
              style: TextStyle(
                fontSize: 96,
                height: 1,
                fontFamily: 'serif',
                fontWeight: FontWeight.w700,
                color: p.quoteMark,
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                if (title.isNotEmpty)
                  Text(
                    title,
                    style: TextStyle(
                      color: p.text,
                      fontSize: 22,
                      height: 1.3,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'serif',
                      letterSpacing: -0.3,
                    ),
                  ),
                if (excerpt.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    '"$excerpt"',
                    style: TextStyle(
                      color: p.muted,
                      fontSize: 14,
                      height: 1.6,
                      fontStyle: FontStyle.italic,
                      fontFamily: 'Geist',
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                Container(height: 1, color: p.text.withValues(alpha: 0.1)),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: p.authorBg,
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(color: p.authorBorder),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: const BoxDecoration(
                              color: Color(0xFFF59E0B),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            author,
                            style: TextStyle(
                              color: p.authorText,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              fontFamily: 'Geist',
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      'UNMINDFUL',
                      style: TextStyle(
                        color: p.text.withValues(alpha: 0.4),
                        fontSize: 10,
                        letterSpacing: 2.5,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'GeistMono',
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}