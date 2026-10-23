"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Utensils,
  Wine,
  X,
} from "lucide-react";
import {
  cancelParticipation,
  type DashboardItem,
  type DashboardParticipant,
} from "@/app/actions/event";
import { formatQuantity } from "@/lib/format";
import { clearStoredParticipantId, useParticipantId } from "@/lib/participant-storage";

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
  const participantId = useParticipantId();
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const participant = participantId
    ? participants.find((item) => item.id === participantId)
    : undefined;

  const myItems =
    participant && participant.itemIds.length > 0
      ? items
          .filter((item) => participant.itemIds.includes(item.id))
          .map((item) => ({
            item,
            quota:
              item.volunteers.find(
                (volunteer) => volunteer.participantId === participant.id,
              )?.quota ?? item.cotaPorVoluntario,
          }))
      : [];

  async function handleCancel() {
    if (!participant || isCancelling) return;

    setIsCancelling(true);
    setErrorMessage(null);

    const result = await cancelParticipation(participant.id);

    if (result.status === "success") {
      clearStoredParticipantId();
    } else {
      setErrorMessage(result.message);
    }

    setIsCancelling(false);
  }

  if (!participant) {
    return (
      <section className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm dark:bg-zinc-900 dark:text-emerald-300">
            <Utensils className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-emerald-950 dark:text-emerald-50">
              Sua cota personalizada
            </h2>
            <p className="text-sm leading-relaxed text-emerald-900/80 dark:text-emerald-100/80">
              {participantId
                ? "Não encontramos sua confirmação. Ela pode ter sido cancelada — preencha o formulário ao lado para entrar de novo."
                : "Confirme sua presença ao lado. Depois, este espaço mostra exatamente o que você ficou responsável por levar."}
            </p>
            <a
              href="#confirmacao"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 underline-offset-4 hover:underline dark:text-emerald-300"
            >
              Ir para a confirmação
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl shadow-emerald-900/15">
      <div className="space-y-5 p-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/80">
            Sua cota
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Olá, {participant.name}!
          </h2>
          <p className="text-sm leading-relaxed text-emerald-50/90">
            {myItems.length > 0
              ? "Você está responsável por:"
              : "Você confirmou presença, mas ainda não assumiu nenhum item. Escolha algo no cardápio ao lado."}
          </p>
        </div>

        {myItems.length > 0 && (
          <ul className="space-y-3">
            {myItems.map(({ item, quota }) => (
              <li
                key={item.id}
                className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm"
              >
                <p className="text-sm font-semibold text-white">{item.name}</p>
                <p className="mt-1 text-sm text-emerald-50/90">
                  Sua cota atualizada é de{" "}
                  <strong className="text-lg font-bold text-white">
                    {formatQuantity(quota, item.unitMeasure)}
                  </strong>{" "}
                  (para alimentar {totalPessoas}{" "}
                  {totalPessoas === 1 ? "pessoa" : "pessoas"} no total).
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/15 px-3 py-1 font-medium text-emerald-50">
            {participant.peopleCount}{" "}
            {participant.peopleCount === 1 ? "pessoa na sua turma" : "pessoas na sua turma"}
          </span>
          {participant.bringsOwnDrink && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-300/20 px-3 py-1 font-medium text-amber-100">
              <Wine className="size-3.5" aria-hidden="true" />
              Leva a própria bebida
            </span>
          )}
        </div>

        {errorMessage && (
          <p className="flex items-start gap-2 rounded-xl bg-red-950/30 px-3 py-2 text-xs text-red-100">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {errorMessage}
          </p>
        )}

        <div className="flex flex-col gap-2 border-t border-white/15 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-emerald-50/70">
            Precisa atualizar? Use o formulário ao lado.
          </p>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isCancelling}
            className="inline-flex items-center justify-center gap-1.5 self-start rounded-lg px-3 py-2 text-xs font-semibold text-emerald-50 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCancelling ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                Cancelando...
              </>
            ) : (
              <>
                <X className="size-3.5" aria-hidden="true" />
                Não vou mais poder ir
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
