create table if not exists public.vat_code_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  direction text not null
    check (direction in ('sales', 'purchase', 'both')),
  rate_percent numeric(5,2) not null default 0
    check (rate_percent >= 0 and rate_percent <= 100),
  calculation_method text not null
    check (calculation_method in ('percentage', 'zero', 'exempt', 'reverse_charge', 'kor', 'none')),
  vat_due_return_section text,
  vat_deductible_return_section text,
  is_reverse_charge boolean not null default false,
  requires_icp_listing boolean not null default false,
  deductibility_percent numeric(5,2) not null default 100
    check (deductibility_percent >= 0 and deductibility_percent <= 100),
  available_for_vat boolean not null default true,
  available_for_kor boolean not null default false,
  available_for_exempt boolean not null default false,
  sort_order integer not null default 0,
  is_default boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_vat_code_templates_updated_at on public.vat_code_templates;
create trigger set_vat_code_templates_updated_at
before update on public.vat_code_templates
for each row execute function public.set_updated_at();

create index if not exists vat_code_templates_code_idx
on public.vat_code_templates(code);

create index if not exists vat_code_templates_direction_idx
on public.vat_code_templates(direction);

create table if not exists public.vat_codes (
  id uuid primary key default gen_random_uuid(),
  administration_id uuid not null references public.administrations(id) on delete cascade,
  template_id uuid references public.vat_code_templates(id) on delete set null,
  code text not null,
  name text not null,
  description text,
  direction text not null
    check (direction in ('sales', 'purchase', 'both')),
  rate_percent numeric(5,2) not null default 0
    check (rate_percent >= 0 and rate_percent <= 100),
  calculation_method text not null
    check (calculation_method in ('percentage', 'zero', 'exempt', 'reverse_charge', 'kor', 'none')),
  vat_due_return_section text,
  vat_deductible_return_section text,
  is_reverse_charge boolean not null default false,
  requires_icp_listing boolean not null default false,
  deductibility_percent numeric(5,2) not null default 100
    check (deductibility_percent >= 0 and deductibility_percent <= 100),
  payable_ledger_account_id uuid references public.ledger_accounts(id) on delete set null,
  receivable_ledger_account_id uuid references public.ledger_accounts(id) on delete set null,
  is_default boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (administration_id, code)
);

drop trigger if exists set_vat_codes_updated_at on public.vat_codes;
create trigger set_vat_codes_updated_at
before update on public.vat_codes
for each row execute function public.set_updated_at();

create index if not exists vat_codes_administration_id_idx
on public.vat_codes(administration_id);

create index if not exists vat_codes_template_id_idx
on public.vat_codes(template_id);

create index if not exists vat_codes_direction_idx
on public.vat_codes(direction);

alter table public.vat_code_templates enable row level security;
alter table public.vat_codes enable row level security;

drop policy if exists "vat_code_templates_select_authenticated" on public.vat_code_templates;
create policy "vat_code_templates_select_authenticated"
on public.vat_code_templates
for select
to authenticated
using (true);

drop policy if exists "vat_code_templates_insert_by_app_admin" on public.vat_code_templates;
create policy "vat_code_templates_insert_by_app_admin"
on public.vat_code_templates
for insert
to authenticated
with check (public.is_app_admin());

drop policy if exists "vat_code_templates_update_by_app_admin" on public.vat_code_templates;
create policy "vat_code_templates_update_by_app_admin"
on public.vat_code_templates
for update
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

drop policy if exists "vat_code_templates_delete_by_app_admin" on public.vat_code_templates;
create policy "vat_code_templates_delete_by_app_admin"
on public.vat_code_templates
for delete
to authenticated
using (public.is_app_admin());

drop policy if exists "vat_codes_select_by_administration_access" on public.vat_codes;
create policy "vat_codes_select_by_administration_access"
on public.vat_codes
for select
to authenticated
using (public.has_administration_access(administration_id));

drop policy if exists "vat_codes_insert_by_admin_role" on public.vat_codes;
create policy "vat_codes_insert_by_admin_role"
on public.vat_codes
for insert
to authenticated
with check (
  public.has_administration_role(administration_id, array['owner', 'admin', 'bookkeeper'])
);

drop policy if exists "vat_codes_update_by_admin_role" on public.vat_codes;
create policy "vat_codes_update_by_admin_role"
on public.vat_codes
for update
to authenticated
using (
  public.has_administration_role(administration_id, array['owner', 'admin', 'bookkeeper'])
)
with check (
  public.has_administration_role(administration_id, array['owner', 'admin', 'bookkeeper'])
);

drop policy if exists "vat_codes_delete_by_app_admin" on public.vat_codes;
create policy "vat_codes_delete_by_app_admin"
on public.vat_codes
for delete
to authenticated
using (public.is_app_admin());

insert into public.vat_code_templates (
  code,
  name,
  description,
  direction,
  rate_percent,
  calculation_method,
  vat_due_return_section,
  vat_deductible_return_section,
  is_reverse_charge,
  requires_icp_listing,
  deductibility_percent,
  available_for_vat,
  available_for_kor,
  available_for_exempt,
  sort_order,
  is_default,
  is_active
)
values
  (
    'SALES_21',
    'Verkoop 21%',
    'Binnenlandse verkoop met algemeen btw-tarief.',
    'sales',
    21.00,
    'percentage',
    '1a',
    null,
    false,
    false,
    0,
    true,
    false,
    false,
    100,
    true,
    true
  ),
  (
    'SALES_9',
    'Verkoop 9%',
    'Binnenlandse verkoop met verlaagd btw-tarief.',
    'sales',
    9.00,
    'percentage',
    '1b',
    null,
    false,
    false,
    0,
    true,
    false,
    false,
    110,
    true,
    true
  ),
  (
    'SALES_0',
    'Verkoop 0%',
    'Verkoop met 0% btw.',
    'sales',
    0.00,
    'zero',
    '1e',
    null,
    false,
    false,
    0,
    true,
    false,
    false,
    120,
    true,
    true
  ),
  (
    'SALES_EXEMPT',
    'Verkoop vrijgesteld',
    'Vrijgestelde omzet zonder btw.',
    'sales',
    0.00,
    'exempt',
    null,
    null,
    false,
    false,
    0,
    true,
    false,
    true,
    130,
    true,
    true
  ),
  (
    'SALES_REVERSE_CHARGE_NL',
    'Verkoop btw verlegd NL',
    'Binnenlandse verkoop waarbij btw is verlegd.',
    'sales',
    0.00,
    'reverse_charge',
    '1e',
    null,
    true,
    false,
    0,
    true,
    false,
    false,
    140,
    true,
    true
  ),
  (
    'SALES_EU_ICP',
    'Verkoop EU ICP',
    'Intracommunautaire levering of dienst binnen de EU. ICP-opgave voorbereid.',
    'sales',
    0.00,
    'reverse_charge',
    '3b',
    null,
    true,
    true,
    0,
    true,
    false,
    false,
    150,
    true,
    true
  ),
  (
    'PURCHASE_21',
    'Inkoop 21%',
    'Binnenlandse inkoop met 21% btw en aftrekbare voorbelasting.',
    'purchase',
    21.00,
    'percentage',
    null,
    '5b',
    false,
    false,
    100,
    true,
    false,
    false,
    200,
    true,
    true
  ),
  (
    'PURCHASE_9',
    'Inkoop 9%',
    'Binnenlandse inkoop met 9% btw en aftrekbare voorbelasting.',
    'purchase',
    9.00,
    'percentage',
    null,
    '5b',
    false,
    false,
    100,
    true,
    false,
    false,
    210,
    true,
    true
  ),
  (
    'PURCHASE_0',
    'Inkoop 0%',
    'Inkoop met 0% btw.',
    'purchase',
    0.00,
    'zero',
    null,
    null,
    false,
    false,
    0,
    true,
    false,
    true,
    220,
    true,
    true
  ),
  (
    'PURCHASE_EXEMPT',
    'Inkoop vrijgesteld',
    'Inkoop zonder btw of vrijgesteld.',
    'purchase',
    0.00,
    'exempt',
    null,
    null,
    false,
    false,
    0,
    true,
    false,
    true,
    230,
    true,
    true
  ),
  (
    'PURCHASE_REVERSE_EU_21',
    'Inkoop EU verlegd 21%',
    'Inkoop uit de EU waarbij de btw naar de afnemer is verlegd.',
    'purchase',
    21.00,
    'reverse_charge',
    '4b',
    '5b',
    true,
    false,
    100,
    true,
    false,
    false,
    240,
    true,
    true
  ),
  (
    'PURCHASE_REVERSE_NON_EU_SERVICE_21',
    'Inkoop buiten EU dienst verlegd 21%',
    'Dienst van buiten de EU waarbij de btw naar de afnemer is verlegd.',
    'purchase',
    21.00,
    'reverse_charge',
    '4a',
    '5b',
    true,
    false,
    100,
    true,
    false,
    false,
    250,
    true,
    true
  ),
  (
    'KOR_SALES_NO_VAT',
    'KOR verkoop zonder btw',
    'Verkoop onder de kleineondernemersregeling. Geen btw op factuur.',
    'sales',
    0.00,
    'kor',
    null,
    null,
    false,
    false,
    0,
    false,
    true,
    false,
    300,
    true,
    true
  ),
  (
    'KOR_PURCHASE_NO_DEDUCTION',
    'KOR inkoop zonder btw-aftrek',
    'Inkoop onder KOR-administratie. Btw wordt niet als voorbelasting afgetrokken.',
    'purchase',
    0.00,
    'kor',
    null,
    null,
    false,
    false,
    0,
    false,
    true,
    false,
    310,
    true,
    true
  ),
  (
    'NO_VAT',
    'Geen btw',
    'Algemene code voor posten zonder btw.',
    'both',
    0.00,
    'none',
    null,
    null,
    false,
    false,
    0,
    true,
    true,
    true,
    900,
    true,
    true
  )
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  direction = excluded.direction,
  rate_percent = excluded.rate_percent,
  calculation_method = excluded.calculation_method,
  vat_due_return_section = excluded.vat_due_return_section,
  vat_deductible_return_section = excluded.vat_deductible_return_section,
  is_reverse_charge = excluded.is_reverse_charge,
  requires_icp_listing = excluded.requires_icp_listing,
  deductibility_percent = excluded.deductibility_percent,
  available_for_vat = excluded.available_for_vat,
  available_for_kor = excluded.available_for_kor,
  available_for_exempt = excluded.available_for_exempt,
  sort_order = excluded.sort_order,
  is_default = excluded.is_default,
  is_active = excluded.is_active,
  updated_at = now();

create or replace function public.create_default_vat_codes(
  target_administration_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
  target_tax_scheme text;
  payable_account_id uuid;
  receivable_account_id uuid;
begin
  if not public.has_administration_role(
    target_administration_id,
    array['owner', 'admin', 'bookkeeper']
  ) then
    raise exception 'No access to create vat codes for administration %', target_administration_id;
  end if;

  select tax_scheme
  into target_tax_scheme
  from public.administrations
  where id = target_administration_id;

  if target_tax_scheme is null then
    raise exception 'Administration % not found', target_administration_id;
  end if;

  select id
  into payable_account_id
  from public.ledger_accounts
  where administration_id = target_administration_id
    and code = '1610'
  limit 1;

  select id
  into receivable_account_id
  from public.ledger_accounts
  where administration_id = target_administration_id
    and code = '1500'
  limit 1;

  insert into public.vat_codes (
    administration_id,
    template_id,
    code,
    name,
    description,
    direction,
    rate_percent,
    calculation_method,
    vat_due_return_section,
    vat_deductible_return_section,
    is_reverse_charge,
    requires_icp_listing,
    deductibility_percent,
    payable_ledger_account_id,
    receivable_ledger_account_id,
    is_default,
    is_active
  )
  select
    target_administration_id,
    template.id,
    template.code,
    template.name,
    template.description,
    template.direction,
    template.rate_percent,
    template.calculation_method,
    template.vat_due_return_section,
    template.vat_deductible_return_section,
    template.is_reverse_charge,
    template.requires_icp_listing,
    template.deductibility_percent,
    case
      when template.vat_due_return_section is not null then payable_account_id
      else null
    end,
    case
      when template.vat_deductible_return_section is not null then receivable_account_id
      else null
    end,
    true,
    true
  from public.vat_code_templates template
  where template.is_default = true
    and template.is_active = true
    and (
      (target_tax_scheme = 'vat' and template.available_for_vat = true)
      or (target_tax_scheme = 'kor' and template.available_for_kor = true)
      or (target_tax_scheme = 'exempt' and template.available_for_exempt = true)
    )
  on conflict (administration_id, code) do nothing;

  get diagnostics inserted_count = row_count;

  perform public.write_audit_log(
    target_administration_id,
    'vat_codes.default_schema_created',
    'vat_codes',
    target_administration_id::text,
    null,
    jsonb_build_object(
      'inserted_count', inserted_count,
      'tax_scheme', target_tax_scheme
    )
  );

  return inserted_count;
end;
$$;

grant execute on function public.create_default_vat_codes(uuid) to authenticated;