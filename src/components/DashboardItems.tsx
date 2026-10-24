"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Lock,
  Sparkles,
  Users,
} from "lucide-react";
import type { DashboardItem } from "@/app/actions/event";
import { CATEGORY_GROUP_LABELS, pluralize } from "@/lib/format";
import {
  requestParticipantStep,
  useParticipantSession,
} from "@/lib/participant-storage";

type DashboardItemsProps = {
  items: DashboardItem[];
  totalPessoas: number;
};

type CategoryFilter = "TODOS" | "COMIDA" | "SOBREMESA" | "DESCARTAVEL";

const DISPLAY_CATEGORIES = ["COMIDA", "SOBREMESA", "DESCARTAVEL"] as const;

export function DashboardItems({ items, totalPessoas }: DashboardItemsProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("TODOS");
  const session = useParticipantSession();
  const currentParticipantId = session?.participantId;

  const hasConfirmations = totalPessoas > 0;

  const categoriesToRender =
    selectedCategory === "TODOS"
      ? DISPLAY_CATEGORIES.filter((cat) =>
          items.some((item) => item.category === cat),
        )
      : [selectedCategory];

  function handleSelectAction() {
    requestParticipantStep(
      currentParticipantId ? "contribution" : "presence",
      "confirmacao",
    );
  }

  return (
    <section
      id="cardapio"
      aria-labelledby="cardapio-heading"
      className="scroll-mt-6 rounded-3xl border border-orange-200/80 bg-white p-5 shadow-sm shadow-orange-950/5 sm:p-7"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
            <ClipboardList className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="cardapio-heading"
              className="text-lg font-bold tracking-tight text-orange-950 sm:text-xl"
            >
              Cardápio e transparência da mesa
            </h2>
            <p className="mt-0.5 text-sm leading-relaxed text-stone-600">
              {hasConfirmations
                ? `Acompanhamento das porções para ${pluralize(totalPessoas, "pessoa confirmada", "pessoas confirmadas")}. Cada voluntário assume 1 porção familiar.`
                : "Veja os 11 itens básicos planejados para o nosso encontro. Cada família pode assumir 1 porção ou pacote."}
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <div
            role="group"
            aria-label="Filtrar cardápio por categoria"
            className="flex flex-wrap gap-1.5"
          >
            {(
              [
                { id: "TODOS", label: "Todos" },
                { id: "COMIDA", label: "Comidas" },
                { id: "SOBREMESA", label: "Sobremesas" },
                { id: "DESCARTAVEL", label: "Descartáveis e infraestrutura" },
              ] as { id: CategoryFilter; label: string }[]
            ).map((filter) => {
              const isActive = selectedCategory === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setSelectedCategory(filter.id)}
                  aria-pressed={isActive}
                  className={`min-h-9 rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-1 ${
                    isActive
                      ? "bg-orange-800 text-white shadow-sm"
                      : "border border-orange-200 bg-orange-50/70 text-stone-800 hover:bg-orange-100"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!hasConfirmations && items.length > 0 && (
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-orange-200 bg-orange-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles
              className="mt-0.5 size-5 shrink-0 text-orange-700"
              aria-hidden="true"
            />
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-orange-950">
                Mesa pronta para receber as primeiras confirmações!
              </p>
              <p className="text-xs leading-relaxed text-stone-700">
                Ainda não há famílias confirmadas. Assim que a primeira presença
                for registrada, o sistema calcula quantas travessas cada item
                vai precisar.
              </p>
            </div>
          </div>
          <a
            href="#confirmacao"
            onClick={handleSelectAction}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 self-start rounded-xl bg-orange-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 sm:self-auto"
          >
            Confirmar presença
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      )}

      {items.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-orange-200 p-6 text-center text-sm text-stone-600">
          Nenhum item cadastrado no cardápio ainda.
        </p>
      ) : (
        <div className="mt-6 space-y-7">
          {categoriesToRender.map((categoryKey) => {
            const categoryItems = items.filter(
              (item) => item.category === categoryKey,
            );
            if (categoryItems.length === 0) return null;

            return (
              <div key={categoryKey} className="space-y-3">
                <div className="flex items-center justify-between border-b border-orange-100 pb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-orange-900">
                    {CATEGORY_GROUP_LABELS[categoryKey] ?? categoryKey}
                  </h3>
                  <span className="text-xs font-medium text-stone-600">
                    {pluralize(categoryItems.length, "item", "itens")}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {categoryItems.map((item) => {
                    const isMine = Boolean(
                      currentParticipantId &&
                        item.volunteers.some(
                          (v) => v.participantId === currentParticipantId,
                        ),
                    );

                    const isNoConfirmations =
                      !hasConfirmations && item.qtdVoluntarios === 0;
                    const isConfirmedWithoutVolunteers =
                      hasConfirmations && item.qtdVoluntarios === 0;
                    const isPartialCoverage =
                      hasConfirmations &&
                      item.qtdVoluntarios > 0 &&
                      !item.isEnough;
                    const isSufficientCoverage = item.isEnough;
                    const isUnavailableForNewChoice =
                      isSufficientCoverage && !isMine;

                    let stateBadge: {
                      label: string;
                      className: string;
                    };
                    let needSummary: string;

                    if (isNoConfirmations) {
                      stateBadge = {
                        label: "Nenhuma confirmação",
                        className:
                          "bg-stone-100 text-stone-700 border-stone-200",
                      };
                      needSummary =
                        "Aguardando confirmações para calcular a quantidade sugerida.";
                    } else if (isConfirmedWithoutVolunteers) {
                      stateBadge = {
                        label: "Sem voluntários",
                        className:
                          "bg-amber-100 text-amber-950 border-amber-300",
                      };
                      needSummary = `Precisa de ${pluralize(item.suggestedServings, item.servingLabel, item.servingLabelPlural)} · nenhuma família assumiu ainda.`;
                    } else if (isPartialCoverage) {
                      stateBadge = {
                        label: "Cobertura parcial",
                        className:
                          "bg-orange-100 text-orange-950 border-orange-200",
                      };
                      needSummary = `${item.qtdVoluntarios} de ${item.suggestedServings} garantido(s) · faltam ${pluralize(item.missingServings, item.servingLabel, item.servingLabelPlural)}.`;
                    } else {
                      stateBadge = {
                        label: "Cobertura suficiente",
                        className:
                          "bg-emerald-50 text-emerald-900 border-emerald-200",
                      };
                      needSummary = `${item.qtdVoluntarios} de ${item.suggestedServings} ${item.suggestedServings === 1 ? item.servingLabel : item.servingLabelPlural} garantido(s).`;
                    }

                    return (
                      <article
                        key={item.id}
                        className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 transition ${
                          isConfirmedWithoutVolunteers
                            ? "border-amber-300/90 bg-amber-50/40"
                            : isSufficientCoverage
                              ? "border-stone-200 bg-stone-50/60"
                              : "border-orange-200/70 bg-orange-50/25"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="text-sm font-bold leading-snug text-orange-950">
                              {item.name}
                            </h4>

                            <span
                              className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${stateBadge.className}`}
                            >
                              {isSufficientCoverage ? (
                                <CheckCircle2
                                  className="size-3 text-emerald-700"
                                  aria-hidden="true"
                                />
                              ) : isNoConfirmations ? (
                                <Clock className="size-3" aria-hidden="true" />
                              ) : null}
                              {stateBadge.label}
                            </span>
                          </div>

                          <p className="text-xs text-stone-700">
                            Porção:{" "}
                            <strong className="font-semibold text-stone-900">
                              1 {item.servingLabel}
                            </strong>{" "}
                            ({item.servesDescription})
                          </p>

                          <p className="text-xs font-medium leading-relaxed text-stone-800">
                            {needSummary}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-orange-100/90 pt-3">
                          {item.volunteers.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600">
                                <Users
                                  className="size-3.5"
                                  aria-hidden="true"
                                />
                                Quem leva:
                              </span>
                              <ul
                                aria-label={`Voluntários para ${item.name}`}
                                className="flex flex-wrap gap-1"
                              >
                                {item.volunteers.map((volunteer) => (
                                  <li
                                    key={volunteer.participantId}
                                    className="rounded-lg border border-orange-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-orange-950"
                                  >
                                    {volunteer.name}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <span className="text-[11px] text-stone-600">
                              {hasConfirmations
                                ? "Aguardando primeiro voluntário"
                                : "Disponível para escolha"}
                            </span>
                          )}

                          {isUnavailableForNewChoice ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-stone-200/80 px-2.5 py-1 text-[11px] font-semibold text-stone-700">
                              <Lock className="size-3" aria-hidden="true" />
                              Indisponível para nova escolha
                            </span>
                          ) : isMine ? (
                            <a
                              href="#confirmacao"
                              onClick={handleSelectAction}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-900 transition hover:bg-emerald-200"
                            >
                              <CheckCircle2
                                className="size-3"
                                aria-hidden="true"
                              />
                              Assumido por você · Editar
                            </a>
                          ) : (
                            <a
                              href="#confirmacao"
                              onClick={handleSelectAction}
                              className="inline-flex items-center gap-1 rounded-lg border border-orange-300 bg-white px-2.5 py-1 text-[11px] font-bold text-orange-900 transition hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700"
                            >
                              Quero levar
                              <ArrowUpRight
                                className="size-3"
                                aria-hidden="true"
                              />
                            </a>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
