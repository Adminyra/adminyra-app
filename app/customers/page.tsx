import { AdminAppShell } from "@/modules/layout/AdminAppShell";
import { PlaceholderPage } from "@/modules/shared/PlaceholderPage";

export default function CustomersRoute() {
  return (
    <AdminAppShell>
      <PlaceholderPage
        eyebrow="Adminyra Boekhoudapp"
        title="Klanten"
        description="Hier komt het klantenoverzicht voor Adminyra, inclusief contactgegevens, administraties, dossiers en status."
        items={[
          "Klantprofielen",
          "Contactgegevens",
          "Gekoppelde administraties",
          "Aanleverstatus",
          "Dossieroverzicht",
          "Interne notities",
        ]}
      />
    </AdminAppShell>
  );
}