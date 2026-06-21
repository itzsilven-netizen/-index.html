# Add a New Section

Add a new section to `index.html` based on `$ARGUMENTS` (e.g. `/new-section pricing` or `/new-section testimonials`).

## What to do

1. Read `index.html` fully to understand current structure and design language.
2. Design a world-class, visually stunning new section that fits the dark/metallic/premium aesthetic of Apex Standard.
3. Insert the new section in the most logical position in the page flow (after `#resources` unless the type suggests otherwise).
4. Follow these rules:
   - Give the section a unique `id` (e.g. `id="pricing"`).
   - Add a matching sidebar nav entry: `<a class="sb-link" data-sec="<id>" href="#<id>">Label</a>`.
   - Add a matching mobile nav entry in `.nav-links`.
   - Apply `.reveal` + stagger classes (`.d1`–`.d4`) to cards/items for scroll animation.
   - Keep all CSS in the single `<style>` block.
   - Use existing CSS custom properties; do not introduce inline styles.
5. If the section involves pricing cards, add `.fprice` spans so they stay consistent with other price displays.
6. After inserting, confirm the section id and describe the layout added.
