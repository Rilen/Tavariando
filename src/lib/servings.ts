export type ServingProfile = {
  label: string;
  pluralLabel: string;
  servesPeople: number;
  servesDescription: string;
};

const SERVING_PROFILES: Record<string, ServingProfile> = {
  "proteínas / carnes (bovino, frango, linguiça)": {
    label: "porção familiar",
    pluralLabel: "porções familiares",
    servesPeople: 10,
    servesDescription: "~1 a 1,5 kg para grelhar ou servir",
  },
  "arroz branco": {
    label: "travessa/panela média",
    pluralLabel: "travessas/panelas médias",
    servesPeople: 12,
    servesDescription: "serve ~10 a 12 pessoas",
  },
  "farofa pronta": {
    label: "travessa/pote médio",
    pluralLabel: "travessas/potes médios",
    servesPeople: 15,
    servesDescription: "serve ~12 a 15 pessoas",
  },
  "salada de maionese / batata": {
    label: "travessa média",
    pluralLabel: "travessas médias",
    servesPeople: 12,
    servesDescription: "serve ~10 a 12 pessoas",
  },
  sobremesa: {
    label: "travessa/doce",
    pluralLabel: "travessas/doces",
    servesPeople: 12,
    servesDescription: "serve ~10 a 12 pessoas",
  },
  "carvão vegetal": {
    label: "saco (2,5 a 4 kg)",
    pluralLabel: "sacos (2,5 a 4 kg)",
    servesPeople: 20,
    servesDescription: "para um churrasco de ~20 pessoas",
  },
  "copos descartáveis": {
    label: "pacote (100 un)",
    pluralLabel: "pacotes (100 un)",
    servesPeople: 50,
    servesDescription: "~2 copos por pessoa",
  },
  "pratos descartáveis (refeição)": {
    label: "pacote (50 un)",
    pluralLabel: "pacotes (50 un)",
    servesPeople: 50,
    servesDescription: "1 prato por pessoa",
  },
  "garfos descartáveis": {
    label: "pacote (50 un)",
    pluralLabel: "pacotes (50 un)",
    servesPeople: 50,
    servesDescription: "1 garfo por pessoa",
  },
  "colheres de sobremesa descartáveis": {
    label: "pacote (50 un)",
    pluralLabel: "pacotes (50 un)",
    servesPeople: 50,
    servesDescription: "1 colher por pessoa",
  },
  "guardanapos de papel": {
    label: "pacote/fardo",
    pluralLabel: "pacotes/fardos",
    servesPeople: 50,
    servesDescription: "para ~50 pessoas",
  },
};

const UNIT_PROFILE: ServingProfile = {
  label: "pacote/kit",
  pluralLabel: "pacotes/kits",
  servesPeople: 20,
  servesDescription: "serve ~20 pessoas",
};

const FAMILY_PROFILE: ServingProfile = {
  label: "porção familiar",
  pluralLabel: "porções familiares",
  servesPeople: 10,
  servesDescription: "serve ~10 pessoas",
};

export function getServingProfile(item: {
  name: string;
  category: string;
  unitMeasure: string;
}): ServingProfile {
  const key = item.name.trim().toLowerCase();
  const profile = SERVING_PROFILES[key];

  if (profile) return profile;
  if (item.category === "BEBIDA") return UNIT_PROFILE;
  if (item.unitMeasure === "un") return UNIT_PROFILE;

  return FAMILY_PROFILE;
}
