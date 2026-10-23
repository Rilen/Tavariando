import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const foodItems = [
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
  {
    name: "Salada de maionese/batata",
    category: "COMIDA",
    portionPerPerson: 120,
    unitMeasure: "g",
  },
  {
    name: "Macarrão",
    category: "COMIDA",
    portionPerPerson: 80,
    unitMeasure: "g",
  },
  {
    name: "Sobremesa",
    category: "SOBREMESA",
    portionPerPerson: 100,
    unitMeasure: "g",
  },
  {
    name: "Copos/pratos descartáveis",
    category: "DESCARTAVEL",
    portionPerPerson: 2,
    unitMeasure: "un",
  },
  {
    name: "Guardanapos/carvão",
    category: "DESCARTAVEL",
    portionPerPerson: 1,
    unitMeasure: "un",
  },
];

async function main() {
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
