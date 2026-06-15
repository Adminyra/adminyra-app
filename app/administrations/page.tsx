import { requireCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdministrationsPage } from "@/modules/administrations/AdministrationsPage";
import { AdminAppShell } from "@/modules/layout/AdminAppShell";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    created?: string;
    error?: string;
  }>;
};

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default async function AdministrationsRoute({
  searchParams,
}: PageProps) {
  await requireCurrentUser();

  const supabase = await createSupabaseServerClient();
  const resolvedSearchParams = (await searchParams) ?? {};

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
        created={getSearchValue(resolvedSearchParams.created) === "1"}
        error={getSearchValue(resolvedSearchParams.error) ?? (error ? "load" : undefined)}
      />
    </AdminAppShell>
  );
}