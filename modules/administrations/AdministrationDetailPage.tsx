import { createFiscalYearAction } from "@/modules/administrations/fiscalYearActions";
import { createDefaultLedgerAccountsAction } from "@/modules/administrations/ledgerActions";
import {
  JournalSection,
  type JournalEntryRow,
} from "@/modules/administrations/JournalSection";
import {
  VatCodesSection,
  type VatCodeRow,
} from "@/modules/administrations/VatCodesSection";

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

type LedgerAccountRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  account_type: string;
  normal_balance: string;
  is_control_account: boolean;
  is_bank_account: boolean;
  is_cash_account: boolean;
  is_vat_account: boolean;
  is_active: boolean;
  created_at: string;
};

type AdministrationDetailPageProps = {
  administration: AdministrationDetail;
  fiscalYears: FiscalYearRow[];
  ledgerAccounts: LedgerAccountRow[];
  vatCodes: VatCodeRow[];
  journalEntries: JournalEntryRow[];
  fiscalYearCreated?: boolean;
  ledgerCreated?: string;
  vatCodesCreated?: string;
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

function getAccountTypeLabel(accountType: string) {
  if (accountType === "asset") return "Activa";
  if (accountType === "liability") return "Passiva";
  if (accountType === "equity") return "Eigen vermogen";
  if (accountType === "revenue") return "Omzet";
  if (accountType === "expense") return "Kosten";
  if (accountType === "tax") return "Btw";
  if (accountType === "suspense") return "Vraagpost";
  return accountType;
}

function getNormalBalanceLabel(normalBalance: string) {
  if (normalBalance === "credit") return "Credit";
  return "Debet";
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

  if (error === "delete-journal-entry") {
  return "De conceptboeking kon niet worden verwijderd. Alleen conceptboekingen mogen verwijderd worden.";
  }
  
  if (error === "create-correction-journal") {
  return "De correctieboeking kon niet worden aangemaakt. Alleen geposte boekingen kunnen via een correctieboeking worden teruggedraaid.";
  }



  if (error === "duplicate-year") {
    return "Dit boekjaar bestaat al voor deze administratie.";
  }

  if (error === "create-ledger") {
    return "Het standaard grootboek kon niet worden aangemaakt.";
  }

  if (error === "create-vat-codes") {
    return "De standaard btw-codes konden niet worden aangemaakt.";
  }

  if (error === "invalid-vat-usage") {
    return "Deze btw-code hoort niet bij deze grootboekrekening. Gebruik btw-codes alleen op omzet- of kostenregels en kies op tegenrekeningen geen btw-code.";
  }

  if (error === "missing-vat-ledger-account") {
    return "De btw-code mist nog een gekoppelde btw-grootboekrekening. Maak eerst het standaard grootboek en de standaard btw-codes opnieuw aan of controleer rekening 1500/1610.";
  }

  if (error === "create-journal") {
    return "De conceptboeking kon niet worden aangemaakt.";
  }

  if (error === "create-journal-line") {
    return "De journaalregel kon niet worden toegevoegd.";
  }

  if (error === "delete-journal-line") {
    return "De journaalregel kon niet worden verwijderd. Alleen regels uit conceptboekingen mogen verwijderd worden.";
  }

  if (error === "post-journal") {
    return "De journaalpost kon niet worden gepost. Controleer of debet en credit gelijk zijn.";
  }

  if (error === "load-detail") {
    return "Niet alle gegevens konden worden geladen.";
  }

  return "Er ging iets mis.";
}

export function AdministrationDetailPage({
  administration,
  fiscalYears,
  ledgerAccounts,
  vatCodes,
  journalEntries,
  fiscalYearCreated,
  ledgerCreated,
  vatCodesCreated,
  error,
}: AdministrationDetailPageProps) {
  const currentYear = new Date().getFullYear();

  const ledgerCreatedCount =
    typeof ledgerCreated === "string" ? Number.parseInt(ledgerCreated, 10) : null;

  const vatCodesCreatedCount =
    typeof vatCodesCreated === "string"
      ? Number.parseInt(vatCodesCreated, 10)
      : null;

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

      {ledgerCreatedCount !== null ? (
        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
          Standaard grootboek verwerkt. Nieuwe rekeningen aangemaakt:{" "}
          {Number.isNaN(ledgerCreatedCount) ? 0 : ledgerCreatedCount}.
        </div>
      ) : null}

      {vatCodesCreatedCount !== null ? (
        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
          Standaard btw-codes verwerkt. Nieuwe codes aangemaakt:{" "}
          {Number.isNaN(vatCodesCreatedCount) ? 0 : vatCodesCreatedCount}.
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

      <div className="mt-8 rounded-[2rem] border border-[#0f2d3a]/10 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-[#0f2d3a]">Grootboek</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#405459]">
              Dit grootboek is gekoppeld aan de Adminyra RGS-starterset. Later
              breiden we dit uit met officiële RGS-import en verdere
              boekhoudlogica.
            </p>
          </div>

          <form action={createDefaultLedgerAccountsAction}>
            <input
              type="hidden"
              name="administration_id"
              value={administration.id}
            />
            <button
              type="submit"
              style={{ color: "#ffffff" }}
              className="w-fit rounded-full bg-[#0f2d3a] px-5 py-3 text-sm font-black !text-white shadow-sm transition hover:bg-[#123746]"
            >
              Standaard grootboek aanmaken
            </button>
          </form>
        </div>

        {ledgerAccounts.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[#0f2d3a]/20 bg-[#fffaf4] p-5 text-sm leading-7 text-[#405459]">
            Nog geen grootboekrekeningen voor deze administratie. Klik op
            “Standaard grootboek aanmaken” om de basisrekeningen klaar te
            zetten.
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-2xl border border-[#0f2d3a]/10">
            <div className="hidden grid-cols-[90px_1.3fr_130px_120px_1fr] gap-3 bg-[#fffaf4] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#c9795e] lg:grid">
              <span>Code</span>
              <span>Naam</span>
              <span>Type</span>
              <span>Balans</span>
              <span>Labels</span>
            </div>

            <div className="divide-y divide-[#0f2d3a]/10">
              {ledgerAccounts.map((account) => (
                <article
                  key={account.id}
                  className="grid gap-3 px-4 py-4 text-sm text-[#405459] lg:grid-cols-[90px_1.3fr_130px_120px_1fr] lg:items-center"
                >
                  <p className="font-black text-[#0f2d3a]">{account.code}</p>

                  <div>
                    <h3 className="font-black text-[#0f2d3a]">
                      {account.name}
                    </h3>
                    {account.description ? (
                      <p className="mt-1 text-xs leading-5 text-[#607278]">
                        {account.description}
                      </p>
                    ) : null}
                  </div>

                  <p>{getAccountTypeLabel(account.account_type)}</p>

                  <p>{getNormalBalanceLabel(account.normal_balance)}</p>

                  <div className="flex flex-wrap gap-2">
                    {account.is_bank_account ? (
                      <LedgerBadge label="Bank" />
                    ) : null}
                    {account.is_cash_account ? (
                      <LedgerBadge label="Kas" />
                    ) : null}
                    {account.is_vat_account ? (
                      <LedgerBadge label="Btw" />
                    ) : null}
                    {account.is_control_account ? (
                      <LedgerBadge label="Controle" />
                    ) : null}
                    {!account.is_active ? (
                      <LedgerBadge label="Inactief" />
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>

      <VatCodesSection administrationId={administration.id} vatCodes={vatCodes} />

      <JournalSection
        administrationId={administration.id}
        fiscalYears={fiscalYears}
        ledgerAccounts={ledgerAccounts}
        vatCodes={vatCodes}
        journalEntries={journalEntries}
      />
    </section>
  );
}

function LedgerBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-[#fffaf4] px-3 py-1 text-xs font-black text-[#c9795e]">
      {label}
    </span>
  );
}
