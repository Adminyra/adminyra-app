export function DashboardPage() {
  return (
    <section>
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-3 text-sm font-black uppercase tracking-[0.35em] text-[#c9795e]">
            Adminyra Boekhoudapp
          </p>

          <h1 className="text-4xl font-black tracking-[-0.03em] text-[#0f2d3a] md:text-5xl">
            Dashboard
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#405459]">
            Overzicht van administraties, open taken, documenten,
            btw-aangiftes, bankregels, controles en audit logs.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex w-fit items-center justify-center rounded-full bg-[#0f2d3a] px-5 py-3 text-sm font-black text-white shadow-sm"
          style={{ color: "#ffffff" }}
        >
          Nieuwe administratie
        </button>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <DashboardCard
          label="Administraties"
          value="0"
          description="Bedrijven en boekjaren in beheer."
        />

        <DashboardCard
          label="Open documenten"
          value="0"
          description="Nog te verwerken bonnen en facturen."
        />

        <DashboardCard
          label="Controles"
          value="0"
          description="Open controlepunten en auditmeldingen."
        />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-[#0f2d3a]/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#0f2d3a]">
            Eerste V1-bouwvolgorde
          </h2>

          <div className="mt-5 space-y-3">
            <RoadmapItem title="1. Administraties" text="Klanten, bedrijven, boekjaren en rollen." />
            <RoadmapItem title="2. RGS-grootboek" text="Basis grootboekstructuur met officiële RGS-koppeling." />
            <RoadmapItem title="3. Documenten" text="Uploaden, verwerken en koppelen aan boekingen." />
            <RoadmapItem title="4. Journaal" text="Boekingen, btw-regels en audit trail." />
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#0f2d3a]/10 bg-white/70 p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#0f2d3a]">
            Uitgangspunt
          </h2>

          <p className="mt-3 leading-8 text-[#405459]">
            Deze app moet vanaf V1 echte boekhoudingen kunnen verwerken.
            Niet eerst invoeren in Adminyra en daarna opnieuw in een ander
            pakket. Daarom bouwen we vanaf dag één met traceerbaarheid.
          </p>
        </div>
      </div>
    </section>
  );
}

type DashboardCardProps = {
  label: string;
  value: string;
  description: string;
};

function DashboardCard({ label, value, description }: DashboardCardProps) {
  return (
    <div className="rounded-[2rem] border border-[#0f2d3a]/10 bg-white p-6 shadow-sm">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-[#c9795e]">
        {label}
      </p>
      <p className="mt-4 text-4xl font-black text-[#0f2d3a]">{value}</p>
      <p className="mt-3 leading-7 text-[#405459]">{description}</p>
    </div>
  );
}

type RoadmapItemProps = {
  title: string;
  text: string;
};

function RoadmapItem({ title, text }: RoadmapItemProps) {
  return (
    <div className="rounded-2xl border border-[#0f2d3a]/10 bg-[#fffaf4] p-4">
      <h3 className="font-black text-[#0f2d3a]">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-[#405459]">{text}</p>
    </div>
  );
}