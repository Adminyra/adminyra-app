import { DashboardPage } from "@/modules/dashboard/DashboardPage";
import { AdminAppShell } from "@/modules/layout/AdminAppShell";

export default function DashboardRoute() {
  return (
    <AdminAppShell>
      <DashboardPage />
    </AdminAppShell>
  );
}