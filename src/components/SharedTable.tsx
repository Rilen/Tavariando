import { Sparkles, UtensilsCrossed } from "lucide-react";
import type { SpecialDishSummary } from "@/app/actions/event";

type SharedTableProps = {
  specialDishes: SpecialDishSummary[];
};

export function SharedTable({ specialDishes }: SharedTableProps) {
  return (
    <section
      id="mesa-compartilhada"
      className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-900/5 sm:p-7 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mb-6 flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Mesa de Gostosuras, Frutas & Petiscos
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Pratos adicionais, salpicões, doces e frutas que a família já
            prometeu levar.
          </p>
        </div>
      </div>

      {specialDishes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Ninguém prometeu uma gostosura, fruta ou petisco ainda. Seja o
          primeiro a complementar a mesa!
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {specialDishes.map((dish) => (
            <li
              key={dish.id}
              className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                <UtensilsCrossed className="size-4" aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
                  <strong className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {dish.participantName}:
                  </strong>{" "}
                  {dish.description}
                </p>

                {dish.replacesItemName ? (
                  <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                    Substitui {dish.replacesItemName}
                  </span>
                ) : (
                  <span className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-800 dark:bg-orange-500/15 dark:text-amber-300">
                    Adicional
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
