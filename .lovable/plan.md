

## Plan: Make "Add Note" button icon-only on small screens

**What changes:**
In `CanvasToolbar.tsx`, hide the "Add Note" text on small screens using a responsive Tailwind class (`hidden sm:inline`), keeping only the `+` icon visible. This prevents the toolbar from being too tall or wide on mobile.

**File:** `src/components/canvas/CanvasToolbar.tsx`
- Add `hidden sm:inline` to the "Add Note" text span
- Adjust button padding to be square on small screens (`px-2 sm:px-3`)

