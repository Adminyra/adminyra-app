import { createDefaultVatCodesAction } from "@/modules/administrations/vatCodeActions";

export type VatCodeRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  direction: string;
  rate_percent: number | string;
  calculation_method: string;
  vat_due_return_section: string | null;
  vat_deductible_return_section: string | null;
  is_reverse_charge: boolean;
  requires_icp_listing: boolean;
  deductibility_percent: number | string;
  is_active: boolean;
};

type VatCodesSectionProps = {
  administrationId: string;
  vatCodes: VatCodeRow[];
};

function getDirectionLabel(direction: string) {
  if (direction === "sales") return "Verkoop";
  if (direction === "purchase") return "Inkoop";
  return "Beide";
}

function getCalculationMethodLabel(method: string) {
  if (method === "percentage") return "Percentage";
  if (method === "zero") return "0%";
  if (method === "exempt") return "Vrijgesteld";
  if (method === "reverse_charge") return "Verlegd";
  if (method === "kor") return "KOR";
  return "Geen btw";
}

function formatPercent(value: number | string) {
  const numberValue = typeof value === "string" ? Number(value) : value;

  if (Number.isNaN(numberValue)) {
    return "0%";
  }

  return `${numberValue.toFixed(2).replace(".", ",")}%`;
}

export function VatCodesSection({
  administrationId,
  vatCodes,
}: VatCodesSectionProps) {
  return (
    <div className="mt-8 rounded-[2rem] border border-[#0f2d3a]/10 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-[#0f2d3a]">Btw-codes</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#405459]">
            Deze codes bepalen straks hoe bedragen op documenten,
            boekingsvoorstellen, journaalposten en btw-aangiftes worden
            verwerkt.
          </p>
        </div>

        <form action={createDefaultVatCodesAction}>
          <input
            type="hidden"
            name="administration_id"
            value={administrationId}
          />

          <button
            type="submit"
            style={{ color: "#ffffff" }}
            className="w-fit rounded-full bg-[#0f2d3a] px-5 py-3 text-sm font-black !text-white shadow-sm transition hover:bg-[#123746]"
          >
            Standaard btw-codes aanmaken
          </button>
        </form>
      </div>

      {vatCodes.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[#0f2d3a]/20 bg-[#fffaf4] p-5 text-sm leading-7 text-[#405459]">
          Nog geen btw-codes voor deze administratie. Klik op “Standaard
          btw-codes aanmaken” om de juiste starterset klaar te zetten.
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-[#0f2d3a]/10">
          <div className="hidden grid-cols-[150px_1.2fr_110px_110px_1fr] gap-3 bg-[#fffaf4] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#c9795e] lg:grid">
            <span>Code</span>
            <span>Naam</span>
            <span>Richting</span>
            <span>Tarief</span>
            <span>Aangifte / labels</span>
          </div>

          <div className="divide-y divide-[#0f2d3a]/10">
            {vatCodes.map((vatCode) => (
              <article
                key={vatCode.id}
                className="grid gap-3 px-4 py-4 text-sm text-[#405459] lg:grid-cols-[150px_1.2fr_110px_110px_1fr] lg:items-center"
              >
                <p className="font-black text-[#0f2d3a]">{vatCode.code}</p>

                <div>
                  <h3 className="font-black text-[#0f2d3a]">
                    {vatCode.name}
                  </h3>

                  {vatCode.description ? (
                    <p className="mt-1 text-xs leading-5 text-[#607278]">
                      {vatCode.description}
                    </p>
                  ) : null}
                </div>

                <p>{getDirectionLabel(vatCode.direction)}</p>

                <p>{formatPercent(vatCode.rate_percent)}</p>

                <div className="flex flex-wrap gap-2">
                  <VatBadge
                    label={getCalculationMethodLabel(
                      vatCode.calculation_method,
                    )}
                  />

                  {vatCode.vat_due_return_section ? (
                    <VatBadge
                      label={`Rubriek ${vatCode.vat_due_return_section}`}
                    />
                  ) : null}

                  {vatCode.vat_deductible_return_section ? (
                    <VatBadge
                      label={`Voorbelasting ${vatCode.vat_deductible_return_section}`}
                    />
                  ) : null}

                  {vatCode.is_reverse_charge ? (
                    <VatBadge label="Verlegd" />
                  ) : null}

                  {vatCode.requires_icp_listing ? (
                    <VatBadge label="ICP" />
                  ) : null}

                  {!vatCode.is_active ? <VatBadge label="Inactief" /> : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VatBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-[#fffaf4] px-3 py-1 text-xs font-black text-[#c9795e]">
      {label}
    </span>
  );
}