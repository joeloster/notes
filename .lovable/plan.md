

## Plan: Clean Up Unused Code and Dependencies

I verified Copilot's analysis against the actual codebase. Here's what I agree with and one correction:

### Agree — Delete These Files

**Test file:**
- `src/test/example.test.ts`

**Unused components:**
- `src/components/NavLink.tsx` — not imported anywhere
- `src/hooks/use-mobile.tsx` — only imported by `sidebar.tsx` which is also being deleted

**Unused UI components (none imported by app code, only by each other):**
- All 30+ UI components listed by Copilot, plus `card.tsx` (also unused) and `calendar.tsx` (unused)

**Metadata:**
- `.lovable/plan.md` — stale plan file (but NOT the `.lovable` directory itself or `mem://` files, which Lovable uses internally)

### Agree — Remove Unused NPM Dependencies
Remove from `package.json`: all `@radix-ui/*` packages for deleted components, `@hookform/resolvers`, `react-hook-form`, `zod`, `cmdk`, `date-fns`, `react-day-picker`, `embla-carousel-react`, `input-otp`, `recharts`, `react-resizable-panels`, `vaul`.

Keep `@tailwindcss/typography` check: it's not in `tailwind.config.ts` plugins and not referenced anywhere — safe to remove if present in `package.json`.

### Disagree / Caution

- **Do NOT delete the `.lovable` directory** — Lovable uses it for project configuration and memory. Deleting it would break project functionality. I'll only remove `plan.md` inside it.
- **README.md** — I'll replace with a brief project description rather than delete.

### Also Add
- `src/components/ui/use-toast.ts` — this is a re-export wrapper that can stay since `toaster.tsx` and `use-toast.ts` (hook) are kept.

### Summary of Changes
1. Delete ~35 unused files (UI components, NavLink, use-mobile, example test)
2. Remove ~15 unused npm packages from `package.json`
3. Delete `.lovable/plan.md`
4. Replace `README.md` with a proper description
5. Run install to update lockfile

