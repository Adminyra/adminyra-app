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
        is_active: boolean;
      }
    | null = null;

  if (vatCodeId) {
    const { data: vatCodeData, error: vatCodeError } = await supabase
      .from("vat_codes")
      .select("id, administration_id, code, name, direction, is_active")
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

  const errorMessage = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();

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