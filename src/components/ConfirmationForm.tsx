"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  Loader2,
  UserPlus,
  Wine,
} from "lucide-react";
import {
  registerOrUpdateParticipant,
  type ActionState,
  type DashboardItem,
} from "@/app/actions/event";
import {
  CATEGORY_LABELS,
  CATEGORY_STYLES,
  formatQuantity,
  pluralize,
} from "@/lib/format";
import { storeParticipantId, useParticipantId } from "@/lib/participant-storage";

type ConfirmationFormProps = {
  items: DashboardItem[];
};

const initialState: ActionState = { status: "idle", message: "" };
const DEPENDENT_OPTIONS = [0, 1, 2, 3, 4, 5];

export function ConfirmationForm({ items }: ConfirmationFormProps) {
  const [state, formAction, isPending] = useActionState(
    registerOrUpdateParticipant,
    initialState,
  );

  const storedParticipantId = useParticipantId();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dependentsCount, setDependentsCount] = useState(0);
  const [bringsOwnDrink, setBringsOwnDrink] = useState(false);
  const [selectedFoodItemIds, setSelectedFoodItemIds] = useState<string[]>([]);

  useEffect(() => {
    if (state.status === "success" && state.participantId) {
      storeParticipantId(state.participantId);
    }
  }, [state]);

  function toggleFoodItem(foodItemId: string) {
    setSelectedFoodItemIds((current) =>
      current.includes(foodItemId)
        ? current.filter((id) => id !== foodItemId)
        : [...current, foodItemId],
    );
  }

  return (
    <section
      id="confirmacao"
      className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-900/5 sm:p-7 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mb-6 flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          <UserPlus className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Confirme sua presença
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Diga com quem você vem e assuma um ou mais itens do cardápio.
          </p>
        </div>
      </div>

      <form action={formAction} className="space-y-6">
        <input
          type="hidden"
          name="participantId"
          value={storedParticipantId ?? ""}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="participant-name"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Nome
            </label>
            <input
              id="participant-name"
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
              placeholder="Como a família te chama?"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-emerald-400"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="participant-phone"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              WhatsApp{" "}
              <span className="font-normal text-zinc-400 dark:text-zinc-500">
                (opcional)
              </span>
            </label>
            <input
              id="participant-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-emerald-400"
            />
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Acompanhantes
          </legend>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Inclua crianças e outros adultos que vêm com você.
          </p>
          <div className="grid grid-cols-6 gap-2">
            {DEPENDENT_OPTIONS.map((option) => {
              const isSelected = dependentsCount === option;

              return (
                <label
                  key={option}
                  className={`cursor-pointer rounded-xl border px-1 py-2.5 text-center text-sm font-semibold transition ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                      : "border-zinc-300 bg-white text-zinc-600 hover:border-emerald-400 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-emerald-500 dark:hover:text-emerald-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="dependentsCount"
                    value={option}
                    checked={isSelected}
                    onChange={() => setDependentsCount(option)}
                    className="sr-only"
                  />
                  +{option}
                </label>
              );
            })}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {dependentsCount === 0
              ? "Você vem sozinho(a)."
              : `Sua turma soma ${pluralize(dependentsCount + 1, "pessoa", "pessoas")}.`}
          </p>
        </fieldset>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 transition hover:border-emerald-300 dark:border-zinc-800 dark:bg-zinc-950/60 dark:hover:border-emerald-700">
          <input
            type="checkbox"
            name="bringsOwnDrink"
            checked={bringsOwnDrink}
            onChange={(event) => setBringsOwnDrink(event.target.checked)}
            className="peer sr-only"
          />
          <span
            className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition ${
              bringsOwnDrink
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-zinc-300 bg-white text-transparent dark:border-zinc-600 dark:bg-zinc-900"
            }`}
          >
            <Check className="size-3.5" aria-hidden="true" />
          </span>
          <span>
            <span className="flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-100">
              <Wine className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              Vou levar minha própria bebida
            </span>
            <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
              Cooler ou térmica individual, para não pesar no rateio.
            </span>
          </span>
        </label>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            O que você pode levar?
          </legend>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Marque um ou mais itens. As cotas são recalculadas automaticamente
            conforme novas confirmações chegam.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => {
              const isSelected = selectedFoodItemIds.includes(item.id);

              return (
                <label
                  key={item.id}
                  className={`group flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 transition ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50 shadow-sm dark:border-emerald-500/70 dark:bg-emerald-500/10"
                      : "border-zinc-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-emerald-700 dark:hover:bg-emerald-500/5"
                  }`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-zinc-300 bg-white text-transparent group-hover:border-emerald-400 dark:border-zinc-600 dark:bg-zinc-900"
                        }`}
                      >
                        <Check className="size-3.5" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                          {item.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                          {formatQuantity(item.portionPerPerson, item.unitMeasure)}{" "}
                          por pessoa
                        </span>
                      </span>
                    </span>

                    <input
                      type="checkbox"
                      name="selectedFoodItemIds"
                      value={item.id}
                      checked={isSelected}
                      onChange={() => toggleFoodItem(item.id)}
                      className="sr-only"
                    />
                  </span>

                  <span className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        CATEGORY_STYLES[item.category] ??
                        "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {CATEGORY_LABELS[item.category] ?? item.category}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {pluralize(
                        item.qtdVoluntarios,
                        "voluntário",
                        "voluntários",
                      )}
                    </span>
                    {item.qtdVoluntarios > 0 && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                        cota de{" "}
                        {formatQuantity(
                          item.cotaPorVoluntario,
                          item.unitMeasure,
                        )}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>

          {items.length === 0 && (
            <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              Nenhum item disponível ainda. Avise a organização!
            </p>
          )}
        </fieldset>

        {state.status !== "idle" && (
          <p
            role="status"
            aria-live="polite"
            className={`flex items-start gap-2 rounded-xl border px-3.5 py-3 text-sm ${
              state.status === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
            }`}
          >
            {state.status === "success" && (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            )}
            {state.message}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Você pode voltar depois para atualizar sua escolha.
          </p>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto dark:focus-visible:ring-offset-zinc-900"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Confirmar presença
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
