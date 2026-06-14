create table if not exists public.fiscal_years (
  id uuid primary key default gen_random_uuid(),
  administration_id uuid not null references public.administrations(id) on delete cascade,
  year integer not null check (year >= 1900 and year <= 2200),
  start_date date not null,
  end_date date not null,
  status text not null default 'open'
    check (status in ('open', 'closed', 'locked')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (administration_id, year),
  check (start_date <= end_date)
);

drop trigger if exists set_fiscal_years_updated_at on public.fiscal_years;
create trigger set_fiscal_years_updated_at
before update on public.fiscal_years
for each row execute function public.set_updated_at();

create index if not exists fiscal_years_administration_id_idx
on public.fiscal_years(administration_id);

create index if not exists fiscal_years_year_idx
on public.fiscal_years(year);

alter table public.fiscal_years enable row level security;

drop policy if exists "fiscal_years_select_by_administration_access" on public.fiscal_years;
create policy "fiscal_years_select_by_administration_access"
on public.fiscal_years
for select
to authenticated
using (public.has_administration_access(administration_id));

drop policy if exists "fiscal_years_insert_by_admin_role" on public.fiscal_years;
create policy "fiscal_years_insert_by_admin_role"
on public.fiscal_years
for insert
to authenticated
with check (
  public.has_administration_role(administration_id, array['owner', 'admin', 'bookkeeper'])
);

drop policy if exists "fiscal_years_update_by_admin_role" on public.fiscal_years;
create policy "fiscal_years_update_by_admin_role"
on public.fiscal_years
for update
to authenticated
using (
  public.has_administration_role(administration_id, array['owner', 'admin', 'bookkeeper'])
)
with check (
  public.has_administration_role(administration_id, array['owner', 'admin', 'bookkeeper'])
);

drop policy if exists "fiscal_years_delete_by_app_admin" on public.fiscal_years;
create policy "fiscal_years_delete_by_app_admin"
on public.fiscal_years
for delete
to authenticated
using (public.is_app_admin());