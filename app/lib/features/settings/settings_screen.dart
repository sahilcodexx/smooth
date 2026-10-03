import 'package:material_ui/material_ui.dart';
import 'package:material_3_expressive/material_3_expressive.dart';

import '../../app.dart';
import '../../core/config.dart';
import '../../core/theme.dart';
import '../../data/local_store.dart';

/// Settings: appearance, reading typography, and account.
class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final scope = AppScope.of(context);
    final theme = M3ETheme.of(context);

    return ListenableBuilder(
      listenable: Listenable.merge([scope.auth, scope.themeController]),
      builder: (context, _) => CustomScrollView(
        slivers: [
          // Sliver app bar: part of the scroll content, so it collapses with
          // the list instead of the content sliding underneath it.
          const M3EAppBar.sliver(titleText: 'Settings'),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
            sliver: SliverList.list(
              children: [
          if (scope.auth.isSignedIn) ...[
            M3ECard(
              variant: M3ECardVariant.filled,
              child: ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                  child: Text(scope.auth.user!.handle.characters.first.toUpperCase()),
                ),
                title: Text(scope.auth.user!.email),
                subtitle: const Text('Synced to the cloud'),
              ),
            ),
            const SizedBox(height: 24),
          ],

          Text('Appearance', style: theme.typography.baseline.titleSmall),
          const SizedBox(height: 8),
          M3ECard(
            variant: M3ECardVariant.outlined,
            child: Column(
              children: [
                SwitchListTile(
                  value: scope.themeController.isDark,
                  onChanged: scope.themeController.setDark,
                  title: const Text('Dark theme'),
                  subtitle: const Text('Follows your device by default'),
                ),
                const M3EDivider(inset: M3EDividerInset.inset),
                SwitchListTile(
                  value: scope.themeController.useDynamicColor,
                  onChanged: (value) async {
                    await scope.themeController.setDynamicColor(value);
                    if (!context.mounted) return;
                    showAppSnack(
                      context,
                      value
                          ? 'Colors now follow your wallpaper'
                          : 'Using the unmindful brand palette',
                    );
                  },
                  title: const Text('Material You colors'),
                  subtitle: const Text('Tint the app from your wallpaper'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          Text('Reading', style: theme.typography.baseline.titleSmall),
          const SizedBox(height: 8),
          const _ReaderSettingsCard(),
          const SizedBox(height: 24),

          if (!scope.auth.isSignedIn) ...[
            Text('About', style: theme.typography.baseline.titleSmall),
            const SizedBox(height: 8),
            M3ECard(
              variant: M3ECardVariant.outlined,
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(M3EIcons.info),
                    title: const Text('unmindful'),
                    subtitle: const Text('Version 1.0.0'),
                  ),
                  const M3EDivider(inset: M3EDividerInset.inset),
                  ListTile(
                    leading: const Icon(M3EIcons.cloud_off),
                    title: const Text('${AppConfig.maxGuestPosts} free notes'),
                    subtitle: const Text(
                      'Sign in for unlimited writing and cloud sync',
                    ),
                  ),
                ],
              ),
            ),
          ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Font family / size controls. The measure slider is web-only: on a phone
/// the viewport already bounds the column, so exposing it would be a control
/// that does nothing.
class _ReaderSettingsCard extends StatefulWidget {
  const _ReaderSettingsCard();

  @override
  State<_ReaderSettingsCard> createState() => _ReaderSettingsCardState();
}

class _ReaderSettingsCardState extends State<_ReaderSettingsCard> {
  ReaderSettings _settings = const ReaderSettings();
  bool _seeded = false;

  // `AppScope.of` uses dependOnInheritedWidgetOfExactType, which is illegal in
  // initState, so the stored preferences are read once dependencies resolve.
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_seeded) return;
    _seeded = true;
    _settings = AppScope.of(context).store.readSettings();
  }

  Future<void> _update(ReaderSettings next) async {
    setState(() => _settings = next);
    await AppScope.of(context).store.writeSettings(next);
  }

  @override
  Widget build(BuildContext context) {
    final theme = M3ETheme.of(context);

    return M3ECard(
      variant: M3ECardVariant.outlined,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text('Typeface', style: theme.typography.baseline.labelLarge),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: M3ESegmentedButton<ReaderFont>(
              density: M3ESegmentedButtonDensity.comfortable,
              segments: [
                for (final font in ReaderFont.values)
                  M3ESegment(value: font, label: font.label),
              ],
              selected: {_settings.fontFamily},
              onSelectionChanged: (value) => _update(
                _settings.copyWith(fontFamily: value.first),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 4),
            child: Row(
              children: [
                Text('Text size', style: theme.typography.baseline.labelLarge),
                const Spacer(),
                Text(
                  '${_settings.fontSize}px',
                  style: theme.typography.baseline.labelMedium
                      .copyWith(color: theme.colorScheme.outline),
                ),
              ],
            ),
          ),
          M3ESlider(
            value: _settings.fontSize.toDouble(),
            min: AppConfig.minFontSize.toDouble(),
            max: AppConfig.maxFontSize.toDouble(),
            divisions: AppConfig.maxFontSize - AppConfig.minFontSize,
            semanticLabel: 'Text size',
            onChanged: (value) =>
                _update(_settings.copyWith(fontSize: value.round())),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: TextButton(
              onPressed: () => _update(const ReaderSettings()),
              child: const Text('Reset to defaults'),
            ),
          ),
        ],
      ),
    );
  }
}