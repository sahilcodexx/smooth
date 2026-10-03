import 'package:material_ui/material_ui.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:material_3_expressive/material_3_expressive.dart';

import '../../core/theme.dart';

/// Renders markdown with editorial typography.
///
/// Shared by the reader and the editor's preview tab so a note looks identical
/// in both places. Vertical rhythm comes from the stylesheet's line heights and
/// `listIndent` rather than custom element builders, which keeps the parser's
/// own accessibility and selection behaviour intact.
class MarkdownView extends StatelessWidget {
  const MarkdownView({
    super.key,
    required this.source,
    this.font = ReaderFontKind.sans,
    this.fontSize = 15,
  });

  final String source;
  final ReaderFontKind font;
  final double fontSize;

  @override
  Widget build(BuildContext context) {
    final theme = M3ETheme.of(context);
    final scheme = theme.colorScheme;

    final serif = font == ReaderFontKind.serif;
    final mono = scheme.onSurfaceVariant;

    final bodyStyle = theme.typography.baseline.bodyLarge.copyWith(
      fontSize: fontSize,
      height: 1.75,
      color: scheme.onSurface,
      fontFamily: serif ? 'serif' : 'Geist',
      fontFamilyFallback: serif
          ? const ['Georgia', 'Cambria', 'Times New Roman']
          : null,
    );

    // Headings share one recipe, scaled from the reading size so the type scale
    // follows the user's font-size preference instead of fighting it.
    TextStyle heading(
      TextStyle? base,
      double scale,
      double lineHeight,
      FontWeight weight,
    ) {
      return (base ?? bodyStyle).copyWith(
        fontSize: fontSize * scale,
        height: lineHeight,
        fontWeight: weight,
        fontFamily: serif ? 'serif' : 'Geist',
        // Slight negative tracking tightens the editorial look.
        letterSpacing: -0.3,
        color: scheme.onSurface,
      );
    }

    return MarkdownBody(
      data: source,
      selectable: true,
      softLineBreak: true,
      styleSheet: MarkdownStyleSheet(
        p: bodyStyle,
        h1: heading(theme.typography.baseline.headlineMedium, 1.9, 1.25, FontWeight.w400),
        h2: heading(theme.typography.baseline.headlineSmall, 1.55, 1.3, FontWeight.w500),
        h3: heading(theme.typography.baseline.titleLarge, 1.3, 1.35, FontWeight.w500),
        h4: heading(theme.typography.baseline.titleMedium, 1.15, 1.4, FontWeight.w600),
        em: bodyStyle.copyWith(fontStyle: FontStyle.italic),
        strong: bodyStyle.copyWith(fontWeight: FontWeight.w700),
        del: bodyStyle.copyWith(
          decoration: TextDecoration.lineThrough,
          color: scheme.outline,
        ),
        listBullet: bodyStyle,
        blockquote: bodyStyle.copyWith(
          color: scheme.onSurfaceVariant,
          fontStyle: FontStyle.italic,
        ),
        blockquoteDecoration: BoxDecoration(
          // Material's leading bar rather than the web's left rule.
          border: Border(left: BorderSide(color: scheme.primary, width: 3)),
        ),
        blockquotePadding: const EdgeInsets.only(left: 14),
        code: bodyStyle.copyWith(
          fontFamily: 'GeistMono',
          fontSize: fontSize * 0.92,
          backgroundColor: scheme.surfaceContainerHighest,
        ),
        codeblockPadding: const EdgeInsets.all(14),
        codeblockDecoration: BoxDecoration(
          color: scheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(12),
        ),
        a: bodyStyle.copyWith(
          color: scheme.primary,
          decoration: TextDecoration.underline,
          decorationColor: scheme.primary.withValues(alpha: 0.4),
        ),
        horizontalRuleDecoration: BoxDecoration(
          border: Border(top: BorderSide(color: scheme.outlineVariant)),
        ),
        // Indent nested list items so depth reads clearly.
        listIndent: fontSize,
        img: bodyStyle,
        textAlign: WrapAlignment.start,
        h1Align: WrapAlignment.start,
        h2Align: WrapAlignment.start,
        h3Align: WrapAlignment.start,
        tableBody: bodyStyle,
        tableHead: bodyStyle.copyWith(
          fontWeight: FontWeight.w600,
          color: mono,
        ),
        tableBorder: TableBorder.all(color: scheme.outlineVariant),
        tableCellsPadding: const EdgeInsets.all(8),
      ),
    );
  }
}