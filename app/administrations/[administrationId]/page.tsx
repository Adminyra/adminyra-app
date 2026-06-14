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

  return (
    <AdminAppShell>
      <AdministrationDetailPage
        administration={administration}
        fiscalYears={fiscalYears ?? []}
        fiscalYearCreated={query?.fiscal_year_created === "1"}
        error={query?.error ?? (fiscalYearsError ? "load-years" : undefined)}
      />
    </AdminAppShell>
  );
}