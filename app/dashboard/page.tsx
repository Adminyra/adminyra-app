import { DashboardPage } from "@/modules/dashboard/DashboardPage";
import { AdminAppShell } from "@/modules/layout/AdminAppShell";

export const dynamic = "force-dynamic";

export default function DashboardRoute() {
  return (
    <AdminAppShell>
      <DashboardPage />
    </AdminAppShell>
  );
}