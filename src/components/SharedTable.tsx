import { Sparkles, UtensilsCrossed } from "lucide-react";
import type { SpecialDishSummary } from "@/app/actions/event";

type SharedTableProps = {
  specialDishes: SpecialDishSummary[];
};

export function SharedTable({ specialDishes }: SharedTableProps) {
  return (
    <section
      id="mesa-compartilhada"
      aria-labelledby="mesa-compartilhada-heading"
      className="rounded-3xl border border-orange-200/80 bg-white p-5 shadow-sm shadow-orange-950/5 sm:p-7"
    >
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2
            id="mesa-compartilhada-heading"
            className="text-lg font-bold tracking-tight text-orange-950 sm:text-xl"
          >
            Mesa de Gostosuras, Frutas &amp; Petiscos
          </h2>
          <p className="mt-0.5 text-sm leading-relaxed text-stone-600">
            Pratos extras, salpicões, doces e frutas que a família já combinou
            de levar para somar à mesa.
          </p>
        </div>
      </div>

      {specialDishes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-5 text-center">
          <p className="text-sm font-medium text-stone-700">
            Ainda não há pratos extras, doces ou frutas registrados.
          </p>
          <p className="mt-1 text-xs text-stone-600">
            Ao escolher sua contribuição acima, você também pode adicionar uma
            gostosura especial da família!
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {specialDishes.map((dish) => (
            <li
              key={dish.id}
              className="flex items-start gap-3 rounded-2xl border border-orange-200/70 bg-orange-50/30 p-3.5"
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-900">
                <UtensilsCrossed className="size-4" aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm leading-relaxed text-stone-800">
                  <strong className="font-bold text-orange-950">
                    {dish.participantName}:
                  </strong>{" "}
                  {dish.description}
                </p>

                {dish.replacesItemName ? (
                  <span className="inline-block rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-950">
                    Substitui {dish.replacesItemName}
                  </span>
                ) : (
                  <span className="inline-block rounded-full border border-orange-200 bg-orange-100 px-2.5 py-0.5 text-[11px] font-semibold text-orange-950">
                    Adicional para a mesa
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
