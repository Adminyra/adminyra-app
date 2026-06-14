import { createAdministrationAction } from "@/modules/administrations/actions";

type AdministrationRow = {
  id: string;
  name: string;
  legal_name: string | null;
  chamber_of_commerce_number: string | null;
  vat_number: string | null;
  tax_scheme: string;
  status: string;
  country_code: string;
  currency_code: string;
  created_at: string;
};

type AdministrationsPageProps = {
  administrations: AdministrationRow[];
  created?: boolean;
  error?: string;
};

export function AdministrationsPage({
  administrations,
  created,
  error,
}: AdministrationsPageProps) {
  return (
    <section>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="mb-3 text-sm font-black uppercase tracking-[0.35em] text-[#c9795e]">
            Adminyra Boekhoudapp
          </p>

          <h1 className="text-4xl font-black tracking-[-0.03em] text-[#0f2d3a] md:text-5xl">
            Administraties
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-[#405459]">
            Beheer hier de administraties waarvoor Adminyra de boekhouding
            verwerkt. Dit wordt de basis voor boekjaren, documenten,
            grootboek, btw en audit logs.
          </p>
        </div>

        <div className="rounded-[2rem] border border-[#0f2d3a]/10 bg-white/70 p-5 text-sm leading-7 text-[#405459] shadow-sm">
          <strong className="text-[#0f2d3a]">Status:</strong>{" "}
          {administrations.length} administratie
          {administrations.length === 1 ? "" : "s"} gevonden
        </div>
      </div>

      {created ? (
        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
          Administratie is aangemaakt.
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error === "missing-name"
            ? "Vul minimaal een administratienaam in."
            : "Er ging iets mis bij het laden of aanmaken van de administratie."}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form
          action={createAdministrationAction}
          className="rounded-[2rem] border border-[#0f2d3a]/10 bg-white p-6 shadow-sm"
        >
          <h2 className="text-xl font-black text-[#0f2d3a]">
            Nieuwe administratie
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#405459]">
            Voor nu maken we de basisgegevens aan. Boekjaren, btw-codes en RGS
            koppelen we in de volgende stappen.
          </p>

          <label className="mt-5 block text-sm font-black text-[#0f2d3a]">
            Administratienaam *
          </label>
          <input
            name="name"
            required
            placeholder="Bijvoorbeeld: Adminyra"
            className="mt-2 w-full rounded-2xl border border-[#0f2d3a]/15 bg-[#fffaf4] px-4 py-3 text-[#1e2b30] outline-none focus:border-[#c9795e]"
          />

          <label className="mt-4 block text-sm font-black text-[#0f2d3a]">
            Juridische naam
          </label>
          <input
            name="legal_name"
            placeholder="Bijvoorbeeld: Adminyra"
            className="mt-2 w-full rounded-2xl border border-[#0f2d3a]/15 bg-[#fffaf4] px-4 py-3 text-[#1e2b30] outline-none focus:border-[#c9795e]"
          />

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-black text-[#0f2d3a]">
                KvK-nummer
              </label>
              <input
                name="chamber_of_commerce_number"
                placeholder="12345678"
                className="mt-2 w-full rounded-2xl border border-[#0f2d3a]/15 bg-[#fffaf4] px-4 py-3 text-[#1e2b30] outline-none focus:border-[#c9795e]"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-[#0f2d3a]">
                Btw-nummer
              </label>
              <input
                name="vat_number"
                placeholder="NL..."
                className="mt-2 w-full rounded-2xl border border-[#0f2d3a]/15 bg-[#fffaf4] px-4 py-3 text-[#1e2b30] outline-none focus:border-[#c9795e]"
              />
            </div>
          </div>

          <label className="mt-4 block text-sm font-black text-[#0f2d3a]">
            Btw-regime
          </label>
          <select
            name="tax_scheme"
            defaultValue="vat"
            className="mt-2 w-full rounded-2xl border border-[#0f2d3a]/15 bg-[#fffaf4] px-4 py-3 text-[#1e2b30] outline-none focus:border-[#c9795e]"
          >
            <option value="vat">Normale btw</option>
            <option value="kor">KOR</option>
            <option value="exempt">Vrijgesteld</option>
          </select>

          <button
            type="submit"
            style={{ color: "#ffffff" }}
            className="mt-6 w-full rounded-full bg-[#0f2d3a] px-5 py-4 font-black !text-white shadow-sm transition hover:bg-[#123746]"
          >
            Administratie aanmaken
          </button>
        </form>

        <div className="rounded-[2rem] border border-[#0f2d3a]/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#0f2d3a]">
            Overzicht
          </h2>

          {administrations.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-[#0f2d3a]/20 bg-[#fffaf4] p-5 text-sm leading-7 text-[#405459]">
              Nog geen administraties. Maak links je eerste administratie aan.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {administrations.map((administration) => (
                <article
                  key={administration.id}
                  className="rounded-2xl border border-[#0f2d3a]/10 bg-[#fffaf4] p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="font-black text-[#0f2d3a]">
                        {administration.name}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-[#405459]">
                        {administration.legal_name ||
                          "Geen juridische naam ingevuld"}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#c9795e]">
                      {administration.tax_scheme}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-[#405459] md:grid-cols-2">
                    <p>
                      <strong className="text-[#0f2d3a]">KvK:</strong>{" "}
                      {administration.chamber_of_commerce_number || "—"}
                    </p>
                    <p>
                      <strong className="text-[#0f2d3a]">Btw:</strong>{" "}
                      {administration.vat_number || "—"}
                    </p>
                    <p>
                      <strong className="text-[#0f2d3a]">Status:</strong>{" "}
                      {administration.status}
                    </p>
                    <p>
                      <strong className="text-[#0f2d3a]">Land/valuta:</strong>{" "}
                      {administration.country_code} ·{" "}
                      {administration.currency_code}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}