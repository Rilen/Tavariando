"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const CATEGORY_ORDER = ["COMIDA", "BEBIDA", "SOBREMESA", "DESCARTAVEL"];

export type DashboardVolunteer = {
  participantId: string;
  name: string;
  quota: number;
};

export type DashboardItem = {
  id: string;
  name: string;
  category: string;
  portionPerPerson: number;
  unitMeasure: string;
  totalNecessario: number;
  qtdVoluntarios: number;
  cotaPorVoluntario: number;
  volunteers: DashboardVolunteer[];
};

export type DashboardParticipant = {
  id: string;
  name: string;
  dependentsCount: number;
  peopleCount: number;
  bringsOwnDrink: boolean;
  itemIds: string[];
};

export type DashboardData = {
  stats: {
    totalPessoas: number;
    totalConfirmados: number;
    totalItens: number;
    itensSemVoluntario: number;
  };
  items: DashboardItem[];
  participants: DashboardParticipant[];
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
    },
    items: [],
    participants: [],
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
              select: { name: true, confirmed: true },
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
      const confirmedAssignments = item.assignments.filter(
        (assignment) => assignment.participant.confirmed,
      );
      const qtdVoluntarios = confirmedAssignments.length;
      const totalNecessario = totalPessoas * item.portionPerPerson;
      const cotaPorVoluntario =
        qtdVoluntarios > 0
          ? Math.ceil(totalNecessario / qtdVoluntarios)
          : totalNecessario;

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        portionPerPerson: item.portionPerPerson,
        unitMeasure: item.unitMeasure,
        totalNecessario,
        qtdVoluntarios,
        cotaPorVoluntario,
        volunteers: confirmedAssignments.map((assignment) => ({
          participantId: assignment.participantId,
          name: assignment.participant.name,
          quota: cotaPorVoluntario,
        })),
      };
    })
    .sort((a, b) => {
      const categoryDiff =
        CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);

      if (categoryDiff !== 0) return categoryDiff;

      return a.name.localeCompare(b.name, "pt-BR");
    });

  return {
    stats: {
      totalPessoas,
      totalConfirmados: participants.length,
      totalItens: items.length,
      itensSemVoluntario: items.filter((item) => item.qtdVoluntarios === 0)
        .length,
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
    })),
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

  try {
    const participant = await prisma.$transaction(async (tx) => {
      const validItems = selectedFoodItemIds.length
        ? await tx.foodItem.findMany({
            where: { id: { in: selectedFoodItemIds } },
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
