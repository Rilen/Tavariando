import "server-only";
import { z } from "zod";

const HTML_BLOCK_PATTERN =
  /<\s*(script|style|iframe|object|embed|svg|math|template)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const HTML_TAG_PATTERN = /<[^>]*>/g;
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeText(value: string): string {
  return value
    .replace(HTML_BLOCK_PATTERN, " ")
    .replace(HTML_TAG_PATTERN, " ")
    .replace(CONTROL_CHARACTERS, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const nameSchema = z
  .string({ error: "Nome inválido." })
  .max(2_000, "Nome muito longo.")
  .transform(sanitizeText)
  .refine(
    (value) => value.length >= 2,
    "Informe seu nome com pelo menos 2 caracteres.",
  )
  .refine(
    (value) => value.length <= 60,
    "O nome pode ter no máximo 60 caracteres.",
  );

const phoneSchema = z
  .string({ error: "WhatsApp inválido." })
  .max(40, "WhatsApp inválido.")
  .transform((value) => value.replace(/\D/g, ""))
  .refine(
    (digits) =>
      digits.length === 0 || (digits.length >= 10 && digits.length <= 13),
    "Informe um WhatsApp válido com DDD (10 a 13 dígitos).",
  )
  .transform((digits) => digits || null);

const additionalDishSchema = z
  .string({ error: "Descrição inválida." })
  .max(1_000, "Descrição muito longa.")
  .transform(sanitizeText)
  .refine(
    (value) => value.length <= 120,
    "A descrição do prato adicional pode ter no máximo 120 caracteres.",
  );

const idSchema = z
  .string({ error: "Identificador inválido." })
  .trim()
  .min(1, "Identificador inválido.")
  .max(40, "Identificador inválido.")
  .regex(/^[a-z0-9]+$/i, "Identificador inválido.");

export const participantIdSchema = idSchema;

export const sessionTokenSchema = z
  .string({ error: "Sessão inválida." })
  .regex(/^[A-Za-z0-9_-]{20,200}$/, "Sessão inválida.");

export const BEVERAGE_CATEGORIES = [
  "REFRIGERANTE",
  "SUCO",
  "AGUA",
  "OUTRA",
] as const;

export type BeverageCategory = (typeof BEVERAGE_CATEGORIES)[number];

export const sharedBeverageItemSchema = z
  .object({
    id: z.string().trim().optional(),
    category: z.enum(BEVERAGE_CATEGORIES, {
      error: "Categoria de bebida inválida.",
    }),
    customDescription: z
      .string()
      .max(60, "A descrição da bebida pode ter no máximo 60 caracteres.")
      .transform(sanitizeText)
      .default("")
      .optional(),
    quantity: z.coerce
      .number({ error: "Quantidade inválida." })
      .int("A quantidade de bebidas deve ser um número inteiro.")
      .min(1, "A quantidade de bebidas deve ser de pelo menos 1 unidade.")
      .max(100, "A quantidade máxima por item é 100 unidades."),
    unitVolumeMl: z.coerce
      .number({ error: "Volume inválido." })
      .int("O volume deve ser um número inteiro em mL.")
      .min(50, "O volume mínimo por unidade é 50 mL.")
      .max(10_000, "O volume máximo por unidade é 10 L (10.000 mL)."),
  })
  .superRefine((val, ctx) => {
    if (
      val.category === "OUTRA" &&
      (!val.customDescription || val.customDescription.trim().length === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["customDescription"],
        message: "Descreva a bebida quando selecionar 'Outra bebida'.",
      });
    }
  });

export type SharedBeverageItemInput = z.infer<typeof sharedBeverageItemSchema>;

export const sharedBeveragesInputSchema = z
  .union([
    z.array(sharedBeverageItemSchema),
    z
      .string()
      .transform((str, ctx) => {
        if (!str || !str.trim()) return [];
        try {
          const parsed = JSON.parse(str);
          if (!Array.isArray(parsed)) {
            ctx.addIssue({
              code: "custom",
              message: "Formato de bebidas inválido.",
            });
            return z.NEVER;
          }
          return parsed;
        } catch {
          ctx.addIssue({
            code: "custom",
            message: "Formato de bebidas inválido.",
          });
          return z.NEVER;
        }
      })
      .pipe(z.array(sharedBeverageItemSchema)),
  ])
  .default([])
  .transform((items) => items.slice(0, 10));

export const participantInputSchema = z
  .object({
    name: nameSchema,
    phone: phoneSchema,
    dependentsCount: z.coerce
      .number()
      .int("A quantidade de acompanhantes deve ser um número inteiro.")
      .min(0, "A quantidade de acompanhantes deve ficar entre 0 e 20.")
      .max(20, "A quantidade de acompanhantes deve ficar entre 0 e 20."),
    bringsOwnDrink: z.boolean().default(false),
    participantId: idSchema.nullable(),
    participantToken: sessionTokenSchema.nullable(),
    specialDishDescription: additionalDishSchema,
    specialDishReplacesItemId: idSchema.nullable(),
    selectedFoodItemIds: z
      .array(idSchema)
      .max(20, "Selecione no máximo 20 itens.")
      .transform((ids) => [...new Set(ids)]),
    sharedBeverages: sharedBeveragesInputSchema,
  })
  .superRefine((value, context) => {
    if (value.specialDishReplacesItemId && !value.specialDishDescription) {
      context.addIssue({
        code: "custom",
        path: ["specialDishDescription"],
        message:
          "Descreva o prato adicional, doce, fruta ou petisco que você vai levar para indicar qual item ele substitui.",
      });
    }
  });

export const contributionInputSchema = z
  .object({
    participantId: idSchema,
    participantToken: sessionTokenSchema,
    specialDishDescription: additionalDishSchema,
    specialDishReplacesItemId: idSchema.nullable(),
    selectedFoodItemIds: z
      .array(idSchema)
      .max(20, "Selecione no máximo 20 itens.")
      .transform((ids) => [...new Set(ids)]),
    sharedBeverages: sharedBeveragesInputSchema,
  })
  .superRefine((value, context) => {
    if (value.specialDishReplacesItemId && !value.specialDishDescription) {
      context.addIssue({
        code: "custom",
        path: ["specialDishDescription"],
        message:
          "Descreva o prato adicional, doce, fruta ou petisco que você vai levar para indicar qual item ele substitui.",
      });
    }
  });

export type ParticipantInput = z.infer<typeof participantInputSchema>;
export type ContributionInput = z.infer<typeof contributionInputSchema>;

export function firstValidationMessage(error: z.ZodError): string {
  return (
    error.issues[0]?.message ??
    "Dados inválidos. Revise os campos e tente novamente."
  );
}
