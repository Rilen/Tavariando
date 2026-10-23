import Image from "next/image";
import { PartyPopper, Utensils, Users } from "lucide-react";
import type { DashboardData } from "@/app/actions/event";
import { pluralize } from "@/lib/format";

type HeaderStatsProps = {
  stats: DashboardData["stats"];
};

export function HeaderStats({ stats }: HeaderStatsProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-8 text-white shadow-xl shadow-amber-950/15 sm:px-10 sm:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/10 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/3 size-56 rounded-full bg-amber-300/20 blur-3xl"
      />

      <div className="relative z-20 flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-10">
        <div className="flex-1 space-y-8">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-50 backdrop-blur">
              <PartyPopper className="size-3.5" aria-hidden="true" />
              Almoço da família Tavariando
            </span>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Vamos dividir o cardápio e multiplicar o carinho.
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-orange-50/90 sm:text-base">
              Confirme sua presença, escolha a travessa ou porção que pode levar
              e acompanhe em tempo real o que já está garantido. Assim ninguém
              fica sobrecarregado e todo mundo aproveita a confraternização.
            </p>
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-4 backdrop-blur-sm">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15">
                <Users className="size-5" aria-hidden="true" />
              </span>
              <div>
                <dt className="text-xs uppercase tracking-wide text-orange-50/80">
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
                <dt className="text-xs uppercase tracking-wide text-orange-50/80">
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
                <dt className="text-xs uppercase tracking-wide text-orange-50/80">
                  Pratos no cardápio
                </dt>
                <dd className="text-2xl font-semibold leading-tight">
                  {stats.totalItens}
                </dd>
              </div>
            </div>
          </dl>

          <p className="text-xs text-orange-50/80">
            {pluralize(stats.totalConfirmados, "família confirmada", "famílias confirmadas")}
            {" · "}
            {stats.itensGarantidos} de {stats.totalItens}{" "}
            {stats.totalItens === 1 ? "prato garantido" : "pratos garantidos"}
            {stats.itensSemVoluntario > 0
              ? ` · ${pluralize(stats.itensSemVoluntario, "item ainda precisa", "itens ainda precisam")} de voluntário`
              : " · todos os itens já têm voluntários"}
            .
          </p>
        </div>

        <div className="hidden shrink-0 rounded-2xl border border-amber-400/30 bg-orange-950/50 p-2 text-amber-100 shadow-2xl backdrop-blur-sm md:block">
          <div className="relative h-[300px] w-[201px] overflow-hidden rounded-xl">
            <Image
              src="/herminio_evangelina.jpg"
              alt="Família Tavares"
              fill
              priority
              sizes="300px"
              className="object-contain"
            />
          </div>
          <span className="mt-1.5 block text-center text-xs font-medium tracking-wide text-amber-100">
            Hermínio & Evangelina
          </span>
        </div>

        <div className="pointer-events-none relative mx-auto mt-4 h-72 w-[193px] select-none overflow-hidden rounded-xl md:hidden">
          <Image
            src="/herminio_evangelina.jpg"
            alt="Família Tavares"
            fill
            sizes="193px"
            className="object-contain object-bottom"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-orange-950/40" />
        </div>
      </div>
    </section>
  );
}
