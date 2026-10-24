import "server-only";
import { cacheTag } from "next/cache";
import type {
  DashboardData,
  SharedBeverageGroup,
  SharedBeverageGroupItem,
} from "@/app/actions/event";
import { DASHBOARD_CACHE_TAG } from "@/lib/cache-tags";
import {
  BEVERAGE_CATEGORY_GROUP_LABELS,
  formatContainerLabel,
  formatUnitVolume,
} from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getServingProfile } from "@/lib/servings";

const CATEGORY_ORDER = ["COMIDA", "BEBIDA", "SOBREMESA", "DESCARTAVEL"];
const BEVERAGE_ORDER = ["REFRIGERANTE", "SUCO", "AGUA", "OUTRA"];

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
    sharedBeveragesSummary: {
      totalLiters: 0,
      totalUnits: 0,
      groups: [],
    },
  };
}

async function getCachedDashboardData(): Promise<DashboardData> {
  "use cache";

  try {
    cacheTag(DASHBOARD_CACHE_TAG);
  } catch {
    // Ignora quando executado fora do runtime Next.js (ex.: testes unitários)
  }

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
        sharedBeverages: {
          select: {
            id: true,
            category: true,
            customDescription: true,
            quantity: true,
            unitVolumeMl: true,
          },
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
      sharedBeverages: participant.sharedBeverages.map((bev) => ({
        id: bev.id,
        category: bev.category,
        customDescription: bev.customDescription,
        quantity: bev.quantity,
        unitVolumeMl: bev.unitVolumeMl,
      })),
    })),
    specialDishes,
    sharedBeveragesSummary: (() => {
      const allSharedBeverages = participants.flatMap(
        (p) => p.sharedBeverages,
      );

      const groups: SharedBeverageGroup[] = [];
      let totalLitersAll = 0;
      let totalUnitsAll = 0;

      for (const cat of BEVERAGE_ORDER) {
        const matching = allSharedBeverages.filter((b) => b.category === cat);
        if (matching.length === 0) continue;

        const volumeMap = new Map<
          number,
          {
            unitVolumeMl: number;
            totalQuantity: number;
            customDescriptions: Set<string>;
          }
        >();

        for (const item of matching) {
          const existing = volumeMap.get(item.unitVolumeMl) ?? {
            unitVolumeMl: item.unitVolumeMl,
            totalQuantity: 0,
            customDescriptions: new Set<string>(),
          };
          existing.totalQuantity += item.quantity;
          if (item.customDescription?.trim()) {
            existing.customDescriptions.add(item.customDescription.trim());
          }
          volumeMap.set(item.unitVolumeMl, existing);
          totalUnitsAll += item.quantity;
        }

        const sortedVolumes = Array.from(volumeMap.values()).sort(
          (a, b) => b.unitVolumeMl - a.unitVolumeMl,
        );

        let categoryTotalLiters = 0;
        const items: SharedBeverageGroupItem[] = sortedVolumes.map((entry) => {
          const totalLiters = (entry.totalQuantity * entry.unitVolumeMl) / 1000;
          categoryTotalLiters += totalLiters;
          return {
            unitVolumeMl: entry.unitVolumeMl,
            formattedUnitVolume: formatUnitVolume(entry.unitVolumeMl),
            totalQuantity: entry.totalQuantity,
            totalLiters,
            containerLabel: formatContainerLabel(
              entry.totalQuantity,
              entry.unitVolumeMl,
            ),
            customDescriptions: Array.from(entry.customDescriptions),
          };
        });

        totalLitersAll += categoryTotalLiters;

        groups.push({
          category: cat,
          categoryLabel: BEVERAGE_CATEGORY_GROUP_LABELS[cat] ?? cat,
          totalLiters: categoryTotalLiters,
          items,
        });
      }

      return {
        totalLiters: totalLitersAll,
        totalUnits: totalUnitsAll,
        groups,
      };
    })(),
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  try {
    return await getCachedDashboardData();
  } catch (error) {
    console.error("Falha ao buscar dados do dashboard:", error);
    return emptyDashboardData();
  }
}
