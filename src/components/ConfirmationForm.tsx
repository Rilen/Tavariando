"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  Loader2,
  Sparkles,
  UserPlus,
  Wine,
} from "lucide-react";
import {
  registerOrUpdateParticipant,
  type ActionState,
  type DashboardItem,
} from "@/app/actions/event";
import { CATEGORY_LABELS, CATEGORY_STYLES, pluralize } from "@/lib/format";
import { IceReminder } from "@/components/IceReminder";
import {
  storeParticipantSession,
  useParticipantSession,
} from "@/lib/participant-storage";

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

  const session = useParticipantSession();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dependentsCount, setDependentsCount] = useState(0);
  const [bringsOwnDrink, setBringsOwnDrink] = useState(false);
  const [selectedFoodItemIds, setSelectedFoodItemIds] = useState<string[]>([]);
  const [specialDishDescription, setSpecialDishDescription] = useState("");
  const [specialDishReplacesItemId, setSpecialDishReplacesItemId] =
    useState("");

  useEffect(() => {
    if (
      state.status === "success" &&
      state.participantId &&
      state.participantToken
    ) {
      storeParticipantSession(state.participantId, state.participantToken);
    }
  }, [state]);

  function toggleFoodItem(foodItemId: string) {
    setSelectedFoodItemIds((current) =>
      current.includes(foodItemId)
        ? current.filter((id) => id !== foodItemId)
        : [...current, foodItemId],
    );
  }

  function handleReplacementChange(value: string) {
    setSpecialDishReplacesItemId(value);

    if (value) {
      setSelectedFoodItemIds((current) =>
        current.filter((id) => id !== value),
      );
    }
  }

  return (
    <section
      id="confirmacao"
      className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-900/5 sm:p-7 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mb-6 flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-amber-300">
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
          value={session?.participantId ?? ""}
        />
        <input
          type="hidden"
          name="participantToken"
          value={session?.participantToken ?? ""}
        />

        <div
          aria-hidden="true"
          className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
        >
          <label htmlFor="website">Não preencha este campo</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

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
              maxLength={60}
              autoComplete="name"
              placeholder="Como a família te chama?"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-amber-400"
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
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-amber-400"
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
                      ? "border-orange-400 bg-orange-500 text-white shadow-sm"
                      : "border-zinc-300 bg-white text-zinc-600 hover:border-amber-400 hover:text-orange-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-orange-500 dark:hover:text-amber-300"
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

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 transition hover:border-amber-300 dark:border-zinc-800 dark:bg-zinc-950/60 dark:hover:border-orange-700">
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
                ? "border-orange-500 bg-orange-500 text-white"
                : "border-zinc-300 bg-white text-transparent dark:border-zinc-600 dark:bg-zinc-900"
            }`}
          >
            <Check className="size-3.5" aria-hidden="true" />
          </span>
          <span>
            <span className="flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-100">
              <Wine className="size-4 text-orange-600 dark:text-amber-400" aria-hidden="true" />
              Vou levar minha própria bebida
            </span>
            <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
              Cooler ou térmica individual, para não pesar no rateio.
            </span>
          </span>
        </label>

        <IceReminder />

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
                      ? "border-orange-500 bg-orange-50 shadow-sm dark:border-orange-500/70 dark:bg-orange-500/10"
                      : "border-zinc-200 bg-white hover:border-amber-300 hover:bg-orange-50/40 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-orange-700 dark:hover:bg-orange-500/5"
                  }`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition ${
                          isSelected
                            ? "border-orange-500 bg-orange-500 text-white"
                            : "border-zinc-300 bg-white text-transparent group-hover:border-amber-400 dark:border-zinc-600 dark:bg-zinc-900"
                        }`}
                      >
                        <Check className="size-3.5" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                          {item.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                          <strong className="font-semibold text-zinc-700 dark:text-zinc-300">
                            1 {item.servingLabel}
                          </strong>{" "}
                          ({item.servesDescription})
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
                    {item.isEnough ? (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-800 dark:bg-orange-500/15 dark:text-amber-300">
                        Suficiente garantido
                      </span>
                    ) : item.suggestedServings > 0 ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                        Faltam {item.missingServings}{" "}
                        {item.missingServings === 1
                          ? item.servingLabel
                          : item.servingLabelPlural}
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        Aguardando confirmações
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

        <fieldset className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-amber-950 dark:text-amber-100">
            <Sparkles className="size-4" aria-hidden="true" />
            Quer levar algum prato adicional, doce, fruta ou petisco?
          </legend>
          <p className="text-xs leading-relaxed text-amber-900/80 dark:text-amber-100/80">
            Conte para a família o que você vai levar e combine se isso entra no
            lugar de um item básico.
          </p>

          <div className="space-y-2">
            <label
              htmlFor="special-dish-description"
              className="text-sm font-medium text-amber-950 dark:text-amber-100"
            >
              Descreva o que você vai levar
            </label>
            <textarea
              id="special-dish-description"
              name="specialDishDescription"
              rows={2}
              maxLength={120}
              value={specialDishDescription}
              onChange={(event) =>
                setSpecialDishDescription(event.target.value)
              }
              placeholder="(Ex: Salpicão, pipoca, bolo, pavê, torta, melancia, etc.)"
              className="w-full resize-y rounded-xl border border-amber-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-amber-500/40 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-amber-400"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="special-dish-replacement"
              className="text-sm font-medium text-amber-950 dark:text-amber-100"
            >
              Isso substitui um item comum?
            </label>
            <select
              id="special-dish-replacement"
              name="specialDishReplacesItemId"
              value={specialDishReplacesItemId}
              onChange={(event) =>
                handleReplacementChange(event.target.value)
              }
              className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-amber-500/40 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-amber-400"
            >
              <option value="">Não, é adicional</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  Sim, substitui {item.name}
                </option>
              ))}
            </select>
            {specialDishReplacesItemId && (
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Esse item sai da sua lista de pratos básicos; o prato adicional
                entra na mesa compartilhada.
              </p>
            )}
          </div>
        </fieldset>

        {state.status !== "idle" && (
          <p
            role="status"
            aria-live="polite"
            className={`flex items-start gap-2 rounded-xl border px-3.5 py-3 text-sm ${
              state.status === "success"
                ? "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-amber-300"
                : "border-amber-200 bg-amber-50 text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-amber-300"
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto dark:focus-visible:ring-offset-zinc-900"
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
