# unmindful — Android app

Native Flutter client for unmindful, built on **Material 3 Expressive**.

## Stack

| Concern | Choice |
|---|---|
| Design system | `material_3_expressive` (the M3 Expressive component set, 44 widgets) |
| Material library | `material_ui` (official — Flutter 3.47 decoupled Material out of `flutter/flutter`) |
| Colour | Material You dynamic colour (wallpaper-derived), with a brand seed fallback |
| Type | Geist (bundled variable TTF, same as the web app) |
| State | `ChangeNotifier` + `InheritedWidget` scope. No state-management package. |
| Storage | `shared_preferences` (guest drafts, settings), `flutter_secure_storage` (session token) |

Flutter **3.47.6** / Dart **3.13.5** are required by `material_3_expressive`.

## Why markdown-source editing

The web editor is TipTap, which serialises rich text **to** markdown. A native
`flutter_quill` / `super_editor` editor stores Delta/JSON instead, so every
existing note would need a JSON→markdown conversion on read and a markdown→JSON
conversion on write — lossy both ways.

This app edits markdown directly and renders a live preview. Your markdown
column stays the single source of truth, so nothing can be mangled by a round
trip, and guest drafts stay byte-identical to what the web app writes.

## Project layout

```
lib/
  main.dart                 bootstrap: storage, api, auth, first feed load
  app.dart                  M3EMaterialApp shell, AppScope, ThemeController
  core/
    config.dart             API base URL, guest caps, OAuth scheme
    theme.dart              seeds, reading styles, route transitions, snackbars
  data/
    api_client.dart         Dio + explicit session_token replay
    auth_repository.dart    identity + guest→cloud migration
    posts_repository.dart   one feed API for cloud and local drafts
    local_store.dart        guest drafts, reader settings
    models.dart             Post, AppUser, PostPage
  features/
    shell/                  bottom nav + extended FAB
    feed/                   notes list, long-press multi-select
    editor/                 markdown editor + preview + quick-format bar
    reader/                 rendered note
    search/                 server-side (members) / local (guests)
    settings/               appearance + reading typography
    share/                  share-as-image card (RepaintBoundary → share sheet)
    data_transfer/          import/export .md and .json
    auth/                   email+password and Google
    oauth/                  browser OAuth round trip
    markdown/               shared renderer
```

## Backend endpoints used

| Endpoint | Use |
|---|---|
| `GET /api/config` | Discovers the Neon Auth URL per deployment |
| `GET /api/auth/session` | Validates the stored token on launch |
| `POST /api/auth/login` \| `/register` | Credential sign-in/up; sets the cookie |
| `POST /api/auth/logout` | Ends the session |
| `POST /api/auth/mobile-callback` | OAuth return leg (see below) |
| `POST /api/auth/login-social` | Social session bridging (web flow) |
| `GET /api/posts` | Lists notes (`?q=`, `?limit=`, `?offset=`); `?id=` for one |
| `POST /api/posts` | Upserts a note |
| `DELETE /api/posts` | Deletes one (`id`) or many (`ids`) |
| `POST /api/posts/sync-local` | Guest→cloud migration and import |

`GET /api/posts` without `?id=` was added for this app: the web feed is
server-rendered, so there was previously no way for a client to list notes.

## OAuth: what you must configure

Google sign-in leaves the app for the system browser:

```
app  -> POST {neonAuthUrl}/sign-in/social  ->  Google
     -> {neonAuthUrl}/callback/google
     -> {API_BASE_URL}/api/auth/mobile-callback   <- resolves the session
     -> smooth://auth/callback?token=...          <- back into the app
```

`/api/auth/mobile-callback` receives the redirect as a **top-level navigation**,
so the browser hands it the Better Auth cookie. It resolves the Neon session,
mints a first-party token, and redirects into the app.

**Add these to your Neon Auth redirect-URL allowlist:**

- `https://unmindful.vercel.app/api/auth/mobile-callback`
- `smooth://auth/callback`

Without the first, Google rejects the redirect; without the second, the app
cannot receive the token.

## Running

```bash
source ~/dev/env.sh          # PATH + ANDROID_HOME
export JAVA_HOME=/opt/android-studio/jbr

cd app

# production backend (default)
flutter run --dart-define=API_BASE_URL=https://unmindful.vercel.app

# local backend — use the host LAN IP, not localhost, on a real device
flutter run --dart-define=API_BASE_URL=http://192.168.1.x:4321
```

Only arm64 is needed for a modern phone, and it makes builds much faster:

```bash
flutter run --target-platform android-arm64
```

## Notes

- Guest writers are capped at 10 notes; drafts idle for 30 days are pruned.
- Signing in migrates local drafts to the cloud via `/api/posts/sync-local`
  before the identity switch completes. A failed migration keeps the drafts on
  disk and retries next time.
- The editor persists on a 1s debounce **and** on app backgrounding.