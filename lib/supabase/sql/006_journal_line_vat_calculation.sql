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
    new.amount_excl_vat = null;
    new.vat_amount = 0;
    new.amount_incl_vat = null;
    return new;
  end if;

  if new.vat_code_id is null then
    new.amount_excl_vat = base_amount;
    new.vat_amount = 0;
    new.amount_incl_vat = base_amount;
    return new;
  end if;

  select
    code,
    direction,
    rate_percent,
    calculation_method,
    is_reverse_charge,
    deductibility_percent
  into vat_code_record
  from public.vat_codes
  where id = new.vat_code_id;

  if vat_code_record.id is null then
    raise exception 'VAT code % not found', new.vat_code_id;
  end if;

  if vat_code_record.calculation_method = 'percentage'
     and vat_code_record.rate_percent > 0 then
    -- Normale btw: ingevoerd bedrag behandelen we als inclusief btw.
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
    -- Verlegde btw: factuurbedrag is meestal exclusief btw,
    -- btw wordt berekend voor aangifte/controle maar verhoogt het factuurbedrag niet.
    calculated_vat = round(
      base_amount * vat_code_record.rate_percent / 100,
      2
    );

    new.amount_excl_vat = base_amount;
    new.vat_amount = calculated_vat;
    new.amount_incl_vat = base_amount;

    return new;
  end if;

  -- 0%, vrijgesteld, KOR, geen btw.
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