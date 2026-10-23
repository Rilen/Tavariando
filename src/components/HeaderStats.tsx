import { PartyPopper, Utensils, Users } from "lucide-react";
import type { DashboardData } from "@/app/actions/event";
import { pluralize } from "@/lib/format";

type HeaderStatsProps = {
  stats: DashboardData["stats"];
};

export function HeaderStats({ stats }: HeaderStatsProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-6 py-8 text-white shadow-xl shadow-emerald-900/15 sm:px-10 sm:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/10 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/3 size-56 rounded-full bg-amber-300/20 blur-3xl"
      />

      <div className="relative flex flex-col gap-8">
        <div className="max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-50 backdrop-blur">
            <PartyPopper className="size-3.5" aria-hidden="true" />
            Almoço da família Tavariando
          </span>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Vamos dividir o cardápio e multiplicar o carinho.
          </h1>

          <p className="max-w-xl text-sm leading-relaxed text-emerald-50/90 sm:text-base">
            Confirme sua presença, escolha o que pode levar e acompanhe em tempo
            real como estão as cotas de cada prato. Assim ninguém fica
            sobrecarregado e todo mundo aproveita a confraternização.
          </p>
        </div>

        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-4 backdrop-blur-sm">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15">
              <Users className="size-5" aria-hidden="true" />
            </span>
            <div>
              <dt className="text-xs uppercase tracking-wide text-emerald-50/80">
                Pessoas à mesa
              </dt>
              <dd className="text-2xl font-semibold leading-tight">
                {stats.totalPessoas}
              </dd>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-4 backdrop-blur-sm">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15">
              <PartyPopper className="size-5" aria-hidden="true" />
            </span>
            <div>
              <dt className="text-xs uppercase tracking-wide text-emerald-50/80">
                Confirmações
              </dt>
              <dd className="text-2xl font-semibold leading-tight">
                {stats.totalConfirmados}
              </dd>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-4 backdrop-blur-sm">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15">
              <Utensils className="size-5" aria-hidden="true" />
            </span>
            <div>
              <dt className="text-xs uppercase tracking-wide text-emerald-50/80">
                Itens no cardápio
              </dt>
              <dd className="text-2xl font-semibold leading-tight">
                {stats.totalItens}
              </dd>
            </div>
          </div>
        </dl>

        <p className="text-xs text-emerald-50/80">
          {pluralize(stats.totalConfirmados, "família confirmada", "famílias confirmadas")}
          {" · "}
          {stats.itensSemVoluntario === 0
            ? "Todos os itens já têm voluntários."
            : `${pluralize(stats.itensSemVoluntario, "item ainda precisa", "itens ainda precisam")} de voluntário.`}
        </p>
      </div>
    </section>
  );
}
