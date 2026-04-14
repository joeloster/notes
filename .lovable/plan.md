

## Cleanup: Extract snapToGrid + Remove Duplicate colorMap

Two of the three suggestions are valid. The `NOTE_COLORS` import in StickyNote.tsx is **actually used** (line 260, color picker), so we skip that one.

### 1. Extract `snapToGrid` into a shared utility

Create `src/lib/snapGrid.ts` exporting:
```ts
export function snapToGrid(value: number, grid: number = SNAP_GRID): number {
  return Math.round(value / grid) * grid;
}
```

Then replace the inline/local definitions in:
- `src/hooks/useCanvasState.ts` — remove local `snapToGrid` function (line 5-7), import from utility
- `src/components/canvas/StickyNote.tsx` — replace inline `const snap = (v) => ...` (line 178) with imported function
- `src/components/canvas/InfiniteCanvas.tsx` — replace inline `const snap = (value) => ...` (line 148) with imported function

### 2. Remove duplicate `colorMap` in Auth.tsx

In `src/pages/Auth.tsx`, the `DecoNote` component defines its own `colorMap` (lines 19-25) which is identical to `NOTE_COLOR_MAP` from `@/types/canvas`. Replace with the existing import — `NOTE_COLOR_MAP` is already the same mapping.

### Files changed
- **New**: `src/lib/snapGrid.ts`
- `src/hooks/useCanvasState.ts` — import `snapToGrid`, remove local definition
- `src/components/canvas/StickyNote.tsx` — import `snapToGrid`, use it instead of inline lambda
- `src/components/canvas/InfiniteCanvas.tsx` — import `snapToGrid`, use it instead of inline lambda
- `src/pages/Auth.tsx` — import `NOTE_COLOR_MAP`, remove local `colorMap`

