# Swap the Color Palette

Apply a new color palette to `index.html` based on `$ARGUMENTS` (e.g. `/color-palette electric-blue` or `/color-palette emerald-dark` or `/color-palette rose-gold`).

## What to do

1. Read `index.html` — specifically the `:root` and `[data-theme="light"]` blocks.
2. Map the requested palette to concrete color values. Common palette ideas:
   - `electric-blue`: accent → electric blue (#3b82f6), grad → blue-to-cyan
   - `emerald-dark`: accent → emerald green (#10b981), grad → green-to-teal
   - `rose-gold`: accent → rose gold (#c084fc → #f472b6), grad → pink-to-purple
   - `amber-dark`: accent → amber (#f59e0b), grad → gold-to-orange
   - `crimson`: accent → crimson (#ef4444), grad → red-to-rose
   - If a custom color is given (e.g. `#00ffaa`), derive a harmonious two-stop gradient from it.
3. Update ONLY these CSS custom properties in `:root`:
   - `--accent` — the primary interactive/icon color
   - `--grad` — the gradient used on buttons and highlight text
   - Any glow/shadow values that reference the old accent color
4. Update `[data-theme="light"]` equivalents to match.
5. Do NOT change layout, typography, or background colors (`--ink`, `--char`, `--navy`).
6. After editing, show a before/after summary of the changed values.
