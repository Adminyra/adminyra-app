export type AuditLogRow = {
  id: string;
  administration_id: string | null;
  actor_profile_id: string | null;
  action: string;
  entity_table: string | null;
  entity_id: string | null;
  old_data: unknown | null;
  new_data: unknown | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

type AuditLogSectionProps = {
  auditLogs: AuditLogRow[];
};

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getActionLabel(action: string) {
  const labels: Record<string, string> = {
    "journal_entry.created": "Journaalpost aangemaakt",
    "journal_entry.posted": "Journaalpost gepost",
    "journal_entry.deleted": "Conceptboeking verwijderd",
    "journal_entry.correction_created": "Correctieboeking aangemaakt",
    "journal_entry_line.deleted": "Journaalregel verwijderd",
  };

  return labels[action] ?? action;
}

function formatShortId(value: string | null) {
  if (!value) return "—";

  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function formatJson(value: unknown | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "Kon gegevens niet tonen.";
  }
}

export function AuditLogSection({ auditLogs }: AuditLogSectionProps) {
  return (
    <div className="mt-8 rounded-[2rem] border border-[#0f2d3a]/10 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-[#0f2d3a]">
            Auditlog / historie
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#405459]">
            Hier zie je de laatste acties binnen deze administratie. Dit helpt
            om later terug te vinden wie wat heeft gedaan en welke boekingen,
            regels of gegevens zijn aangemaakt, verwijderd of gecorrigeerd.
          </p>
        </div>

        <div className="rounded-2xl bg-[#fffaf4] px-4 py-3 text-sm font-bold text-[#405459]">
          Laatste {auditLogs.length} actie{auditLogs.length === 1 ? "" : "s"}
        </div>
      </div>

      {auditLogs.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[#0f2d3a]/20 bg-[#fffaf4] p-5 text-sm leading-7 text-[#405459]">
          Nog geen auditlog-acties voor deze administratie.
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-[#0f2d3a]/10">
          <div className="hidden grid-cols-[165px_1.1fr_160px_150px_120px] gap-3 bg-[#fffaf4] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#c9795e] lg:grid">
            <span>Moment</span>
            <span>Actie</span>
            <span>Tabel</span>
            <span>Gebruiker</span>
            <span>Details</span>
          </div>

          <div className="divide-y divide-[#0f2d3a]/10">
            {auditLogs.map((log) => (
              <article
                key={log.id}
                className="grid gap-3 px-4 py-4 text-sm text-[#405459] lg:grid-cols-[165px_1.1fr_160px_150px_120px] lg:items-start"
              >
                <p className="font-bold text-[#0f2d3a]">
                  {formatDateTime(log.created_at)}
                </p>

                <div>
                  <p className="font-black text-[#0f2d3a]">
                    {getActionLabel(log.action)}
                  </p>
                  <p className="mt-1 text-xs text-[#607278]">{log.action}</p>
                  {log.entity_id ? (
                    <p className="mt-1 text-xs text-[#607278]">
                      Entity: {formatShortId(log.entity_id)}
                    </p>
                  ) : null}
                </div>

                <p>{log.entity_table ?? "—"}</p>

                <p>{formatShortId(log.actor_profile_id)}</p>

                <details className="group">
                  <summary className="cursor-pointer rounded-full border border-[#0f2d3a]/10 bg-white px-3 py-1 text-xs font-black text-[#0f2d3a] transition hover:bg-[#fffaf4]">
                    Bekijk
                  </summary>

                  <div className="mt-3 rounded-2xl bg-[#fffaf4] p-3">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c9795e]">
                      Oud
                    </p>
                    <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs leading-5 text-[#405459]">
                      {formatJson(log.old_data)}
                    </pre>

                    <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-[#c9795e]">
                      Nieuw
                    </p>
                    <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs leading-5 text-[#405459]">
                      {formatJson(log.new_data)}
                    </pre>
                  </div>
                </details>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}