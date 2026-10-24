"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  Sparkles,
  UserCheck,
  UserPlus,
  Utensils,
  Wine,
} from "lucide-react";
import {
  registerOrUpdateParticipant,
  type ActionState,
  type DashboardItem,
  type DashboardParticipant,
} from "@/app/actions/event";
import {
  CATEGORY_LABELS,
  CATEGORY_STYLES,
  pluralize,
} from "@/lib/format";
import { IceReminder } from "@/components/IceReminder";
import {
  clearStoredParticipantSession,
  PARTICIPANT_STEP_EVENT,
  storeParticipantSession,
  useParticipantSession,
  type ParticipantStep,
} from "@/lib/participant-storage";

type ConfirmationFormProps = {
  items: DashboardItem[];
  participants?: DashboardParticipant[];
  totalPessoas?: number;
};

type ItemCategoryFilter =
  | "TODOS"
  | "FALTAM"
  | "COMIDA"
  | "SOBREMESA"
  | "DESCARTAVEL";

const initialState: ActionState = { status: "idle", message: "" };
const QUICK_DEPENDENT_OPTIONS = [0, 1, 2, 3, 4, 5];

function getParticipantSignature(
  participant: DashboardParticipant | undefined,
): string {
  if (!participant) return "visitor";
  return [
    participant.id,
    participant.name,
    participant.dependentsCount,
    participant.bringsOwnDrink ? "1" : "0",
    participant.itemIds.join(","),
    participant.specialDish?.description ?? "",
    participant.specialDish?.replacesItemId ?? "",
  ].join("|");
}

export function ConfirmationForm({
  items,
  participants = [],
  totalPessoas = 0,
}: ConfirmationFormProps) {
  const [state, formAction, isPending] = useActionState(
    registerOrUpdateParticipant,
    initialState,
  );

  const session = useParticipantSession();

  const [dismissedState, setDismissedState] = useState<ActionState | null>(
    null,
  );
  const [lastHandledState, setLastHandledState] =
    useState<ActionState>(initialState);

  const activeActionState = state === dismissedState ? initialState : state;

  const activeParticipant = session?.participantId
    ? participants.find((item) => item.id === session.participantId)
    : undefined;

  const isConfirmedParticipant = Boolean(activeParticipant);

  const hasStaleSession = Boolean(
    session !== undefined &&
      session?.participantId &&
      participants.length >= 0 &&
      !activeParticipant,
  );

  const [activeStep, setActiveStep] = useState<ParticipantStep>("presence");
  const [includeItemsInStep1, setIncludeItemsInStep1] = useState(false);
  const [categoryFilter, setCategoryFilter] =
    useState<ItemCategoryFilter>("TODOS");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [dependentsCount, setDependentsCount] = useState(0);
  const [bringsOwnDrink, setBringsOwnDrink] = useState(false);
  const [selectedFoodItemIds, setSelectedFoodItemIds] = useState<string[]>([]);
  const [specialDishDescription, setSpecialDishDescription] = useState("");
  const [specialDishReplacesItemId, setSpecialDishReplacesItemId] =
    useState("");
  const [showSpecialDishFields, setShowSpecialDishFields] = useState(false);

  const participantSignature = getParticipantSignature(activeParticipant);
  const [syncedSignature, setSyncedSignature] = useState<string>("init");

  if (session !== undefined && participantSignature !== syncedSignature) {
    const previousSignature = syncedSignature;
    setSyncedSignature(participantSignature);
    if (activeParticipant) {
      setName(activeParticipant.name);
      setDependentsCount(activeParticipant.dependentsCount);
      setBringsOwnDrink(activeParticipant.bringsOwnDrink);
      setSelectedFoodItemIds(activeParticipant.itemIds);
      const existingSpecialDescription =
        activeParticipant.specialDish?.description ?? "";
      const existingSpecialReplaces =
        activeParticipant.specialDish?.replacesItemId ?? "";
      setSpecialDishDescription(existingSpecialDescription);
      setSpecialDishReplacesItemId(existingSpecialReplaces);
      setShowSpecialDishFields(Boolean(existingSpecialDescription));
      if (session?.phone && !phoneTouched) {
        setPhone(session.phone);
      }
      if (previousSignature === "init") {
        setActiveStep("contribution");
      }
    } else if (previousSignature !== "init") {
      setDismissedState(state);
      setName("");
      setPhone("");
      setPhoneTouched(false);
      setDependentsCount(0);
      setBringsOwnDrink(false);
      setSelectedFoodItemIds([]);
      setSpecialDishDescription("");
      setSpecialDishReplacesItemId("");
      setShowSpecialDishFields(false);
      setIncludeItemsInStep1(false);
      setActiveStep("presence");
    }
  }

  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.status === "success" && state.stepCompleted === "presence") {
      setActiveStep("contribution");
    }
  }

  const clearPhoneFlag =
    phoneTouched && phone.trim().length === 0 ? "true" : "false";

  const lastPersistedStateRef = useRef<ActionState>(initialState);

  useEffect(() => {
    if (state === lastPersistedStateRef.current) {
      return;
    }
    lastPersistedStateRef.current = state;

    if (
      state.status === "success" &&
      state.participantId &&
      state.participantToken
    ) {
      storeParticipantSession(
        state.participantId,
        state.participantToken,
        phone,
        clearPhoneFlag === "true",
      );
    }
  }, [state, phone, clearPhoneFlag]);

  useEffect(() => {
    function handleStepRequest(event: Event) {
      const customEvent = event as CustomEvent<ParticipantStep>;
      if (
        customEvent.detail === "presence" ||
        customEvent.detail === "contribution"
      ) {
        setActiveStep(customEvent.detail);
      }
    }

    window.addEventListener(PARTICIPANT_STEP_EVENT, handleStepRequest);
    return () => {
      window.removeEventListener(PARTICIPANT_STEP_EVENT, handleStepRequest);
    };
  }, []);

  function toggleFoodItem(foodItemId: string) {
    setSelectedFoodItemIds((current) =>
      current.includes(foodItemId)
        ? current.filter((id) => id !== foodItemId)
        : [...current, foodItemId],
    );
  }

  function handleToggleSpecialDish() {
    if (showSpecialDishFields) {
      setShowSpecialDishFields(false);
      setSpecialDishDescription("");
      setSpecialDishReplacesItemId("");
    } else {
      setShowSpecialDishFields(true);
    }
  }

  function handleReplacementChange(value: string) {
    setSpecialDishReplacesItemId(value);

    if (value) {
      setSelectedFoodItemIds((current) =>
        current.filter((id) => id !== value),
      );
    }
  }

  function handleResetInvalidSession() {
    setDismissedState(state);
    clearStoredParticipantSession();
    setActiveStep("presence");
  }

  const effectiveParticipantId = activeParticipant ? activeParticipant.id : "";
  const effectiveParticipantToken = effectiveParticipantId
    ? (session?.participantToken ??
      (activeActionState.status === "success" &&
      activeActionState.participantId === effectiveParticipantId
        ? (activeActionState.participantToken ?? "")
        : ""))
    : "";

  const totalGroupPeople = dependentsCount + 1;
  const effectiveTotalPessoas = Math.max(totalPessoas, totalGroupPeople);

  const itemsMissingVolunteersCount = items.filter(
    (item) => !item.isEnough,
  ).length;

  const filteredItems = items.filter((item) => {
    if (categoryFilter === "TODOS") return true;
    if (categoryFilter === "FALTAM") {
      return !item.isEnough || selectedFoodItemIds.includes(item.id);
    }
    return item.category === categoryFilter;
  });

  const effectiveSpecialDishDescription = showSpecialDishFields
    ? specialDishDescription.trim()
    : "";

  const hasCurrentContribution =
    selectedFoodItemIds.length > 0 ||
    effectiveSpecialDishDescription.length > 0;

  const currentStep: ParticipantStep = isConfirmedParticipant
    ? activeStep
    : "presence";

  const formScope =
    currentStep === "contribution"
      ? "contribution"
      : includeItemsInStep1 && !isConfirmedParticipant
        ? "full"
        : "presence";

  function renderItemSelectorSection() {
    return (
      <div className="space-y-5">
        <fieldset className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <legend className="text-base font-bold text-orange-950">
                Itens básicos do almoço
              </legend>
              <p className="mt-0.5 text-xs leading-relaxed text-stone-600">
                Marque o que você pode levar. Cada escolha corresponde a 1
                porção familiar ou pacote sugerido.
              </p>
            </div>
            {selectedFoodItemIds.length > 0 && (
              <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-900">
                <Check className="size-3.5" aria-hidden="true" />
                {pluralize(
                  selectedFoodItemIds.length,
                  "item selecionado",
                  "itens selecionados",
                )}
              </span>
            )}
          </div>

          {items.length > 0 && (
            <div
              role="group"
              aria-label="Filtrar itens do cardápio por categoria"
              className="flex flex-wrap gap-1.5"
            >
              {(
                [
                  { id: "TODOS", label: `Todos (${items.length})` },
                  ...(effectiveTotalPessoas > 0 &&
                  itemsMissingVolunteersCount < items.length
                    ? [
                        {
                          id: "FALTAM",
                          label: `Em aberto (${itemsMissingVolunteersCount})`,
                        },
                      ]
                    : []),
                  { id: "COMIDA", label: "Comidas" },
                  { id: "SOBREMESA", label: "Sobremesas" },
                  {
                    id: "DESCARTAVEL",
                    label: "Descartáveis e infraestrutura",
                  },
                ] as { id: ItemCategoryFilter; label: string }[]
              ).map((tab) => {
                const isActive = categoryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCategoryFilter(tab.id)}
                    aria-pressed={isActive}
                    className={`min-h-9 rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-1 ${
                      isActive
                        ? "bg-orange-800 text-white shadow-sm"
                        : "border border-orange-200 bg-orange-50/70 text-stone-800 hover:bg-orange-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}

          { selectedFoodItemIds
            .filter((id) => !filteredItems.some((item) => item.id === id))
            .map((hiddenSelectedId) => (
              <input
                key={hiddenSelectedId}
                type="hidden"
                name="selectedFoodItemIds"
                value={hiddenSelectedId}
              />
            )) }

          <div className="grid gap-3 sm:grid-cols-2">
            {filteredItems.map((item) => {
              const isSelected = selectedFoodItemIds.includes(item.id);
              const isAlreadyAssignedToMe = Boolean(
                activeParticipant?.itemIds.includes(item.id),
              );
              const isUnavailableForNewChoice =
                item.isEnough && !isSelected && !isAlreadyAssignedToMe;

              let statusBadge: { label: string; className: string };
              if (totalPessoas === 0 && item.qtdVoluntarios === 0) {
                statusBadge = {
                  label: "Aguardando confirmações",
                  className: "bg-stone-100 text-stone-700 border-stone-200",
                };
              } else if (isUnavailableForNewChoice) {
                statusBadge = {
                  label: "Cobertura suficiente · Indisponível",
                  className: "bg-stone-200/80 text-stone-700 border-stone-300",
                };
              } else if (item.isEnough) {
                statusBadge = {
                  label: "Cobertura suficiente",
                  className:
                    "bg-emerald-50 text-emerald-900 border-emerald-200",
                };
              } else if (item.qtdVoluntarios === 0) {
                statusBadge = {
                  label:
                    item.suggestedServings > 0
                      ? `Sem voluntários · faltam ${item.suggestedServings}`
                      : "Sem voluntários",
                  className: "bg-amber-100 text-amber-950 border-amber-300",
                };
              } else {
                statusBadge = {
                  label: `Cobertura parcial · Faltam ${item.missingServings} ${
                    item.missingServings === 1
                      ? item.servingLabel
                      : item.servingLabelPlural
                  }`,
                  className: "bg-orange-100 text-orange-950 border-orange-200",
                };
              }

              return (
                <label
                  key={item.id}
                  className={`group relative flex flex-col justify-between gap-3 rounded-2xl border p-4 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-orange-700 has-[:focus-visible]:ring-offset-2 ${
                    isUnavailableForNewChoice
                      ? "cursor-not-allowed border-stone-200 bg-stone-100/70 opacity-75"
                      : isSelected
                        ? "cursor-pointer border-orange-700 bg-orange-50/90 shadow-sm ring-1 ring-orange-700/20"
                        : "cursor-pointer border-orange-200/80 bg-white hover:border-orange-400 hover:bg-orange-50/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition ${
                          isUnavailableForNewChoice
                            ? "border-stone-300 bg-stone-200 text-transparent"
                            : isSelected
                              ? "border-orange-700 bg-orange-700 text-white"
                              : "border-orange-300 bg-white text-transparent group-hover:border-orange-500"
                        }`}
                      >
                        <Check className="size-3.5" />
                      </span>
                      <div className="space-y-1">
                        <span className="block text-sm font-bold leading-snug text-orange-950">
                          {item.name}
                        </span>
                        <span className="block text-xs leading-relaxed text-stone-700">
                          <strong className="font-semibold text-stone-900">
                            1 {item.servingLabel}
                          </strong>{" "}
                          ({item.servesDescription})
                        </span>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      name="selectedFoodItemIds"
                      value={item.id}
                      checked={isSelected}
                      disabled={isUnavailableForNewChoice}
                      onChange={() => toggleFoodItem(item.id)}
                      className="sr-only"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-orange-100/80 pt-2.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        CATEGORY_STYLES[item.category] ??
                        "bg-orange-100 text-stone-800"
                      }`}
                    >
                      {CATEGORY_LABELS[item.category] ?? item.category}
                    </span>

                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge.className}`}
                    >
                      {statusBadge.label}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>

          {items.length === 0 && (
            <p className="rounded-xl border border-dashed border-orange-200 p-4 text-sm text-stone-600">
              Nenhum item disponível no cardápio ainda. Avise a organização!
            </p>
          )}
        </fieldset>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Sparkles
                className="mt-0.5 size-4 shrink-0 text-amber-800"
                aria-hidden="true"
              />
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  Prato adicional, doce, fruta ou petisco (opcional)
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed text-amber-950/80">
                  Quer levar salpicão, bolo, pavê, melancia ou petisco para a
                  mesa compartilhada?
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleSpecialDish}
              aria-expanded={showSpecialDishFields}
              className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-950 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700"
            >
              {showSpecialDishFields ? (
                <>
                  Remover prato adicional
                  <ChevronUp className="size-3.5" aria-hidden="true" />
                </>
              ) : (
                <>
                  Informar prato
                  <ChevronDown className="size-3.5" aria-hidden="true" />
                </>
              )}
            </button>
          </div>

          {showSpecialDishFields ? (
            <div className="mt-4 space-y-4 border-t border-amber-200/80 pt-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="special-dish-description"
                  className="block text-sm font-semibold text-amber-950"
                >
                  Descreva o que você vai levar
                </label>
                <textarea
                  id="special-dish-description"
                  name="specialDishDescription"
                  rows={2}
                  maxLength={120}
                  value={specialDishDescription}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setSpecialDishDescription(nextValue);
                    if (nextValue.trim().length === 0) {
                      setSpecialDishReplacesItemId("");
                    }
                  }}
                  placeholder="Ex.: Salpicão de frango, pudim, melancia fatiada, torta salgada..."
                  className="w-full resize-y rounded-xl border border-amber-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-500 focus:border-orange-700 focus:ring-2 focus:ring-orange-700/20"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="special-dish-replacement"
                  className="block text-sm font-semibold text-amber-950"
                >
                  Isso substitui um item básico da sua cota?
                </label>
                <select
                  id="special-dish-replacement"
                  name="specialDishReplacesItemId"
                  value={
                    specialDishDescription.trim().length > 0
                      ? specialDishReplacesItemId
                      : ""
                  }
                  onChange={(event) =>
                    handleReplacementChange(event.target.value)
                  }
                  className="min-h-11 w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-sm outline-none transition focus:border-orange-700 focus:ring-2 focus:ring-orange-700/20"
                >
                  <option value="">Não, é um prato adicional para a mesa</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      Sim, substitui {item.name}
                    </option>
                  ))}
                </select>
                {specialDishDescription.trim().length > 0 &&
                  specialDishReplacesItemId && (
                    <p className="text-xs font-medium text-amber-950">
                      Esse item básico sai da sua seleção e seu prato entra na
                      mesa compartilhada.
                    </p>
                  )}
              </div>
            </div>
          ) : (
            <>
              <input
                type="hidden"
                name="specialDishDescription"
                value=""
              />
              <input
                type="hidden"
                name="specialDishReplacesItemId"
                value=""
              />
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <section
      id="confirmacao"
      aria-labelledby="confirmacao-heading"
      className="scroll-mt-6 rounded-3xl border border-orange-200/80 bg-white p-5 shadow-sm shadow-orange-950/5 sm:p-7"
    >
      {hasStaleSession && (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle
              className="mt-0.5 size-4 shrink-0 text-amber-800"
              aria-hidden="true"
            />
            <p className="leading-relaxed">
              Sua confirmação anterior neste aparelho não está mais ativa (pode
              ter sido cancelada). Você pode confirmar sua presença novamente
              abaixo.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetInvalidSession}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-amber-400 bg-white px-3.5 py-2 text-xs font-bold text-amber-950 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Limpar aviso
          </button>
        </div>
      )}

      <div className="mb-6 space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-800">
            {isConfirmedParticipant ? (
              <UserCheck className="size-5" aria-hidden="true" />
            ) : (
              <UserPlus className="size-5" aria-hidden="true" />
            )}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="confirmacao-heading"
                className="text-lg font-bold tracking-tight text-orange-950 sm:text-xl"
              >
                {isConfirmedParticipant
                  ? `Participação de ${activeParticipant?.name ?? (name || "sua família")}`
                  : "Confirme sua presença no almoço"}
              </h2>
              {isConfirmedParticipant && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900">
                  <Check className="size-3 text-emerald-700" aria-hidden="true" />
                  Presença confirmada
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm leading-relaxed text-stone-600">
              {isConfirmedParticipant
                ? "Que alegria ter você com a gente! Escolha ou atualize o que vai levar, ou ajuste seus acompanhantes quando precisar."
                : "Passo 1: avise quem vem com você. Não é preciso escolher um prato agora."}
            </p>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Etapas da confirmação"
          className="grid grid-cols-2 gap-2 rounded-2xl bg-orange-50/90 p-1.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={currentStep === "presence"}
            onClick={() => setActiveStep("presence")}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition sm:text-sm ${
              currentStep === "presence"
                ? "bg-white text-orange-950 shadow-sm ring-1 ring-orange-200"
                : "text-stone-700 hover:bg-white/60 hover:text-orange-950"
            }`}
          >
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                isConfirmedParticipant
                  ? "bg-emerald-600 text-white"
                  : currentStep === "presence"
                    ? "bg-orange-800 text-white"
                    : "bg-orange-200 text-orange-950"
              }`}
            >
              {isConfirmedParticipant ? (
                <Check className="size-3" aria-hidden="true" />
              ) : (
                "1"
              )}
            </span>
            <span className="truncate">
              {isConfirmedParticipant
                ? "Presença confirmada"
                : "Confirmar presença"}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={currentStep === "contribution"}
            disabled={!isConfirmedParticipant}
            onClick={() => setActiveStep("contribution")}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition sm:text-sm ${
              currentStep === "contribution"
                ? "bg-white text-orange-950 shadow-sm ring-1 ring-orange-200"
                : isConfirmedParticipant
                  ? "text-stone-700 hover:bg-white/60 hover:text-orange-950"
                  : "cursor-not-allowed text-stone-400"
            }`}
          >
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                hasCurrentContribution && isConfirmedParticipant
                  ? "bg-emerald-600 text-white"
                  : currentStep === "contribution"
                    ? "bg-orange-800 text-white"
                    : "bg-orange-200/70 text-stone-700"
              }`}
            >
              {hasCurrentContribution && isConfirmedParticipant ? (
                <Check className="size-3" aria-hidden="true" />
              ) : (
                "2"
              )}
            </span>
            <span className="truncate">Escolher o que levar</span>
          </button>
        </div>
      </div>

      {activeActionState.status !== "idle" && (
        <div
          role="status"
          aria-live="polite"
          className={`mb-6 rounded-2xl border p-4 text-sm ${
            activeActionState.status === "success"
              ? "border-emerald-300 bg-emerald-50/90 text-emerald-950"
              : "border-red-300 bg-red-50 text-red-950"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {activeActionState.status === "success" ? (
              <CheckCircle2
                className="mt-0.5 size-5 shrink-0 text-emerald-700"
                aria-hidden="true"
              />
            ) : (
              <AlertCircle
                className="mt-0.5 size-5 shrink-0 text-red-700"
                aria-hidden="true"
              />
            )}
            <div className="flex-1 space-y-2">
              {activeActionState.status === "success" && (
                <p className="text-base font-bold text-emerald-950 sm:text-lg">
                  Que alegria! Sua presença está confirmada!
                </p>
              )}
              <p className="font-semibold leading-relaxed">
                {activeActionState.message}
              </p>

              {activeActionState.status === "success" &&
                isConfirmedParticipant && (
                  <p className="text-xs text-emerald-900">
                    Resumo: <strong>{activeParticipant?.name ?? name}</strong> ·{" "}
                    <strong>
                      {pluralize(
                        activeParticipant?.peopleCount ?? totalGroupPeople,
                        "pessoa confirmada",
                        "pessoas confirmadas",
                      )}
                    </strong>
                    {selectedFoodItemIds.length > 0
                      ? ` · ${pluralize(selectedFoodItemIds.length, "item assumido", "itens assumidos")}`
                      : " · nenhum prato assumido ainda (opcional)"}
                    .
                  </p>
                )}

              {activeActionState.status === "error" &&
                activeActionState.message.toLowerCase().includes("sessão") && (
                  <button
                    type="button"
                    onClick={handleResetInvalidSession}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-red-300 bg-white px-3.5 py-2 text-xs font-bold text-red-900 transition hover:bg-red-100"
                  >
                    <RefreshCw className="size-3.5" aria-hidden="true" />
                    Iniciar uma nova confirmação
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="formScope" value={formScope} />
        <input
          type="hidden"
          name="participantId"
          value={effectiveParticipantId}
        />
        <input
          type="hidden"
          name="participantToken"
          value={effectiveParticipantToken}
        />
        <input type="hidden" name="clearPhone" value={clearPhoneFlag} />

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

        {currentStep === "presence" ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="participant-name"
                  className="block text-sm font-semibold text-stone-800"
                >
                  Seu nome{" "}
                  <span className="text-xs font-normal text-orange-800">
                    (obrigatório)
                  </span>
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
                  className="min-h-11 w-full rounded-xl border border-orange-300 bg-orange-50/40 px-3.5 py-2.5 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-500 focus:border-orange-700 focus:bg-white focus:ring-2 focus:ring-orange-700/20"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="participant-phone"
                  className="block text-sm font-semibold text-stone-800"
                >
                  WhatsApp{" "}
                  <span className="text-xs font-normal text-stone-600">
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
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setPhoneTouched(true);
                  }}
                  className="min-h-11 w-full rounded-xl border border-orange-300 bg-orange-50/40 px-3.5 py-2.5 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-500 focus:border-orange-700 focus:bg-white focus:ring-2 focus:ring-orange-700/20"
                />
              </div>
            </div>

            <fieldset className="space-y-4 rounded-2xl border border-orange-200/80 bg-orange-50/40 p-4 sm:p-5">
              <div className="space-y-1">
                <legend className="text-sm font-bold text-orange-950 sm:text-base">
                  Quantos acompanhantes vêm com você?
                </legend>
                <p className="text-xs leading-relaxed text-stone-600">
                  Conte adultos e crianças da sua família (sem contar você).
                </p>
              </div>

              {/* Distinction breakdown card */}
              <div
                aria-live="polite"
                className="grid grid-cols-3 gap-2 rounded-xl border border-orange-200/80 bg-white/90 p-2.5 text-center shadow-xs"
              >
                <div className="rounded-lg bg-orange-50/80 px-2 py-1.5">
                  <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                    Titular
                  </span>
                  <span className="block text-sm font-bold text-orange-950">
                    Você (1)
                  </span>
                </div>
                <div className="rounded-lg bg-orange-50/80 px-2 py-1.5">
                  <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                    Acompanhantes
                  </span>
                  <span className="block text-sm font-bold text-orange-950">
                    +{dependentsCount}
                  </span>
                </div>
                <div className="rounded-lg bg-orange-800 px-2 py-1.5 text-white shadow-xs">
                  <span className="block text-[11px] font-semibold text-orange-100 uppercase tracking-wider">
                    Total à mesa
                  </span>
                  <span className="block text-sm font-extrabold text-white">
                    {pluralize(totalGroupPeople, "pessoa", "pessoas")}
                  </span>
                </div>
              </div>

              {/* Quick options 0 to 5 */}
              <div className="space-y-2">
                <span className="block text-xs font-semibold text-stone-700">
                  Escolha rápida de acompanhantes:
                </span>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {QUICK_DEPENDENT_OPTIONS.map((option) => {
                    const isSelected = dependentsCount === option;

                    return (
                      <label
                        key={option}
                        className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border px-2 py-2.5 text-center text-sm font-bold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-orange-700 has-[:focus-visible]:ring-offset-2 ${
                          isSelected
                            ? "border-orange-800 bg-orange-800 text-white shadow-sm"
                            : "border-orange-200 bg-white text-stone-800 hover:border-orange-400 hover:bg-orange-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="dependentsCountRadio"
                          value={option}
                          checked={isSelected}
                          onChange={() => setDependentsCount(option)}
                          className="sr-only"
                        />
                        {option === 0 ? "Só eu (0)" : `+${option}`}
                      </label>
                    );
                  })}
                </div>
              </div>

              <input
                type="hidden"
                name="dependentsCount"
                value={dependentsCount}
              />

              {/* Fine tuning / more than 5 */}
              <div className="flex flex-col gap-2 rounded-xl border border-orange-200/70 bg-white/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-stone-700 font-medium">
                  {dependentsCount === 0
                    ? "Você vem sozinho(a) — 1 lugar à mesa."
                    : `Você + ${pluralize(dependentsCount, "acompanhante", "acompanhantes")} = ${pluralize(totalGroupPeople, "pessoa", "pessoas")} à mesa.`}
                </span>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="text-xs font-semibold text-stone-700">
                    Ajuste fino (ou mais de 5):
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Diminuir um acompanhante"
                      disabled={dependentsCount <= 0}
                      onClick={() =>
                        setDependentsCount((prev) => Math.max(0, prev - 1))
                      }
                      className="inline-flex size-11 items-center justify-center rounded-xl border border-orange-300 bg-white text-stone-800 shadow-2xs transition hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 disabled:opacity-40"
                    >
                      <Minus className="size-4" aria-hidden="true" />
                    </button>
                    <span className="min-w-8 text-center text-sm font-extrabold text-orange-950">
                      +{dependentsCount}
                    </span>
                    <button
                      type="button"
                      aria-label="Aumentar um acompanhante"
                      disabled={dependentsCount >= 20}
                      onClick={() =>
                        setDependentsCount((prev) => Math.min(20, prev + 1))
                      }
                      className="inline-flex size-11 items-center justify-center rounded-xl border border-orange-300 bg-white text-stone-800 shadow-2xs transition hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 disabled:opacity-40"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </fieldset>

            <div className="space-y-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-orange-200/80 bg-orange-50/40 p-4 transition hover:border-orange-400 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-orange-700 has-[:focus-visible]:ring-offset-2">
                <input
                  type="checkbox"
                  name="bringsOwnDrink"
                  checked={bringsOwnDrink}
                  onChange={(event) => setBringsOwnDrink(event.target.checked)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition ${
                    bringsOwnDrink
                      ? "border-orange-700 bg-orange-700 text-white"
                      : "border-orange-300 bg-white text-transparent"
                  }`}
                >
                  <Check className="size-3.5" />
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-2 text-sm font-bold text-orange-950">
                    <Wine
                      className="size-4 text-orange-700"
                      aria-hidden="true"
                    />
                    Vou levar minha própria bebida (opcional)
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-stone-600">
                    Marque se for trazer seu cooler ou térmica individual.
                  </span>
                </span>
              </label>

              {bringsOwnDrink && <IceReminder />}
            </div>

            {!isConfirmedParticipant && (
              <div className="rounded-2xl border border-orange-200/70 bg-orange-50/30 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-orange-950">
                      Quer escolher um prato agora ou depois?
                    </p>
                    <p className="text-xs text-stone-600">
                      Você pode confirmar apenas sua presença agora e escolher o
                      prato na etapa seguinte.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIncludeItemsInStep1((prev) => !prev)}
                    aria-expanded={includeItemsInStep1}
                    className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 self-start rounded-xl border border-orange-300 bg-white px-3.5 py-2 text-xs font-bold text-orange-900 transition hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 sm:self-auto"
                  >
                    <Utensils className="size-3.5" aria-hidden="true" />
                    {includeItemsInStep1
                      ? "Confirmar só presença primeiro"
                      : "Já quero escolher o que levar"}
                  </button>
                </div>

                {includeItemsInStep1 && (
                  <div className="mt-5 border-t border-orange-200/70 pt-5">
                    {renderItemSelectorSection()}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-orange-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-relaxed text-stone-600">
                {isConfirmedParticipant
                  ? "Seus pratos já escolhidos são preservados ao salvar seus dados."
                  : "Após confirmar presença, você poderá ver e escolher o que levar com calma."}
              </p>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {isConfirmedParticipant && (
                  <button
                    type="button"
                    onClick={() => setActiveStep("contribution")}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-orange-300 bg-white px-4 py-3 text-sm font-bold text-orange-900 transition hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700"
                  >
                    Ir para escolha de pratos
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                >
                  {isPending ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                      {isConfirmedParticipant
                        ? "Salvar dados de presença"
                        : includeItemsInStep1 && hasCurrentContribution
                          ? "Confirmar presença e contribuição"
                          : "Confirmar minha presença"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div id="escolher-contribuicao" className="space-y-6">
            <input type="hidden" name="name" value={name} />
            <input
              type="hidden"
              name="dependentsCount"
              value={dependentsCount}
            />
            {bringsOwnDrink && (
              <input type="hidden" name="bringsOwnDrink" value="true" />
            )}

            {renderItemSelectorSection()}

            <div className="flex flex-col gap-3 border-t border-orange-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-stone-700">
                  {hasCurrentContribution
                    ? "Revise sua escolha e clique em salvar."
                    : "Ainda não sabe o que levar? Sem problemas, sua presença já está garantida!"}
                </p>
                <a
                  href="#cardapio"
                  className="inline-block text-xs font-bold text-orange-800 underline-offset-4 hover:underline"
                >
                  Consultar quem já assumiu cada item no cardápio abaixo
                </a>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {isPending ? (
                  <>
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    {hasCurrentContribution
                      ? "Salvar minha contribuição"
                      : "Continuar sem assumir prato agora"}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </section>
  );
}
