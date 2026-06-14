type AdminAppShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Administraties", href: "/administrations" },
  { label: "Klanten", href: "/customers" },
  { label: "Documenten", href: "/documents" },
  { label: "Boekhouding", href: "/bookkeeping" },
  { label: "Instellingen", href: "/settings" },
];

export function AdminAppShell({ children }: AdminAppShellProps) {
  return (
    <main className="min-h-screen bg-[#f7f3ee] text-[#1e2b30]">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-[#0f2d3a]/10 bg-white/75 px-5 py-6 md:block">
          <a href="/" className="block">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[#c9795e]">
              Adminyra
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#0f2d3a]">
              Boekhoudapp
            </h1>
          </a>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block rounded-2xl px-4 py-3 text-sm font-black text-[#0f2d3a] transition hover:bg-[#f7f3ee]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-8 rounded-[1.5rem] border border-[#0f2d3a]/10 bg-[#fffaf4] p-4 text-sm leading-6 text-[#405459]">
            <strong className="text-[#0f2d3a]">V1:</strong> volledige
            boekhouding, RGS, documenten, btw, journaal en audit logs.
          </div>
        </aside>

        <section className="flex-1">
          <header className="border-b border-[#0f2d3a]/10 bg-white/70 px-6 py-4 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#c9795e]">
                  Portaal
                </p>
                <p className="mt-1 text-sm font-bold text-[#405459]">
                  portaal.adminyra.nl
                </p>
              </div>

              <a
                href="/login"
                className="rounded-full bg-[#0f2d3a] px-5 py-3 text-sm font-black text-white"
                style={{ color: "#ffffff" }}
              >
                Uitloggen
              </a>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
        </section>
      </div>
    </main>
  );
}