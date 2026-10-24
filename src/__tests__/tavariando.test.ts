import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import { prisma } from "@/lib/prisma-client";
import { resetRateLimits } from "@/lib/rate-limit";
import {
  cancelParticipation,
  registerOrUpdateParticipant,
} from "@/app/actions/event";
import {
  normalizePixKey,
  normalizeWhatsappUrl,
} from "@/lib/format";
import { isValidStoredSession } from "@/lib/participant-storage";

const dbUrl = process.env.DATABASE_URL ?? "";
if (!dbUrl.startsWith("file:")) {
  throw new Error(
    `ABORTED: Integration tests must run against an isolated local SQLite file (got DATABASE_URL="${dbUrl}").`,
  );
}

function buildFormData(
  entries: Record<string, string | string[] | undefined>,
): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        formData.append(key, item);
      }
    } else {
      formData.set(key, value);
    }
  }
  return formData;
}

describe("Tavariando — Fluxo de Confirmação, Contribuição e Segurança", () => {
  let arrozId = "";
  let saladaId = "";
  let farofaId = "";
  let sobremesaId = "";

  before(async () => {
    await prisma.itemAssignment.deleteMany();
    await prisma.specialDish.deleteMany();
    await prisma.participantSession.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.foodItem.deleteMany();

    const arroz = await prisma.foodItem.create({
      data: {
        name: "Arroz branco",
        category: "COMIDA",
        portionPerPerson: 70,
        unitMeasure: "g",
      },
    });
    const salada = await prisma.foodItem.create({
      data: {
        name: "Salada de maionese / batata",
        category: "COMIDA",
        portionPerPerson: 120,
        unitMeasure: "g",
      },
    });
    const farofa = await prisma.foodItem.create({
      data: {
        name: "Farofa pronta",
        category: "COMIDA",
        portionPerPerson: 40,
        unitMeasure: "g",
      },
    });
    const sobremesa = await prisma.foodItem.create({
      data: {
        name: "Sobremesa",
        category: "SOBREMESA",
        portionPerPerson: 100,
        unitMeasure: "g",
      },
    });

    arrozId = arroz.id;
    saladaId = salada.id;
    farofaId = farofa.id;
    sobremesaId = sobremesa.id;
  });

  beforeEach(async () => {
    resetRateLimits();
    await prisma.itemAssignment.deleteMany();
    await prisma.specialDish.deleteMany();
    await prisma.participantSession.deleteMany();
    await prisma.participant.deleteMany();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("1. Nova confirmação sem prato (Etapa 1 pura)", async () => {
    const res = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "presence",
        name: "Tia Helena",
        phone: "(11) 98888-7777",
        dependentsCount: "2",
        bringsOwnDrink: "on",
      }),
    );

    assert.equal(res.status, "success");
    assert.ok(res.participantId);
    assert.ok(res.participantToken);
    assert.equal(res.stepCompleted, "presence");

    const saved = await prisma.participant.findUnique({
      where: { id: res.participantId },
      include: { assignments: true, specialDish: true },
    });

    assert.ok(saved);
    assert.equal(saved.name, "Tia Helena");
    assert.equal(saved.phone, "11988887777");
    assert.equal(saved.dependentsCount, 2);
    assert.equal(saved.bringsOwnDrink, true);
    assert.equal(saved.confirmed, true);
    assert.equal(saved.assignments.length, 0);
    assert.equal(saved.specialDish, null);
  });

  it("2. Nova confirmação com prato no mesmo envio", async () => {
    const res = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "full",
        name: "Tio Carlos",
        dependentsCount: "1",
        selectedFoodItemIds: [arrozId],
      }),
    );

    assert.equal(res.status, "success");
    assert.ok(res.participantId);

    const saved = await prisma.participant.findUnique({
      where: { id: res.participantId },
      include: { assignments: true },
    });

    assert.ok(saved);
    assert.equal(saved.name, "Tio Carlos");
    assert.equal(saved.dependentsCount, 1);
    assert.equal(saved.assignments.length, 1);
    assert.equal(saved.assignments[0]?.foodItemId, arrozId);
  });

  it("3. Escolha posterior de prato (Etapa 2 sem reenviar nome/acompanhantes/telefone)", async () => {
    const step1 = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "presence",
        name: "Prima Juliana",
        phone: "(21) 97777-6666",
        dependentsCount: "3",
        bringsOwnDrink: "true",
      }),
    );
    assert.equal(step1.status, "success");

    const step2 = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "contribution",
        participantId: step1.participantId,
        participantToken: step1.participantToken,
        selectedFoodItemIds: [saladaId],
      }),
    );

    assert.equal(step2.status, "success");
    assert.equal(step2.stepCompleted, "contribution");

    const saved = await prisma.participant.findUnique({
      where: { id: step1.participantId },
      include: { assignments: true },
    });

    assert.ok(saved);
    assert.equal(saved.name, "Prima Juliana");
    assert.equal(saved.phone, "21977776666");
    assert.equal(saved.dependentsCount, 3);
    assert.equal(saved.bringsOwnDrink, true);
    assert.equal(saved.assignments.length, 1);
    assert.equal(saved.assignments[0]?.foodItemId, saladaId);
  });

  it("4. Edição de nome e acompanhantes não apaga pratos escolhidos nem telefone existente", async () => {
    const initial = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "full",
        name: "Vó Maria",
        phone: "(11) 91234-5678",
        dependentsCount: "1",
        selectedFoodItemIds: [arrozId, farofaId],
        specialDishDescription: "Bolo de fubá",
      }),
    );
    assert.equal(initial.status, "success");

    // Edit presence only, leaving phone empty (as happens on a fresh page reload where phone isn't in public RSC data)
    const editedPresence = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "presence",
        participantId: initial.participantId,
        participantToken: initial.participantToken,
        name: "Vó Maria Aparecida",
        phone: "",
        clearPhone: "false",
        dependentsCount: "4",
        bringsOwnDrink: "false",
      }),
    );

    assert.equal(editedPresence.status, "success");

    const saved = await prisma.participant.findUnique({
      where: { id: initial.participantId },
      include: { assignments: true, specialDish: true },
    });

    assert.ok(saved);
    assert.equal(saved.name, "Vó Maria Aparecida");
    assert.equal(saved.dependentsCount, 4);
    assert.equal(saved.phone, "11912345678");
    assert.equal(saved.assignments.length, 2);
    assert.equal(saved.specialDish?.description, "Bolo de fubá");
  });

  it("5 e 6. Edição de contribuição: inclusão e remoção de itens", async () => {
    const created = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "presence",
        name: "Primo Marcos",
        dependentsCount: "2",
      }),
    );
    assert.equal(created.status, "success");

    // Include 2 items
    const addItems = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "contribution",
        participantId: created.participantId,
        participantToken: created.participantToken,
        selectedFoodItemIds: [arrozId, saladaId],
      }),
    );
    assert.equal(addItems.status, "success");

    let assignments = await prisma.itemAssignment.findMany({
      where: { participantId: created.participantId },
    });
    assert.equal(assignments.length, 2);

    // Remove 1 item and add another
    const updateItems = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "contribution",
        participantId: created.participantId,
        participantToken: addItems.participantToken,
        selectedFoodItemIds: [farofaId],
      }),
    );
    assert.equal(updateItems.status, "success");

    assignments = await prisma.itemAssignment.findMany({
      where: { participantId: created.participantId },
    });
    assert.equal(assignments.length, 1);
    assert.equal(assignments[0]?.foodItemId, farofaId);

    // Remove all items (remain confirmed without contribution)
    const removeAll = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "contribution",
        participantId: created.participantId,
        participantToken: updateItems.participantToken,
        selectedFoodItemIds: [],
      }),
    );
    assert.equal(removeAll.status, "success");

    const participantAfter = await prisma.participant.findUnique({
      where: { id: created.participantId },
      include: { assignments: true },
    });
    assert.ok(participantAfter?.confirmed);
    assert.equal(participantAfter?.assignments.length, 0);
  });

  it("7 e 8. Prato adicional, substituição de item básico e remoção posterior (Regressão H3)", async () => {
    const otherParticipant = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "full",
        name: "Tio Paulo",
        dependentsCount: "0",
        selectedFoodItemIds: [farofaId],
        specialDishDescription: "Pudim de leite",
      }),
    );
    assert.equal(otherParticipant.status, "success");

    const created = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "full",
        name: "Tia Sandra",
        dependentsCount: "1",
        selectedFoodItemIds: [arrozId, saladaId],
        specialDishDescription: "Salpicão especial",
        specialDishReplacesItemId: saladaId,
      }),
    );
    assert.equal(created.status, "success");

    const saved = await prisma.participant.findUnique({
      where: { id: created.participantId },
      include: { assignments: true, specialDish: true },
    });

    assert.ok(saved);
    // saladaId was replaced by the special dish, so only arrozId remains in basic assignments
    assert.equal(saved.assignments.length, 1);
    assert.equal(saved.assignments[0]?.foodItemId, arrozId);
    assert.ok(saved.specialDish);
    assert.equal(saved.specialDish.description, "Salpicão especial");
    assert.equal(saved.specialDish.replacesFoodItemId, saladaId);

    // Regressão H3: Desmarcar/limpar prato adicional deve removê-lo do banco sem enviar replacesItemId obsoleto,
    // preservando os pratos básicos selecionados (arrozId) e sem afetar outros participantes (Tio Paulo).
    const removedSpecialDish = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "contribution",
        participantId: created.participantId,
        participantToken: created.participantToken,
        selectedFoodItemIds: [arrozId],
        specialDishDescription: "",
        specialDishReplacesItemId: "",
      }),
    );
    assert.equal(removedSpecialDish.status, "success");

    const savedAfterRemoval = await prisma.participant.findUnique({
      where: { id: created.participantId },
      include: { assignments: true, specialDish: true },
    });
    assert.ok(savedAfterRemoval);
    assert.equal(savedAfterRemoval.specialDish, null);
    assert.equal(savedAfterRemoval.assignments.length, 1);
    assert.equal(savedAfterRemoval.assignments[0]?.foodItemId, arrozId);

    // Verifica que a contribuição de outro participante permaneceu intacta
    const otherAfter = await prisma.participant.findUnique({
      where: { id: otherParticipant.participantId },
      include: { assignments: true, specialDish: true },
    });
    assert.equal(otherAfter?.assignments.length, 1);
    assert.equal(otherAfter?.specialDish?.description, "Pudim de leite");
  });

  it("9, 10 e 11. Isolamento entre participantes, rotação de token, cancelamento e reconfirmação imediata (Regressão H1/H5)", async () => {
    const p1 = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "full",
        name: "Participante 1",
        phone: "(11) 98877-6655",
        dependentsCount: "1",
        selectedFoodItemIds: [arrozId],
      }),
    );
    const p2 = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "presence",
        name: "Participante 2",
        dependentsCount: "0",
      }),
    );

    assert.equal(p1.status, "success");
    assert.equal(p2.status, "success");

    // 1. Tentativa de editar p1 usando token de p2 -> rejeitado por autorização
    const unauthorizedEdit = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "presence",
        participantId: p1.participantId,
        participantToken: p2.participantToken,
        name: "Invasor",
        dependentsCount: "0",
      }),
    );
    assert.equal(unauthorizedEdit.status, "error");

    // 2. Tentativa de cancelar p1 usando token de p2 -> rejeitado por autorização
    // (Nota: o aborto de cancelamento na interface "Manter minha presença" não invoca a Server Action e é verificado via E2E no Chrome)
    const unauthorizedCancel = await cancelParticipation(
      p1.participantId!,
      p2.participantToken!,
    );
    assert.equal(unauthorizedCancel.status, "error");

    // 3. Edição legítima de p1 rotaciona o token e invalida o token anterior
    const p1Edit = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "presence",
        participantId: p1.participantId,
        participantToken: p1.participantToken,
        name: "Participante 1 Editado",
        dependentsCount: "2",
      }),
    );
    assert.equal(p1Edit.status, "success");
    assert.notEqual(p1Edit.participantToken, p1.participantToken);

    const replayOldToken = await cancelParticipation(
      p1.participantId!,
      p1.participantToken!,
    );
    assert.equal(replayOldToken.status, "error");

    // 4. Cancelamento confirmado com o token atualizado
    const validCancel = await cancelParticipation(
      p1.participantId!,
      p1Edit.participantToken!,
    );
    assert.equal(validCancel.status, "success");

    const p1AfterCancel = await prisma.participant.findUnique({
      where: { id: p1.participantId },
      include: { assignments: true, session: true },
    });
    assert.equal(p1AfterCancel?.confirmed, false);
    assert.equal(p1AfterCancel?.assignments.length, 0);
    assert.equal(p1AfterCancel?.session, null);

    // 5. Regressão H1: Tentativa de reutilizar sessão cancelada falha, mas nova confirmação imediata (sem participantId anterior) cria novo participante válido
    const reuseCancelledSession = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "presence",
        participantId: p1.participantId,
        participantToken: p1Edit.participantToken,
        name: "Participante 1",
        dependentsCount: "1",
      }),
    );
    assert.equal(reuseCancelledSession.status, "error");

    resetRateLimits();
    const reconfirmImmediately = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "presence",
        participantId: "",
        participantToken: "",
        name: "Participante 1 Reconfirmado",
        phone: "(11) 97766-5544",
        dependentsCount: "1",
      }),
    );
    assert.equal(reconfirmImmediately.status, "success");
    assert.ok(reconfirmImmediately.participantId);
    assert.notEqual(reconfirmImmediately.participantId, p1.participantId);
  });

  it("12. Limite de capacidade e concorrência real simultânea na escolha de itens (Regressão H5)", async () => {
    // 3 participantes concorrendo simultaneamente via Promise.all para Sobremesa (capacidade = 1 para até 12 pessoas)
    const [resA, resB, resC] = await Promise.all([
      registerOrUpdateParticipant(
        buildFormData({
          formScope: "full",
          name: "Família Concorrente A",
          dependentsCount: "1",
          selectedFoodItemIds: [sobremesaId],
        }),
      ),
      registerOrUpdateParticipant(
        buildFormData({
          formScope: "full",
          name: "Família Concorrente B",
          dependentsCount: "1",
          selectedFoodItemIds: [sobremesaId],
        }),
      ),
      registerOrUpdateParticipant(
        buildFormData({
          formScope: "full",
          name: "Família Concorrente C",
          dependentsCount: "1",
          selectedFoodItemIds: [sobremesaId],
        }),
      ),
    ]);

    const results = [resA, resB, resC];
    const successes = results.filter((r) => r.status === "success");
    const failures = results.filter((r) => r.status === "error");

    assert.equal(successes.length, 1);
    assert.equal(failures.length, 2);
    for (const failure of failures) {
      assert.match(
        failure.message,
        /já está com o número suficiente de voluntários/,
      );
    }

    const persistedAssignments = await prisma.itemAssignment.findMany({
      where: { foodItemId: sobremesaId },
    });
    assert.equal(persistedAssignments.length, 1);
    assert.equal(
      persistedAssignments[0]?.participantId,
      successes[0]?.participantId,
    );
  });

  it("Proteção contra bots (honeypot), rate limit e validadores de sessão/Pix/WhatsApp", async () => {
    // Honeypot filled -> ignored without creating DB record
    const botAttempt = await registerOrUpdateParticipant(
      buildFormData({
        name: "Bot",
        website: "https://spam.example.com",
      }),
    );
    assert.equal(botAttempt.status, "success");
    const totalParticipants = await prisma.participant.count();
    assert.equal(totalParticipants, 0);

    // Session validator
    assert.equal(isValidStoredSession(null, null), false);
    assert.equal(isValidStoredSession("abc", "short"), false);
    assert.equal(
      isValidStoredSession(
        "cm9abc1234567890",
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_-abcdef",
      ),
      true,
    );

    // Pix & WhatsApp validators
    assert.equal(normalizePixKey(""), null);
    assert.equal(normalizePixKey("chave-pix-aqui"), null);
    assert.equal(
      normalizePixKey("claret.sandra@familia.com.br"),
      "claret.sandra@familia.com.br",
    );

    assert.equal(normalizeWhatsappUrl(""), null);
    assert.equal(normalizeWhatsappUrl("https://wa.me/55DDDNUMERO"), null);
    assert.equal(normalizeWhatsappUrl("https://evil.example.com/123"), null);
    const validWa = normalizeWhatsappUrl("https://wa.me/5511999998888");
    assert.ok(validWa?.startsWith("https://wa.me/5511999998888?text="));

    // Rate limiting (5 allowed per minute, 6th blocked)
    resetRateLimits();
    for (let i = 1; i <= 5; i++) {
      const r = await registerOrUpdateParticipant(
        buildFormData({
          name: `Teste ${i}`,
          website: "honeypot",
        }),
      );
      assert.equal(r.status, "success");
    }
    const sixth = await registerOrUpdateParticipant(
      buildFormData({
        name: "Teste 6",
        website: "honeypot",
      }),
    );
    assert.equal(sixth.status, "error");
    assert.match(sixth.message, /Muitas tentativas/);
  });
});
