export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ee] px-6 py-10 text-[#1e2b30]">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.35em] text-[#c9795e]">
              Adminyra Boekhoudapp
            </p>

            <h1 className="text-4xl font-black tracking-[-0.03em] text-[#0f2d3a] md:text-5xl">
              Dashboard
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#405459]">
              Hier komt straks het overzicht van administraties, open taken,
              documenten, btw-aangiftes, bankregels, controles en audit logs.
            </p>
          </div>

          <a
            href="/"
            className="inline-flex w-fit items-center justify-center rounded-full border border-[#0f2d3a]/20 bg-white px-5 py-3 text-sm font-black text-[#0f2d3a] shadow-sm"
          >
            Terug naar start
          </a>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-[2rem] border border-[#0f2d3a]/10 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#c9795e]">
              Stap 1
            </p>
            <h2 className="mt-3 text-xl font-black text-[#0f2d3a]">
              Administraties
            </h2>
            <p className="mt-3 leading-7 text-[#405459]">
              Bedrijven, klanten, boekjaren en basisgegevens beheren.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#0f2d3a]/10 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#c9795e]">
              Stap 2
            </p>
            <h2 className="mt-3 text-xl font-black text-[#0f2d3a]">
              Documenten
            </h2>
            <p className="mt-3 leading-7 text-[#405459]">
              Inkoopfacturen, verkoopfacturen, bonnen, mandaten en dossiers.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#0f2d3a]/10 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#c9795e]">
              Stap 3
            </p>
            <h2 className="mt-3 text-xl font-black text-[#0f2d3a]">
              Boekhouding
            </h2>
            <p className="mt-3 leading-7 text-[#405459]">
              RGS-grootboek, journaalposten, btw, controles en audit trail.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-[#0f2d3a]/10 bg-white/70 p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#0f2d3a]">
            V1 uitgangspunt
          </h2>
          <p className="mt-3 max-w-3xl leading-8 text-[#405459]">
            Adminyra V1 moet meteen volledige boekhoudingen kunnen verwerken,
            zonder daarna opnieuw alles in een ander pakket te moeten doen.
            Daarom bouwen we vanaf het begin met rollen, RGS, audit logs en
            traceerbaarheid.
          </p>
        </div>
      </section>
    </main>
  );
}