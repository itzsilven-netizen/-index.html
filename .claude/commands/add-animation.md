# Add Animation to Elements

Add or enhance animations on `$ARGUMENTS` (e.g. `/add-animation hero-headline` or `/add-animation pricing-cards` or `/add-animation cta-button`).

## What to do

1. Read `index.html` to understand the current animation system:
   - `.reveal` + IntersectionObserver adds `.in` class on scroll entry
   - Stagger delays use `.d1`–`.d4` utility classes
   - Keyframes defined in the `<style>` block
2. Identify the target element(s) from the argument.
3. Design and implement one of these animation types (choose the most impactful for the element):
   - **Entrance**: slide-up, fade-in, scale-in, clip-path wipe
   - **Continuous**: floating/pulse on hero elements, shimmer on CTAs, rotating gradient border
   - **Hover**: lift + glow, magnetic pull effect, gradient shift
   - **Scroll-driven**: parallax, counter increment (for stats), text scramble on entry
4. Rules:
   - All keyframes go in the `<style>` block — no external files.
   - Use CSS animations/transitions first; JavaScript only if the effect requires it (e.g. counter).
   - Respect `prefers-reduced-motion` with a `@media` override that disables motion.
   - Do not break existing `.reveal` / `.in` logic.
5. Describe the animation added and which elements it targets.
