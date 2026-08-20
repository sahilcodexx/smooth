## Project Summary

This project is an Astro-based web application that renders a long-form article ("A Morning at the Letterpress Museum") and manages a feed of user-created posts. The focus is on establishing a premium, highly readable typographic design system using `shadcn/typeset` without relying on Tailwind CSS. The design features an editorial dark mode theme, optimal line lengths (measure), customized vertical rhythm (leading), and a minimal scrollbar.

The application uses **Neon Serverless Postgres** for data storage and **Neon Auth (Managed Better Auth)** for user authentication.

## Current Architecture & Key Components

*   **Database & Core Auth**: [src/lib/auth.ts](file:///home/sahilcodex/Documents/smooth/src/lib/auth.ts) houses database initializers, password hashing, and server-side session checks (`getSessionUser`). It dynamically bridges both custom first-party cookie sessions and Neon Auth (Better Auth) sessions.
*   **Astro Server-Side Rendering**: Configured in Vercel SSR server mode (`output: 'server'` in `astro.config.mjs`) to handle live SSR route rendering, dynamic middleware, and API handlers.
*   **Managed OAuth Sync**: Standard cross-origin cookie limitations (where Vercel cannot read cookies set on the Neon Auth domain) are bypassed using a hybrid client-server session bridging pattern implemented in [src/components/AuthCard.tsx](file:///home/sahilcodex/Documents/smooth/src/components/AuthCard.tsx) and the social sync endpoint [src/pages/api/auth/login-social.ts](file:///home/sahilcodex/Documents/smooth/src/pages/api/auth/login-social.ts).
*   **Design System & UI**: Styles are managed through standard native CSS variables and utility fallbacks inside `src/styles/globals.css`. Navigation uses a floating Radix UI + Framer Motion dock toolbar defined in [src/components/HomeToolbar.tsx](file:///home/sahilcodex/Documents/smooth/src/components/HomeToolbar.tsx) and [src/components/PostFeed.tsx](file:///home/sahilcodex/Documents/smooth/src/components/PostFeed.tsx).
*   **Local-First Guest Drafting**: Anonymous writers can view, write, and delete local draft posts saved entirely inside browser `localStorage`.
    - Guest writing is limited to a maximum of **10 posts** to encourage user sign-in.
    - Local guest drafts are stamped with a `last_active_at` timestamp. Any draft that hasn't been active/edited for 30 days is automatically pruned from local storage on site mount.
    - When a guest decides to log in or register, [AuthCard.tsx](file:///home/sahilcodex/Documents/smooth/src/components/AuthCard.tsx) automatically reads the guest posts and sends them to `/api/posts/sync-local` to sync them securely to the database before completing the login flow.

---

## Completed Work (Changelog)

### 1. Typography & Styling Foundation
*   **Shadcn Typeset & Layer Stripping**: Integrated `typeset.css` natively in the global pipeline and stripped Tailwind `@layer` keywords so it processes without standard Tailwind builds.
*   **Custom Dark Theme**: Set zinc-950/zinc-50 colors and added CSS scrollbar overrides to Firefox/WebKit to blend seamlessly.
*   **Layout rhythm**: Enforced optimal ~80 character measure restrictions via native CSS variables.

### 2. Neon Auth & Google OAuth Production Integration
*   **Production Domains & Redirects**: Authorized `https://unmindful.vercel.app` redirect domains under Neon Auth's domain allowlist. Registered Google Console redirect URIs pointing back to Neon (`{NEON_AUTH_BASE_URL}/callback/google`).
*   **Custom Credentials Integration**: Configured dedicated client credentials in Google Cloud Platform and Neon Console, moving away from shared developer tokens.
*   **OAuth Callback Verification & Sync**: Integrated a verification routine in [AuthCard.tsx](file:///home/sahilcodex/Documents/smooth/src/components/AuthCard.tsx) that checks for the `neon_auth_session_verifier` parameter, queries `/get-session` on Neon Auth, and synchronizes the session payload to the backend via `/api/auth/login-social`.
*   **Social Login Endpoint**: Created `/api/auth/login-social` to register first-time OAuth users into the local `users` database table and issue a first-party, secure, HttpOnly `session_token` cookie.

### 3. DOM & Hydration Mismatch Fixes
*   **Interactive Tooltips**: Resolved invalid HTML console errors (`<button> cannot contain a nested <button>`) and React hydration mismatches on the nav docks.
*   **Trigger Refactoring**: Refactored trigger hierarchies to merge Radix triggers onto a single native `<button>` element inside `<TooltipTrigger>` and `<DropdownMenuTrigger>` tags.

### 4. Local-First Guest Writing & Auto-Migration
*   **Anonymous Access**: Refactored [index.astro](file:///home/sahilcodex/Documents/smooth/src/pages/index.astro) and [create.astro](file:///home/sahilcodex/Documents/smooth/src/pages/create.astro) to allow guest viewing and editing, passing `'guest'` as `userId` when unauthenticated.
*   **Local Draft Support**: Extended [Editor.tsx](file:///home/sahilcodex/Documents/smooth/src/components/Editor.tsx) to read, save, and delete draft posts under `smooth_guest_posts` in `localStorage` when in guest mode.
*   **Guest Writing Limit**: Enforced a hard limit of 10 guest posts in the editor, showing a premium sign-in promotional banner when reached.
*   **Draft Expiration & Purging**: Integrated a cleanup sweep in [PostFeed.tsx](file:///home/sahilcodex/Documents/smooth/src/components/PostFeed.tsx) to delete guest posts that haven't been edited or active for more than 30 days.
*   **Synchronization Endpoint**: Created [/api/posts/sync-local.ts](file:///home/sahilcodex/Documents/smooth/src/pages/api/posts/sync-local.ts) to batch upsert guest posts into the Neon database.
*   **On-Login Migration Handler**: Hooked up a pre-redirect synchronization routine in [AuthCard.tsx](file:///home/sahilcodex/Documents/smooth/src/components/AuthCard.tsx) that automatically migrates local guest posts to the cloud and purges the guest local storage when the user logs in.

### 5. Buttery Typing & Caret Smoothness
*   **Zero per-keystroke React work**: Reworked [Editor.tsx](file:///home/sahilcodex/Documents/smooth/src/components/Editor.tsx) so `onUpdate` only writes to refs (markdown content + dirty state) and schedules a debounced save — no full-document markdown serialization, no `getText()` scans, and no state re-renders on every keystroke. Word count updates are throttled to ~300ms and the save status only flips once per debounce.
*   **Smooth Caret Animated Overlay**: Added [SmoothCaret.tsx](file:///home/sahilcodex/Documents/smooth/src/components/SmoothCaret.tsx) which tracks ProseMirror cursor position (`coordsAtPos`) with high performance `requestAnimationFrame` and `translate3d(x, y, 0)`. The custom cursor overlay glides buttery-smoothly between character positions using custom cubic-bezier easing (`cubic-bezier(0.16, 1, 0.3, 1)`), automatically resizes to font line-height, snaps quickly on large line jumps (>220px), and gently pulses with a breathing animation when typing pauses.
*   **Smooth caret-follow scrolling**: Added a rAF-driven scroll easing in [Editor.tsx](file:///home/sahilcodex/Documents/smooth/src/components/Editor.tsx) that glides the caret into a comfort band (18%–52% of viewport) when typing near the edges, cancels on wheel/blur, and never fights native scrolling (`scroll-behavior: auto`).
*   **Caret/scroll CSS**: Set `caret-color: transparent !important` on `.typeset [contenteditable]` in [globals.css](file:///home/sahilcodex/Documents/smooth/src/styles/globals.css) to suppress the default jumping browser caret, `scroll-padding-bottom: 7rem` (keeps the caret clear of the floating toolbar), `scroll-behavior: auto` on `html`/contenteditable, antialiased font smoothing, and a border-tinted `::selection`.
### 6. Kokonut UI Toolbar Dock Integration
*   **Kokonut UI Toolbar**: Integrated [@kokonutui/toolbar](file:///home/sahilcodex/Documents/smooth/src/components/kokonutui/toolbar.tsx) using `motion/react` spring physics, expandable pill selection states, and top animated notification tooltips.
*   **Dock Replacement**: Replaced the previous dock toolbar in [HomeToolbar.tsx](file:///home/sahilcodex/Documents/smooth/src/components/HomeToolbar.tsx) with the Kokonut UI Toolbar, preserving all navigation, theme toggling, reader settings sliders, and user authentication actions.

---

## Development

To boot the Astro development server in background mode:

```bash
astro dev --background
```

Manage the server lifecycle using:
*   `astro dev status` - check background status
*   `astro dev logs` - view active server terminal output
*   `astro dev stop` - terminate background process

For validation, build the production code locally with:

```bash
npm run build
```

## Documentation

*   [Astro Documentation](https://docs.astro.build)
*   [Neon Managed Auth Documentation](https://neon.com/docs/auth/introduction)
