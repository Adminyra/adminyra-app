import Link from "next/link";
import type { ReactNode } from "react";

import { requireCurrentUser } from "@/lib/auth/session";
import { signOutAction } from "@/modules/auth/actions";

type AdminAppShellProps = {
  children: ReactNode;
};

const navigationItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
  },
  {
    href: "/administrations",
    label: "Administraties",
  },
  {
    href: "/customers",
    label: "Klanten",
  },
  {
    href: "/documents",
    label: "Documenten",
  },
  {
    href: "/bookkeeping",
    label: "Boekhouding",
  },
  {
    href: "/settings",
    label: "Instellingen",
  },
];

export async function AdminAppShell({ children }: AdminAppShellProps) {
  const user = await requireCurrentUser();

  return (
    <div className="min-h-screen bg-[#fffaf4] text-[#1e2b30]">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-[#0f2d3a]/10 bg-white/80 px-5 py-6 shadow-sm lg:block">
          <Link href="/dashboard" className="block">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-[#c9795e]">
              Adminyra
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#0f2d3a]">
              Boekhoudapp
            </h1>
          </Link>

          <nav className="mt-8 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-2xl px-4 py-3 text-sm font-black text-[#405459] transition hover:bg-[#fffaf4] hover:text-[#0f2d3a]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl border border-[#0f2d3a]/10 bg-[#fffaf4] p-4 text-xs leading-5 text-[#405459]">
            <p className="font-black text-[#0f2d3a]">Ingelogd als</p>
            <p className="mt-1 break-words">{user.email}</p>
          </div>

          <form action={signOutAction} className="mt-5">
            <button
              type="submit"
              className="w-full rounded-full border border-[#0f2d3a]/15 bg-white px-4 py-3 text-sm font-black text-[#0f2d3a] transition hover:bg-[#fffaf4]"
            >
              Uitloggen
            </button>
          </form>
        </aside>

        <main className="flex-1">
          <header className="sticky top-0 z-20 border-b border-[#0f2d3a]/10 bg-white/90 px-4 py-4 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-4">
              <Link href="/dashboard">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#c9795e]">
                  Adminyra
                </p>
                <p className="text-lg font-black text-[#0f2d3a]">
                  Boekhoudapp
                </p>
              </Link>

              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-full border border-[#0f2d3a]/15 bg-white px-4 py-2 text-xs font-black text-[#0f2d3a]"
                >
                  Uitloggen
                </button>
              </form>
            </div>

            <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="shrink-0 rounded-full bg-[#fffaf4] px-4 py-2 text-xs font-black text-[#405459]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>

          <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}