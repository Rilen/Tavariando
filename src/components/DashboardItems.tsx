import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Users,
} from "lucide-react";
import type { DashboardItem } from "@/app/actions/event";
import { CATEGORY_LABELS, CATEGORY_STYLES, pluralize } from "@/lib/format";

type DashboardItemsProps = {
  items: DashboardItem[];
  totalPessoas: number;
};

export function DashboardItems({ items, totalPessoas }: DashboardItemsProps) {
  return (
    <section
      id="cardapio"
      className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-900/5 sm:p-7 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mb-6 flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          <ClipboardList className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Pratos Básicos Garantidos
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Status das travessas para{" "}
            {pluralize(totalPessoas, "pessoa", "pessoas")}. Cada família leva
            uma porção familiar; ninguém precisa pesar nada.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Nenhum item cadastrado no cardápio ainda.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => {
            const needsVolunteer =
              totalPessoas > 0 && item.qtdVoluntarios === 0;

            const status = item.isEnough
              ? {
                  label: "Suficiente garantido",
                  className:
                    "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-amber-300",
                }
              : item.suggestedServings > 0
                ? {
                    label: `Faltam ${item.missingServings} ${
                      item.missingServings === 1
                        ? item.servingLabel
                        : item.servingLabelPlural
                    }`,
                    className:
                      "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
                  }
                : {
                    label: "Aguardando confirmações",
                    className:
                      "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
                  };

            return (
              <article
                key={item.id}
                className={`flex flex-col gap-4 rounded-2xl border p-4 ${
                  needsVolunteer
                    ? "border-amber-300 bg-amber-50/70 dark:border-amber-500/40 dark:bg-amber-500/10"
                    : item.isEnough
                      ? "border-orange-200 bg-orange-50/50 dark:border-orange-500/30 dark:bg-orange-500/5"
                      : "border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                      {item.name}
                    </h3>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        CATEGORY_STYLES[item.category] ??
                        "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {CATEGORY_LABELS[item.category] ?? item.category}
                    </span>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.className}`}
                  >
                    {item.isEnough && (
                      <CheckCircle2 className="size-3" aria-hidden="true" />
                    )}
                    {status.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-zinc-900/60">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Sugerido
                    </p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {item.suggestedServings > 0
                        ? `${item.suggestedServings} ${
                            item.suggestedServings === 1
                              ? item.servingLabel
                              : item.servingLabelPlural
                          }`
                        : "Aguardando confirmações"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-zinc-900/60">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Já garantido
                    </p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {pluralize(
                        item.qtdVoluntarios,
                        "voluntário",
                        "voluntários",
                      )}
                    </p>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Referência:{" "}
                  <strong className="font-medium text-zinc-700 dark:text-zinc-300">
                    1 {item.servingLabel}
                  </strong>{" "}
                  ({item.servesDescription}).
                </p>

                {needsVolunteer ? (
                  <p className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-100/80 px-3 py-2 text-xs font-medium text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
                    <AlertTriangle
                      className="mt-0.5 size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    Precisamos de voluntário! Nenhuma família assumiu este item
                    ainda.
                  </p>
                ) : item.volunteers.length > 0 ? (
                  <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                      <Users className="size-3.5" aria-hidden="true" />
                      Quem já vai levar
                    </p>
                    <ul className="flex flex-wrap gap-1.5">
                      {item.volunteers.map((volunteer) => (
                        <li
                          key={volunteer.participantId}
                          className="rounded-lg border border-orange-200 bg-white px-2 py-1 text-[11px] font-medium text-orange-800 dark:border-orange-500/30 dark:bg-zinc-900 dark:text-amber-300"
                        >
                          {volunteer.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
