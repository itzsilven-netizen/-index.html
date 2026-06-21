# Mobile Polish Pass

Audit and fix mobile responsiveness across `index.html` (or scope to `$ARGUMENTS` if a section name is given).

## What to do

1. Read `index.html` fully — focus on media queries (look for `@media` blocks) and any fixed widths.
2. Audit for common mobile issues:
   - Text overflow / horizontal scroll caused by fixed `px` widths
   - Font sizes too small (<14px) or too large on small screens
   - Touch targets smaller than 44×44px (buttons, links)
   - Grid/flex layouts that don't collapse cleanly below 480px
   - Hero sections with too much padding or oversized headline text
   - Sidebar (`#sidebar`) behavior on small screens
3. Fix every issue found:
   - Use `clamp()` for fluid type sizes
   - Switch `grid-template-columns` to `1fr` at ≤600px breakpoints
   - Ensure `.book` buttons have `min-height: 44px; min-width: 44px`
   - Add `-webkit-overflow-scrolling: touch` where needed
4. All fixes go in the single `<style>` block — consolidate with existing `@media` rules where possible.
5. Output a numbered list of every fix applied with the element and property changed.
