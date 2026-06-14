import { signInAction } from "@/modules/auth/actions";

type LoginPageProps = {
  error?: string;
};

export function LoginPage({ error }: LoginPageProps) {
  return (
    <main className="min-h-screen bg-[#f7f3ee] px-6 py-10 text-[#1e2b30]">
      <section className="mx-auto flex min-h-[85vh] max-w-md flex-col justify-center">
        <a
          href="/"
          className="mb-8 inline-flex w-fit text-sm font-bold text-[#0f2d3a]"
        >
          ← Terug naar start
        </a>

        <p className="mb-3 text-sm font-black uppercase tracking-[0.35em] text-[#c9795e]">
          Adminyra portaal
        </p>

        <h1 className="text-4xl font-black tracking-[-0.03em] text-[#0f2d3a]">
          Inloggen
        </h1>

        <p className="mt-4 leading-7 text-[#405459]">
          Log in op het boekhoudportaal van Adminyra.
        </p>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error === "missing"
              ? "Vul je e-mailadres en wachtwoord in."
              : "Inloggen is niet gelukt. Controleer je gegevens."}
          </div>
        ) : null}

        <form
          action={signInAction}
          className="mt-8 rounded-[2rem] border border-[#0f2d3a]/10 bg-white p-6 shadow-sm"
        >
          <label className="block text-sm font-black text-[#0f2d3a]">
            E-mailadres
          </label>
          <input
            name="email"
            type="email"
            placeholder="jij@bedrijf.nl"
            autoComplete="email"
            required
            className="mt-2 w-full rounded-2xl border border-[#0f2d3a]/15 bg-[#fffaf4] px-4 py-3 text-[#1e2b30] outline-none focus:border-[#c9795e]"
          />

          <label className="mt-5 block text-sm font-black text-[#0f2d3a]">
            Wachtwoord
          </label>
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            className="mt-2 w-full rounded-2xl border border-[#0f2d3a]/15 bg-[#fffaf4] px-4 py-3 text-[#1e2b30] outline-none focus:border-[#c9795e]"
          />

          <button
            type="submit"
            style={{ color: "#ffffff" }}
            className="mt-6 w-full rounded-full bg-[#0f2d3a] px-5 py-4 font-black !text-white shadow-sm transition hover:bg-[#123746]"
          >
            Inloggen
          </button>
        </form>
      </section>
    </main>
  );
}