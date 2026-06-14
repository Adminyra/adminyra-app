import { notFound } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdministrationDetailPage } from "@/modules/administrations/AdministrationDetailPage";
import { AdminAppShell } from "@/modules/layout/AdminAppShell";

export const dynamic = "force-dynamic";

type AdministrationDetailRouteProps = {
  params: Promise<{
    administrationId: string;
  }>;
  searchParams?: Promise<{
    fiscal_year_created?: string;
    ledger_created?: string;
    vat_codes_created?: string;
    error?: string;
  }>;
};

export default async function AdministrationDetailRoute({
  params,
  searchParams,
}: AdministrationDetailRouteProps) {
  await requireCurrentUser();

  const { administrationId } = await params;
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: administration, error: administrationError } = await supabase
    .from("administrations")
    .select(
      "id, name, legal_name, chamber_of_commerce_number, vat_number, tax_scheme, status, country_code, currency_code, created_at",
    )
    .eq("id", administrationId)
    .single();

  if (administrationError || !administration) {
    notFound();
  }

  const { data: fiscalYears, error: fiscalYearsError } = await supabase
    .from("fiscal_years")
    .select("id, year, start_date, end_date, status, notes, created_at")
    .eq("administration_id", administrationId)
    .order("year", { ascending: false });

  const { data: ledgerAccounts, error: ledgerAccountsError } = await supabase
    .from("ledger_accounts")
    .select(
      "id, code, name, description, account_type, normal_balance, is_control_account, is_bank_account, is_cash_account, is_vat_account, is_active, created_at",
    )
    .eq("administration_id", administrationId)
    .order("code", { ascending: true });

  const { data: vatCodes, error: vatCodesError } = await supabase
    .from("vat_codes")
    .select(
      "id, code, name, description, direction, rate_percent, calculation_method, vat_due_return_section, vat_deductible_return_section, is_reverse_charge, requires_icp_listing, deductibility_percent, is_active",
    )
    .eq("administration_id", administrationId)
    .order("code", { ascending: true });

  const { data: journalEntriesData, error: journalEntriesError } = await supabase
    .from("journal_entries")
    .select(
      "id, fiscal_year_id, entry_number, entry_date, description, reference, source_type, status, total_debit, total_credit, created_at",
    )
    .eq("administration_id", administrationId)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(25);

  const journalEntryIds = (journalEntriesData ?? []).map((entry) => entry.id);

  const { data: journalLinesData, error: journalLinesError } =
    journalEntryIds.length > 0
      ? await supabase
          .from("journal_entry_lines")
          .select(
            "id, journal_entry_id, line_number, ledger_account_id, vat_code_id, description, debit_amount, credit_amount, amount_excl_vat, vat_amount, amount_incl_vat, created_at",
          )
          .in("journal_entry_id", journalEntryIds)
          .order("line_number", { ascending: true })
      : { data: [], error: null };

  const linesByJournalEntry = new Map<
    string,
    NonNullable<typeof journalLinesData>
  >();

  for (const line of journalLinesData ?? []) {
    const existingLines = linesByJournalEntry.get(line.journal_entry_id) ?? [];
    existingLines.push(line);
    linesByJournalEntry.set(line.journal_entry_id, existingLines);
  }

  const journalEntries = (journalEntriesData ?? []).map((entry) => ({
    ...entry,
    lines: linesByJournalEntry.get(entry.id) ?? [],
  }));

  return (
    <AdminAppShell>
      <AdministrationDetailPage
        administration={administration}
        fiscalYears={fiscalYears ?? []}
        ledgerAccounts={ledgerAccounts ?? []}
        vatCodes={vatCodes ?? []}
        journalEntries={journalEntries}
        fiscalYearCreated={query?.fiscal_year_created === "1"}
        ledgerCreated={query?.ledger_created}
        vatCodesCreated={query?.vat_codes_created}
        error={
          query?.error ??
          (fiscalYearsError ||
          ledgerAccountsError ||
          vatCodesError ||
          journalEntriesError ||
          journalLinesError
            ? "load-detail"
            : undefined)
        }
      />
    </AdminAppShell>
  );
}