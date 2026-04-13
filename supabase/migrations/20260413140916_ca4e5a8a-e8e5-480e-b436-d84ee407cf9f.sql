
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  x float not null default 0,
  y float not null default 0,
  width float not null default 220,
  height float not null default 180,
  content text not null default '',
  color text not null default 'yellow',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "Users can view own notes" on public.notes
  for select to authenticated
  using (user_id = auth.uid());

create policy "Users can create own notes" on public.notes
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own notes" on public.notes
  for update to authenticated
  using (user_id = auth.uid());

create policy "Users can delete own notes" on public.notes
  for delete to authenticated
  using (user_id = auth.uid());

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

create trigger update_notes_updated_at
  before update on public.notes
  for each row execute function public.update_updated_at_column();
