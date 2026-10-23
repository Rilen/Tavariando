import { AlertTriangle, ClipboardList, Users } from "lucide-react";
import type { DashboardItem } from "@/app/actions/event";
import {
  CATEGORY_LABELS,
  CATEGORY_STYLES,
  formatQuantity,
  pluralize,
} from "@/lib/format";

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
            Transparência do cardápio
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Total calculado para {pluralize(totalPessoas, "pessoa", "pessoas")}.
            As cotas mudam conforme cada família confirma.
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
            const needsVolunteer = item.qtdVoluntarios === 0;

            return (
              <article
                key={item.id}
                className={`flex flex-col gap-4 rounded-2xl border p-4 ${
                  needsVolunteer
                    ? "border-amber-300 bg-amber-50/70 dark:border-amber-500/40 dark:bg-amber-500/10"
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

                  <div className="shrink-0 text-right">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Total necessário
                    </p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      {formatQuantity(item.totalNecessario, item.unitMeasure)}
                    </p>
                  </div>
                </div>

                {needsVolunteer ? (
                  <p className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-100/80 px-3 py-2 text-xs font-medium text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
                    <AlertTriangle
                      className="mt-0.5 size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    Precisamos de voluntário! Nenhuma família assumiu este item
                    ainda.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                      <Users className="size-3.5" aria-hidden="true" />
                      {pluralize(
                        item.qtdVoluntarios,
                        "voluntário",
                        "voluntários",
                      )}{" "}
                      · {formatQuantity(item.cotaPorVoluntario, item.unitMeasure)}{" "}
                      para cada
                    </p>
                    <ul className="flex flex-wrap gap-1.5">
                      {item.volunteers.map((volunteer) => (
                        <li
                          key={volunteer.participantId}
                          className="rounded-lg border border-emerald-200 bg-white px-2 py-1 text-[11px] font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-zinc-900 dark:text-emerald-300"
                          title={`Cota: ${formatQuantity(volunteer.quota, item.unitMeasure)}`}
                        >
                          {volunteer.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="mt-auto text-[11px] text-zinc-500 dark:text-zinc-400">
                  Referência:{" "}
                  {formatQuantity(item.portionPerPerson, item.unitMeasure)} por
                  pessoa.
                </p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
