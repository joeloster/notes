

## Multi-Select & Group Move

**How it works for you**: A new lock/unlock toggle button on the toolbar. When locked (select mode), dragging on the canvas draws a selection rectangle instead of panning. All notes inside the rectangle get selected and can be dragged together as a group.

### Design

```text
Toolbar:  [+] [colors] [🔒/🔓] [zoom] [logout]
                         ^
                    new toggle
```

- **Unlocked (default)** = current behavior (pan mode, hand icon)
- **Locked** = select mode (crosshair cursor, drag draws a selection box)

### Implementation

**1. Add `interactionMode` state to `InfiniteCanvas.tsx`**
- New state: `interactionMode: 'pan' | 'select'` (default `'pan'`)
- New state: `selectedNoteIds: Set<string>` for multi-selection
- New state: `selectionRect: {x, y, w, h} | null` for the rubber-band rectangle

**2. Modify canvas pointer handlers in `InfiniteCanvas.tsx`**
- In `handlePointerDown`: if mode is `'select'`, start drawing a selection rectangle instead of panning
- In `handlePointerMove`: if selecting, update the rectangle dimensions; compute which notes intersect the rect and update `selectedNoteIds`
- In `handlePointerUp`: finalize selection, clear the rect visual

**3. Group drag logic in `InfiniteCanvas.tsx`**
- When a note that's part of `selectedNoteIds` is dragged, move all selected notes by the same delta
- Pass `isGroupSelected` prop to `StickyNote` so it shows a selection highlight
- On drag end, persist positions for all moved notes

**4. Selection rectangle overlay**
- Render a semi-transparent colored div in the canvas transform layer showing the drag-selection area

**5. Update `CanvasToolbar.tsx`**
- Add a Lock/Unlock toggle button (using `Lock`/`Unlock` icons from lucide-react)
- New prop: `interactionMode` and `onToggleMode`

**6. Update `StickyNote.tsx`**
- Accept `isGroupSelected` prop for visual highlight
- When dragging starts on a group-selected note, call a new `onGroupMove` callback instead of single-note move

**7. Update `useCanvasState.ts`**
- Add `moveNotes(ids, dx, dy)` and `persistPositions(ids)` for batch operations

### Files changed
- `src/components/canvas/InfiniteCanvas.tsx` — mode state, selection rect, group drag
- `src/components/canvas/CanvasToolbar.tsx` — lock/unlock toggle button
- `src/components/canvas/StickyNote.tsx` — group selection visual + callback
- `src/hooks/useCanvasState.ts` — batch move/persist helpers

No database changes needed.

