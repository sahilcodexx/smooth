import 'dart:convert';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:intl/intl.dart';
import 'package:material_ui/material_ui.dart';
import 'package:material_3_expressive/material_3_expressive.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../app.dart';
import '../../data/models.dart';
import '../../data/posts_repository.dart';

/// Import / export sheet, mirroring the web modal.
Future<void> showDataSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (_) => const _DataSheet(),
  );
}

class _DataSheet extends StatefulWidget {
  const _DataSheet();

  @override
  State<_DataSheet> createState() => _DataSheetState();
}

class _DataSheetState extends State<_DataSheet> {
  bool _busy = false;
  String? _status;
  bool _statusIsError = false;

  Future<void> _run(Future<void> Function() action, String success) async {
    setState(() {
      _busy = true;
      _status = null;
    });
    try {
      await action();
      if (!mounted) return;
      setState(() {
        _status = success;
        _statusIsError = false;
      });
    } on GuestLimitReached {
      if (!mounted) return;
      setState(() {
        _status = 'Not enough local space. Sign in to import without limits.';
        _statusIsError = true;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _status = 'Failed: $e';
        _statusIsError = true;
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  // ------------------------------------------------------------------ export

  Future<void> _exportJson() => _run(() async {
        final scope = AppScope.of(context);
        final posts = await scope.posts
            .exportablePosts(isSignedIn: scope.auth.isSignedIn);
        if (posts.isEmpty) {
          setState(() {
            _status = 'Nothing to export yet.';
            _statusIsError = true;
          });
          return;
        }
        final json = const JsonEncoder.withIndent('  ')
            .convert(posts.map((p) => p.toJson()).toList());
        await _shareText(
          json,
          'unmindful-backup-${_today()}.json',
          'application/json',
        );
      }, 'Backup ready to share.');

  Future<void> _exportMarkdown() => _run(() async {
        final scope = AppScope.of(context);
        final posts = await scope.posts
            .exportablePosts(isSignedIn: scope.auth.isSignedIn);
        if (posts.isEmpty) {
          setState(() {
            _status = 'Nothing to export yet.';
            _statusIsError = true;
          });
          return;
        }
        final buffer = StringBuffer();
        for (final p in posts) {
          buffer.writeln('# ${p.title.isEmpty ? 'Untitled' : p.title}');
          buffer.writeln('*Date: ${DateFormat.yMMMMd().format(p.createdAt)}*');
          buffer.writeln();
          buffer.writeln(p.content);
          buffer.writeln();
          buffer.writeln('---');
          buffer.writeln();
        }
        await _shareText(
          buffer.toString(),
          'unmindful-posts-${_today()}.md',
          'text/markdown',
        );
      }, 'Markdown ready to share.');

  Future<void> _shareText(String content, String name, String mime) async {
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/$name');
    await file.writeAsString(content, flush: true);
    await SharePlus.instance.share(
      ShareParams(
        files: [XFile(file.path, mimeType: mime)],
        subject: 'unmindful export',
      ),
    );
  }

  // ------------------------------------------------------------------ import

  Future<void> _import() => _run(() async {
        // Resolve dependencies *before* awaiting: the sheet can be dismissed
        // while the system file picker is open, so `context` must not be read
        // after that await.
        final scope = AppScope.of(context);
        final isSignedIn = scope.auth.isSignedIn;
        final repository = scope.posts;

        final files = await FilePicker.pickFiles(
          type: FileType.any,
        );
        if (files.isEmpty) return;

        final incoming = <Post>[];
        for (final file in files) {
          // `path` is null for some providers; `xFile` still resolves bytes.
          final name = file.name;
          final text = await (file.path != null
              ? File(file.path!).readAsString()
              : file.xFile.readAsString());
          if (name.toLowerCase().endsWith('.json')) {
            incoming.addAll(_parseJsonBackup(text));
          } else {
            incoming.add(_parseMarkdownFile(name, text));
          }
        }

        if (incoming.isEmpty) {
          setState(() {
            _status = 'No notes found in that file.';
            _statusIsError = true;
          });
          return;
        }

        final count =
            await repository.importPosts(incoming, isSignedIn: isSignedIn);
        if (!mounted) return;
        setState(() => _status = 'Imported $count ${count == 1 ? 'note' : 'notes'}.');
      }, 'Import finished.');

  List<Post> _parseJsonBackup(String text) {
    final out = <Post>[];
    try {
      final decoded = jsonDecode(text);
      if (decoded is! List) return out;
      for (final entry in decoded) {
        if (entry is! Map) continue;
        final map = entry.cast<String, dynamic>();
        final content = (map['content'] ?? '') as String;
        final title = (map['title'] ?? '') as String;
        if (content.isEmpty && title.isEmpty) continue;
        out.add(Post(
          id: (map['id'] as String?) ?? _newId(),
          title: title.isEmpty ? 'Imported note' : title,
          content: content,
          createdAt:
              DateTime.tryParse((map['created_at'] ?? '') as String? ?? '') ??
                  DateTime.now(),
          lastActiveAt: DateTime.now(),
        ));
      }
    } catch (_) {
      return const [];
    }
    return out;
  }

  Post _parseMarkdownFile(String fileName, String text) {
    var title = fileName.replaceAll(RegExp(r'\.[^/.]+$'), '');
    var content = text;

    // Lift a leading "# Title" into the title field, like the web importer.
    final match = RegExp(r'^#\s+(.+)$', multiLine: true).firstMatch(text);
    if (match != null) {
      title = match.group(1)!.trim();
      content = text.replaceFirst(RegExp(r'^#\s+.+$', multiLine: true), '').trim();
    }

    return Post(
      id: _newId(),
      title: title.isEmpty ? 'Imported note' : title,
      content: content,
      createdAt: DateTime.now(),
      lastActiveAt: DateTime.now(),
    );
  }

  static String _newId() =>
      'post_${DateTime.now().millisecondsSinceEpoch}_'
      '${DateTime.now().microsecondsSinceEpoch % 1000000}';

  static String _today() => DateFormat('yyyy-MM-dd').format(DateTime.now());

  @override
  Widget build(BuildContext context) {
    final scope = AppScope.of(context);
    final theme = M3ETheme.of(context);
    final count = scope.posts.posts.length;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(M3EIcons.import_export, color: theme.colorScheme.primary),
                const SizedBox(width: 10),
                Text('Import & export', style: theme.typography.baseline.titleMedium),
              ],
            ),
            const SizedBox(height: 24),

            Text('Import', style: theme.typography.baseline.labelLarge),
            const SizedBox(height: 10),
            M3EButton(
              style: M3EButtonStyle.outlined,
              icon: const Icon(M3EIcons.upload),
              onPressed: _busy ? null : _import,
              child: Text(_busy ? 'Working…' : 'Upload .md or .json'),
            ),
            const SizedBox(height: 6),
            Text(
              'Markdown articles or a JSON backup exported from unmindful.',
              style: theme.typography.baseline.bodySmall
                  .copyWith(color: theme.colorScheme.outline),
            ),

            const SizedBox(height: 24),
            M3EDivider(),
            const SizedBox(height: 20),

            Text(
              'Export ($count ${count == 1 ? 'note' : 'notes'})',
              style: theme.typography.baseline.labelLarge,
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: M3EButton(
                    style: M3EButtonStyle.outlined,
                    icon: const Icon(M3EIcons.download),
                    onPressed: _busy || count == 0 ? null : _exportMarkdown,
                    child: const Text('.MD'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: M3EButton(
                    style: M3EButtonStyle.outlined,
                    icon: const Icon(M3EIcons.download),
                    onPressed: _busy || count == 0 ? null : _exportJson,
                    child: const Text('.JSON'),
                  ),
                ),
              ],
            ),

            if (_status != null) ...[
              const SizedBox(height: 20),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: _statusIsError
                      ? theme.colorScheme.errorContainer
                      : theme.colorScheme.secondaryContainer,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(
                      _statusIsError ? M3EIcons.error : M3EIcons.check,
                      size: 18,
                      color: _statusIsError
                          ? theme.colorScheme.onErrorContainer
                          : theme.colorScheme.onSecondaryContainer,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _status!,
                        style: theme.typography.baseline.bodySmall.copyWith(
                          color: _statusIsError
                              ? theme.colorScheme.onErrorContainer
                              : theme.colorScheme.onSecondaryContainer,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}