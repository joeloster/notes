

## Plan: Auth + Landing Page + Persistent Notes with Lovable Cloud

### Overview
Enable Lovable Cloud (Supabase), create a combined landing/auth page, protect the canvas behind auth, and persist notes to the database per user.

### 1. Enable Lovable Cloud
- Activate Lovable Cloud to provision Supabase (database + auth)

### 2. Database Migration
Create `notes` table:
```sql
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  x float not null default 0,
  y float not null default 0,
  width float not null default 220,
  height float not null default 180,
  content text not null default '',
  color text not null default 'yellow',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.notes enable row level security;

create policy "Users manage own notes" on public.notes
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

No profiles table needed — we only need auth identity + notes.

### 3. Auth + Landing Page (`src/pages/Auth.tsx`)
A single page that serves as both landing and auth:
- App name/tagline at top
- Brief description of the sticky notes canvas
- Toggle between Sign In and Sign Up forms (email + password)
- Clean design matching existing color scheme (primary blue, warm background)
- On successful auth, redirect to `/`

### 4. Route Protection (`src/App.tsx`)
- Add auth state listener using Supabase `onAuthStateChange`
- If not authenticated: show Auth page
- If authenticated: show InfiniteCanvas
- Add a sign-out button to the canvas toolbar

### 5. Refactor `useCanvasState.ts` for Persistence
- Accept `userId` parameter
- **On mount**: fetch notes from `notes` table where `user_id = userId`
- **Add note**: INSERT into DB, use returned UUID as note id
- **Delete note**: DELETE from DB immediately
- **Move/resize (on release)**: UPDATE position/dimensions immediately
- **Content edit**: debounced UPDATE (~500ms)
- **Color change**: UPDATE immediately
- Local state updates remain instant for responsiveness; DB writes happen in background

### 6. Sign Out
- Add logout button to `CanvasToolbar.tsx`
- Calls `supabase.auth.signOut()`, redirects to auth page

### Files Changed
| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | New — landing + login/signup |
| `src/App.tsx` | Auth guard, session state |
| `src/hooks/useCanvasState.ts` | DB read/write, accepts userId |
| `src/components/canvas/CanvasToolbar.tsx` | Add sign-out button |
| `src/components/canvas/InfiniteCanvas.tsx` | Pass userId to hook |
| Migration SQL | Create `notes` table + RLS |

