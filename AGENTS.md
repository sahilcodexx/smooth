## Project Summary

This project is an Astro-based web application that renders a long-form article ("A Morning at the Letterpress Museum"). The primary focus has been on establishing a premium, highly readable typographic design system using `shadcn/typeset` without relying on Tailwind CSS. The design features an editorial dark mode theme, optimal line lengths (measure), customized vertical rhythm (leading), and a minimal scrollbar.

## Completed Work (Changelog)

- **Shadcn Typeset Integration**: Downloaded `typeset.css` and integrated it into the project's CSS pipeline.
- **Typography**: Installed and configured the `Geist Variable` and `Geist Mono Variable` fonts.
- **Astro Build Fix**: Changed the stylesheet inclusion in `src/layouts/Layout.astro` from a static HTML `<link>` tag to an Astro frontmatter import (`import '../styles/globals.css';`) to ensure Vite correctly bundles the CSS and resolves `@import` statements.
- **Layer Compatibility**: Stripped the `@layer components` wrappers from `typeset.css` to allow the styles to apply natively in the browser without requiring a Tailwind CSS compilation step.
- **Editorial Dark Theme**: Defined global CSS variables in `src/styles/globals.css` to apply a rich dark theme (zinc-950 background, zinc-50 text) to the `html` and `body`.
- **Utility Fallbacks**: Added native CSS fallbacks in `globals.css` for specific Tailwind utility classes used in the markup (`.max-w-[37em]`, `.grayscale`, `.dark\:brightness-50`) to enforce an optimal reading measure (~80 characters per line) and style images.
- **Layout Spacing**: Increased the vertical margin (`6rem`) and padding on the main article container in `src/pages/index.astro` to provide more breathing room.
- **Scrollbar Styling**: Added minimal, custom scrollbar CSS rules for WebKit (Chrome/Safari) and Firefox to seamlessly blend with the dark theme.

---

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
