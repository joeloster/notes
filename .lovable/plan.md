

## Fix Multi-Select & Group Move Behavior

### What changes

**1. Selection rectangle renders on top of notes** (`InfiniteCanvas.tsx`)
- Move the selection rectangle `div` to render *after* the notes in the transform container, so it appears above them visually.

**2. "One-shot" select mode** (`InfiniteCanvas.tsx`)
- When the user releases the selection rectangle (`handlePointerUp` during select), immediately switch `interactionMode` back to `'pan'`. This makes locking a one-time action.
- The `groupSelectedIds` remain set after releasing, so the selected notes stay highlighted.

**3. Group drag from canvas (not just from notes)** (`InfiniteCanvas.tsx`)
- In `handlePointerDown` (pan mode): if `groupSelectedIds` is non-empty, check if the click landed inside the bounding box of the selected notes. If yes, start a group drag instead of panning. If no (clicked elsewhere), clear the group selection and pan normally.
- This means after selecting notes, the user can immediately drag the group without needing to click a specific note.

**4. Clicking elsewhere clears selection** (`InfiniteCanvas.tsx`)
- Already handled by the logic above: clicking outside the group bounding box clears `groupSelectedIds` and resumes normal pan behavior.

### Files changed
- `src/components/canvas/InfiniteCanvas.tsx` — all changes above

