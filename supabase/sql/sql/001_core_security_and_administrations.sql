create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  app_role text not null default 'client'
    check (app_role in ('owner', 'admin', 'bookkeeper', 'client', 'readonly')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.administrations (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  legal_name text,
  chamber_of_commerce_number text,
  vat_number text,
  tax_scheme text not null default 'vat'
    check (tax_scheme in ('vat', 'kor', 'exempt')),
  country_code text not null default 'NL',
  currency_code text not null default 'EUR',
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_administrations_updated_at on public.administrations;
create trigger set_administrations_updated_at
before update on public.administrations
for each row execute function public.set_updated_at();

create table if not exists public.administration_memberships (
  id uuid primary key default gen_random_uuid(),
  administration_id uuid not null references public.administrations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null
    check (role in ('owner', 'admin', 'bookkeeper', 'client', 'readonly')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (administration_id, profile_id)
);

drop trigger if exists set_administration_memberships_updated_at on public.administration_memberships;
create trigger set_administration_memberships_updated_at
before update on public.administration_memberships
for each row execute function public.set_updated_at();

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  administration_id uuid references public.administrations(id) on delete set null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_table text,
  entity_id text,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
      and app_role in ('owner', 'admin')
  );
$$;

create or replace function public.has_administration_access(target_administration_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_app_admin()
    or exists (
      select 1
      from public.administration_memberships
      where administration_id = target_administration_id
        and profile_id = auth.uid()
        and is_active = true
    );
$$;

create or replace function public.has_administration_role(
  target_administration_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_app_admin()
    or exists (
      select 1
      from public.administration_memberships
      where administration_id = target_administration_id
        and profile_id = auth.uid()
        and role = any(allowed_roles)
        and is_active = true
    );
$$;

create or replace function public.write_audit_log(
  p_administration_id uuid,
  p_action text,
  p_entity_table text default null,
  p_entity_id text default null,
  p_old_data jsonb default null,
  p_new_data jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_log_id uuid;
begin
  if p_administration_id is not null
     and not public.has_administration_access(p_administration_id) then
    raise exception 'No access to administration %', p_administration_id;
  end if;

  insert into public.audit_logs (
    administration_id,
    actor_profile_id,
    action,
    entity_table,
    entity_id,
    old_data,
    new_data
  )
  values (
    p_administration_id,
    auth.uid(),
    p_action,
    p_entity_table,
    p_entity_id,
    p_old_data,
    p_new_data
  )
  returning id into new_log_id;

  return new_log_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.administrations enable row level security;
alter table public.administration_memberships enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_app_admin()
);

drop policy if exists "profiles_update_by_app_admin" on public.profiles;
create policy "profiles_update_by_app_admin"
on public.profiles
for update
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

drop policy if exists "administrations_select_by_access" on public.administrations;
create policy "administrations_select_by_access"
on public.administrations
for select
to authenticated
using (public.has_administration_access(id));

drop policy if exists "administrations_insert_by_app_admin" on public.administrations;
create policy "administrations_insert_by_app_admin"
on public.administrations
for insert
to authenticated
with check (public.is_app_admin());

drop policy if exists "administrations_update_by_admin_role" on public.administrations;
create policy "administrations_update_by_admin_role"
on public.administrations
for update
to authenticated
using (public.has_administration_role(id, array['owner', 'admin']))
with check (public.has_administration_role(id, array['owner', 'admin']));

drop policy if exists "administrations_delete_by_app_admin" on public.administrations;
create policy "administrations_delete_by_app_admin"
on public.administrations
for delete
to authenticated
using (public.is_app_admin());

drop policy if exists "memberships_select_by_access" on public.administration_memberships;
create policy "memberships_select_by_access"
on public.administration_memberships
for select
to authenticated
using (public.has_administration_access(administration_id));

drop policy if exists "memberships_insert_by_admin_role" on public.administration_memberships;
create policy "memberships_insert_by_admin_role"
on public.administration_memberships
for insert
to authenticated
with check (public.has_administration_role(administration_id, array['owner', 'admin']));

drop policy if exists "memberships_update_by_admin_role" on public.administration_memberships;
create policy "memberships_update_by_admin_role"
on public.administration_memberships
for update
to authenticated
using (public.has_administration_role(administration_id, array['owner', 'admin']))
with check (public.has_administration_role(administration_id, array['owner', 'admin']));

drop policy if exists "memberships_delete_by_admin_role" on public.administration_memberships;
create policy "memberships_delete_by_admin_role"
on public.administration_memberships
for delete
to authenticated
using (public.has_administration_role(administration_id, array['owner', 'admin']));

drop policy if exists "audit_logs_select_by_access" on public.audit_logs;
create policy "audit_logs_select_by_access"
on public.audit_logs
for select
to authenticated
using (
  administration_id is null
  or public.has_administration_access(administration_id)
);

grant execute on function public.write_audit_log(uuid, text, text, text, jsonb, jsonb) to authenticated;