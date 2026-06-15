import {
  addJournalEntryLineAction,
  createCorrectionJournalEntryAction,
  createManualJournalEntryAction,
  deleteDraftJournalEntryAction,
  deleteJournalEntryLineAction,
  postJournalEntryAction,
} from "@/modules/administrations/journalActions";
import type { VatCodeRow } from "@/modules/administrations/VatCodesSection";

type FiscalYearOption = {
  id: string;
  year: number;
  start_date: string;
  end_date: string;
  status: string;
};

type LedgerAccountOption = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
};

export type JournalEntryLineRow = {
  id: string;
  journal_entry_id: string;
  line_number: number;
  ledger_account_id: string;
  vat_code_id: string | null;
  description: string | null;
  debit_amount: number | string;
  credit_amount: number | string;
  amount_excl_vat: number | string | null;
  vat_amount: number | string;
  amount_incl_vat: number | string | null;
  created_at: string;
};

export type JournalEntryRow = {
  id: string;
  fiscal_year_id: string;
  entry_number: number | null;
  entry_date: string;
  description: string;
  reference: string | null;
  source_type: string;
  status: string;
  total_debit: number | string;
  total_credit: number | string;
  created_at: string;
  lines: JournalEntryLineRow[];
};

type JournalSectionProps = {
  administrationId: string;
  fiscalYears: FiscalYearOption[];
  ledgerAccounts: LedgerAccountOption[];
  vatCodes: VatCodeRow[];
  journalEntries: JournalEntryRow[];
};

function formatMoney(value: number | string | null | undefined) {
  const numberValue = typeof value === "string" ? Number(value) : value ?? 0;

  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(Number.isFinite(numberValue) ? numberValue : 0);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function getStatusLabel(status: string) {
  if (status === "posted") return "Gepost";
  if (status === "voided") return "Vervallen";
  return "Concept";
}

function getLineTypeLabel({
  line,
  accountCode,
}: {
  line: JournalEntryLineRow;
  accountCode?: string;
}) {
  if (accountCode === "1500" || accountCode === "1610") {
    return "Btw-regel";
  }

  if (line.vat_code_id) {
    return "Hoofdregel";
  }

  return "Tegenregel";
}

export function JournalSection({
  administrationId,
  fiscalYears,
  ledgerAccounts,
  vatCodes,
  journalEntries,
}: JournalSectionProps) {
  const openFiscalYears = fiscalYears.filter(
    (fiscalYear) => fiscalYear.status === "open",
  );

  const activeLedgerAccounts = ledgerAccounts.filter(
    (account) => account.is_active,
  );

  const activeVatCodes = vatCodes.filter((vatCode) => vatCode.is_active);

  const ledgerAccountMap = new Map(
    ledgerAccounts.map((account) => [account.id, account]),
  );

  const vatCodeMap = new Map(vatCodes.map((vatCode) => [vatCode.id, vatCode]));

  const today = new Date().toISOString().slice(0, 10);

  const canCreateJournal =
    openFiscalYears.length > 0 && activeLedgerAccounts.length > 0;

  return (
    <div className="mt-8 rounded-[2rem] border border-[#0f2d3a]/10 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-[#0f2d3a]">Journaal</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#405459]">
            Hier maken we handmatige boekingen. Btw-regels worden automatisch
            uitgesplitst naar de juiste btw-rekening. Geposte boekingen pas je
            niet direct aan; die corrigeer je met een aparte correctieboeking.
          </p>
        </div>

        <div className="rounded-2xl bg-[#fffaf4] px-4 py-3 text-sm font-bold text-[#405459]">
          {journalEntries.length} journaalpost
          {journalEntries.length === 1 ? "" : "en"}
        </div>
      </div>

      {!canCreateJournal ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[#0f2d3a]/20 bg-[#fffaf4] p-5 text-sm leading-7 text-[#405459]">
          Maak eerst minimaal één open boekjaar en grootboekrekeningen aan.
          Daarna kun je journaalposten maken.
        </div>
      ) : (
        <form
          action={createManualJournalEntryAction}
          className="mt-6 rounded-[1.5rem] border border-[#0f2d3a]/10 bg-[#fffaf4] p-5"
        >
          <input
            type="hidden"
            name="administration_id"
            value={administrationId}
          />

          <h3 className="font-black text-[#0f2d3a]">
            Nieuwe conceptboeking
          </h3>

          <div className="mt-4 grid gap-4 lg:grid-cols-[130px_160px_1fr_180px]">
            <div>
              <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#c9795e]">
                Datum
              </label>
              <input
                name="entry_date"
                type="date"
                defaultValue={today}
                required
                className="mt-2 w-full rounded-2xl border border-[#0f2d3a]/15 bg-white px-4 py-3 text-[#1e2b30] outline-none focus:border-[#c9795e]"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#c9795e]">
                Boekjaar
              </label>
              <select
                name="fiscal_year_id"
                required
                className="mt-2 w-full rounded-2xl border border-[#0f2d3a]/15 bg-white px-4 py-3 text-[#1e2b30] outline-none focus:border-[#c9795e]"
              >
                {openFiscalYears.map((fiscalYear) => (
                  <option key={fiscalYear.id} value={fiscalYear.id}>
                    {fiscalYear.year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#c9795e]">
                Omschrijving
              </label>
              <input
                name="description"
                required
                placeholder="Bijvoorbeeld: verkoopfactuur, inkoopfactuur of correctie"
                className="mt-2 w-full rounded-2xl border border-[#0f2d3a]/15 bg-white px-4 py-3 text-[#1e2b30] outline-none focus:border-[#c9795e]"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#c9795e]">
                Referentie
              </label>
              <input
                name="reference"
                placeholder="Optioneel"
                className="mt-2 w-full rounded-2xl border border-[#0f2d3a]/15 bg-white px-4 py-3 text-[#1e2b30] outline-none focus:border-[#c9795e]"
              />
            </div>
          </div>

          <button
            type="submit"
            style={{ color: "#ffffff" }}
            className="mt-5 rounded-full bg-[#0f2d3a] px-5 py-3 text-sm font-black !text-white shadow-sm transition hover:bg-[#123746]"
          >
            Conceptboeking aanmaken
          </button>
        </form>
      )}

      {journalEntries.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[#0f2d3a]/20 bg-[#fffaf4] p-5 text-sm leading-7 text-[#405459]">
          Nog geen journaalposten voor deze administratie.
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {journalEntries.map((entry) => {
            const totalDebit = Number(entry.total_debit);
            const totalCredit = Number(entry.total_credit);
            const difference =
              Math.round((totalDebit - totalCredit) * 100) / 100;
            const isBalanced =
              difference === 0 && totalDebit > 0 && totalCredit > 0;

            return (
              <article
                key={entry.id}
                className="rounded-[1.5rem] border border-[#0f2d3a]/10 bg-[#fffaf4] p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-[#0f2d3a]">
                        {entry.entry_number
                          ? `Journaalpost ${entry.entry_number}`
                          : "Conceptboeking"}
                      </h3>

                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#c9795e]">
                        {getStatusLabel(entry.status)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-[#405459]">
                      {formatDate(entry.entry_date)} · {entry.description}
                      {entry.reference ? ` · ${entry.reference}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-[#405459]">
                      <p>
                        <strong className="text-[#0f2d3a]">Debet:</strong>{" "}
                        {formatMoney(entry.total_debit)}
                      </p>
                      <p>
                        <strong className="text-[#0f2d3a]">Credit:</strong>{" "}
                        {formatMoney(entry.total_credit)}
                      </p>
                      <p>
                        <strong className="text-[#0f2d3a]">Verschil:</strong>{" "}
                        {formatMoney(Math.abs(difference))}
                      </p>
                    </div>

                    {entry.status === "draft" ? (
                      <form action={deleteDraftJournalEntryAction}>
                        <input
                          type="hidden"
                          name="administration_id"
                          value={administrationId}
                        />
                        <input
                          type="hidden"
                          name="journal_entry_id"
                          value={entry.id}
                        />
                        <button
                          type="submit"
                          className="w-full rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-700 transition hover:bg-red-100"
                        >
                          Concept verwijderen
                        </button>
                      </form>
                    ) : null}

                    {entry.status === "posted" ? (
                      <form action={createCorrectionJournalEntryAction}>
                        <input
                          type="hidden"
                          name="administration_id"
                          value={administrationId}
                        />
                        <input
                          type="hidden"
                          name="journal_entry_id"
                          value={entry.id}
                        />
                        <button
                          type="submit"
                          className="w-full rounded-full border border-[#0f2d3a]/15 bg-white px-4 py-2 text-xs font-black text-[#0f2d3a] transition hover:bg-[#fffaf4]"
                        >
                          Correctie maken
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>

                {entry.status === "draft" ? (
                  <form
                    action={addJournalEntryLineAction}
                    className="mt-5 rounded-2xl border border-[#0f2d3a]/10 bg-white p-4"
                  >
                    <input
                      type="hidden"
                      name="administration_id"
                      value={administrationId}
                    />
                    <input
                      type="hidden"
                      name="journal_entry_id"
                      value={entry.id}
                    />

                    <h4 className="font-black text-[#0f2d3a]">
                      Regel toevoegen
                    </h4>

                    <p className="mt-1 text-xs leading-5 text-[#607278]">
                      Kies een btw-code alleen op omzet- of kostenregels. Op
                      bank, kas, eigen vermogen, debiteuren en crediteuren kies
                      je “Geen btw-code”.
                    </p>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.9fr_120px_130px_1fr]">
                      <div>
                        <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#c9795e]">
                          Grootboek
                        </label>
                        <select
                          name="ledger_account_id"
                          required
                          className="mt-2 w-full rounded-2xl border border-[#0f2d3a]/15 bg-[#fffaf4] px-4 py-3 text-[#1e2b30] outline-none focus:border-[#c9795e]"
                        >
                          {activeLedgerAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.code} · {account.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#c9795e]">
                          Btw-code
                        </label>
                        <select
                          name="vat_code_id"
                          className="mt-2 w-full rounded-2xl border border-[#0f2d3a]/15 bg-[#fffaf4] px-4 py-3 text-[#1e2b30] outline-none focus:border-[#c9795e]"
                        >
                          <option value="">Geen btw-code</option>
                          {activeVatCodes.map((vatCode) => (
                            <option key={vatCode.id} value={vatCode.id}>
                              {vatCode.code} · {vatCode.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#c9795e]">
                          Kant
                        </label>
                        <select
                          name="side"
                          defaultValue="debit"
                          required
                          className="mt-2 w-full rounded-2xl border border-[#0f2d3a]/15 bg-[#fffaf4] px-4 py-3 text-[#1e2b30] outline-none focus:border-[#c9795e]"
                        >
                          <option value="debit">Debet</option>
                          <option value="credit">Credit</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#c9795e]">
                          Bedrag
                        </label>
                        <input
                          name="amount"
                          type="number"
                          min="0.01"
                          step="0.01"
                          required
                          placeholder="0,00"
                          className="mt-2 w-full rounded-2xl border border-[#0f2d3a]/15 bg-[#fffaf4] px-4 py-3 text-[#1e2b30] outline-none focus:border-[#c9795e]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#c9795e]">
                          Omschrijving
                        </label>
                        <input
                          name="description"
                          placeholder="Optioneel"
                          className="mt-2 w-full rounded-2xl border border-[#0f2d3a]/15 bg-[#fffaf4] px-4 py-3 text-[#1e2b30] outline-none focus:border-[#c9795e]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      style={{ color: "#ffffff" }}
                      className="mt-4 rounded-full bg-[#0f2d3a] px-5 py-3 text-sm font-black !text-white shadow-sm transition hover:bg-[#123746]"
                    >
                      Regel toevoegen
                    </button>
                  </form>
                ) : null}

                {entry.lines.length > 0 ? (
                  <div className="mt-5 overflow-hidden rounded-2xl border border-[#0f2d3a]/10 bg-white">
                    <div className="hidden grid-cols-[70px_110px_1fr_120px_100px_100px_100px_100px_90px] gap-3 bg-[#fffaf4] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#c9795e] lg:grid">
                      <span>Regel</span>
                      <span>Soort</span>
                      <span>Grootboek</span>
                      <span>Btw-code</span>
                      <span>Excl.</span>
                      <span>Btw</span>
                      <span>Debet</span>
                      <span>Credit</span>
                      <span>Actie</span>
                    </div>

                    <div className="divide-y divide-[#0f2d3a]/10">
                      {entry.lines.map((line) => {
                        const account = ledgerAccountMap.get(
                          line.ledger_account_id,
                        );
                        const vatCode = line.vat_code_id
                          ? vatCodeMap.get(line.vat_code_id)
                          : null;

                        const lineTypeLabel = getLineTypeLabel({
                          line,
                          accountCode: account?.code,
                        });

                        return (
                          <div
                            key={line.id}
                            className="grid gap-3 px-4 py-3 text-sm text-[#405459] lg:grid-cols-[70px_110px_1fr_120px_100px_100px_100px_100px_90px] lg:items-center"
                          >
                            <p className="font-black text-[#0f2d3a]">
                              {line.line_number}
                            </p>

                            <p>
                              <span className="rounded-full bg-[#fffaf4] px-3 py-1 text-xs font-black text-[#c9795e]">
                                {lineTypeLabel}
                              </span>
                            </p>

                            <p>
                              {account
                                ? `${account.code} · ${account.name}`
                                : "Onbekende rekening"}
                            </p>

                            <p>{vatCode ? vatCode.code : "—"}</p>

                            <p>{formatMoney(line.amount_excl_vat)}</p>

                            <p>{formatMoney(line.vat_amount)}</p>

                            <p>{formatMoney(line.debit_amount)}</p>

                            <p>{formatMoney(line.credit_amount)}</p>

                            <div>
                              {entry.status === "draft" ? (
                                <form action={deleteJournalEntryLineAction}>
                                  <input
                                    type="hidden"
                                    name="administration_id"
                                    value={administrationId}
                                  />
                                  <input
                                    type="hidden"
                                    name="journal_entry_line_id"
                                    value={line.id}
                                  />
                                  <button
                                    type="submit"
                                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-700 transition hover:bg-red-100"
                                  >
                                    Verwijder
                                  </button>
                                </form>
                              ) : (
                                <span className="text-xs text-[#607278]">—</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {entry.status === "draft" ? (
                  <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm font-bold text-[#405459]">
                      {isBalanced
                        ? "Deze conceptboeking is in balans en kan gepost worden."
                        : "Debet en credit moeten gelijk zijn voordat je kunt posten."}
                    </p>

                    <form action={postJournalEntryAction}>
                      <input
                        type="hidden"
                        name="administration_id"
                        value={administrationId}
                      />
                      <input
                        type="hidden"
                        name="journal_entry_id"
                        value={entry.id}
                      />

                      <button
                        type="submit"
                        disabled={!isBalanced}
                        style={{ color: "#ffffff" }}
                        className="rounded-full bg-[#0f2d3a] px-5 py-3 text-sm font-black !text-white shadow-sm transition hover:bg-[#123746] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Boeking posten
                      </button>
                    </form>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}