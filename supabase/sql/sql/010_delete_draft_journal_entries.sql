create or replace function public.validate_journal_entry_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status <> 'draft' then
    raise exception 'Only draft journal entries can be deleted';
  end if;

  return old;
end;
$$;

drop trigger if exists validate_journal_entry_delete_before_delete
on public.journal_entries;

create trigger validate_journal_entry_delete_before_delete
before delete on public.journal_entries
for each row execute function public.validate_journal_entry_delete();


create or replace function public.delete_draft_journal_entry(
  target_journal_entry_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_entry record;
  deleted_lines jsonb;
begin
  select *
  into deleted_entry
  from public.journal_entries
  where id = target_journal_entry_id
  for update;

  if deleted_entry.id is null then
    raise exception 'Journal entry % not found', target_journal_entry_id;
  end if;

  if deleted_entry.status <> 'draft' then
    raise exception 'Only draft journal entries can be deleted';
  end if;

  if not public.has_administration_role(
    deleted_entry.administration_id,
    array['owner', 'admin', 'bookkeeper']
  ) then
    raise exception 'No access to delete journal entry %', target_journal_entry_id;
  end if;

  select coalesce(jsonb_agg(to_jsonb(line) order by line.line_number), '[]'::jsonb)
  into deleted_lines
  from public.journal_entry_lines line
  where line.journal_entry_id = target_journal_entry_id;

  delete from public.journal_entry_lines
  where journal_entry_id = target_journal_entry_id;

  delete from public.journal_entries
  where id = target_journal_entry_id;

  perform public.write_audit_log(
    deleted_entry.administration_id,
    'journal_entry.deleted',
    'journal_entries',
    target_journal_entry_id::text,
    jsonb_build_object(
      'entry', to_jsonb(deleted_entry),
      'lines', coalesce(deleted_lines, '[]'::jsonb)
    ),
    null
  );
end;
$$;

grant execute on function public.delete_draft_journal_entry(uuid) to authenticated;
