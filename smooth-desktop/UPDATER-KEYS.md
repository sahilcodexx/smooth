# Tauri updater signing key

The private key at `~/.tauri/unmindful-desktop` **must never be committed**.

Add these two repository secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | contents of `~/.tauri/unmindful-desktop` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | *(empty — the key was generated with no password)* |

Losing the key means already-installed apps can never auto-update again —
back it up somewhere safe.
