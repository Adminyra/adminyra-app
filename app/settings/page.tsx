import { AdminAppShell } from "@/modules/layout/AdminAppShell";
import { PlaceholderPage } from "@/modules/shared/PlaceholderPage";

export default function SettingsRoute() {
  return (
    <AdminAppShell>
      <PlaceholderPage
        eyebrow="Adminyra Boekhoudapp"
        title="Instellingen"
        description="Hier komen later algemene app-instellingen, rollen, beveiliging, btw-standaarden en boekhoudinstellingen."
        items={[
          "Rollen en rechten",
          "Beveiliging",
          "Btw-standaarden",
          "RGS-instellingen",
          "Audit log instellingen",
          "Portaalinstellingen",
        ]}
      />
    </AdminAppShell>
  );
}