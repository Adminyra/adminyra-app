export type BookkeepingSummaryAccountRow = {
  ledger_account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  normal_balance: string;
  debit_total: number;
  credit_total: number;
  balance: number;
};

type BookkeepingSummarySectionProps = {
  rows: BookkeepingSummaryAccountRow[];
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(Number.isFinite(value) ? value : 0);
}

function sumByType(rows: BookkeepingSummaryAccountRow[], accountType: string) {
  return rows
    .filter((row) => row.account_type === accountType)
    .reduce((total, row) => total + row.balance, 0);
}

function getDisplayBalance(row: BookkeepingSummaryAccountRow) {
  if (row.normal_balance === "credit") {
    return row.credit_total - row.debit_total;
  }

  return row.debit_total - row.credit_total;
}

function getAccountTypeLabel(accountType: string) {
  if (accountType === "asset") return "Activa";
  if (accountType === "liability") return "Passiva";
  if (accountType === "equity") return "Eigen vermogen";
  if (accountType === "revenue") return "Omzet";
  if (accountType === "expense") return "Kosten";
  if (accountType === "tax") return "Btw";
  if (accountType === "suspense") return "Vraagposten";
  return accountType;
}

export function BookkeepingSummarySection({
  rows,
}: BookkeepingSummarySectionProps) {
  const normalizedRows = rows.map((row) => ({
    ...row,
    balance: getDisplayBalance(row),
  }));

  const assets = sumByType(normalizedRows, "asset");
  const liabilities = sumByType(normalizedRows, "liability");
  const equity = sumByType(normalizedRows, "equity");
  const revenue = sumByType(normalizedRows, "revenue");
  const expenses = sumByType(normalizedRows, "expense");
  const tax = sumByType(normalizedRows, "tax");
  const suspense = sumByType(normalizedRows, "suspense");

  const result = revenue - expenses;

  const cards = [
    { label: "Activa", value: assets },
    { label: "Passiva", value: liabilities },
    { label: "Eigen vermogen", value: equity },
    { label: "Omzet", value: revenue },
    { label: "Kosten", value: expenses },
    { label: "Resultaat", value: result },
  ];

  return (
    <div className="mt-8 rounded-[2rem] border border-[#0f2d3a]/10 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-[#0f2d3a]">
            Boekhoudkundige samenvatting
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#405459]">
            Eerste samenvatting op basis van geposte journaalregels. Concepten
            tellen bewust nog niet mee.
          </p>
        </div>

        <div className="rounded-2xl bg-[#fffaf4] px-4 py-3 text-sm font-bold text-[#405459]">
          {rows.length} rekening{rows.length === 1 ? "" : "en"} met saldo
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-[#0f2d3a]/10 bg-[#fffaf4] p-5"
          >
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c9795e]">
              {card.label}
            </p>
            <p className="mt-3 text-2xl font-black text-[#0f2d3a]">
              {formatMoney(card.value)}
            </p>
          </div>
        ))}
      </div>

      {normalizedRows.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[#0f2d3a]/20 bg-[#fffaf4] p-5 text-sm leading-7 text-[#405459]">
          Nog geen geposte journaalregels om samen te vatten.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[#0f2d3a]/10">
          <div className="hidden grid-cols-[100px_1fr_150px_140px] gap-3 bg-[#fffaf4] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#c9795e] lg:grid">
            <span>Code</span>
            <span>Rekening</span>
            <span>Type</span>
            <span>Saldo</span>
          </div>

          <div className="divide-y divide-[#0f2d3a]/10">
            {normalizedRows.map((row) => (
              <article
                key={row.ledger_account_id}
                className="grid gap-3 px-4 py-4 text-sm text-[#405459] lg:grid-cols-[100px_1fr_150px_140px] lg:items-center"
              >
                <p className="font-black text-[#0f2d3a]">
                  {row.account_code}
                </p>
                <p>{row.account_name}</p>
                <p>{getAccountTypeLabel(row.account_type)}</p>
                <p className="font-black text-[#0f2d3a]">
                  {formatMoney(row.balance)}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs leading-5 text-[#607278]">
        Let op: dit is een eerste interne samenvatting. Later splitsen we dit
        netjes uit naar balans, winst-en-verlies en btw-overzicht.
      </p>
    </div>
  );
}