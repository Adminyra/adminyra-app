"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function parseMoney(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "")
    .trim()
    .replace(",", ".");

  const amount = Number.parseFloat(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 100) / 100;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function getSupabaseErrorText(error: { message?: string; details?: string } | null) {
  return `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
}

function toMoneyNumber(value: number | string | null | undefined) {
  const numberValue = typeof value === "string" ? Number(value) : value ?? 0;

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  return Math.round(numberValue * 100) / 100;
}

type CorrectionJournalLine = {
  id: string;
  line_number: number;
  ledger_account_id: string;
  vat_code_id: string | null;
  description: string | null;
  debit_amount: number | string;
  credit_amount: number | string;
  amount_excl_vat: number | string | null;
  vat_amount: number | string | null;
  amount_incl_vat: number | string | null;
};

export async function createManualJournalEntryAction(formData: FormData) {
  await requireCurrentUser();

  const supabase = await createSupabaseServerClient();

  const administrationId = String(formData.get("administration_id") ?? "");
  const fiscalYearId = String(formData.get("fiscal_year_id") ?? "");
  const entryDate = String(formData.get("entry_date") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const reference = String(formData.get("reference") ?? "").trim();

  const redirectBase = `/administrations/${administrationId}`;

  if (!administrationId || !fiscalYearId || !entryDate || !description) {
    redirect(`${redirectBase}?error=create-journal`);
  }

  const insertPayload = {
    administration_id: administrationId,
    fiscal_year_id: fiscalYearId,
    entry_date: entryDate,
    description,
    reference: reference || null,
    source_type: "manual",
    status: "draft",
  };

  const { data, error } = await supabase
    .from("journal_entries")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !data) {
    console.error("Create journal entry failed:", error);
    redirect(`${redirectBase}?error=create-journal`);
  }

  await supabase.rpc("write_audit_log", {
    p_administration_id: administrationId,
    p_action: "journal_entry.created",
    p_entity_table: "journal_entries",
    p_entity_id: data.id,
    p_old_data: null,
    p_new_data: insertPayload,
  });

  revalidatePath(redirectBase);
  redirect(`${redirectBase}?journal_created=1`);
}

export async function addJournalEntryLineAction(formData: FormData) {
  await requireCurrentUser();

  const supabase = await createSupabaseServerClient();

  const administrationId = String(formData.get("administration_id") ?? "");
  const journalEntryId = String(formData.get("journal_entry_id") ?? "");
  const ledgerAccountId = String(formData.get("ledger_account_id") ?? "");
  const vatCodeId = String(formData.get("vat_code_id") ?? "");
  const side = String(formData.get("side") ?? "");
  const amount = parseMoney(formData.get("amount"));
  const description = String(formData.get("description") ?? "").trim();

  const redirectBase = `/administrations/${administrationId}`;

  if (!administrationId || !journalEntryId || !ledgerAccountId || !amount) {
    redirect(`${redirectBase}?error=create-journal-line`);
  }

  if (side !== "debit" && side !== "credit") {
    redirect(`${redirectBase}?error=create-journal-line`);
  }

  const { data: entry, error: entryError } = await supabase
    .from("journal_entries")
    .select("id, administration_id, fiscal_year_id, status")
    .eq("id", journalEntryId)
    .single();

  if (entryError || !entry || entry.status !== "draft") {
    console.error("Load journal entry for line failed:", entryError);
    redirect(`${redirectBase}?error=create-journal-line`);
  }

  const { data: ledgerAccount, error: ledgerAccountError } = await supabase
    .from("ledger_accounts")
    .select("id, administration_id, code, name, account_type, is_active")
    .eq("id", ledgerAccountId)
    .single();

  if (
    ledgerAccountError ||
    !ledgerAccount ||
    ledgerAccount.administration_id !== entry.administration_id ||
    !ledgerAccount.is_active
  ) {
    console.error("Invalid ledger account for journal line:", ledgerAccountError);
    redirect(`${redirectBase}?error=create-journal-line`);
  }

  let vatCode:
    | {
        id: string;
        administration_id: string;
        code: string;
        name: string;
        direction: string;
        rate_percent: number | string;
        calculation_method: string;
        is_active: boolean;
        payable_ledger_account_id: string | null;
        receivable_ledger_account_id: string | null;
      }
    | null = null;

  if (vatCodeId) {
    const { data: vatCodeData, error: vatCodeError } = await supabase
      .from("vat_codes")
      .select(
        "id, administration_id, code, name, direction, rate_percent, calculation_method, is_active, payable_ledger_account_id, receivable_ledger_account_id",
      )
      .eq("id", vatCodeId)
      .single();

    if (
      vatCodeError ||
      !vatCodeData ||
      vatCodeData.administration_id !== entry.administration_id ||
      !vatCodeData.is_active
    ) {
      console.error("Invalid VAT code for journal line:", vatCodeError);
      redirect(`${redirectBase}?error=create-journal-line`);
    }

    vatCode = vatCodeData;

    if (!["expense", "revenue"].includes(ledgerAccount.account_type)) {
      redirect(`${redirectBase}?error=invalid-vat-usage`);
    }

    if (
      vatCode.direction === "purchase" &&
      ledgerAccount.account_type !== "expense"
    ) {
      redirect(`${redirectBase}?error=invalid-vat-usage`);
    }

    if (
      vatCode.direction === "sales" &&
      ledgerAccount.account_type !== "revenue"
    ) {
      redirect(`${redirectBase}?error=invalid-vat-usage`);
    }
  }

  const { data: lastLine } = await supabase
    .from("journal_entry_lines")
    .select("line_number")
    .eq("journal_entry_id", journalEntryId)
    .order("line_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextLineNumber = Number(lastLine?.line_number ?? 0) + 1;

  const shouldSplitVat =
    vatCode &&
    vatCode.calculation_method === "percentage" &&
    Number(vatCode.rate_percent) > 0;

  if (shouldSplitVat && vatCode) {
    const rate = Number(vatCode.rate_percent);
    const grossAmount = amount;
    const vatAmount = roundMoney((grossAmount * rate) / (100 + rate));
    const netAmount = roundMoney(grossAmount - vatAmount);

    const vatLedgerAccountId =
      vatCode.direction === "purchase"
        ? vatCode.receivable_ledger_account_id
        : vatCode.payable_ledger_account_id;

    if (!vatLedgerAccountId) {
      redirect(`${redirectBase}?error=missing-vat-ledger-account`);
    }

    const mainLinePayload = {
      journal_entry_id: journalEntryId,
      administration_id: entry.administration_id,
      fiscal_year_id: entry.fiscal_year_id,
      line_number: nextLineNumber,
      ledger_account_id: ledgerAccountId,
      vat_code_id: vatCode.id,
      description: description || null,
      debit_amount: side === "debit" ? netAmount : 0,
      credit_amount: side === "credit" ? netAmount : 0,
      amount_excl_vat: netAmount,
      vat_amount: vatAmount,
      amount_incl_vat: grossAmount,
    };

    const vatLinePayload = {
      journal_entry_id: journalEntryId,
      administration_id: entry.administration_id,
      fiscal_year_id: entry.fiscal_year_id,
      line_number: nextLineNumber + 1,
      ledger_account_id: vatLedgerAccountId,
      vat_code_id: null,
      description: `Btw ${vatCode.code}`,
      debit_amount: side === "debit" ? vatAmount : 0,
      credit_amount: side === "credit" ? vatAmount : 0,
      amount_excl_vat: vatAmount,
      vat_amount: 0,
      amount_incl_vat: vatAmount,
    };

    const { error } = await supabase
      .from("journal_entry_lines")
      .insert([mainLinePayload, vatLinePayload]);

    if (error) {
      console.error("Create VAT split journal lines failed:", error);

      const errorMessage = getSupabaseErrorText(error);

      if (
        errorMessage.includes("vat code") ||
        errorMessage.includes("purchase vat code") ||
        errorMessage.includes("sales vat code") ||
        errorMessage.includes("contra accounts")
      ) {
        redirect(`${redirectBase}?error=invalid-vat-usage`);
      }

      redirect(`${redirectBase}?error=create-journal-line`);
    }

    revalidatePath(redirectBase);
    redirect(`${redirectBase}?journal_line_created=1`);
  }

  const insertPayload = {
    journal_entry_id: journalEntryId,
    administration_id: entry.administration_id,
    fiscal_year_id: entry.fiscal_year_id,
    line_number: nextLineNumber,
    ledger_account_id: ledgerAccountId,
    vat_code_id: vatCodeId || null,
    description: description || null,
    debit_amount: side === "debit" ? amount : 0,
    credit_amount: side === "credit" ? amount : 0,
    vat_amount: 0,
  };

  const { error } = await supabase
    .from("journal_entry_lines")
    .insert(insertPayload);

  if (error) {
    console.error("Create journal entry line failed:", error);

    const errorMessage = getSupabaseErrorText(error);

    if (
      errorMessage.includes("vat code") ||
      errorMessage.includes("purchase vat code") ||
      errorMessage.includes("sales vat code") ||
      errorMessage.includes("contra accounts")
    ) {
      redirect(`${redirectBase}?error=invalid-vat-usage`);
    }

    redirect(`${redirectBase}?error=create-journal-line`);
  }

  revalidatePath(redirectBase);
  redirect(`${redirectBase}?journal_line_created=1`);
}

export async function deleteJournalEntryLineAction(formData: FormData) {
  await requireCurrentUser();

  const supabase = await createSupabaseServerClient();

  const administrationId = String(formData.get("administration_id") ?? "");
  const journalEntryLineId = String(formData.get("journal_entry_line_id") ?? "");

  const redirectBase = `/administrations/${administrationId}`;

  if (!administrationId || !journalEntryLineId) {
    redirect(`${redirectBase}?error=delete-journal-line`);
  }

  const { error } = await supabase.rpc("delete_journal_entry_line", {
    target_journal_entry_line_id: journalEntryLineId,
  });

  if (error) {
    console.error("Delete journal entry line failed:", error);
    redirect(`${redirectBase}?error=delete-journal-line`);
  }

  revalidatePath(redirectBase);
  redirect(`${redirectBase}?journal_line_deleted=1`);
}

export async function deleteDraftJournalEntryAction(formData: FormData) {
  await requireCurrentUser();

  const supabase = await createSupabaseServerClient();

  const administrationId = String(formData.get("administration_id") ?? "");
  const journalEntryId = String(formData.get("journal_entry_id") ?? "");

  const redirectBase = `/administrations/${administrationId}`;

  if (!administrationId || !journalEntryId) {
    redirect(`${redirectBase}?error=delete-journal-entry`);
  }

  const { error } = await supabase.rpc("delete_draft_journal_entry", {
    target_journal_entry_id: journalEntryId,
  });

  if (error) {
    console.error("Delete draft journal entry failed:", error);
    redirect(`${redirectBase}?error=delete-journal-entry`);
  }

  revalidatePath(redirectBase);
  redirect(`${redirectBase}?journal_deleted=1`);
}

export async function createCorrectionJournalEntryAction(formData: FormData) {
  await requireCurrentUser();

  const supabase = await createSupabaseServerClient();

  const administrationId = String(formData.get("administration_id") ?? "");
  const journalEntryId = String(formData.get("journal_entry_id") ?? "");

  const redirectBase = `/administrations/${administrationId}`;

  if (!administrationId || !journalEntryId) {
    redirect(`${redirectBase}?error=create-correction-journal`);
  }

  const { data: originalEntry, error: originalEntryError } = await supabase
    .from("journal_entries")
    .select(
      "id, administration_id, fiscal_year_id, entry_number, entry_date, description, reference, status",
    )
    .eq("id", journalEntryId)
    .single();

  if (
    originalEntryError ||
    !originalEntry ||
    originalEntry.administration_id !== administrationId ||
    originalEntry.status !== "posted"
  ) {
    console.error("Load posted journal entry for correction failed:", originalEntryError);
    redirect(`${redirectBase}?error=create-correction-journal`);
  }

  const { data: originalLinesData, error: originalLinesError } = await supabase
    .from("journal_entry_lines")
    .select(
      "id, line_number, ledger_account_id, vat_code_id, description, debit_amount, credit_amount, amount_excl_vat, vat_amount, amount_incl_vat",
    )
    .eq("journal_entry_id", journalEntryId)
    .order("line_number", { ascending: true });

  if (originalLinesError) {
    console.error("Load posted journal lines for correction failed:", originalLinesError);
    redirect(`${redirectBase}?error=create-correction-journal`);
  }

  const originalLines = (originalLinesData ?? []) as CorrectionJournalLine[];

  if (originalLines.length === 0) {
    redirect(`${redirectBase}?error=create-correction-journal`);
  }

  const originalLabel = originalEntry.entry_number
    ? `journaalpost ${originalEntry.entry_number}`
    : "geposte boeking";

  const today = new Date().toISOString().slice(0, 10);

  const correctionEntryPayload = {
    administration_id: originalEntry.administration_id,
    fiscal_year_id: originalEntry.fiscal_year_id,
    entry_date: today,
    description: `Correctie op ${originalLabel}: ${originalEntry.description}`,
    reference: originalEntry.reference
      ? `Correctie op ${originalEntry.reference}`
      : `Correctie op ${originalLabel}`,
    source_type: "manual",
    status: "draft",
  };

  const { data: correctionEntry, error: correctionEntryError } = await supabase
    .from("journal_entries")
    .insert(correctionEntryPayload)
    .select("id")
    .single();

  if (correctionEntryError || !correctionEntry) {
    console.error("Create correction journal entry failed:", correctionEntryError);
    redirect(`${redirectBase}?error=create-correction-journal`);
  }

  const correctionLinesPayload = originalLines.map((line) => {
    const originalDebit = toMoneyNumber(line.debit_amount);
    const originalCredit = toMoneyNumber(line.credit_amount);

    return {
      journal_entry_id: correctionEntry.id,
      administration_id: originalEntry.administration_id,
      fiscal_year_id: originalEntry.fiscal_year_id,
      line_number: line.line_number,
      ledger_account_id: line.ledger_account_id,
      vat_code_id: line.vat_code_id,
      description: line.description
        ? `Correctie: ${line.description}`
        : `Correctie regel ${line.line_number}`,
      debit_amount: originalCredit,
      credit_amount: originalDebit,
      amount_excl_vat: toMoneyNumber(line.amount_excl_vat),
      vat_amount: toMoneyNumber(line.vat_amount),
      amount_incl_vat: toMoneyNumber(line.amount_incl_vat),
    };
  });

  const { error: correctionLinesError } = await supabase
    .from("journal_entry_lines")
    .insert(correctionLinesPayload);

  if (correctionLinesError) {
    console.error("Create correction journal lines failed:", correctionLinesError);

    await supabase.rpc("delete_draft_journal_entry", {
      target_journal_entry_id: correctionEntry.id,
    });

    redirect(`${redirectBase}?error=create-correction-journal`);
  }

  await supabase.rpc("write_audit_log", {
    p_administration_id: originalEntry.administration_id,
    p_action: "journal_entry.correction_created",
    p_entity_table: "journal_entries",
    p_entity_id: correctionEntry.id,
    p_old_data: {
      corrected_journal_entry_id: originalEntry.id,
      corrected_entry_number: originalEntry.entry_number,
    },
    p_new_data: correctionEntryPayload,
  });

  revalidatePath(redirectBase);
  redirect(`${redirectBase}?journal_created=1`);
}

export async function postJournalEntryAction(formData: FormData) {
  await requireCurrentUser();

  const supabase = await createSupabaseServerClient();

  const administrationId = String(formData.get("administration_id") ?? "");
  const journalEntryId = String(formData.get("journal_entry_id") ?? "");

  const redirectBase = `/administrations/${administrationId}`;

  if (!administrationId || !journalEntryId) {
    redirect(`${redirectBase}?error=post-journal`);
  }

  const { data, error } = await supabase.rpc("post_journal_entry", {
    target_journal_entry_id: journalEntryId,
  });

  if (error) {
    console.error("Post journal entry failed:", error);
    redirect(`${redirectBase}?error=post-journal`);
  }

  revalidatePath(redirectBase);
  redirect(`${redirectBase}?journal_posted=${data ?? ""}`);
}
