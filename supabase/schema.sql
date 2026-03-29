-- Supabase SQL Editor에서 한 번에 실행 (신규 프로젝트)

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  applicant_name text,
  birth_date text,
  phone text,
  gender text,
  nationality text,
  address text,
  resident_no text,
  personal_no text,
  foreigner_nationality text,
  foreigner_no text,
  vaccination_status text,
  language text,
  phone_home text,
  weight_kg text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pdf_url text not null,
  file_name text,
  created_at timestamptz not null default now()
);

create index if not exists submissions_user_id_created_at_idx
  on public.submissions (user_id, created_at desc);

alter table public.submissions enable row level security;

create policy "submissions_select_own"
  on public.submissions for select using (auth.uid() = user_id);

create policy "submissions_insert_own"
  on public.submissions for insert with check (auth.uid() = user_id);

create policy "submissions_delete_own"
  on public.submissions for delete using (auth.uid() = user_id);

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  plate text not null,
  created_at timestamptz not null default now()
);

create index if not exists equipment_user_id_idx on public.equipment (user_id);

alter table public.equipment enable row level security;

create policy "equipment_select_own"
  on public.equipment for select using (auth.uid() = user_id);

create policy "equipment_insert_own"
  on public.equipment for insert with check (auth.uid() = user_id);

create policy "equipment_delete_own"
  on public.equipment for delete using (auth.uid() = user_id);

-- 이미 profiles가 있는 경우:
-- alter table public.profiles add column if not exists language text;
-- alter table public.profiles add column if not exists phone_home text;
-- alter table public.profiles add column if not exists weight_kg text;
