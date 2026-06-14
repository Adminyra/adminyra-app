"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function isValidDateInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function createFiscalYearAction(formData: FormData) {
  await requireCurrentUser();

  const supabase = await createSupabaseServerClient();

  const administrationId = String(formData.get("administration_id") ?? "");
  const yearInput = String(formData.get("year") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDate = String(formData.get("end_date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const redirectBase = `/administrations/${administrationId}`;

  const year = Number.parseInt(yearInput, 10);

  if (!administrationId || !year || year < 1900 || year > 2200) {
    redirect(`${redirectBase}?error=invalid-year`);
  }

  if (!isValidDateInput(startDate) || !isValidDateInput(endDate)) {
    redirect(`${redirectBase}?error=invalid-dates`);
  }

  if (startDate > endDate) {
    redirect(`${redirectBase}?error=invalid-date-order`);
  }

  const insertPayload = {
    administration_id: administrationId,
    year,
    start_date: startDate,
    end_date: endDate,
    status: "open",
    notes: notes || null,
  };

  const { data, error } = await supabase
    .from("fiscal_years")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !data) {
    console.error("Create fiscal year failed:", error);

    if (error?.code === "23505") {
      redirect(`${redirectBase}?error=duplicate-year`);
    }

    redirect(`${redirectBase}?error=create-year`);
  }

  const { error: auditError } = await supabase.rpc("write_audit_log", {
    p_administration_id: administrationId,
    p_action: "fiscal_year.created",
    p_entity_table: "fiscal_years",
    p_entity_id: data.id,
    p_old_data: null,
    p_new_data: insertPayload,
  });

  if (auditError) {
    console.error("Create fiscal year audit log failed:", auditError);
  }

  revalidatePath(redirectBase);
  redirect(`${redirectBase}?fiscal_year_created=1`);
}