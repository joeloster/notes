

## Plan: Free drag with snap-on-release

**What changes**: Notes move freely (pixel-perfect) while being dragged, then snap to the grid when released.

### Changes

**1. `src/components/canvas/StickyNote.tsx`** — Drag handler changes:
- During drag (`handleMove`): call `onMove` with raw (unsnapped) coordinates
- On release (`handleUp`): call `onMove` with snapped coordinates before ending the drag

Currently `onMove` calls `moveNote` in the hook, which snaps internally. We need to either:
- Add a separate `onMoveEnd` callback that snaps, while `onMove` passes raw values, OR
- Remove snapping from `moveNote` in the hook and snap only on mouse-up in `StickyNote`

**Simplest approach** — remove `snapToGrid` from `moveNote` in the hook, and snap in the component on mouse-up:

**2. `src/hooks/useCanvasState.ts`** — `moveNote`:
- Remove `snapToGrid` wrapping so it accepts raw coordinates during drag

**3. `src/components/canvas/StickyNote.tsx`** — mouse-up handler:
- Import `SNAP_GRID` from types
- Add a local `snapToGrid` helper
- In `handleUp`, call `onMove` with snapped coordinates before setting `isDragging(false)`

This keeps the same snapping on release for resize too (already works via `resizeNote` in the hook — that can stay as-is since resize is less noticeable).

