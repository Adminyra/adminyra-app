"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedTaxSchemes = ["vat", "kor", "exempt"] as const;

export async function createAdministrationAction(formData: FormData) {
  const user = await requireCurrentUser();
  const supabase = await createSupabaseServerClient();

  const name = String(formData.get("name") ?? "").trim();
  const legalName = String(formData.get("legal_name") ?? "").trim();
  const chamberOfCommerceNumber = String(
    formData.get("chamber_of_commerce_number") ?? "",
  ).trim();
  const vatNumber = String(formData.get("vat_number") ?? "").trim();
  const taxSchemeInput = String(formData.get("tax_scheme") ?? "vat");

  const taxScheme = allowedTaxSchemes.includes(
    taxSchemeInput as (typeof allowedTaxSchemes)[number],
  )
    ? taxSchemeInput
    : "vat";

  if (!name) {
    redirect("/administrations?error=missing-name");
  }

  const insertPayload = {
    owner_profile_id: user.id,
    name,
    legal_name: legalName || null,
    chamber_of_commerce_number: chamberOfCommerceNumber || null,
    vat_number: vatNumber || null,
    tax_scheme: taxScheme,
    country_code: "NL",
    currency_code: "EUR",
    status: "active",
  };

  const { data, error } = await supabase
    .from("administrations")
    .insert(insertPayload)
    .select("id, name")
    .single();

  if (error || !data) {
    console.error("Create administration failed:", error);
    redirect("/administrations?error=create");
  }

  const { error: membershipError } = await supabase
    .from("administration_memberships")
    .upsert(
      {
        administration_id: data.id,
        profile_id: user.id,
        role: "owner",
        is_active: true,
      },
      {
        onConflict: "administration_id,profile_id",
      },
    );

  if (membershipError) {
    console.error("Create administration membership failed:", membershipError);
  }

  const { error: auditError } = await supabase.rpc("write_audit_log", {
    p_administration_id: data.id,
    p_action: "administration.created",
    p_entity_table: "administrations",
    p_entity_id: data.id,
    p_old_data: null,
    p_new_data: insertPayload,
  });

  if (auditError) {
    console.error("Create administration audit log failed:", auditError);
  }

  revalidatePath("/administrations");
  redirect("/administrations?created=1");
}