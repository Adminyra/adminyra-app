import { notFound } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdministrationDetailPage } from "@/modules/administrations/AdministrationDetailPage";
import type {
  JournalEntryLineRow,
  JournalEntryRow,
} from "@/modules/administrations/JournalSection";
import type { VatCodeRow } from "@/modules/administrations/VatCodesSection";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    administrationId: string;
  }>;
  searchParams?: Promise<{
    fiscal_year_created?: string;
    ledger_created?: string;
    vat_codes_created?: string;
    journal_created?: string;
    journal_line_created?: string;
    journal_line_deleted?: string;
    journal_deleted?: string;
    journal_posted?: string;
    error?: string;
  }>;
};

type JournalEntryFromDatabase = Omit<JournalEntryRow, "lines">;

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default async function AdministrationDetailRoute({
  params,
  searchParams,
}: PageProps) {
  await requireCurrentUser();

  const supabase = await createSupabaseServerClient();

  const { administrationId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};

  if (!administrationId) {
    notFound();
  }

  const { data: administration, error: administrationError } = await supabase
    .from("administrations")
    .select(
      "id, name, legal_name, chamber_of_commerce_number, vat_number, tax_scheme, status, country_code, currency_code, created_at",
    )
    .eq("id", administrationId)
    .single();

  if (administrationError || !administration) {
    console.error("Load administration detail failed:", administrationError);
    notFound();
  }

  const [
    fiscalYearsResult,
    ledgerAccountsResult,
    vatCodesResult,
    journalEntriesResult,
  ] = await Promise.all([
    supabase
      .from("fiscal_years")
      .select("id, year, start_date, end_date, status, notes, created_at")
      .eq("administration_id", administrationId)
      .order("year", { ascending: false }),

    supabase
      .from("ledger_accounts")
      .select(
        "id, code, name, description, account_type, normal_balance, is_control_account, is_bank_account, is_cash_account, is_vat_account, is_active, created_at",
      )
      .eq("administration_id", administrationId)
      .order("code", { ascending: true }),

    supabase
      .from("vat_codes")
      .select(
        "id, code, name, description, direction, rate_percent, calculation_method, is_reverse_charge, requires_icp_listing, deductibility_percent, payable_ledger_account_id, receivable_ledger_account_id, vat_due_return_section, vat_deductible_return_section, is_active, created_at",
      )
      .eq("administration_id", administrationId)
      .order("direction", { ascending: true })
      .order("code", { ascending: true }),

    supabase
      .from("journal_entries")
      .select(
        "id, fiscal_year_id, entry_number, entry_date, description, reference, source_type, status, total_debit, total_credit, created_at",
      )
      .eq("administration_id", administrationId)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  let loadError = false;

  if (fiscalYearsResult.error) {
    console.error("Load fiscal years failed:", fiscalYearsResult.error);
    loadError = true;
  }

  if (ledgerAccountsResult.error) {
    console.error("Load ledger accounts failed:", ledgerAccountsResult.error);
    loadError = true;
  }

  if (vatCodesResult.error) {
    console.error("Load VAT codes failed:", vatCodesResult.error);
    loadError = true;
  }

  if (journalEntriesResult.error) {
    console.error("Load journal entries failed:", journalEntriesResult.error);
    loadError = true;
  }

  const fiscalYears = fiscalYearsResult.data ?? [];
  const ledgerAccounts = ledgerAccountsResult.data ?? [];
  const vatCodes = (vatCodesResult.data ?? []) as VatCodeRow[];
  const journalEntriesData = (journalEntriesResult.data ??
    []) as JournalEntryFromDatabase[];

  let journalLinesData: JournalEntryLineRow[] = [];

  const journalEntryIds = journalEntriesData.map((entry) => entry.id);

  if (journalEntryIds.length > 0) {
    const { data, error } = await supabase
      .from("journal_entry_lines")
      .select(
        "id, journal_entry_id, line_number, ledger_account_id, vat_code_id, description, debit_amount, credit_amount, amount_excl_vat, vat_amount, amount_incl_vat, created_at",
      )
      .in("journal_entry_id", journalEntryIds)
      .order("line_number", { ascending: true });

    if (error) {
      console.error("Load journal lines failed:", error);
      loadError = true;
    }

    journalLinesData = (data ?? []) as JournalEntryLineRow[];
  }

  const linesByJournalEntry = new Map<string, JournalEntryLineRow[]>(
    journalEntriesData.map((entry) => [entry.id, [] as JournalEntryLineRow[]]),
  );

  for (const line of journalLinesData) {
    const existingLines =
      linesByJournalEntry.get(line.journal_entry_id) ??
      ([] as JournalEntryLineRow[]);

    existingLines.push(line);
    linesByJournalEntry.set(line.journal_entry_id, existingLines);
  }

  const journalEntries: JournalEntryRow[] = journalEntriesData.map((entry) => ({
    ...entry,
    lines: linesByJournalEntry.get(entry.id) ?? [],
  }));

  const queryError = getSearchValue(resolvedSearchParams.error);
  const error = queryError ?? (loadError ? "load-detail" : undefined);

  return (
    <AdministrationDetailPage
      administration={administration}
      fiscalYears={fiscalYears}
      ledgerAccounts={ledgerAccounts}
      vatCodes={vatCodes}
      journalEntries={journalEntries}
      fiscalYearCreated={
        getSearchValue(resolvedSearchParams.fiscal_year_created) === "1"
      }
      ledgerCreated={getSearchValue(resolvedSearchParams.ledger_created)}
      vatCodesCreated={getSearchValue(resolvedSearchParams.vat_codes_created)}
      error={error}
    />
  );
}