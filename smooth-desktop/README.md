# unmindful desktop

Native desktop client for **unmindful**, built with **Tauri v2** — no Electron.

The window loads your live site (`https://unmindful.vercel.app`) in the OS-native
WebView (WebKitGTK on Linux, WebView2 on Windows, WKWebView on macOS), so the UI
is **pixel-identical to the website** — same auth, same Neon database, same
sessions. Every site feature (feed, editor, share cards, PWA install prompts,
OAuth) works unchanged because it literally *is* the website, in a native
frame.

## Features

- **System tray** — Open unmindful · Quick capture · Check for updates · Quit.
  Closing the main window minimizes to tray instead of exiting.
- **Global quick capture** — `Ctrl+Shift+U` anywhere in the OS pops a compact
  always-on-top capture window (`/create?new=true&capture=1`) anchored
  bottom-right of your monitor.
- **Auto-updater** — the app checks your GitHub releases and updates itself
  (signed with minisign; see `UPDATER-KEYS.md` for the release secrets).

**Why it's lightweight:** Tauri ships no browser engine — it reuses the WebView
already on the user's OS. Binaries are ~5–15 MB instead of Electron's ~150+ MB.

## Structure

```
smooth-desktop/
├── package.json          # npm scripts + Tauri CLI
├── scripts/
│   └── vercel-ignore.mjs # Skips Vercel builds for desktop-only commits
└── src-tauri/
    ├── tauri.conf.json   # Window, bundle & remote-URL config
    ├── Cargo.toml
    ├── build.rs
    ├── capabilities/default.json
    ├── icons/            # Generated from public/pwa-512x512.png
    └── src/{main,lib}.rs
```

## Prerequisites

- **Node.js** ≥ 18 (for the CLI)
- **Rust** (stable) — `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Linux only:** WebKitGTK dev libs
  `sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev`
- **Windows:** WebView2 (preinstalled on Win 10/11)
- **macOS:** Xcode Command Line Tools

## Commands

```bash
cd smooth-desktop
npm install

# Point the shell at a local dev server instead of production (optional)
#   edit src-tauri/tauri.conf.json → build.frontendDist

npm run dev          # dev build with hot Rust reload + devtools
npm run build        # optimized release build + native installers
```

## Releasing updates

One-time setup: add the two signing secrets from `UPDATER-KEYS.md`.

1. Bump `version` in `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, and
   `package.json`.
2. Commit and tag:

```bash
git tag desktop-v0.2.0 && git push origin desktop-v0.2.0
```

GitHub Actions builds signed installers for Linux, Windows (MSI + NSIS) and
macOS (Apple silicon), attaches them to a GitHub Release, and publishes
`latest.json` — installed apps update themselves.

Installers land in `smooth-desktop/src-tauri/target/release/bundle/`:

| OS      | Formats                             |
|---------|-------------------------------------|
| Linux   | `.deb`, `.rpm`, `.AppImage`         |
| Windows | `.msi`, `.exe` (NSIS)               |
| macOS   | `.dmg`, `.app`                      |

## Vercel build skipping

`vercel.json` at the repo root wires an `ignoreCommand` to
`smooth-desktop/scripts/vercel-ignore.mjs`. When a commit **only** touches
`smooth-desktop/**`, the script exits 0 and Vercel skips the web build
entirely. Any change outside that folder triggers a normal deploy as usual.

## Sessions & auth

The first-party `session_token` cookie that the Astro backend mints is scoped
to `unmindful.vercel.app`. Because the desktop WebView loads that exact origin,
sign-in works out of the box with no token bridging — the same flow as a
normal browser tab, just inside an app window.
