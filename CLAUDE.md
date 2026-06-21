# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static marketing website for **Apex Standard** (`apexstandard.biz`), an AI-powered growth agency. Hosted on GitHub Pages with a custom domain via `CNAME`.

## Development Workflow

There is no build step, package manager, or test suite. Changes to `.html` files take effect immediately — open them directly in a browser or push to GitHub to deploy via Pages.

To preview locally:
```
python3 -m http.server 8080
# then open http://localhost:8080
```

Deploy by pushing to the `main` branch (GitHub Pages serves from root).

## File Structure

- `index.html` — Main marketing landing page (the primary file)
- `bootcamp.html` — Standalone 10-day bootcamp signup and progress tracker
- `CNAME` — Custom domain (`apexstandard.biz`) for GitHub Pages

## Architecture

### `index.html` — Marketing Site

All CSS lives in a single `<style>` block in `<head>`. All JavaScript is inline at the bottom of `<body>`. There are no external `.css` or `.js` files.

**Design system** is built on CSS custom properties in `:root` and a `[data-theme="light"]` override block. Key tokens:
- `--ink`, `--char`, `--navy` — background scale
- `--txt`, `--muted`, `--muted-2` — text scale
- `--grad` — the silver/steel gradient used on primary buttons and highlight text
- `--accent` — cool silver used on icons and interactive accents
- `--r`, `--sb` — border radius and sidebar width

**Sections** (each has a matching `id` used for both IntersectionObserver spy and smooth-scroll navigation):
`#home` → `#what-we-do` → `#what-it-is` → `#capabilities` → `#why-us` → `#resources`

**JS conventions:**
- `.book` class on any element opens the Calendly booking link (`CALENDLY` var at top of script block)
- `.nav-to[data-sec="<id>"]` triggers smooth scroll to a section
- `.sb-link[data-sec="<id>"]` is the sidebar nav; active state is managed by an IntersectionObserver scroll spy
- `.reveal` elements animate in via IntersectionObserver (`.in` class added on entry); stagger delays use `.d1`–`.d4`
- Tabs in the Capabilities section switch `.active` on both `.tab-btn` and the matching `.tab-panel[id]`

**3D background** (`#bg3d` canvas): a Three.js WebGL scene (loaded from CDN `r128`) rendering a metallic brain with scroll-driven dolly camera. The `initBrain()` function is the entire scene — performance-tiered by `LOW` flag based on screen size and CPU core count. Lives entirely in the inline script.

**Third-party integrations** (inline scripts at very bottom):
- HubSpot (`hs-scripts.com/246155394.js`) — analytics/tracking
- Tidio (`code.tidio.co/...`) — live chat widget

### `bootcamp.html` — Bootcamp App

Two-screen flow controlled by `localStorage`:
1. **Signup screen** (`#signupScreen`): collects name/email/phone, stores in `localStorage` key `apex_bc_user`
2. **Bootcamp screen** (`#bootcampScreen`): shown if user already signed up on load

Progress is stored in `localStorage` key `apex_bc_progress` as a JSON array of completed day indices (e.g., `[0, 1, 2]`). Days are sequentially locked — day `i` requires day `i-1` to be in the completed array.

The `DAYS` array (10 entries) is the sole data source for all day cards. Each entry has `icon`, `title`, `sub`, `desc`, and `lessons[]`. Editing content means editing this array.

The Advanced Course upsell (`#advancedSection`) and completion banner (`#completionBanner`) are hidden by default and shown only when all 10 days are complete.

**Design system**: separate from `index.html` — uses `Rajdhani` + `Exo 2` fonts, a pure black/silver/chrome palette, `clip-path` polygon buttons, and a custom CSS cursor (`.cursor` + `.cursor-ring`). All CSS is inline in `<head>`.

## Key Conventions

- **Single-file architecture**: each page is fully self-contained — no shared CSS or JS files between pages.
- **Utility classes as JS hooks**: target elements by class (`.book`, `.nav-to`, `.sb-link`, `.tab-btn`, `.reveal`) not by `id` unless the element is unique.
- **No frameworks**: plain ES5-style JavaScript throughout (no modules, no TypeScript, no bundler).
- **Calendly URL** is defined once at the top of `index.html`'s script block — update there to change the booking link site-wide.
- **Pricing** appears in both the feature cards (`.fprice`) and the tabs (`.price`); keep them in sync when updating.
