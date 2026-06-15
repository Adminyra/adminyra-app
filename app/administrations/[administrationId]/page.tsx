import { notFound } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdministrationDetailPage } from "@/modules/administrations/AdministrationDetailPage";
import type { AuditLogRow } from "@/modules/administrations/AuditLogSection";
import type { BookkeepingSummaryAccountRow } from "@/modules/administrations/BookkeepingSummarySection";
import type {
  JournalEntryLineRow,
  JournalEntryRow,
} from "@/modules/administrations/JournalSection";
import type { VatCodeRow } from "@/modules/administrations/VatCodesSection";
import { AdminAppShell } from "@/modules/layout/AdminAppShell";

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

type PostedJournalLineRow = {
  ledger_account_id: string;
  debit_amount: number | string | null;
  credit_amount: number | string | null;
};

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function toMoneyNumber(value: number | string | null | undefined) {
  const numberValue = typeof value === "string" ? Number(value) : value ?? 0;

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  return Math.round(numberValue * 100) / 100;
}

function buildBookkeepingSummaryRows({
  ledgerAccounts,
  postedJournalLines,
}: {
  ledgerAccounts: {
    id: string;
    code: string;
    name: string;
    account_type: string;
    normal_balance: string;
  }[];
  postedJournalLines: PostedJournalLineRow[];
}): BookkeepingSummaryAccountRow[] {
  const totalsByLedgerAccount = new Map<
    string,
    {
      debit_total: number;
      credit_total: number;
    }
  >();

  for (const line of postedJournalLines) {
    const current = totalsByLedgerAccount.get(line.ledger_account_id) ?? {
      debit_total: 0,
      credit_total: 0,
    };

    current.debit_total += toMoneyNumber(line.debit_amount);
    current.credit_total += toMoneyNumber(line.credit_amount);

    totalsByLedgerAccount.set(line.ledger_account_id, current);
  }

  return ledgerAccounts
    .map((account) => {
      const totals = totalsByLedgerAccount.get(account.id) ?? {
        debit_total: 0,
        credit_total: 0,
      };

      const debitTotal = Math.round(totals.debit_total * 100) / 100;
      const creditTotal = Math.round(totals.credit_total * 100) / 100;

      return {
        ledger_account_id: account.id,
        account_code: account.code,
        account_name: account.name,
        account_type: account.account_type,
        normal_balance: account.normal_balance,
        debit_total: debitTotal,
        credit_total: creditTotal,
        balance:
          account.normal_balance === "credit"
            ? creditTotal - debitTotal
            : debitTotal - creditTotal,
      };
    })
    .filter((row) => row.debit_total !== 0 || row.credit_total !== 0)
    .sort((a, b) => a.account_code.localeCompare(b.account_code));
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
    auditLogsResult,
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

    supabase
      .from("audit_logs")
      .select(
        "id, administration_id, actor_profile_id, action, entity_table, entity_id, old_data, new_data, ip_address, user_agent, created_at",
      )
      .eq("administration_id", administrationId)
      .order("created_at", { ascending: false })
      .limit(50),
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

  if (auditLogsResult.error) {
    console.error("Load audit logs failed:", auditLogsResult.error);
    loadError = true;
  }

  const fiscalYears = fiscalYearsResult.data ?? [];
  const ledgerAccounts = ledgerAccountsResult.data ?? [];
  const vatCodes = (vatCodesResult.data ?? []) as VatCodeRow[];
  const auditLogs = (auditLogsResult.data ?? []) as AuditLogRow[];
  const journalEntriesData = (journalEntriesResult.data ??
    []) as JournalEntryFromDatabase[];

  let journalLinesData: JournalEntryLineRow[] = [];
  let postedJournalLines: PostedJournalLineRow[] = [];

  const journalEntryIds = journalEntriesData.map((entry) => entry.id);
  const postedJournalEntryIds = journalEntriesData
    .filter((entry) => entry.status === "posted")
    .map((entry) => entry.id);

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

  if (postedJournalEntryIds.length > 0) {
    const { data, error } = await supabase
      .from("journal_entry_lines")
      .select("ledger_account_id, debit_amount, credit_amount")
      .in("journal_entry_id", postedJournalEntryIds);

    if (error) {
      console.error("Load posted journal lines failed:", error);
      loadError = true;
    }

    postedJournalLines = (data ?? []) as PostedJournalLineRow[];
  }

  const bookkeepingSummaryRows = buildBookkeepingSummaryRows({
    ledgerAccounts,
    postedJournalLines,
  });

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
    <AdminAppShell>
      <AdministrationDetailPage
        administration={administration}
        fiscalYears={fiscalYears}
        ledgerAccounts={ledgerAccounts}
        vatCodes={vatCodes}
        journalEntries={journalEntries}
        auditLogs={auditLogs}
        bookkeepingSummaryRows={bookkeepingSummaryRows}
        fiscalYearCreated={
          getSearchValue(resolvedSearchParams.fiscal_year_created) === "1"
        }
        ledgerCreated={getSearchValue(resolvedSearchParams.ledger_created)}
        vatCodesCreated={getSearchValue(resolvedSearchParams.vat_codes_created)}
        error={error}
      />
    </AdminAppShell>
  );
}