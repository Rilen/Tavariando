import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const proteinsItem = {
  name: "Proteínas / Carnes (Bovino, Frango, Linguiça)",
  category: "COMIDA",
  portionPerPerson: 120,
  unitMeasure: "g",
};

const saladItem = {
  name: "Salada de maionese / batata",
  category: "COMIDA",
  portionPerPerson: 120,
  unitMeasure: "g",
};

const cupsItem = {
  name: "Copos descartáveis",
  category: "DESCARTAVEL",
  portionPerPerson: 2,
  unitMeasure: "un",
};

const charcoalItem = {
  name: "Carvão vegetal",
  category: "DESCARTAVEL",
  portionPerPerson: 1,
  unitMeasure: "un",
};

const foodItems = [
  proteinsItem,
  {
    name: "Arroz branco",
    category: "COMIDA",
    portionPerPerson: 70,
    unitMeasure: "g",
  },
  {
    name: "Farofa pronta",
    category: "COMIDA",
    portionPerPerson: 40,
    unitMeasure: "g",
  },
  saladItem,
  {
    name: "Sobremesa",
    category: "SOBREMESA",
    portionPerPerson: 100,
    unitMeasure: "g",
  },
  charcoalItem,
  cupsItem,
  {
    name: "Pratos descartáveis (refeição)",
    category: "DESCARTAVEL",
    portionPerPerson: 1,
    unitMeasure: "un",
  },
  {
    name: "Garfos descartáveis",
    category: "DESCARTAVEL",
    portionPerPerson: 1,
    unitMeasure: "un",
  },
  {
    name: "Colheres de sobremesa descartáveis",
    category: "DESCARTAVEL",
    portionPerPerson: 1,
    unitMeasure: "un",
  },
  {
    name: "Guardanapos de papel",
    category: "DESCARTAVEL",
    portionPerPerson: 1,
    unitMeasure: "un",
  },
];

const LEGACY_ITEM_RENAMES = [
  { from: "Macarrão", to: proteinsItem },
  {
    from: "Proteínas / Carnes (Carne bovina, Frango ou Linguiça)",
    to: proteinsItem,
  },
  { from: "Salada de maionese/batata", to: saladItem },
  { from: "Copos/pratos descartáveis", to: cupsItem },
  { from: "Guardanapos/carvão", to: charcoalItem },
];

async function main() {
  for (const migration of LEGACY_ITEM_RENAMES) {
    const legacyItem = await prisma.foodItem.findFirst({
      where: { name: migration.from },
    });

    if (!legacyItem) continue;

    const targetItem = await prisma.foodItem.findFirst({
      where: { name: migration.to.name },
    });

    if (targetItem) continue;

    await prisma.foodItem.update({
      where: { id: legacyItem.id },
      data: migration.to,
    });
  }

  for (const item of foodItems) {
    const existing = await prisma.foodItem.findFirst({
      where: { name: item.name },
    });

    if (existing) {
      await prisma.foodItem.update({
        where: { id: existing.id },
        data: item,
      });
    } else {
      await prisma.foodItem.create({ data: item });
    }
  }

  console.log(`Seed concluído: ${foodItems.length} itens disponíveis.`);
}

main()
  .catch((error) => {
    console.error("Falha ao executar o seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
