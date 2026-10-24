export const CATEGORY_LABELS: Record<string, string> = {
  COMIDA: "Comida",
  BEBIDA: "Bebida",
  SOBREMESA: "Sobremesa",
  DESCARTAVEL: "Descartáveis e infra",
};

export const CATEGORY_GROUP_LABELS: Record<string, string> = {
  COMIDA: "Comidas",
  BEBIDA: "Bebidas",
  SOBREMESA: "Sobremesas",
  DESCARTAVEL: "Descartáveis e infraestrutura",
};

export const CATEGORY_STYLES: Record<string, string> = {
  COMIDA: "bg-amber-100 text-amber-950 border border-amber-200/80",
  BEBIDA: "bg-sky-100 text-sky-950 border border-sky-200/80",
  SOBREMESA: "bg-orange-100 text-orange-950 border border-orange-200/80",
  DESCARTAVEL: "bg-stone-100 text-stone-800 border border-stone-200/80",
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

const WHATSAPP_DEFAULT_TEXT =
  "Olá! Passei pelo Tavariando e gostaria de falar com a organização do almoço.";

const PLACEHOLDER_PIX_PATTERNS = [
  /^chave-pix-aqui$/i,
  /^sua-chave-pix$/i,
  /^seu-pix-aqui$/i,
  /^pix-key$/i,
  /^todo$/i,
  /^changeme$/i,
];

export function normalizePixKey(rawKey?: string | null): string | null {
  const trimmed = rawKey?.trim() ?? "";
  if (!trimmed || trimmed.length < 5) return null;
  if (PLACEHOLDER_PIX_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return null;
  }
  return trimmed;
}

export function normalizeWhatsappUrl(rawUrl?: string | null): string | null {
  const trimmed = rawUrl?.trim() ?? "";
  if (!trimmed) return null;
  if (/DDDNUMERO|SEUNUMERO|00000000/i.test(trimmed)) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }

    const host = parsed.hostname.toLowerCase();
    const isAllowedHost =
      host === "wa.me" ||
      host === "api.whatsapp.com" ||
      host === "chat.whatsapp.com" ||
      host === "www.whatsapp.com";

    if (!isAllowedHost) return null;

    if (host === "wa.me") {
      const cleanPath = parsed.pathname.replace(/^\/+|\/+$/g, "");
      const isPhonePath = /^\d{10,15}$/.test(cleanPath);
      const isMessagePath = /^message\/[A-Za-z0-9_-]+$/i.test(cleanPath);
      if (!isPhonePath && !isMessagePath) {
        return null;
      }

      if (isPhonePath && !parsed.searchParams.has("text")) {
        parsed.searchParams.set("text", WHATSAPP_DEFAULT_TEXT);
      }
    }

    return parsed.toString();
  } catch {
    return null;
  }
}
