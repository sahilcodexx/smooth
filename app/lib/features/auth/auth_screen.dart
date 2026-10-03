import 'package:material_ui/material_ui.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:material_3_expressive/material_3_expressive.dart';

import '../../app.dart';
import '../../core/theme.dart';
import '../oauth/google_oauth_screen.dart';

/// Email/password + Google sign-in.
///
/// The Google path runs in an in-app WebView (see [GoogleOAuthScreen])
/// because Neon Auth needs a third-party cookie that Chrome refuses to send.
class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();

  bool _isSignUp = false;
  bool _obscure = true;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final flow = AppScope.of(context).oauth;
    if (_isSignUp) {
      await flow.register(
        email: _email.text.trim(),
        password: _password.text,
      );
    } else {
      await flow.signIn(
        email: _email.text.trim(),
        password: _password.text,
      );
    }
    // The root widget swaps to the shell once auth status flips.
  }

  @override
  Widget build(BuildContext context) {
    final theme = M3ETheme.of(context);
    context.syncSystemBars();
    final flow = AppScope.of(context).oauth;

    return ListenableBuilder(
      listenable: flow,
      builder: (context, _) => Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _Wordmark(theme: theme),
                    const SizedBox(height: 40),

                    Text(
                      _isSignUp ? 'Create an account' : 'Welcome back',
                      style: theme.typography.baseline.headlineSmall,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _isSignUp
                          ? 'Register a new account to start writing.'
                          : 'Sign in to your unmindful workspace.',
                      style: theme.typography.baseline.bodyMedium
                          .copyWith(color: theme.colorScheme.outline),
                    ),
                    const SizedBox(height: 28),

                    if (flow.error != null) ...[
                      _ErrorBanner(message: flow.error!),
                      const SizedBox(height: 16),
                    ],

                    M3EButton(
                      onPressed: flow.busy
                          ? null
                          : () => Navigator.of(context).push(
                                AppPageTransitions.fadeThrough<void>(
                                  const GoogleOAuthScreen(),
                                  name: 'google-oauth',
                                ),
                              ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _GoogleGlyph(),
                          SizedBox(width: 12),
                          Text('Continue with Google'),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: M3EDivider(),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text(
                            'or',
                            style: theme.typography.baseline.labelMedium
                                .copyWith(color: theme.colorScheme.outline),
                          ),
                        ),
                        Expanded(child: M3EDivider()),
                      ],
                    ),
                    const SizedBox(height: 20),

                    TextFormField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.email],
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        hintText: 'you@example.com',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        final text = (value ?? '').trim();
                        if (text.isEmpty) return 'Enter your email';
                        if (!text.contains('@') || !text.contains('.')) {
                          return 'Enter a valid email';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    TextFormField(
                      controller: _password,
                      obscureText: _obscure,
                      autofillHints: [
                        _isSignUp
                            ? AutofillHints.newPassword
                            : AutofillHints.password
                      ],
                      textInputAction: TextInputAction.done,
                      onFieldSubmitted: (_) => _submit(),
                      decoration: InputDecoration(
                        labelText: 'Password',
                        border: const OutlineInputBorder(),
                        suffixIcon: M3EIconButton(
                          icon: Icon(
                            _obscure ? M3EIcons.visibility : M3EIcons.visibility_off,
                          ),
                          tooltip: _obscure ? 'Show password' : 'Hide password',
                          variant: M3EIconButtonVariant.standard,
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                      ),
                      validator: (value) {
                        final text = value ?? '';
                        if (text.isEmpty) return 'Enter your password';
                        if (_isSignUp && text.length < 6) {
                          return 'Use at least 6 characters';
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: 24),
                    M3EButton(
                      style: M3EButtonStyle.filled,
                      onPressed: flow.busy ? null : _submit,
                      child: flow.busy
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(_isSignUp ? 'Sign up' : 'Sign in'),
                    ),

                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          _isSignUp ? 'Already have an account?' : 'No account?',
                          style: theme.typography.baseline.bodySmall,
                        ),
                        M3EButton.text(
                          onPressed: flow.busy
                              ? null
                              : () => setState(() => _isSignUp = !_isSignUp),
                          child: Text(_isSignUp ? 'Sign in' : 'Create one'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
      ),
    );
  }
}

class _Wordmark extends StatelessWidget {
  const _Wordmark({required this.theme});

  final M3EThemeData theme;

  @override
  Widget build(BuildContext context) {
    final scheme = theme.colorScheme;
    return Column(
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: scheme.surfaceContainerHigh,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Center(
            child: Transform.rotate(
              angle: 0.785398,
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
        const SizedBox(height: 16),
        Text(
          'unmindful',
          style: theme.typography.baseline.headlineSmall.copyWith(
            fontFamily: 'serif',
            fontStyle: FontStyle.italic,
            fontWeight: FontWeight.w400,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Where random thoughts find their home.',
          textAlign: TextAlign.center,
          style: theme.typography.baseline.bodySmall
              .copyWith(color: theme.colorScheme.outline),
        ),
      ],
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final theme = M3ETheme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: theme.colorScheme.errorContainer,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(M3EIcons.error, size: 18, color: theme.colorScheme.onErrorContainer),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: theme.typography.baseline.bodySmall
                  .copyWith(color: theme.colorScheme.onErrorContainer),
            ),
          ),
        ],
      ),
    );
  }
}

/// Google's brand mark, shipped as an asset so it renders offline and always
/// matches Google's current logo.
class _GoogleGlyph extends StatelessWidget {
  const _GoogleGlyph();

  @override
  Widget build(BuildContext context) {
    return SvgPicture.asset('assets/google_g.svg', width: 18, height: 18);
  }
}