import 'package:material_ui/material_ui.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'app.dart';
import 'data/api_client.dart';
import 'data/auth_repository.dart';
import 'data/local_store.dart';
import 'data/posts_repository.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Draw behind the system bars. M3E components inset their own interactive
  // content out of the gesture area using MediaQuery.viewPadding.
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      systemNavigationBarColor: Colors.transparent,
    ),
  );

  final store = await LocalStore.open();
  final api = ApiClient(tokenStore: TokenStore(const FlutterSecureStorage()));
  final auth = AuthRepository(api: api, store: store);
  final posts = PostsRepository(api: api, store: store);

  // Resolve identity before the first frame so the shell never flashes a
  // signed-out state for an already-signed-in user.
  await auth.bootstrap();
  await posts.refresh(isSignedIn: auth.isSignedIn);

  runApp(
    SmoothApp(
      api: api,
      store: store,
      auth: auth,
      posts: posts,
    ),
  );
}