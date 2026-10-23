export type ServingProfile = {
  label: string;
  pluralLabel: string;
  servesPeople: number;
  servesDescription: string;
};

const SERVING_PROFILES: Record<string, ServingProfile> = {
  "arroz branco": {
    label: "travessa/panela média",
    pluralLabel: "travessas/panelas médias",
    servesPeople: 12,
    servesDescription: "serve ~10 a 12 pessoas",
  },
  "farofa pronta": {
    label: "travessa média",
    pluralLabel: "travessas médias",
    servesPeople: 15,
    servesDescription: "serve ~12 a 15 pessoas",
  },
  "salada de maionese/batata": {
    label: "travessa grande",
    pluralLabel: "travessas grandes",
    servesPeople: 12,
    servesDescription: "serve ~10 a 12 pessoas",
  },
  macarrão: {
    label: "travessa/panela média",
    pluralLabel: "travessas/panelas médias",
    servesPeople: 10,
    servesDescription: "serve ~8 a 10 pessoas",
  },
  sobremesa: {
    label: "travessa média",
    pluralLabel: "travessas médias",
    servesPeople: 12,
    servesDescription: "serve ~10 a 12 pessoas",
  },
  "copos/pratos descartáveis": {
    label: "pacote (50 unidades)",
    pluralLabel: "pacotes (50 unidades)",
    servesPeople: 25,
    servesDescription: "serve ~25 pessoas",
  },
  "guardanapos/carvão": {
    label: "kit",
    pluralLabel: "kits",
    servesPeople: 20,
    servesDescription: "serve ~20 pessoas",
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
