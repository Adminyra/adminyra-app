import { requireCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminAppShell } from "@/modules/layout/AdminAppShell";
import { AdministrationsPage } from "@/modules/administrations/AdministrationsPage";

type AdministrationsRouteProps = {
  searchParams?: Promise<{
    created?: string;
    error?: string;
  }>;
};

export default async function AdministrationsRoute({
  searchParams,
}: AdministrationsRouteProps) {
  await requireCurrentUser();

  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("administrations")
    .select(
      "id, name, legal_name, chamber_of_commerce_number, vat_number, tax_scheme, status, country_code, currency_code, created_at",
    )
    .order("created_at", { ascending: false });

  return (
    <AdminAppShell>
      <AdministrationsPage
        administrations={data ?? []}
        created={params?.created === "1"}
        error={params?.error ?? (error ? "load" : undefined)}
      />
    </AdminAppShell>
  );
}