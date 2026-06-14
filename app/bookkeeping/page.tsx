import { AdminAppShell } from "@/modules/layout/AdminAppShell";
import { PlaceholderPage } from "@/modules/shared/PlaceholderPage";

export const dynamic = "force-dynamic";

export default function BookkeepingRoute() {
  return (
    <AdminAppShell>
      <PlaceholderPage
        eyebrow="Adminyra Boekhoudapp"
        title="Boekhouding"
        description="Hier bouwen we de kern van de boekhoudapp: RGS-grootboek, journaalposten, btw, bankregels en controles."
        items={[
          "RGS-grootboek",
          "Journaalposten",
          "Btw-codes",
          "Bankregels",
          "Controlepunten",
          "Volledige traceerbaarheid",
        ]}
      />
    </AdminAppShell>
  );
}