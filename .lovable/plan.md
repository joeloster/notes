

## Plan: Final Code Cleanup

All items verified against the codebase — Copilot's analysis is correct.

### 1. Delete `src/App.css`
Not imported anywhere. Pure Vite boilerplate.

### 2. Delete `public/placeholder.svg`
Not referenced anywhere.

### 3. Remove sidebar colors
- **`tailwind.config.ts`**: Delete the `sidebar` color object (lines 67-76)
- **`src/index.css`**: Delete the `--sidebar-*` CSS variables (lines 58-65)

### 4. Delete `components.json`
Only used by shadcn CLI — not needed for production.

### 5. Remove test infrastructure
- Delete `src/test/setup.ts` and `vitest.config.ts`
- Remove from `package.json` devDependencies: `@testing-library/jest-dom`, `@testing-library/react`, `jsdom`, `vitest`
- Remove `test` and `test:watch` scripts from `package.json`

All changes are safe deletions of unused code. No functional impact.

