# Redesign a Section

Redesign the section specified in `$ARGUMENTS` (e.g. `/redesign-section hero` or `/redesign-section capabilities`).

## What to do

1. Read `index.html` fully.
2. Locate the section matching the argument: `#home` (hero), `#what-we-do`, `#what-it-is`, `#capabilities`, `#why-us`, or `#resources`.
3. Redesign the section's HTML and CSS while:
   - Staying inside the single `<style>` block in `<head>` — no external files.
   - Using only the existing CSS custom properties (`--ink`, `--char`, `--navy`, `--txt`, `--muted`, `--grad`, `--accent`, `--r`). Add new variables to `:root` only if truly needed.
   - Preserving all JS hooks: `.book`, `.nav-to[data-sec]`, `.sb-link[data-sec]`, `.reveal`, `.tab-btn`, `.tab-panel`.
   - Keeping the section `id` unchanged (scroll-spy depends on it).
   - Matching the premium, dark, metallic aesthetic of the existing design.
4. Make the redesign noticeably more striking — bolder typography, stronger visual hierarchy, more dynamic layout, richer use of the `--grad` gradient.
5. After editing, describe the key visual changes made.
