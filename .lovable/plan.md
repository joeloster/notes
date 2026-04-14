

## Plan: Immersive Landing Page with Sticky Note Hero

### Concept
Transform the Auth page into a two-section fullscreen experience:

**Section 1 (100vh)** — Hero with canvas-style grid background, decorated with fake sticky notes arranged like the screenshot. The largest note (blue, centered) contains the hero content (brand name, tagline, features). Surrounding smaller notes in yellow, green, pink, purple contain sample content to showcase the product. A subtle "scroll down" indicator at the bottom.

**Section 2 (100vh)** — Full-width login/signup form, centered on screen. Clean and spacious.

### Changes

**`src/pages/Auth.tsx`** — Full rewrite of the layout:
1. Outer container becomes a vertical scroll with two `min-h-screen` sections
2. **Hero section**: 
   - Background uses the same CSS grid pattern as the canvas (`--canvas-bg`, `--canvas-grid` vars)
   - 5-6 decorative sticky notes positioned absolutely using the actual note color classes (`bg-note-yellow`, `bg-note-blue`, etc.) with rounded corners and subtle shadows — matching real app appearance
   - Center note is largest (~500px wide) containing the `infiniteNotes` brand, tagline, and feature list
   - Surrounding notes have sample content (like "Todo", "School", "Work" from your screenshot)
   - Notes have the color dot and trash icon in the header bar to look authentic
   - Scroll-down chevron/arrow at bottom
3. **Auth section**:
   - Full `min-h-screen` height, centered form
   - Keep existing form logic unchanged
   - Add the "Sign in to access your board" text

### Technical Details
- Grid background via CSS `background-image` using repeating linear gradients (same approach as `InfiniteCanvas`)
- Decorative notes are pure CSS divs, not the `StickyNote` component (no drag/resize needed)
- Responsive: on mobile, notes scale down and some hide; hero note stays centered
- No new dependencies

