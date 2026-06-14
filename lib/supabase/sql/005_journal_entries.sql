create table if not exists public.journal_entry_number_counters (
  id uuid primary key default gen_random_uuid(),
  administration_id uuid not null references public.administrations(id) on delete cascade,
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  next_entry_number bigint not null default 1 check (next_entry_number > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (administration_id, fiscal_year_id)
);

drop trigger if exists set_journal_entry_number_counters_updated_at
on public.journal_entry_number_counters;

create trigger set_journal_entry_number_counters_updated_at
before update on public.journal_entry_number_counters
for each row execute function public.set_updated_at();

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  administration_id uuid not null references public.administrations(id) on delete cascade,
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete restrict,
  entry_number bigint,
  entry_date date not null default current_date,
  description text not null,
  reference text,
  source_type text not null default 'manual'
    check (
      source_type in (
        'manual',
        'document',
        'bank',
        'import',
        'system',
        'opening_balance',
        'correction'
      )
    ),
  source_id text,
  status text not null default 'draft'
    check (status in ('draft', 'posted', 'voided')),
  total_debit numeric(14,2) not null default 0 check (total_debit >= 0),
  total_credit numeric(14,2) not null default 0 check (total_credit >= 0),
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  posted_by_profile_id uuid references public.profiles(id) on delete set null,
  posted_at timestamptz,
  voided_by_profile_id uuid references public.profiles(id) on delete set null,
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (administration_id, fiscal_year_id, entry_number),
  check (status <> 'posted' or entry_number is not null)
);

drop trigger if exists set_journal_entries_updated_at on public.journal_entries;
create trigger set_journal_entries_updated_at
before update on public.journal_entries
for each row execute function public.set_updated_at();

create index if not exists journal_entries_administration_id_idx
on public.journal_entries(administration_id);

create index if not exists journal_entries_fiscal_year_id_idx
on public.journal_entries(fiscal_year_id);

create index if not exists journal_entries_status_idx
on public.journal_entries(status);

create index if not exists journal_entries_entry_date_idx
on public.journal_entries(entry_date);

create table if not exists public.journal_entry_lines (
  id uuid primary key default gen_random_uuid(),
  journal_entry_id uuid not null references public.journal_entries(id) on delete cascade,
  administration_id uuid not null references public.administrations(id) on delete cascade,
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete restrict,
  line_number integer not null check (line_number > 0),
  ledger_account_id uuid not null references public.ledger_accounts(id) on delete restrict,
  vat_code_id uuid references public.vat_codes(id) on delete set null,
  description text,
  debit_amount numeric(14,2) not null default 0 check (debit_amount >= 0),
  credit_amount numeric(14,2) not null default 0 check (credit_amount >= 0),
  amount_excl_vat numeric(14,2),
  vat_amount numeric(14,2) not null default 0,
  amount_incl_vat numeric(14,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (journal_entry_id, line_number),
  check (
    (debit_amount > 0 and credit_amount = 0)
    or
    (credit_amount > 0 and debit_amount = 0)
  )
);

drop trigger if exists set_journal_entry_lines_updated_at
on public.journal_entry_lines;

create trigger set_journal_entry_lines_updated_at
before update on public.journal_entry_lines
for each row execute function public.set_updated_at();

create index if not exists journal_entry_lines_journal_entry_id_idx
on public.journal_entry_lines(journal_entry_id);

create index if not exists journal_entry_lines_administration_id_idx
on public.journal_entry_lines(administration_id);

create index if not exists journal_entry_lines_fiscal_year_id_idx
on public.journal_entry_lines(fiscal_year_id);

create index if not exists journal_entry_lines_ledger_account_id_idx
on public.journal_entry_lines(ledger_account_id);

create index if not exists journal_entry_lines_vat_code_id_idx
on public.journal_entry_lines(vat_code_id);

create or replace function public.set_journal_entry_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fiscal_year_administration_id uuid;
  fiscal_year_status text;
begin
  select administration_id, status
  into fiscal_year_administration_id, fiscal_year_status
  from public.fiscal_years
  where id = new.fiscal_year_id;

  if fiscal_year_administration_id is null then
    raise exception 'Fiscal year % not found', new.fiscal_year_id;
  end if;

  if fiscal_year_administration_id <> new.administration_id then
    raise exception 'Fiscal year does not belong to administration %', new.administration_id;
  end if;

  if fiscal_year_status <> 'open' then
    raise exception 'Fiscal year % is not open', new.fiscal_year_id;
  end if;

  if new.created_by_profile_id is null then
    new.created_by_profile_id = auth.uid();
  end if;

  return new;
end;
$$;

drop trigger if exists set_journal_entry_defaults_before_write
on public.journal_entries;

create trigger set_journal_entry_defaults_before_write
before insert or update on public.journal_entries
for each row execute function public.set_journal_entry_defaults();

create or replace function public.set_journal_entry_line_context()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_entry record;
  ledger_account_administration_id uuid;
  vat_code_administration_id uuid;
begin
  select administration_id, fiscal_year_id, status
  into parent_entry
  from public.journal_entries
  where id = new.journal_entry_id;

  if parent_entry.administration_id is null then
    raise exception 'Journal entry % not found', new.journal_entry_id;
  end if;

  if parent_entry.status <> 'draft' then
    raise exception 'Journal entry % is not draft', new.journal_entry_id;
  end if;

  select administration_id
  into ledger_account_administration_id
  from public.ledger_accounts
  where id = new.ledger_account_id;

  if ledger_account_administration_id is null then
    raise exception 'Ledger account % not found', new.ledger_account_id;
  end if;

  if ledger_account_administration_id <> parent_entry.administration_id then
    raise exception 'Ledger account does not belong to this administration';
  end if;

  if new.vat_code_id is not null then
    select administration_id
    into vat_code_administration_id
    from public.vat_codes
    where id = new.vat_code_id;

    if vat_code_administration_id is null then
      raise exception 'VAT code % not found', new.vat_code_id;
    end if;

    if vat_code_administration_id <> parent_entry.administration_id then
      raise exception 'VAT code does not belong to this administration';
    end if;
  end if;

  new.administration_id = parent_entry.administration_id;
  new.fiscal_year_id = parent_entry.fiscal_year_id;

  return new;
end;
$$;

drop trigger if exists set_journal_entry_line_context_before_write
on public.journal_entry_lines;

create trigger set_journal_entry_line_context_before_write
before insert or update on public.journal_entry_lines
for each row execute function public.set_journal_entry_line_context();

create or replace function public.recalculate_journal_entry_totals(
  target_journal_entry_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.journal_entries
  set
    total_debit = coalesce(
      (
        select sum(debit_amount)
        from public.journal_entry_lines
        where journal_entry_id = target_journal_entry_id
      ),
      0
    ),
    total_credit = coalesce(
      (
        select sum(credit_amount)
        from public.journal_entry_lines
        where journal_entry_id = target_journal_entry_id
      ),
      0
    ),
    updated_at = now()
  where id = target_journal_entry_id;
end;
$$;

create or replace function public.refresh_journal_entry_totals_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_journal_entry_totals(old.journal_entry_id);
    return old;
  end if;

  if tg_op = 'UPDATE' and old.journal_entry_id <> new.journal_entry_id then
    perform public.recalculate_journal_entry_totals(old.journal_entry_id);
    perform public.recalculate_journal_entry_totals(new.journal_entry_id);
    return new;
  end if;

  perform public.recalculate_journal_entry_totals(new.journal_entry_id);
  return new;
end;
$$;

drop trigger if exists refresh_journal_entry_totals_after_insert
on public.journal_entry_lines;

create trigger refresh_journal_entry_totals_after_insert
after insert on public.journal_entry_lines
for each row execute function public.refresh_journal_entry_totals_trigger();

drop trigger if exists refresh_journal_entry_totals_after_update
on public.journal_entry_lines;

create trigger refresh_journal_entry_totals_after_update
after update on public.journal_entry_lines
for each row execute function public.refresh_journal_entry_totals_trigger();

drop trigger if exists refresh_journal_entry_totals_after_delete
on public.journal_entry_lines;

create trigger refresh_journal_entry_totals_after_delete
after delete on public.journal_entry_lines
for each row execute function public.refresh_journal_entry_totals_trigger();

create or replace function public.post_journal_entry(
  target_journal_entry_id uuid
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  entry_record record;
  assigned_entry_number bigint;
begin
  select *
  into entry_record
  from public.journal_entries
  where id = target_journal_entry_id
  for update;

  if entry_record.id is null then
    raise exception 'Journal entry % not found', target_journal_entry_id;
  end if;

  if not public.has_administration_role(
    entry_record.administration_id,
    array['owner', 'admin', 'bookkeeper']
  ) then
    raise exception 'No access to post journal entry %', target_journal_entry_id;
  end if;

  if entry_record.status <> 'draft' then
    raise exception 'Only draft journal entries can be posted';
  end if;

  perform public.recalculate_journal_entry_totals(target_journal_entry_id);

  select *
  into entry_record
  from public.journal_entries
  where id = target_journal_entry_id
  for update;

  if entry_record.total_debit <= 0 or entry_record.total_credit <= 0 then
    raise exception 'Journal entry must contain debit and credit lines';
  end if;

  if entry_record.total_debit <> entry_record.total_credit then
    raise exception 'Journal entry is not balanced. Debit %, credit %',
      entry_record.total_debit,
      entry_record.total_credit;
  end if;

  if not exists (
    select 1
    from public.fiscal_years
    where id = entry_record.fiscal_year_id
      and administration_id = entry_record.administration_id
      and status = 'open'
  ) then
    raise exception 'Fiscal year is not open';
  end if;

  if entry_record.entry_number is null then
    insert into public.journal_entry_number_counters (
      administration_id,
      fiscal_year_id,
      next_entry_number
    )
    values (
      entry_record.administration_id,
      entry_record.fiscal_year_id,
      1
    )
    on conflict (administration_id, fiscal_year_id) do nothing;

    update public.journal_entry_number_counters
    set next_entry_number = next_entry_number + 1
    where administration_id = entry_record.administration_id
      and fiscal_year_id = entry_record.fiscal_year_id
    returning next_entry_number - 1 into assigned_entry_number;
  else
    assigned_entry_number = entry_record.entry_number;
  end if;

  update public.journal_entries
  set
    entry_number = assigned_entry_number,
    status = 'posted',
    posted_by_profile_id = auth.uid(),
    posted_at = now(),
    updated_at = now()
  where id = target_journal_entry_id;

  perform public.write_audit_log(
    entry_record.administration_id,
    'journal_entry.posted',
    'journal_entries',
    target_journal_entry_id::text,
    null,
    jsonb_build_object(
      'entry_number', assigned_entry_number,
      'total_debit', entry_record.total_debit,
      'total_credit', entry_record.total_credit
    )
  );

  return assigned_entry_number;
end;
$$;

alter table public.journal_entry_number_counters enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_entry_lines enable row level security;

drop policy if exists "journal_entry_number_counters_select_by_access"
on public.journal_entry_number_counters;

create policy "journal_entry_number_counters_select_by_access"
on public.journal_entry_number_counters
for select
to authenticated
using (public.has_administration_access(administration_id));

drop policy if exists "journal_entry_number_counters_manage_by_app_admin"
on public.journal_entry_number_counters;

create policy "journal_entry_number_counters_manage_by_app_admin"
on public.journal_entry_number_counters
for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

drop policy if exists "journal_entries_select_by_administration_access"
on public.journal_entries;

create policy "journal_entries_select_by_administration_access"
on public.journal_entries
for select
to authenticated
using (public.has_administration_access(administration_id));

drop policy if exists "journal_entries_insert_by_admin_role"
on public.journal_entries;

create policy "journal_entries_insert_by_admin_role"
on public.journal_entries
for insert
to authenticated
with check (
  public.has_administration_role(administration_id, array['owner', 'admin', 'bookkeeper'])
);

drop policy if exists "journal_entries_update_by_admin_role"
on public.journal_entries;

create policy "journal_entries_update_by_admin_role"
on public.journal_entries
for update
to authenticated
using (
  public.has_administration_role(administration_id, array['owner', 'admin', 'bookkeeper'])
)
with check (
  public.has_administration_role(administration_id, array['owner', 'admin', 'bookkeeper'])
);

drop policy if exists "journal_entries_delete_by_app_admin"
on public.journal_entries;

create policy "journal_entries_delete_by_app_admin"
on public.journal_entries
for delete
to authenticated
using (public.is_app_admin());

drop policy if exists "journal_entry_lines_select_by_administration_access"
on public.journal_entry_lines;

create policy "journal_entry_lines_select_by_administration_access"
on public.journal_entry_lines
for select
to authenticated
using (public.has_administration_access(administration_id));

drop policy if exists "journal_entry_lines_insert_by_admin_role"
on public.journal_entry_lines;

create policy "journal_entry_lines_insert_by_admin_role"
on public.journal_entry_lines
for insert
to authenticated
with check (
  public.has_administration_role(administration_id, array['owner', 'admin', 'bookkeeper'])
);

drop policy if exists "journal_entry_lines_update_by_admin_role"
on public.journal_entry_lines;

create policy "journal_entry_lines_update_by_admin_role"
on public.journal_entry_lines
for update
to authenticated
using (
  public.has_administration_role(administration_id, array['owner', 'admin', 'bookkeeper'])
)
with check (
  public.has_administration_role(administration_id, array['owner', 'admin', 'bookkeeper'])
);

drop policy if exists "journal_entry_lines_delete_by_admin_role"
on public.journal_entry_lines;

create policy "journal_entry_lines_delete_by_admin_role"
on public.journal_entry_lines
for delete
to authenticated
using (
  public.has_administration_role(administration_id, array['owner', 'admin', 'bookkeeper'])
);

grant execute on function public.post_journal_entry(uuid) to authenticated;