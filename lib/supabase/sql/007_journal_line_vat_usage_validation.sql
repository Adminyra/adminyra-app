create or replace function public.validate_journal_entry_line_vat_usage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_entry record;
  ledger_record record;
  vat_code_record record;
begin
  select id, administration_id, status
  into parent_entry
  from public.journal_entries
  where id = new.journal_entry_id;

  if parent_entry.id is null then
    raise exception 'Journal entry % not found', new.journal_entry_id;
  end if;

  if parent_entry.status <> 'draft' then
    raise exception 'Journal entry % is not draft', new.journal_entry_id;
  end if;

  select id, administration_id, code, name, account_type, is_active
  into ledger_record
  from public.ledger_accounts
  where id = new.ledger_account_id;

  if ledger_record.id is null then
    raise exception 'Ledger account % not found', new.ledger_account_id;
  end if;

  if ledger_record.administration_id <> parent_entry.administration_id then
    raise exception 'Ledger account does not belong to this administration';
  end if;

  if ledger_record.is_active is not true then
    raise exception 'Ledger account % is inactive', ledger_record.code;
  end if;

  -- Geen btw-code gekozen = altijd toegestaan.
  if new.vat_code_id is null then
    return new;
  end if;

  select id, administration_id, code, name, direction, calculation_method, is_active
  into vat_code_record
  from public.vat_codes
  where id = new.vat_code_id;

  if vat_code_record.id is null then
    raise exception 'VAT code % not found', new.vat_code_id;
  end if;

  if vat_code_record.administration_id <> parent_entry.administration_id then
    raise exception 'VAT code does not belong to this administration';
  end if;

  if vat_code_record.is_active is not true then
    raise exception 'VAT code % is inactive', vat_code_record.code;
  end if;

  -- V1-regel:
  -- btw-codes mogen alleen op omzet- of kostenregels.
  -- Tegenrekeningen zoals bank, kas, eigen vermogen, debiteuren, crediteuren
  -- krijgen géén btw-code.
  if ledger_record.account_type not in ('expense', 'revenue') then
    raise exception
      'VAT code % cannot be used on ledger account % (%). Use no VAT code on contra accounts.',
      vat_code_record.code,
      ledger_record.code,
      ledger_record.account_type;
  end if;

  if vat_code_record.direction = 'purchase'
     and ledger_record.account_type <> 'expense' then
    raise exception
      'Purchase VAT code % can only be used on expense accounts',
      vat_code_record.code;
  end if;

  if vat_code_record.direction = 'sales'
     and ledger_record.account_type <> 'revenue' then
    raise exception
      'Sales VAT code % can only be used on revenue accounts',
      vat_code_record.code;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_journal_entry_line_vat_usage_before_write
on public.journal_entry_lines;

create trigger validate_journal_entry_line_vat_usage_before_write
before insert or update on public.journal_entry_lines
for each row execute function public.validate_journal_entry_line_vat_usage();