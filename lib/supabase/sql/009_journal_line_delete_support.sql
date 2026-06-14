create or replace function public.validate_journal_entry_line_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_status text;
begin
  select status
  into parent_status
  from public.journal_entries
  where id = old.journal_entry_id;

  if parent_status <> 'draft' then
    raise exception 'Only lines from draft journal entries can be deleted';
  end if;

  return old;
end;
$$;

drop trigger if exists validate_journal_entry_line_delete_before_delete
on public.journal_entry_lines;

create trigger validate_journal_entry_line_delete_before_delete
before delete on public.journal_entry_lines
for each row execute function public.validate_journal_entry_line_delete();


create or replace function public.delete_journal_entry_line(
  target_journal_entry_line_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_line record;
  target_journal_entry_id uuid;
begin
  select
    line.*,
    entry.status as journal_entry_status
  into deleted_line
  from public.journal_entry_lines line
  join public.journal_entries entry on entry.id = line.journal_entry_id
  where line.id = target_journal_entry_line_id
  for update of line;

  if deleted_line.id is null then
    raise exception 'Journal entry line % not found', target_journal_entry_line_id;
  end if;

  if deleted_line.journal_entry_status <> 'draft' then
    raise exception 'Only lines from draft journal entries can be deleted';
  end if;

  if not public.has_administration_role(
    deleted_line.administration_id,
    array['owner', 'admin', 'bookkeeper']
  ) then
    raise exception 'No access to delete journal entry line %', target_journal_entry_line_id;
  end if;

  target_journal_entry_id = deleted_line.journal_entry_id;

  delete from public.journal_entry_lines
  where id = target_journal_entry_line_id;

  with ordered_lines as (
    select
      id,
      row_number() over (
        order by line_number asc, created_at asc, id asc
      )::integer as new_line_number
    from public.journal_entry_lines
    where journal_entry_id = target_journal_entry_id
  )
  update public.journal_entry_lines line
  set
    line_number = ordered_lines.new_line_number,
    updated_at = now()
  from ordered_lines
  where line.id = ordered_lines.id
    and line.line_number <> ordered_lines.new_line_number;

  perform public.recalculate_journal_entry_totals(target_journal_entry_id);

  perform public.write_audit_log(
    deleted_line.administration_id,
    'journal_entry_line.deleted',
    'journal_entry_lines',
    target_journal_entry_line_id::text,
    to_jsonb(deleted_line),
    null
  );
end;
$$;

grant execute on function public.delete_journal_entry_line(uuid) to authenticated;
