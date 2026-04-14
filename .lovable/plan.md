

## Cleanup Unused Code

Two small removals, both verified as unused:

**1. Remove `pan` from `useCanvasState.ts`**
- Delete the `pan` function definition (lines 145-147) and remove `pan` from the return object (line 169). It's never consumed — `InfiniteCanvas` manipulates `view` via `setView` directly.

**2. Remove accordion keyframes/animations from `tailwind.config.ts`**
- Delete the `keyframes` block (lines 73-90) and `animation` block (lines 91-94). These are shadcn template leftovers with no usage anywhere in the project.

### Files changed
- `src/hooks/useCanvasState.ts` — remove `pan` function + return entry
- `tailwind.config.ts` — remove accordion keyframes + animations

