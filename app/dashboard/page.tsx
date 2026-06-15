import { requireCurrentUser } from "@/lib/auth/session";
import { DashboardPage } from "@/modules/dashboard/DashboardPage";
import { AdminAppShell } from "@/modules/layout/AdminAppShell";

export const dynamic = "force-dynamic";

export default async function DashboardRoute() {
  await requireCurrentUser();

  return (
    <AdminAppShell>
      <DashboardPage />
    </AdminAppShell>
  );
}