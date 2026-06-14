"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createDefaultVatCodesAction(formData: FormData) {
  await requireCurrentUser();

  const administrationId = String(formData.get("administration_id") ?? "");

  if (!administrationId) {
    redirect("/administrations?error=missing-administration");
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("create_default_vat_codes", {
    target_administration_id: administrationId,
  });

  if (error) {
    console.error("Create default VAT codes failed:", error);
    redirect(`/administrations/${administrationId}?error=create-vat-codes`);
  }

  revalidatePath(`/administrations/${administrationId}`);
  redirect(`/administrations/${administrationId}?vat_codes_created=${data ?? 0}`);
}