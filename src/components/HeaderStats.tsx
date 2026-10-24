"use client";

import Image from "next/image";
import {
  ArrowDownRight,
  CheckCircle2,
  Heart,
  PartyPopper,
  Utensils,
  Users,
} from "lucide-react";
import type { DashboardData } from "@/app/actions/event";
import { pluralize } from "@/lib/format";
import {
  requestParticipantStep,
  useParticipantSession,
} from "@/lib/participant-storage";

type HeaderStatsProps = {
  stats: DashboardData["stats"];
  participants?: DashboardData["participants"];
};

export function HeaderStats({ stats, participants = [] }: HeaderStatsProps) {
  const session = useParticipantSession();
  const participant = session?.participantId
    ? participants.find((item) => item.id === session.participantId)
    : undefined;

  const hasContribution = Boolean(
    participant &&
      (participant.itemIds.length > 0 || Boolean(participant.specialDish)),
  );

  const hasConfirmations = stats.totalConfirmados > 0;

  return (
    <header className="relative overflow-hidden rounded-3xl border border-orange-900/15 bg-gradient-to-br from-orange-800 via-orange-700 to-amber-700 px-5 py-6 text-white shadow-lg shadow-orange-950/15 sm:px-8 sm:py-9 lg:px-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/10 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/3 size-56 rounded-full bg-amber-300/15 blur-3xl"
      />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-8 lg:gap-10">
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className=" shrink-0 overflow-hidden rounded-2xl border border-amber-200/40 bg-orange-950/40 p-1 shadow-md md:hidden">
              <div className="relative h-20 w-14 overflow-hidden rounded-xl">
                <Image
                  src="/herminio_evangelina.jpg"
                  alt="Fotografia de Hermínio e Evangelina, patriarcas da família Tavares"
                  fill
                  priority
                  sizes="56px"
                  className="object-cover object-top"
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-sm">
                <Heart className="size-3.5 fill-amber-200 text-amber-200" aria-hidden="true" />
                Encontro da Família Tavares · Tavariando
              </span>
              <p className="text-xs font-medium text-amber-100 md:hidden">
                Homenagem a Hermínio &amp; Evangelina
              </p>
            </div>
          </div>

          <div className="max-w-2xl space-y-3">
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
              Vamos dividir o cardápio e multiplicar o carinho.
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-orange-50 sm:text-base">
              Nosso almoço em família fica mais leve quando cada um colabora um
              pouquinho. Primeiro confirme sua presença e quem vem com você;
              depois, se quiser, escolha uma travessa ou item para levar.
            </p>
          </div>

          <div className="space-y-3">
            {participant && (
              <p className="inline-flex items-center gap-2 rounded-full bg-orange-950/35 px-3.5 py-1.5 text-xs font-semibold text-amber-100 ring-1 ring-amber-200/30">
                <CheckCircle2 className="size-4 text-amber-200" aria-hidden="true" />
                {hasContribution
                  ? `Olá, ${participant.name}! Presença e contribuição registradas (${pluralize(participant.peopleCount, "pessoa", "pessoas")}).`
                  : `Olá, ${participant.name}! Sua presença está confirmada (${pluralize(participant.peopleCount, "pessoa", "pessoas")}).`}
              </p>
            )}

            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
              {!participant ? (
                <>
                  <a
                    href="#confirmacao"
                    onClick={() => requestParticipantStep("presence")}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-orange-900 shadow-md transition hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-orange-800"
                  >
                    Confirmar minha presença
                    <ArrowDownRight className="size-4" aria-hidden="true" />
                  </a>
                  <a
                    href="#cardapio"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-orange-800"
                  >
                    Ver cardápio da família
                  </a>
                </>
              ) : !hasContribution ? (
                <>
                  <a
                    href="#confirmacao"
                    onClick={() => requestParticipantStep("contribution")}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-orange-900 shadow-md transition hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-orange-800"
                  >
                    Escolher o que levar
                    <ArrowDownRight className="size-4" aria-hidden="true" />
                  </a>
                  <a
                    href="#minha-participacao"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-orange-800"
                  >
                    Ver minha participação
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="#minha-participacao"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-orange-900 shadow-md transition hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-orange-800"
                  >
                    Ver minha participação
                    <ArrowDownRight className="size-4" aria-hidden="true" />
                  </a>
                  <a
                    href="#confirmacao"
                    onClick={() => requestParticipantStep("contribution")}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-orange-800"
                  >
                    Atualizar o que vou levar
                  </a>
                </>
              )}
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-2 pt-1 sm:gap-3">
            <div className="rounded-2xl border border-white/15 bg-black/15 px-2.5 py-2.5 backdrop-blur-sm sm:px-4 sm:py-3.5">
              <dt className="flex flex-col items-start gap-1 text-xs font-semibold text-orange-100 sm:flex-row sm:items-center sm:gap-1.5 sm:uppercase sm:tracking-wider">
                <Users className="size-3.5 shrink-0" aria-hidden="true" />
                <span>Pessoas</span>
              </dt>
              <dd className="mt-1 text-xl font-bold leading-tight text-white sm:text-2xl">
                {stats.totalPessoas}
              </dd>
            </div>

            <div className="rounded-2xl border border-white/15 bg-black/15 px-2.5 py-2.5 backdrop-blur-sm sm:px-4 sm:py-3.5">
              <dt className="flex flex-col items-start gap-1 text-xs font-semibold text-orange-100 sm:flex-row sm:items-center sm:gap-1.5 sm:uppercase sm:tracking-wider">
                <PartyPopper className="size-3.5 shrink-0" aria-hidden="true" />
                <span>Famílias</span>
              </dt>
              <dd className="mt-1 text-xl font-bold leading-tight text-white sm:text-2xl">
                {stats.totalConfirmados}
              </dd>
            </div>

            <div className="rounded-2xl border border-white/15 bg-black/15 px-2.5 py-2.5 backdrop-blur-sm sm:px-4 sm:py-3.5">
              <dt className="flex flex-col items-start gap-1 text-xs font-semibold text-orange-100 sm:flex-row sm:items-center sm:gap-1.5 sm:uppercase sm:tracking-wider">
                <Utensils className="size-3.5 shrink-0" aria-hidden="true" />
                <span>Cardápio</span>
              </dt>
              <dd className="mt-1 text-xl font-bold leading-tight text-white sm:text-2xl">
                {hasConfirmations
                  ? `${stats.itensGarantidos}/${stats.totalItens}`
                  : stats.totalItens}
              </dd>
            </div>
          </dl>

          <p className="text-xs leading-relaxed text-orange-50">
            {!hasConfirmations ? (
              "As confirmações estão abertas! Seja a primeira família a confirmar presença para inaugurarmos a nossa mesa."
            ) : (
              <>
                {pluralize(
                  stats.totalConfirmados,
                  "família confirmada",
                  "famílias confirmadas",
                )}
                {" · "}
                {stats.itensGarantidos} de {stats.totalItens}{" "}
                {stats.totalItens === 1
                  ? "item com cobertura suficiente"
                  : "itens com cobertura suficiente"}
                {stats.itensSemVoluntario > 0
                  ? ` · ${pluralize(stats.itensSemVoluntario, "item ainda aguarda", "itens ainda aguardam")} voluntário`
                  : " · todos os itens básicos já têm voluntários"}
                .
              </>
            )}
          </p>
        </div>

        <figure className="hidden shrink-0 rounded-2xl border border-amber-200/40 bg-orange-950/35 p-2.5 text-amber-50 shadow-xl backdrop-blur-sm md:block">
          <div className="relative h-[280px] w-[190px] overflow-hidden rounded-xl lg:h-[300px] lg:w-[201px]">
            <Image
              src="/herminio_evangelina.jpg"
              alt="Fotografia de Hermínio e Evangelina, patriarcas da família Tavares"
              fill
              priority
              sizes="(min-width: 1024px) 201px, 190px"
              className="object-contain"
            />
          </div>
          <figcaption className="mt-2 block text-center text-xs font-semibold tracking-wide text-amber-100">
            Hermínio &amp; Evangelina
          </figcaption>
        </figure>
      </div>
    </header>
  );
}
