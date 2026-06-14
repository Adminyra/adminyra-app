"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createDefaultLedgerAccountsAction(formData: FormData) {
  await requireCurrentUser();

  const administrationId = String(formData.get("administration_id") ?? "");

  if (!administrationId) {
    redirect("/administrations?error=missing-administration");
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("create_default_ledger_accounts", {
    target_administration_id: administrationId,
  });

  if (error) {
    console.error("Create default ledger accounts failed:", error);
    redirect(`/administrations/${administrationId}?error=create-ledger`);
  }

  revalidatePath(`/administrations/${administrationId}`);
  redirect(`/administrations/${administrationId}?ledger_created=${data ?? 0}`);
}