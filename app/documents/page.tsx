import { AdminAppShell } from "@/modules/layout/AdminAppShell";
import { PlaceholderPage } from "@/modules/shared/PlaceholderPage";

export default function DocumentsRoute() {
  return (
    <AdminAppShell>
      <PlaceholderPage
        eyebrow="Adminyra Boekhoudapp"
        title="Documenten"
        description="Hier komen bonnen, verkoopfacturen, inkoopfacturen, mandaten, overeenkomsten en controledocumenten."
        items={[
          "Documenten uploaden",
          "Bonnen en facturen verwerken",
          "Documentstatussen",
          "Koppeling aan boeking",
          "Dossier per klant",
          "Bewaarplicht en audit trail",
        ]}
      />
    </AdminAppShell>
  );
}