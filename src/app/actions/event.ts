"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServingProfile } from "@/lib/servings";
import { getClientIp } from "@/lib/request-ip";
import { checkRateLimit } from "@/lib/rate-limit";
import { DASHBOARD_CACHE_TAG } from "@/lib/cache-tags";
import {
  generateSessionToken,
  hashSessionToken,
  verifySessionToken,
} from "@/lib/session-token";
import {
  contributionInputSchema,
  firstValidationMessage,
  participantIdSchema,
  participantInputSchema,
  sessionTokenSchema,
  type SharedBeverageItemInput,
} from "@/lib/validation";


const RATE_LIMIT_MESSAGE =
  "Muitas tentativas em pouco tempo. Aguarde um minuto e tente novamente.";

class ItemCapacityError extends Error {
  constructor(readonly itemName: string) {
    super(
      `O item "${itemName}" já está com o número suficiente de voluntários.`,
    );
    this.name = "ItemCapacityError";
  }
}

class UnauthorizedSessionError extends Error {
  constructor() {
    super("Sessão inválida ou expirada.");
    this.name = "UnauthorizedSessionError";
  }
}

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getFormStringArray(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string");
}

export type DashboardVolunteer = {
  participantId: string;
  name: string;
};

export type DashboardItem = {
  id: string;
  name: string;
  category: string;
  servingLabel: string;
  servingLabelPlural: string;
  servesPeople: number;
  servesDescription: string;
  suggestedServings: number;
  missingServings: number;
  isEnough: boolean;
  qtdVoluntarios: number;
  volunteers: DashboardVolunteer[];
};

export type SpecialDishSummary = {
  id: string;
  participantId: string;
  participantName: string;
  description: string;
  replacesItemId: string | null;
  replacesItemName: string | null;
};

export type DashboardSharedBeverage = {
  id: string;
  category: string;
  customDescription: string | null;
  quantity: number;
  unitVolumeMl: number;
};

export type SharedBeverageGroupItem = {
  unitVolumeMl: number;
  formattedUnitVolume: string;
  totalQuantity: number;
  totalLiters: number;
  containerLabel: string;
  customDescriptions: string[];
};

export type SharedBeverageGroup = {
  category: string;
  categoryLabel: string;
  totalLiters: number;
  items: SharedBeverageGroupItem[];
};

export type DashboardSharedBeveragesSummary = {
  totalLiters: number;
  totalUnits: number;
  groups: SharedBeverageGroup[];
};

export type DashboardParticipant = {
  id: string;
  name: string;
  dependentsCount: number;
  peopleCount: number;
  bringsOwnDrink: boolean;
  itemIds: string[];
  specialDish: {
    description: string;
    replacesItemId: string | null;
    replacesItemName: string | null;
  } | null;
  sharedBeverages: DashboardSharedBeverage[];
};

export type DashboardData = {
  stats: {
    totalPessoas: number;
    totalConfirmados: number;
    totalItens: number;
    itensSemVoluntario: number;
    itensGarantidos: number;
  };
  items: DashboardItem[];
  participants: DashboardParticipant[];
  specialDishes: SpecialDishSummary[];
  sharedBeveragesSummary: DashboardSharedBeveragesSummary;
};

export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
  participantId?: string;
  participantName?: string;
  participantToken?: string;
  stepCompleted?: "presence" | "contribution" | "full";
};

export async function registerOrUpdateParticipant(
  prevStateOrFormData: ActionState | FormData,
  maybeFormData?: FormData,
): Promise<ActionState> {
  const formData = maybeFormData ?? (prevStateOrFormData as FormData);
  const clientIp = await getClientIp();
  const rateLimit = checkRateLimit(`register:${clientIp}`, {
    limit: 5,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return { status: "error", message: RATE_LIMIT_MESSAGE };
  }

  if (getFormString(formData, "website").trim().length > 0) {
    return { status: "success", message: "Confirmação recebida." };
  }

  const rawFormScope = getFormString(formData, "formScope").trim();
  const formScope: "presence" | "contribution" | "full" =
    rawFormScope === "presence" || rawFormScope === "contribution"
      ? rawFormScope
      : "full";
  const clearPhone = getFormString(formData, "clearPhone").trim() === "true";

  let name = "";
  let phone: string | null = null;
  let dependentsCount = 0;
  let bringsOwnDrink = false;
  let participantId: string | null = null;
  let participantToken: string | null = null;
  let specialDishDescription = "";
  let specialDishReplacesItemId: string | null = null;
  let selectedFoodItemIds: string[] = [];
  let sharedBeverages: SharedBeverageItemInput[] = [];

  if (formScope === "contribution") {
    const parsedContribution = contributionInputSchema.safeParse({
      participantId: getFormString(formData, "participantId").trim() || null,
      participantToken:
        getFormString(formData, "participantToken").trim() || null,
      specialDishDescription: getFormString(formData, "specialDishDescription"),
      specialDishReplacesItemId:
        getFormString(formData, "specialDishReplacesItemId").trim() || null,
      selectedFoodItemIds: getFormStringArray(formData, "selectedFoodItemIds"),
      sharedBeverages: getFormString(formData, "sharedBeverages") || [],
    });

    if (!parsedContribution.success) {
      return {
        status: "error",
        message: firstValidationMessage(parsedContribution.error),
      };
    }

    participantId = parsedContribution.data.participantId;
    participantToken = parsedContribution.data.participantToken;
    specialDishDescription = parsedContribution.data.specialDishDescription;
    specialDishReplacesItemId =
      parsedContribution.data.specialDishReplacesItemId;
    selectedFoodItemIds = parsedContribution.data.selectedFoodItemIds;
    sharedBeverages = parsedContribution.data.sharedBeverages;
  } else {
    const parsed = participantInputSchema.safeParse({
      name: getFormString(formData, "name"),
      phone: getFormString(formData, "phone"),
      dependentsCount: getFormString(formData, "dependentsCount") || "0",
      bringsOwnDrink:
        formData.get("bringsOwnDrink") === "on" ||
        formData.get("bringsOwnDrink") === "true",
      participantId: getFormString(formData, "participantId").trim() || null,
      participantToken:
        getFormString(formData, "participantToken").trim() || null,
      specialDishDescription: getFormString(formData, "specialDishDescription"),
      specialDishReplacesItemId:
        getFormString(formData, "specialDishReplacesItemId").trim() || null,
      selectedFoodItemIds: getFormStringArray(formData, "selectedFoodItemIds"),
      sharedBeverages: getFormString(formData, "sharedBeverages") || [],
    });

    if (!parsed.success) {
      return { status: "error", message: firstValidationMessage(parsed.error) };
    }

    name = parsed.data.name;
    phone = parsed.data.phone;
    dependentsCount = parsed.data.dependentsCount;
    bringsOwnDrink = parsed.data.bringsOwnDrink;
    participantId = parsed.data.participantId;
    participantToken = parsed.data.participantToken;
    specialDishDescription = parsed.data.specialDishDescription;
    specialDishReplacesItemId = parsed.data.specialDishReplacesItemId;
    selectedFoodItemIds = parsed.data.selectedFoodItemIds;
    sharedBeverages = parsed.data.sharedBeverages;
  }

  const effectiveSelectedFoodItemIds = specialDishReplacesItemId
    ? selectedFoodItemIds.filter((id) => id !== specialDishReplacesItemId)
    : selectedFoodItemIds;

  try {
    const requestedItemIds = [
      ...new Set([
        ...effectiveSelectedFoodItemIds,
        ...(specialDishReplacesItemId ? [specialDishReplacesItemId] : []),
      ]),
    ];

    const existingItems = requestedItemIds.length
      ? await prisma.foodItem.findMany({
          where: { id: { in: requestedItemIds } },
          select: { id: true },
        })
      : [];
    const existingItemIds = new Set(existingItems.map((item) => item.id));

    if (
      specialDishReplacesItemId &&
      !existingItemIds.has(specialDishReplacesItemId)
    ) {
      return {
        status: "error",
        message: "O prato que você quer substituir não foi encontrado.",
      };
    }

    if (effectiveSelectedFoodItemIds.some((id) => !existingItemIds.has(id))) {
      return {
        status: "error",
        message: "Um ou mais itens selecionados não estão mais disponíveis.",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      let savedParticipant: { id: string; name: string };
      const isEditingExisting = Boolean(participantId);

      if (participantId) {
        const existingParticipant = await tx.participant.findUnique({
          where: { id: participantId },
          select: {
            id: true,
            name: true,
            phone: true,
            dependentsCount: true,
            bringsOwnDrink: true,
            session: { select: { tokenHash: true } },
          },
        });

        if (
          !existingParticipant ||
          !participantToken ||
          !existingParticipant.session ||
          !verifySessionToken(
            participantToken,
            existingParticipant.session.tokenHash,
          )
        ) {
          throw new UnauthorizedSessionError();
        }

        if (formScope === "contribution") {
          const drinkFieldProvided = formData.has("bringsOwnDrink");
          const updatedBringsOwnDrink = drinkFieldProvided
            ? formData.get("bringsOwnDrink") === "on" ||
              formData.get("bringsOwnDrink") === "true"
            : existingParticipant.bringsOwnDrink;

          savedParticipant = await tx.participant.update({
            where: { id: existingParticipant.id },
            data: {
              bringsOwnDrink: updatedBringsOwnDrink,
              confirmed: true,
            },
          });
        } else {
          const effectivePhone =
            phone !== null
              ? phone
              : clearPhone
                ? null
                : existingParticipant.phone;

          savedParticipant = await tx.participant.update({
            where: { id: existingParticipant.id },
            data: {
              name,
              phone: effectivePhone,
              dependentsCount,
              bringsOwnDrink,
              confirmed: true,
            },
          });
        }
      } else {
        savedParticipant = await tx.participant.create({
          data: {
            name,
            phone,
            dependentsCount,
            bringsOwnDrink,
            confirmed: true,
          },
        });
      }

      const hasBeverageField = formData.has("sharedBeverages");
      const shouldUpdateContributions =
        formScope !== "presence" ||
        !isEditingExisting ||
        effectiveSelectedFoodItemIds.length > 0 ||
        Boolean(specialDishDescription) ||
        sharedBeverages.length > 0 ||
        hasBeverageField;

      if (shouldUpdateContributions) {
        const validItems = effectiveSelectedFoodItemIds.length
          ? await tx.foodItem.findMany({
              where: { id: { in: effectiveSelectedFoodItemIds } },
              select: {
                id: true,
                name: true,
                category: true,
                unitMeasure: true,
              },
            })
          : [];

        if (validItems.length > 0) {
          const confirmedParticipants = await tx.participant.findMany({
            where: { confirmed: true },
            select: { dependentsCount: true },
          });
          const totalPessoas = confirmedParticipants.reduce(
            (total, current) => total + 1 + current.dependentsCount,
            0,
          );

          const otherAssignments = await tx.itemAssignment.findMany({
            where: {
              foodItemId: { in: validItems.map((item) => item.id) },
              participantId: { not: savedParticipant.id },
              participant: { confirmed: true },
            },
            select: { foodItemId: true },
          });

          const assignmentCounts = new Map<string, number>();
          for (const assignment of otherAssignments) {
            assignmentCounts.set(
              assignment.foodItemId,
              (assignmentCounts.get(assignment.foodItemId) ?? 0) + 1,
            );
          }

          for (const item of validItems) {
            const profile = getServingProfile(item);
            const capacity = Math.max(
              1,
              Math.ceil(totalPessoas / profile.servesPeople),
            );

            if ((assignmentCounts.get(item.id) ?? 0) + 1 > capacity) {
              throw new ItemCapacityError(item.name);
            }
          }
        }

        await tx.itemAssignment.deleteMany({
          where: { participantId: savedParticipant.id },
        });

        if (validItems.length > 0) {
          await tx.itemAssignment.createMany({
            data: validItems.map((item) => ({
              participantId: savedParticipant.id,
              foodItemId: item.id,
            })),
          });
        }

        if (specialDishDescription) {
          await tx.specialDish.upsert({
            where: { participantId: savedParticipant.id },
            create: {
              participantId: savedParticipant.id,
              description: specialDishDescription,
              replacesFoodItemId: specialDishReplacesItemId,
            },
            update: {
              description: specialDishDescription,
              replacesFoodItemId: specialDishReplacesItemId,
            },
          });
        } else {
          await tx.specialDish.deleteMany({
            where: { participantId: savedParticipant.id },
          });
        }

        await tx.sharedBeverage.deleteMany({
          where: { participantId: savedParticipant.id },
        });

        if (sharedBeverages.length > 0) {
          await tx.sharedBeverage.createMany({
            data: sharedBeverages.map((bev) => ({
              participantId: savedParticipant.id,
              category: bev.category,
              customDescription: bev.customDescription?.trim() || null,
              quantity: bev.quantity,
              unitVolumeMl: bev.unitVolumeMl,
            })),
          });
        }
      }

      const sessionToken = generateSessionToken();
      await tx.participantSession.upsert({
        where: { participantId: savedParticipant.id },
        create: {
          participantId: savedParticipant.id,
          tokenHash: hashSessionToken(sessionToken),
        },
        update: {
          tokenHash: hashSessionToken(sessionToken),
        },
      });

      return { participant: savedParticipant, sessionToken };
    });

    try {
      revalidatePath("/");
      revalidateTag(DASHBOARD_CACHE_TAG, { expire: 0 });
    } catch (error) {
      console.error("Falha ao invalidar o cache do dashboard:", error);
    }

    const hasChosenContribution =
      effectiveSelectedFoodItemIds.length > 0 ||
      Boolean(specialDishDescription) ||
      sharedBeverages.length > 0;

    const message =
      formScope === "contribution"
        ? hasChosenContribution
          ? `Tudo certo, ${result.participant.name}! Sua contribuição no cardápio foi salva.`
          : `Tudo certo, ${result.participant.name}! Sua presença continua confirmada e você pode escolher um prato quando quiser.`
        : formScope === "presence" && !hasChosenContribution
          ? `Tudo pronto, ${result.participant.name}! Agora, se quiser, você pode escolher o que levar.`
          : `Tudo pronto, ${result.participant.name}! Sua confirmação foi registrada.`;

    return {
      status: "success",
      message,
      participantId: result.participant.id,
      participantName: result.participant.name,
      participantToken: result.sessionToken,
      stepCompleted: formScope,
    };
  } catch (error) {
    if (error instanceof ItemCapacityError) {
      return {
        status: "error",
        message: `${error.message} Escolha outro item ou ajuste sua seleção.`,
      };
    }

    if (error instanceof UnauthorizedSessionError) {
      return {
        status: "error",
        message:
          "Sua sessão expirou ou não pôde ser validada. Atualize a página e confirme novamente.",
      };
    }

    console.error("Erro ao registrar participante:", error);

    return {
      status: "error",
      message:
        "Não conseguimos salvar sua confirmação agora. Tente novamente em instantes.",
    };
  }
}

export async function cancelParticipation(
  participantId: string,
  participantToken: string,
): Promise<ActionState> {
  const clientIp = await getClientIp();
  const rateLimit = checkRateLimit(`cancel:${clientIp}`, {
    limit: 10,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return { status: "error", message: RATE_LIMIT_MESSAGE };
  }

  const parsedId = participantIdSchema.safeParse(participantId);
  const parsedToken = sessionTokenSchema.safeParse(participantToken);

  if (!parsedId.success || !parsedToken.success) {
    return {
      status: "error",
      message:
        "Não foi possível validar sua sessão. Atualize a página e tente novamente.",
    };
  }

  try {
    const cancelledParticipant = await prisma.$transaction(async (tx) => {
      const participant = await tx.participant.findUnique({
        where: { id: parsedId.data },
        select: {
          id: true,
          name: true,
          session: { select: { tokenHash: true } },
        },
      });

      if (
        !participant ||
        !participant.session ||
        !verifySessionToken(parsedToken.data, participant.session.tokenHash)
      ) {
        return null;
      }

      await tx.itemAssignment.deleteMany({
        where: { participantId: parsedId.data },
      });
      await tx.specialDish.deleteMany({
        where: { participantId: parsedId.data },
      });
      await tx.sharedBeverage.deleteMany({
        where: { participantId: parsedId.data },
      });
      await tx.participantSession.deleteMany({
        where: { participantId: parsedId.data },
      });
      await tx.participant.update({
        where: { id: parsedId.data },
        data: { confirmed: false },
      });

      return participant;
    });

    if (!cancelledParticipant) {
      return {
        status: "error",
        message:
          "Não foi possível validar sua sessão. Atualize a página e tente novamente.",
      };
    }

    try {
      revalidatePath("/");
      revalidateTag(DASHBOARD_CACHE_TAG, { expire: 0 });
    } catch (error) {
      console.error("Falha ao invalidar o cache do dashboard:", error);
    }

    return {
      status: "success",
      message: `Sentiremos sua falta, ${cancelledParticipant.name}. Sua confirmação foi removida e as cotas foram recalculadas.`,
      participantId: cancelledParticipant.id,
      participantName: cancelledParticipant.name,
    };
  } catch (error) {
    console.error("Erro ao cancelar participação:", error);

    return {
      status: "error",
      message:
        "Não conseguimos cancelar sua participação agora. Tente novamente em instantes.",
    };
  }
}
