import { Wine, Sparkles, GlassWater } from "lucide-react";
import type { DashboardSharedBeveragesSummary } from "@/app/actions/event";
import { formatLiters, pluralize } from "@/lib/format";

type SharedBeveragesCardProps = {
  summary: DashboardSharedBeveragesSummary;
};

export function SharedBeveragesCard({ summary }: SharedBeveragesCardProps) {
  const hasBeverages = summary.groups.length > 0;

  return (
    <section
      id="bebidas-compartilhadas"
      aria-labelledby="bebidas-compartilhadas-heading"
      className="overflow-hidden rounded-3xl border border-sky-200/80 bg-white p-5 shadow-sm shadow-stone-900/5 sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-800">
            <Wine className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="bebidas-compartilhadas-heading"
              className="text-base font-bold tracking-tight text-stone-900 sm:text-lg"
            >
              Bebidas para compartilhar
            </h2>
            <p className="text-xs text-stone-600 sm:text-sm">
              Contribuições voluntárias da família para a mesa comum
            </p>
          </div>
        </div>

        {hasBeverages && (
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-800 border border-sky-200 sm:self-auto">
            <Sparkles className="size-3.5 text-sky-600" aria-hidden="true" />
            {formatLiters(summary.totalLiters)} no total (
            {pluralize(summary.totalUnits, "volume", "volumes")})
          </span>
        )}
      </div>

      {!hasBeverages ? (
        <div className="mt-5 rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 p-6 text-center">
          <GlassWater
            className="mx-auto size-8 text-sky-400"
            aria-hidden="true"
          />
          <p className="mt-2 text-sm font-semibold text-stone-800">
            Ainda não há bebidas compartilhadas registradas
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-stone-600">
            Se você quiser levar refrigerante, suco ou água para a família, basta
            marcar no formulário de confirmação. Lembrando que quem preferir
            trazer suas próprias bebidas e cooler individual é super bem-vindo!
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {summary.groups.map((group) => (
              <div
                key={group.category}
                className="flex flex-col justify-between rounded-2xl border border-sky-100 bg-sky-50/40 p-4 transition hover:border-sky-200"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-sky-100 pb-2.5">
                    <h3 className="text-sm font-bold text-sky-950">
                      {group.categoryLabel}
                    </h3>
                    <span className="text-xs font-bold text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded-md">
                      {formatLiters(group.totalLiters)}
                    </span>
                  </div>

                  <ul className="mt-3 space-y-2 text-xs text-stone-700">
                    {group.items.map((item, index) => (
                      <li
                        key={`${item.unitVolumeMl}-${index}`}
                        className="flex flex-col gap-0.5"
                      >
                        <div className="flex items-center justify-between font-medium">
                          <span>{item.containerLabel}</span>
                          <span className="font-semibold text-stone-900">
                            {formatLiters(item.totalLiters)}
                          </span>
                        </div>
                        {item.customDescriptions.length > 0 && (
                          <span className="text-[11px] text-stone-500 italic">
                            ({item.customDescriptions.join(", ")})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <p className="rounded-xl border border-sky-100 bg-sky-50/30 px-3.5 py-2.5 text-xs text-stone-600">
            💡 <strong>Observação:</strong> quem preferir pode levar suas
            próprias bebidas e cooler para consumo pessoal, sem necessidade de
            informar.
          </p>
        </div>
      )}
    </section>
  );
}
