import { requireCurrentUser } from "@/lib/auth/session";
import { AdminAppShell } from "@/modules/layout/AdminAppShell";

export const dynamic = "force-dynamic";

export default async function BookkeepingRoute() {
  await requireCurrentUser();

  return (
    <AdminAppShell>
      <section>
        <p className="mb-3 text-sm font-black uppercase tracking-[0.35em] text-[#c9795e]">
          Boekhouding
        </p>

        <h1 className="text-4xl font-black tracking-[-0.03em] text-[#0f2d3a] md:text-5xl">
          Boekhouding
        </h1>

        <p className="mt-4 max-w-3xl text-lg leading-8 text-[#405459]">
          De boekhoudkundige basis staat nu vooral onder Administraties:
          boekjaren, grootboek, btw-codes en journaalposten. Later krijgt deze
          pagina een centraal boekhoud-dashboard.
        </p>

        <div className="mt-8 rounded-[2rem] border border-dashed border-[#0f2d3a]/20 bg-white p-6 text-sm leading-7 text-[#405459] shadow-sm">
          Gebruik voorlopig de module Administraties om boekingen te verwerken.
        </div>
      </section>
    </AdminAppShell>
  );
}