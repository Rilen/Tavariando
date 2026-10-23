export const CATEGORY_LABELS: Record<string, string> = {
  COMIDA: "Comida",
  BEBIDA: "Bebida",
  SOBREMESA: "Sobremesa",
  DESCARTAVEL: "Descartável",
};

export const CATEGORY_STYLES: Record<string, string> = {
  COMIDA:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  BEBIDA: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  SOBREMESA:
    "bg-pink-100 text-pink-800 dark:bg-pink-500/15 dark:text-pink-300",
  DESCARTAVEL:
    "bg-zinc-200 text-zinc-700 dark:bg-zinc-700/60 dark:text-zinc-300",
};

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

export function formatQuantity(value: number, unitMeasure: string): string {
  if (unitMeasure === "g" && value >= 1000) {
    return `${numberFormatter.format(value / 1000)} kg`;
  }

  if (unitMeasure === "litros") {
    return `${numberFormatter.format(value)} L`;
  }

  if (unitMeasure === "un") {
    return `${numberFormatter.format(Math.round(value))} un`;
  }

  return `${numberFormatter.format(value)} ${unitMeasure}`;
}

export function pluralize(
  value: number,
  singular: string,
  plural: string,
): string {
  return `${value} ${value === 1 ? singular : plural}`;
}
