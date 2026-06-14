import { createFiscalYearAction } from "@/modules/administrations/fiscalYearActions";

type AdministrationDetail = {
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

type FiscalYearRow = {
  id: string;
  year: number;
  start_date: string;
  end_date: string;
  status: string;
  notes: string | null;
  created_at: string;
};

type AdministrationDetailPageProps = {
  administration: AdministrationDetail;
  fiscalYears: FiscalYearRow[];
  fiscalYearCreated?: boolean;
  error?: string;
};

function getTaxSchemeLabel(taxScheme: string) {
  if (taxScheme === "kor") return "KOR";
  if (taxScheme === "exempt") return "Vrijgesteld";
  return "Normale btw";
}

function getStatusLabel(status: string) {
  if (status === "closed") return "Gesloten";
  if (status === "locked") return "Vergrendeld";
  if (status === "inactive") return "Inactief";
  if (status === "archived") return "Gearchiveerd";
  return "Open";
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function getErrorMessage(error?: string) {
  if (error === "invalid-year") return "Controleer het boekjaar.";
  if (error === "invalid-dates") return "Controleer de startdatum en einddatum.";
  if (error === "invalid-date-order") {
    return "De startdatum mag niet na de einddatum liggen.";
  }
  if (error === "duplicate-year") {
    return "Dit boekjaar bestaat al voor deze administratie.";
  }

  return "Er ging iets mis bij het aanmaken van het boekjaar.";
}

export function AdministrationDetailPage({
  administration,
  fiscalYears,
  fiscalYearCreated,
  error,
}: AdministrationDetailPageProps) {
  const currentYear = new Date().getFullYear();

  return (
    <section>
      <a
        href="/administrations"
        className="mb-6 inline-flex w-fit text-sm font-black text-[#0f2d3a]"
      >
        ← Terug naar administraties
      </a>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="mb-3 text-sm font-black uppercase tracking-[0.35em] text-[#c9795e]">
            Administratie
          </p>

          <h1 className="text-4xl font-black tracking-[-0.03em] text-[#0f2d3a] md:text-5xl">
            {administration.name}
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-[#405459]">
            {administration.legal_name ||
              "Geen juridische naam ingevuld voor deze administratie."}
          </p>
        </div>

        <div className="rounded-[2rem] border border-[#0f2d3a]/10 bg-white/70 p-5 text-sm leading-7 text-[#405459] shadow-sm">
          <p>
            <strong className="text-[#0f2d3a]">Btw-regime:</strong>{" "}
            {getTaxSchemeLabel(administration.tax_scheme)}
          </p>
          <p>
            <strong className="text-[#0f2d3a]">Status:</strong>{" "}
            {getStatusLabel(administration.status)}
          </p>
          <p>
            <strong className="text-[#0f2d3a]">Land/valuta:</strong>{" "}
            {administration.country_code} · {administration.currency_code}
          </p>
        </div>
      </div>

      {fiscalYearCreated ? (
        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
          Boekjaar is aangemaakt.
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {getErrorMessage(error)}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <form
          action={createFiscalYearAction}
          className="rounded-[2rem] border border-[#0f2d3a]/10 bg-white p-6 shadow-sm"
        >
          <input
            type="hidden"
            name="administration_id"
            value={administration.id}
          />

          <h2 className="text-xl font-black text-[#0f2d3a]">
            Boekjaar aanmaken
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#405459]">
            Standaard gebruiken we kalenderjaren. Bij uitzonderingen kun je de
            start- en einddatum handmatig aanpassen.
          </p>

          <label className="mt-5 block text-sm font-black text-[#0f2d3a]">
            Boekjaar
          </label>
          <input
            name="year"
            type="number"
            min="1900"
            max="2200"
            defaultValue={currentYear}
            required
            className="mt-2 w-full rounded-2xl border border-[#0f2d3a]/15 bg-[#fffaf4] px-4 py-3 text-[#1e2b30] outline-none focus:border-[#c9795e]"
          />

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-black text-[#0f2d3a]">
                Startdatum
              </label>
              <input
                name="start_date"
                type="date"
                defaultValue={`${currentYear}-01-01`}
                required
                className="mt-2 w-full rounded-2xl border border-[#0f2d3a]/15 bg-[#fffaf4] px-4 py-3 text-[#1e2b30] outline-none focus:border-[#c9795e]"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-[#0f2d3a]">
                Einddatum
              </label>
              <input
                name="end_date"
                type="date"
                defaultValue={`${currentYear}-12-31`}
                required
                className="mt-2 w-full rounded-2xl border border-[#0f2d3a]/15 bg-[#fffaf4] px-4 py-3 text-[#1e2b30] outline-none focus:border-[#c9795e]"
              />
            </div>
          </div>

          <label className="mt-4 block text-sm font-black text-[#0f2d3a]">
            Notitie
          </label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Bijvoorbeeld: startende onderneming, gebroken boekjaar of correctie."
            className="mt-2 w-full resize-none rounded-2xl border border-[#0f2d3a]/15 bg-[#fffaf4] px-4 py-3 text-[#1e2b30] outline-none focus:border-[#c9795e]"
          />

          <button
            type="submit"
            style={{ color: "#ffffff" }}
            className="mt-6 w-full rounded-full bg-[#0f2d3a] px-5 py-4 font-black !text-white shadow-sm transition hover:bg-[#123746]"
          >
            Boekjaar aanmaken
          </button>
        </form>

        <div className="rounded-[2rem] border border-[#0f2d3a]/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#0f2d3a]">Boekjaren</h2>

          {fiscalYears.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-[#0f2d3a]/20 bg-[#fffaf4] p-5 text-sm leading-7 text-[#405459]">
              Nog geen boekjaren voor deze administratie. Maak links het eerste
              boekjaar aan.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {fiscalYears.map((fiscalYear) => (
                <article
                  key={fiscalYear.id}
                  className="rounded-2xl border border-[#0f2d3a]/10 bg-[#fffaf4] p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-[#0f2d3a]">
                        Boekjaar {fiscalYear.year}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-[#405459]">
                        {formatDate(fiscalYear.start_date)} t/m{" "}
                        {formatDate(fiscalYear.end_date)}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#c9795e]">
                      {getStatusLabel(fiscalYear.status)}
                    </span>
                  </div>

                  {fiscalYear.notes ? (
                    <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-[#405459]">
                      {fiscalYear.notes}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}