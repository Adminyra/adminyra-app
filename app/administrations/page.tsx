import { AdminAppShell } from "@/modules/layout/AdminAppShell";
import { PlaceholderPage } from "@/modules/shared/PlaceholderPage";

export default function AdministrationsRoute() {
  return (
    <AdminAppShell>
      <PlaceholderPage
        eyebrow="Adminyra Boekhoudapp"
        title="Administraties"
        description="Hier beheren we straks klanten, ondernemingen, boekjaren, btw-instellingen en toegang per administratie."
        items={[
          "Administratie aanmaken",
          "Klantgegevens beheren",
          "Boekjaren openen en sluiten",
          "Btw-regime instellen",
          "Gebruikers en rollen koppelen",
          "Audit trail per administratie",
        ]}
      />
    </AdminAppShell>
  );
}