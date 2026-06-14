export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f3ee] text-[#1e2b30]">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-12 md:px-10">
        <div className="max-w-4xl">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.35em] text-[#c9795e]">
            Adminyra portaal
          </p>

          <h1 className="max-w-4xl text-5xl font-black leading-[1.05] tracking-[-0.04em] text-[#0f2d3a] md:text-7xl">
            Rust in je administratie. Grip op je cijfers.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#405459] md:text-xl">
            Dit wordt het boekhoudportaal van Adminyra. Hier verwerken we straks
            volledige administraties, documenten, btw, grootboek,
            journaalposten en controles met volledige traceerbaarheid.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <a
              href="/login"
              style={{ color: "#ffffff" }}
              className="inline-flex items-center justify-center rounded-full bg-[#0f2d3a] px-7 py-4 text-base font-black !text-white shadow-sm transition hover:translate-y-[-1px] hover:bg-[#123746]"
            >
              Inloggen
            </a>

            <a
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-[#0f2d3a]/20 bg-white px-7 py-4 text-base font-black text-[#0f2d3a] shadow-sm transition hover:translate-y-[-1px] hover:border-[#0f2d3a]/35"
            >
              Naar dashboard
            </a>
          </div>

          <div className="mt-10 rounded-[2rem] border border-[#0f2d3a]/10 bg-white/70 p-5 text-sm leading-7 text-[#405459] shadow-sm backdrop-blur">
            <strong className="text-[#0f2d3a]">V1 focus:</strong> volledige
            boekhouding verwerken in Adminyra zelf, inclusief RGS-grootboek,
            documenten, btw, journaalposten, controles en audit logs.
          </div>
        </div>
      </section>
    </main>
  );
}