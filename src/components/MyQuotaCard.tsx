"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  HeartHandshake,
  ListChecks,
  Loader2,
  PlusCircle,
  Users,
  Utensils,
  Wine,
  X,
} from "lucide-react";
import {
  cancelParticipation,
  type DashboardItem,
  type DashboardParticipant,
} from "@/app/actions/event";
import {
  BEVERAGE_CATEGORY_LABELS,
  formatBeverageItemSummary,
  formatLiters,
  pluralize,
} from "@/lib/format";
import {
  clearStoredParticipantSession,
  requestParticipantStep,
  useParticipantSession,
} from "@/lib/participant-storage";

type MyQuotaCardProps = {
  participants: DashboardParticipant[];
  items: DashboardItem[];
  totalPessoas: number;
};

export function MyQuotaCard({
  participants,
  items,
  totalPessoas,
}: MyQuotaCardProps) {
  const session = useParticipantSession();
  const participantId = session?.participantId;
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cancelledMessage, setCancelledMessage] = useState<string | null>(null);

  const participant = participantId
    ? participants.find((item) => item.id === participantId)
    : undefined;

  const myItems = participant
    ? items.filter((item) => participant.itemIds.includes(item.id))
    : [];

  const myBeverages = participant?.sharedBeverages ?? [];

  const hasContribution =
    myItems.length > 0 ||
    Boolean(participant?.specialDish) ||
    myBeverages.length > 0;

  async function handleConfirmCancel() {
    if (!participant || !session?.participantToken || isCancelling) return;

    setIsCancelling(true);
    setErrorMessage(null);

    const result = await cancelParticipation(
      participant.id,
      session.participantToken,
    );

    if (result.status === "success") {
      setCancelledMessage(result.message);
      setConfirmingCancel(false);
      clearStoredParticipantSession();
    } else {
      setErrorMessage(result.message);
    }

    setIsCancelling(false);
  }

  if (!participant) {
    return (
      <section
        id="minha-participacao"
        aria-labelledby="minha-cota-heading"
        className="rounded-3xl border border-orange-200/80 bg-white p-5 shadow-sm shadow-orange-950/5 sm:p-6"
      >
        {cancelledMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 rounded-2xl border border-orange-200 bg-orange-50 p-3.5 text-xs font-medium leading-relaxed text-orange-950"
          >
            {cancelledMessage}
          </div>
        )}

        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-800">
            <Utensils className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <h2
              id="minha-cota-heading"
              className="text-base font-bold tracking-tight text-orange-950"
            >
              Como funciona a nossa mesa
            </h2>
            <p className="text-xs leading-relaxed text-stone-600">
              {participantId
                ? "Não encontramos uma confirmação ativa neste aparelho. Use o formulário para confirmar sua presença novamente."
                : "Depois de confirmar presença, este espaço mostra o resumo da sua família e os pratos que você escolheu."}
            </p>
          </div>
        </div>

        <ol className="mt-4 space-y-2.5 border-t border-orange-100 pt-4">
          <li className="flex items-start gap-2.5 text-xs leading-relaxed text-stone-700">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-800">
              <Users className="size-3.5" aria-hidden="true" />
            </span>
            <span>
              <strong className="font-semibold text-orange-950">
                1. Confirme sua presença:
              </strong>{" "}
              diga seu nome e quantas pessoas vêm com você (não precisa escolher
              prato na hora).
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-xs leading-relaxed text-stone-700">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-900">
              <ListChecks className="size-3.5" aria-hidden="true" />
            </span>
            <span>
              <strong className="font-semibold text-orange-950">
                2. Escolha o que levar:
              </strong>{" "}
              assuma uma travessa familiar, sobremesa ou item básico quando
              quiser.
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-xs leading-relaxed text-stone-700">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-800">
              <HeartHandshake className="size-3.5" aria-hidden="true" />
            </span>
            <span>
              <strong className="font-semibold text-orange-950">
                3. Mesa colaborativa:
              </strong>{" "}
              todo mundo leva uma porção e ninguém fica sobrecarregado.
            </span>
          </li>
        </ol>
      </section>
    );
  }

  return (
    <section
      id="minha-participacao"
      data-participant-confirmed="true"
      aria-labelledby="minha-participacao-heading"
      className="scroll-mt-6 overflow-hidden rounded-3xl border border-orange-900/15 bg-gradient-to-br from-orange-800 via-orange-700 to-amber-700 text-white shadow-lg shadow-orange-950/15"
    >
      <div className="space-y-5 p-5 sm:p-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 text-xs font-bold tracking-wide text-amber-100">
              {hasContribution ? (
                <>
                  <CheckCircle2
                    className="size-3.5 text-emerald-300"
                    aria-hidden="true"
                  />
                  Presença e contribuição confirmadas
                </>
              ) : (
                <>
                  <CheckCircle2
                    className="size-3.5 text-amber-200"
                    aria-hidden="true"
                  />
                  Presença confirmada · Almoço em família
                </>
              )}
            </span>
          </div>

          <h2
            id="minha-participacao-heading"
            className="text-2xl font-bold tracking-tight text-white"
          >
            Olá, {participant.name}!
          </h2>

          <p className="text-sm leading-relaxed text-orange-50">
            {participant.dependentsCount === 0
              ? "Sua presença individual (1 pessoa) está confirmada à mesa."
              : `Sua turma está confirmada com ${pluralize(participant.peopleCount, "pessoa", "pessoas")} (você + ${pluralize(participant.dependentsCount, "acompanhante", "acompanhantes")}).`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 font-semibold text-white">
            <Users className="size-3.5" aria-hidden="true" />
            {pluralize(
              participant.peopleCount,
              "pessoa confirmada",
              "pessoas confirmadas",
            )}
          </span>
          {myBeverages.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 font-semibold text-sky-100">
              <Wine className="size-3.5" aria-hidden="true" />
              Leva bebidas para compartilhar (
              {formatLiters(
                myBeverages.reduce(
                  (sum, b) => sum + (b.quantity * b.unitVolumeMl) / 1000,
                  0,
                ),
              )}
              )
            </span>
          )}
          {participant.bringsOwnDrink && (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 font-semibold text-amber-100">
                <Wine className="size-3.5" aria-hidden="true" />
                Leva a própria bebida
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 font-semibold text-sky-100">
                🧊 Leva também o gelo
              </span>
            </>
          )}
        </div>

        {hasContribution ? (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-100">
              O que você ficou de levar
            </h3>

            {myItems.length > 0 && (
              <ul className="space-y-2.5">
                {myItems.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-white/15 bg-black/15 p-3.5 backdrop-blur-sm"
                  >
                    <p className="text-sm font-bold text-white">{item.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-orange-50">
                      Você leva{" "}
                      <strong className="font-bold text-white">
                        1 {item.servingLabel}
                      </strong>{" "}
                      ({item.servesDescription}) para somar à mesa de{" "}
                      {pluralize(totalPessoas, "pessoa", "pessoas")}.
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {myBeverages.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-sky-200">
                  Bebidas para compartilhar
                </p>
                <ul className="space-y-2">
                  {myBeverages.map((bev) => (
                    <li
                      key={bev.id}
                      className="rounded-2xl border border-white/15 bg-black/15 p-3.5 backdrop-blur-sm"
                    >
                      <p className="text-sm font-bold text-white">
                        {BEVERAGE_CATEGORY_LABELS[bev.category] ?? bev.category}
                        {bev.customDescription
                          ? ` (${bev.customDescription})`
                          : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-orange-50">
                        Você leva{" "}
                        {formatBeverageItemSummary(
                          bev.quantity,
                          bev.unitVolumeMl,
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {participant.specialDish && (
              <div className="rounded-2xl border border-white/15 bg-black/15 p-3.5 backdrop-blur-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-200">
                  Gostosura / Prato adicional
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {participant.specialDish.description}
                </p>
                <p className="mt-0.5 text-xs text-orange-50">
                  {participant.specialDish.replacesItemName
                    ? `Substitui ${participant.specialDish.replacesItemName}.`
                    : "Adicional para a mesa compartilhada."}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200/35 bg-black/20 p-4 backdrop-blur-sm">
            <p className="text-sm font-bold text-white">
              Quer levar algum prato ou sobremesa? (Totalmente opcional)
            </p>
            <p className="mt-1 text-xs leading-relaxed text-orange-50">
              Sua presença já está garantida e confirmada à mesa! Se quiser levar
              uma travessa ou doce para somar com a família, você pode escolher
              quando quiser.
            </p>
            <a
              href="#confirmacao"
              onClick={() => requestParticipantStep("contribution")}
              className="mt-3 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-orange-900 shadow-sm transition hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <PlusCircle className="size-4" aria-hidden="true" />
              Escolher um prato (opcional)
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
          <a
            href="#confirmacao"
            onClick={() => requestParticipantStep("contribution")}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-white px-3.5 py-2.5 text-xs font-bold text-orange-900 shadow-sm transition hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Utensils className="size-3.5" aria-hidden="true" />
            {hasContribution ? "Alterar o que vou levar" : "Escolher um prato"}
          </a>

          <a
            href="#confirmacao"
            onClick={() => requestParticipantStep("presence")}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Edit3 className="size-3.5" aria-hidden="true" />
            Editar presença ({participant.peopleCount})
          </a>
        </div>

        {errorMessage && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-black/35 px-3.5 py-2.5 text-xs font-medium text-amber-100"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-amber-300"
              aria-hidden="true"
            />
            {errorMessage}
          </p>
        )}

        <div className="border-t border-white/20 pt-4">
          {!confirmingCancel ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-orange-100">
                Imprevisto? Você pode cancelar sua confirmação.
              </p>
              <button
                type="button"
                onClick={() => {
                  setConfirmingCancel(true);
                  setErrorMessage(null);
                }}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 self-start rounded-xl border border-white/25 bg-black/15 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:self-auto"
              >
                <X className="size-3.5" aria-hidden="true" />
                Não vou mais poder ir
              </button>
            </div>
          ) : (
            <div
              role="region"
              aria-label="Confirmação de cancelamento de presença"
              className="space-y-3 rounded-2xl border border-amber-200/40 bg-black/30 p-4"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-amber-300"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">
                    Confirmar cancelamento de presença?
                  </p>
                  <p className="text-xs leading-relaxed text-orange-50">
                    Sua presença ({pluralize(participant.peopleCount, "pessoa", "pessoas")})
                    {hasContribution
                      ? " e os itens que você assumiu serão removidos da lista."
                      : " será removida da lista de confirmados."}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={isCancelling}
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCancelling ? (
                    <>
                      <Loader2
                        className="size-3.5 animate-spin"
                        aria-hidden="true"
                      />
                      Cancelando...
                    </>
                  ) : (
                    "Sim, cancelar minha presença"
                  )}
                </button>

                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={() => setConfirmingCancel(false)}
                  className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-white/30 bg-white/15 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60"
                >
                  Manter minha presença
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
