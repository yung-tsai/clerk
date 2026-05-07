-- Enum for task columns
create type public.task_col as enum ('today','tomorrow','upcoming','someday');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  character text not null default 'blue',
  tasks_completed integer not null default 0,
  streak integer not null default 0,
  onboarded boolean not null default false,
  last_active_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  col public.task_col not null default 'today',
  task_time text,
  location text,
  category text,
  cat_color smallint not null default 0,
  due_date text,
  reason text,
  note text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_idx on public.tasks(user_id);
create index tasks_user_col_idx on public.tasks(user_id, col, position);

alter table public.tasks enable row level security;
create policy "tasks_select_own" on public.tasks for select using (auth.uid() = user_id);
create policy "tasks_insert_own" on public.tasks for insert with check (auth.uid() = user_id);
create policy "tasks_update_own" on public.tasks for update using (auth.uid() = user_id);
create policy "tasks_delete_own" on public.tasks for delete using (auth.uid() = user_id);

-- Completed tasks
create table public.completed_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text,
  cat_color smallint not null default 0,
  completed_at timestamptz not null default now()
);

create index completed_user_idx on public.completed_tasks(user_id, completed_at desc);

alter table public.completed_tasks enable row level security;
create policy "completed_select_own" on public.completed_tasks for select using (auth.uid() = user_id);
create policy "completed_insert_own" on public.completed_tasks for insert with check (auth.uid() = user_id);
create policy "completed_delete_own" on public.completed_tasks for delete using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_updated before update on public.profiles
for each row execute function public.set_updated_at();
create trigger tasks_updated before update on public.tasks
for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', null))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();