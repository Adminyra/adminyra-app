-- Adminyra Boekhoudapp - btw-split ondersteuning voor journaalregels
-- Doel:
-- 1. Bestaande btw-codes koppelen aan 1500/1610 als dat nog ontbreekt.
-- 2. De btw-trigger laat correcte vooraf berekende splitregels toe.
-- 3. Normale regels zonder vooraf berekende bedragen blijven automatisch rekenen.

update public.vat_codes vc
set receivable_ledger_account_id = la.id
from public.ledger_accounts la
where la.administration_id = vc.administration_id
  and la.code = '1500'
  and vc.vat_deductible_return_section is not null
  and vc.receivable_ledger_account_id is null;

update public.vat_codes vc
set payable_ledger_account_id = la.id
from public.ledger_accounts la
where la.administration_id = vc.administration_id
  and la.code = '1610'
  and vc.vat_due_return_section is not null
  and vc.payable_ledger_account_id is null;

create or replace function public.calculate_journal_entry_line_vat_amounts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_amount numeric(14,2);
  vat_code_record record;
  calculated_vat numeric(14,2);
begin
  base_amount = case
    when new.debit_amount > 0 then new.debit_amount
    else new.credit_amount
  end;

  if base_amount is null or base_amount <= 0 then
    new.amount_excl_vat = 0;
    new.vat_amount = 0;
    new.amount_incl_vat = 0;
    return new;
  end if;

  if new.vat_code_id is null then
    new.amount_excl_vat = base_amount;
    new.vat_amount = 0;
    new.amount_incl_vat = base_amount;
    return new;
  end if;

  select
    id,
    code,
    rate_percent,
    calculation_method
  into vat_code_record
  from public.vat_codes
  where id = new.vat_code_id;

  if vat_code_record.id is null then
    raise exception 'VAT code % not found', new.vat_code_id;
  end if;

  if vat_code_record.calculation_method = 'percentage'
     and vat_code_record.rate_percent > 0 then

    -- Als de applicatie bewust een btw-splitregel aanmaakt:
    -- debit/credit = exclusief bedrag
    -- amount_excl_vat = exclusief bedrag
    -- vat_amount = btw-bedrag
    -- amount_incl_vat = originele bedrag inclusief btw
    --
    -- Deze branch accepteert alleen als de bedragen logisch kloppen.
    if new.amount_excl_vat is not null
       and new.vat_amount is not null
       and new.amount_incl_vat is not null
       and abs(new.amount_excl_vat - base_amount) <= 0.01
       and abs((new.amount_excl_vat + new.vat_amount) - new.amount_incl_vat) <= 0.01
       and abs(
         round(
           new.amount_incl_vat * vat_code_record.rate_percent / (100 + vat_code_record.rate_percent),
           2
         ) - new.vat_amount
       ) <= 0.01 then
      return new;
    end if;

    -- Normale invoer: ingevoerd bedrag behandelen als inclusief btw.
    calculated_vat = round(
      base_amount * vat_code_record.rate_percent / (100 + vat_code_record.rate_percent),
      2
    );

    new.amount_incl_vat = base_amount;
    new.vat_amount = calculated_vat;
    new.amount_excl_vat = base_amount - calculated_vat;

    return new;
  end if;

  if vat_code_record.calculation_method = 'reverse_charge'
     and vat_code_record.rate_percent > 0 then
    calculated_vat = round(
      base_amount * vat_code_record.rate_percent / 100,
      2
    );

    new.amount_excl_vat = base_amount;
    new.vat_amount = calculated_vat;
    new.amount_incl_vat = base_amount;

    return new;
  end if;

  new.amount_excl_vat = base_amount;
  new.vat_amount = 0;
  new.amount_incl_vat = base_amount;

  return new;
end;
$$;

drop trigger if exists calculate_journal_entry_line_vat_before_write
on public.journal_entry_lines;

create trigger calculate_journal_entry_line_vat_before_write
before insert or update on public.journal_entry_lines
for each row execute function public.calculate_journal_entry_line_vat_amounts();