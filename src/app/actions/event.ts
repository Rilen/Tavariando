"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServingProfile } from "@/lib/servings";

const CATEGORY_ORDER = ["COMIDA", "BEBIDA", "SOBREMESA", "DESCARTAVEL"];

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
};

export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
  participantId?: string;
  participantName?: string;
};

function emptyDashboardData(): DashboardData {
  return {
    stats: {
      totalPessoas: 0,
      totalConfirmados: 0,
      totalItens: 0,
      itensSemVoluntario: 0,
      itensGarantidos: 0,
    },
    items: [],
    participants: [],
    specialDishes: [],
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  try {
    return await fetchDashboardData();
  } catch (error) {
    console.error("Falha ao buscar dados do dashboard:", error);
    return emptyDashboardData();
  }
}

async function fetchDashboardData(): Promise<DashboardData> {
  const [participants, foodItems] = await Promise.all([
    prisma.participant.findMany({
      where: { confirmed: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        dependentsCount: true,
        bringsOwnDrink: true,
        specialDish: {
          select: {
            id: true,
            description: true,
            replacesFoodItemId: true,
            replacesFoodItem: { select: { name: true } },
          },
        },
        assignments: {
          select: { foodItemId: true },
        },
      },
    }),
    prisma.foodItem.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        category: true,
        portionPerPerson: true,
        unitMeasure: true,
        assignments: {
          select: {
            participantId: true,
            participant: {
              select: {
                name: true,
                confirmed: true,
                specialDish: { select: { replacesFoodItemId: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const totalPessoas = participants.reduce(
    (total, participant) => total + 1 + participant.dependentsCount,
    0,
  );

  const items = foodItems
    .map((item) => {
      const profile = getServingProfile(item);
      const confirmedAssignments = item.assignments.filter(
        (assignment) =>
          assignment.participant.confirmed &&
          assignment.participant.specialDish?.replacesFoodItemId !== item.id,
      );
      const qtdVoluntarios = confirmedAssignments.length;
      const suggestedServings =
        totalPessoas > 0 ? Math.ceil(totalPessoas / profile.servesPeople) : 0;
      const missingServings = Math.max(0, suggestedServings - qtdVoluntarios);

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        servingLabel: profile.label,
        servingLabelPlural: profile.pluralLabel,
        servesPeople: profile.servesPeople,
        servesDescription: profile.servesDescription,
        suggestedServings,
        missingServings,
        isEnough: suggestedServings > 0 && qtdVoluntarios >= suggestedServings,
        qtdVoluntarios,
        volunteers: confirmedAssignments.map((assignment) => ({
          participantId: assignment.participantId,
          name: assignment.participant.name,
        })),
      };
    })
    .sort((a, b) => {
      const categoryDiff =
        CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);

      if (categoryDiff !== 0) return categoryDiff;

      return a.name.localeCompare(b.name, "pt-BR");
    });

  const specialDishes = participants.flatMap((participant) =>
    participant.specialDish
      ? [
          {
            id: participant.specialDish.id,
            participantId: participant.id,
            participantName: participant.name,
            description: participant.specialDish.description,
            replacesItemId: participant.specialDish.replacesFoodItemId,
            replacesItemName:
              participant.specialDish.replacesFoodItem?.name ?? null,
          },
        ]
      : [],
  );

  return {
    stats: {
      totalPessoas,
      totalConfirmados: participants.length,
      totalItens: items.length,
      itensSemVoluntario: items.filter((item) => item.qtdVoluntarios === 0)
        .length,
      itensGarantidos: items.filter((item) => item.isEnough).length,
    },
    items,
    participants: participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      dependentsCount: participant.dependentsCount,
      peopleCount: 1 + participant.dependentsCount,
      bringsOwnDrink: participant.bringsOwnDrink,
      itemIds: participant.assignments.map(
        (assignment) => assignment.foodItemId,
      ),
      specialDish: participant.specialDish
        ? {
            description: participant.specialDish.description,
            replacesItemId: participant.specialDish.replacesFoodItemId,
            replacesItemName:
              participant.specialDish.replacesFoodItem?.name ?? null,
          }
        : null,
    })),
    specialDishes,
  };
}

export async function registerOrUpdateParticipant(
  prevStateOrFormData: ActionState | FormData,
  maybeFormData?: FormData,
): Promise<ActionState> {
  const formData =
    maybeFormData ?? (prevStateOrFormData as FormData);

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const dependentsCount = Number.parseInt(
    String(formData.get("dependentsCount") ?? "0"),
    10,
  );
  const bringsOwnDrink =
    formData.get("bringsOwnDrink") === "on" ||
    formData.get("bringsOwnDrink") === "true";
  const rawParticipantId = String(formData.get("participantId") ?? "").trim();
  const participantId = rawParticipantId || null;
  const specialDishDescription = String(
    formData.get("specialDishDescription") ?? "",
  ).trim();
  const rawSpecialDishReplacesItemId = String(
    formData.get("specialDishReplacesItemId") ?? "",
  ).trim();
  const specialDishReplacesItemId = rawSpecialDishReplacesItemId || null;

  const selectedFoodItemIds = [
    ...new Set(
      formData
        .getAll("selectedFoodItemIds")
        .filter(
          (value): value is string =>
            typeof value === "string" && value.length > 0,
        ),
    ),
  ];

  if (name.length < 2) {
    return {
      status: "error",
      message: "Informe seu nome com pelo menos 2 caracteres.",
    };
  }

  if (name.length > 80) {
    return {
      status: "error",
      message: "O nome pode ter no máximo 80 caracteres.",
    };
  }

  if (
    !Number.isInteger(dependentsCount) ||
    dependentsCount < 0 ||
    dependentsCount > 10
  ) {
    return {
      status: "error",
      message: "A quantidade de acompanhantes deve ficar entre 0 e 10.",
    };
  }

  if (specialDishDescription.length > 200) {
    return {
      status: "error",
      message: "A descrição do prato adicional pode ter no máximo 200 caracteres.",
    };
  }

  if (specialDishReplacesItemId && !specialDishDescription) {
    return {
      status: "error",
      message:
        "Descreva o prato adicional, doce, fruta ou petisco que você vai levar para indicar qual item ele substitui.",
    };
  }

  try {
    if (specialDishReplacesItemId) {
      const replacementItem = await prisma.foodItem.findUnique({
        where: { id: specialDishReplacesItemId },
        select: { id: true },
      });

      if (!replacementItem) {
        return {
          status: "error",
          message: "O prato que você quer substituir não foi encontrado.",
        };
      }
    }

    const effectiveSelectedFoodItemIds = specialDishReplacesItemId
      ? selectedFoodItemIds.filter((id) => id !== specialDishReplacesItemId)
      : selectedFoodItemIds;

    const participant = await prisma.$transaction(async (tx) => {
      const validItems = effectiveSelectedFoodItemIds.length
        ? await tx.foodItem.findMany({
            where: { id: { in: effectiveSelectedFoodItemIds } },
            select: { id: true },
          })
        : [];

      const participantById = participantId
        ? await tx.participant.findUnique({ where: { id: participantId } })
        : null;

      const existingParticipant =
        participantById ??
        (await tx.participant.findFirst({ where: { name } }));

      const data = {
        name,
        phone: phone || null,
        dependentsCount,
        bringsOwnDrink,
        confirmed: true,
      };

      const savedParticipant = existingParticipant
        ? await tx.participant.update({
            where: { id: existingParticipant.id },
            data,
          })
        : await tx.participant.create({ data });

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

      return savedParticipant;
    });

    revalidatePath("/");

    return {
      status: "success",
      message: `Tudo certo, ${participant.name}! Sua confirmação foi registrada.`,
      participantId: participant.id,
      participantName: participant.name,
    };
  } catch (error) {
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
): Promise<ActionState> {
  if (!participantId) {
    return {
      status: "error",
      message: "Não encontramos sua confirmação.",
    };
  }

  try {
    const cancelledParticipant = await prisma.$transaction(async (tx) => {
      const participant = await tx.participant.findUnique({
        where: { id: participantId },
        select: { id: true, name: true },
      });

      if (!participant) return null;

      await tx.itemAssignment.deleteMany({ where: { participantId } });
      await tx.specialDish.deleteMany({ where: { participantId } });
      await tx.participant.update({
        where: { id: participantId },
        data: { confirmed: false },
      });

      return participant;
    });

    if (!cancelledParticipant) {
      return {
        status: "error",
        message: "Não encontramos sua confirmação.",
      };
    }

    revalidatePath("/");

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
