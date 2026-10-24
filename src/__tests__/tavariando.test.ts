import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import { prisma } from "@/lib/prisma-client";
import { resetRateLimits } from "@/lib/rate-limit";
import {
  cancelParticipation,
  registerOrUpdateParticipant,
} from "@/app/actions/event";
import { getDashboardData } from "@/lib/dashboard-data";
import {
  formatBeverageItemSummary,
  formatContainerLabel,
  formatLiters,
  formatUnitVolume,
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
    await prisma.sharedBeverage.deleteMany();
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
    await prisma.sharedBeverage.deleteMany();
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

  it("F02: Confirmação acolhedora — mensagem afetuosa de presença confirmada retornada pelo servidor", async () => {
    resetRateLimits();
    const res = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "presence",
        name: "Tia Claret",
        dependentsCount: "1",
      }),
    );

    assert.equal(res.status, "success");
    assert.ok(res.participantId);
    assert.ok(res.participantToken);
    assert.equal(res.participantName, "Tia Claret");
    assert.match(res.message, /Tudo pronto, Tia Claret!/);
  });

  it("F03: Seletor de acompanhantes — persistência exata da contagem de dependentes e pessoas", async () => {
    resetRateLimits();
    // Test solo participant (0 dependents = 1 person)
    const solo = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "presence",
        name: "Tio Solo",
        dependentsCount: "0",
      }),
    );
    assert.equal(solo.status, "success");
    const soloRecord = await prisma.participant.findUnique({
      where: { id: solo.participantId },
    });
    assert.equal(soloRecord?.dependentsCount, 0);

    // Test family group (5 dependents = 6 people)
    const family = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "presence",
        name: "Família Silva",
        dependentsCount: "5",
      }),
    );
    assert.equal(family.status, "success");
    const familyRecord = await prisma.participant.findUnique({
      where: { id: family.participantId },
    });
    assert.equal(familyRecord?.dependentsCount, 5);
  });

  it("F04: Destaque de pratos sem voluntários — identificação de itens sem voluntário vs com voluntários", async () => {
    resetRateLimits();
    // Arroz gets 1 volunteer; Farofa and Salada have 0 volunteers
    const res = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "full",
        name: "Voluntário Arroz",
        dependentsCount: "0",
        selectedFoodItemIds: [arrozId],
      }),
    );
    assert.equal(res.status, "success");

    const arrozVolunteers = await prisma.itemAssignment.count({
      where: { foodItemId: arrozId, participant: { confirmed: true } },
    });
    const farofaVolunteers = await prisma.itemAssignment.count({
      where: { foodItemId: farofaId, participant: { confirmed: true } },
    });

    assert.equal(arrozVolunteers, 1);
    assert.equal(farofaVolunteers, 0);
  });

  it("F01: Segurança da sessão — recuperação/edição exige token criptográfico válido e rejeita falsificação por nome", async () => {
    resetRateLimits();
    // Create participant legitimately
    const original = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "presence",
        name: "Primo Legítimo",
        dependentsCount: "2",
      }),
    );
    assert.equal(original.status, "success");
    const legitimateId = original.participantId!;
    const legitimateToken = original.participantToken!;

    // Attempt to hijack / update existing participant with a forged token
    const hijackedAttempt = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "presence",
        participantId: legitimateId,
        participantToken: "forged-invalid-session-token-1234567890abcdef",
        name: "Invasor Malicioso",
        dependentsCount: "0",
      }),
    );
    assert.equal(hijackedAttempt.status, "error");
    assert.match(hijackedAttempt.message, /Sua sessão expirou ou não pôde ser validada/);

    // Verify original record is unchanged
    const unchanged = await prisma.participant.findUnique({
      where: { id: legitimateId },
    });
    assert.equal(unchanged?.name, "Primo Legítimo");
    assert.equal(unchanged?.dependentsCount, 2);

    // Legitimate update with true token succeeds
    const legitimateUpdate = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "presence",
        participantId: legitimateId,
        participantToken: legitimateToken,
        name: "Primo Legítimo",
        dependentsCount: "3",
      }),
    );
    assert.equal(legitimateUpdate.status, "success");
    const updated = await prisma.participant.findUnique({
      where: { id: legitimateId },
    });
    assert.equal(updated?.dependentsCount, 3);
  });

  it("F06: Registro de contribuição voluntária de bebida compartilhada com cálculo correto de volume", async () => {
    resetRateLimits();
    const res = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "full",
        name: "Tio das Bebidas",
        dependentsCount: "1",
        sharedBeverages: JSON.stringify([
          {
            category: "REFRIGERANTE",
            quantity: 6,
            unitVolumeMl: 2000,
          },
        ]),
      }),
    );

    assert.equal(res.status, "success");
    assert.ok(res.participantId);

    const saved = await prisma.sharedBeverage.findMany({
      where: { participantId: res.participantId },
    });
    assert.equal(saved.length, 1);
    assert.equal(saved[0].category, "REFRIGERANTE");
    assert.equal(saved[0].quantity, 6);
    assert.equal(saved[0].unitVolumeMl, 2000);
    const totalMl = saved[0].quantity * saved[0].unitVolumeMl;
    assert.equal(totalMl, 12000); // 12 L
  });

  it("F06: Registro de múltiplas bebidas de diferentes tipos e volumes em embalagens distintas", async () => {
    resetRateLimits();
    const res = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "full",
        name: "Prima Organizada",
        dependentsCount: "0",
        sharedBeverages: JSON.stringify([
          {
            category: "REFRIGERANTE",
            quantity: 4,
            unitVolumeMl: 2000,
          },
          {
            category: "SUCO",
            quantity: 3,
            unitVolumeMl: 1000,
          },
          {
            category: "AGUA",
            quantity: 12,
            unitVolumeMl: 500,
          },
        ]),
      }),
    );

    assert.equal(res.status, "success");
    const saved = await prisma.sharedBeverage.findMany({
      where: { participantId: res.participantId },
      orderBy: { unitVolumeMl: "desc" },
    });
    assert.equal(saved.length, 3);

    const refri = saved.find((b) => b.category === "REFRIGERANTE");
    const suco = saved.find((b) => b.category === "SUCO");
    const agua = saved.find((b) => b.category === "AGUA");

    assert.equal(refri?.quantity, 4);
    assert.equal(refri?.unitVolumeMl, 2000); // 8 L
    assert.equal(suco?.quantity, 3);
    assert.equal(suco?.unitVolumeMl, 1000); // 3 L
    assert.equal(agua?.quantity, 12);
    assert.equal(agua?.unitVolumeMl, 500); // 6 L
  });

  it("F06: Categoria 'Outra bebida' exige descrição personalizada não vazia", async () => {
    resetRateLimits();
    // Empty description fails
    const failRes = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "full",
        name: "Primo Criativo",
        dependentsCount: "0",
        sharedBeverages: JSON.stringify([
          {
            category: "OUTRA",
            customDescription: "   ",
            quantity: 2,
            unitVolumeMl: 1000,
          },
        ]),
      }),
    );
    assert.equal(failRes.status, "error");
    assert.match(failRes.message, /Descreva a bebida quando selecionar 'Outra bebida'/);

    // Valid description succeeds
    const successRes = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "full",
        name: "Primo Criativo",
        dependentsCount: "0",
        sharedBeverages: JSON.stringify([
          {
            category: "OUTRA",
            customDescription: "Chá mate gelado com limão",
            quantity: 2,
            unitVolumeMl: 1500,
          },
        ]),
      }),
    );
    assert.equal(successRes.status, "success");
    const saved = await prisma.sharedBeverage.findFirst({
      where: { participantId: successRes.participantId },
    });
    assert.equal(saved?.category, "OUTRA");
    assert.equal(saved?.customDescription, "Chá mate gelado com limão");
    assert.equal(saved?.quantity, 2);
    assert.equal(saved?.unitVolumeMl, 1500);
  });

  it("F06: Edição de bebidas compartilhadas por participante autenticado com atualização correta no banco", async () => {
    resetRateLimits();
    // Step 1: Create participant with initial drink
    const initial = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "full",
        name: "Tia Maria",
        dependentsCount: "2",
        sharedBeverages: JSON.stringify([
          {
            category: "REFRIGERANTE",
            quantity: 2,
            unitVolumeMl: 2000,
          },
        ]),
      }),
    );
    assert.equal(initial.status, "success");
    const pId = initial.participantId!;
    const pToken = initial.participantToken!;

    // Step 2: Update shared beverages via contribution step
    const updated = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "contribution",
        participantId: pId,
        participantToken: pToken,
        sharedBeverages: JSON.stringify([
          {
            category: "REFRIGERANTE",
            quantity: 4,
            unitVolumeMl: 2000,
          },
          {
            category: "SUCO",
            quantity: 2,
            unitVolumeMl: 1000,
          },
        ]),
      }),
    );
    assert.equal(updated.status, "success");

    const saved = await prisma.sharedBeverage.findMany({
      where: { participantId: pId },
      orderBy: { category: "asc" },
    });
    assert.equal(saved.length, 2);
    assert.equal(saved[0].category, "REFRIGERANTE");
    assert.equal(saved[0].quantity, 4);
    assert.equal(saved[1].category, "SUCO");
    assert.equal(saved[1].quantity, 2);
  });

  it("F06: Exclusão/desmarcação de bebidas compartilhadas remove os registros do banco", async () => {
    resetRateLimits();
    // Create participant with shared beverages
    const initial = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "full",
        name: "Tio João",
        dependentsCount: "0",
        sharedBeverages: JSON.stringify([
          {
            category: "AGUA",
            quantity: 6,
            unitVolumeMl: 1500,
          },
        ]),
      }),
    );
    assert.equal(initial.status, "success");
    const pId = initial.participantId!;
    const pToken = initial.participantToken!;

    const countBefore = await prisma.sharedBeverage.count({
      where: { participantId: pId },
    });
    assert.equal(countBefore, 1);

    // Update with empty list []
    const clearRes = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "full",
        participantId: pId,
        participantToken: pToken,
        name: "Tio João",
        dependentsCount: "0",
        sharedBeverages: "[]",
      }),
    );
    assert.equal(clearRes.status, "success");

    const countAfter = await prisma.sharedBeverage.count({
      where: { participantId: pId },
    });
    assert.equal(countAfter, 0);
  });

  it("F06: Cancelamento de participação remove completamente as bebidas compartilhadas do participante", async () => {
    resetRateLimits();
    const initial = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "full",
        name: "Primo Desistente",
        dependentsCount: "1",
        sharedBeverages: JSON.stringify([
          {
            category: "REFRIGERANTE",
            quantity: 4,
            unitVolumeMl: 2000,
          },
        ]),
      }),
    );
    assert.equal(initial.status, "success");
    const pId = initial.participantId!;
    const pToken = initial.participantToken!;

    const cancelRes = await cancelParticipation(pId, pToken);
    assert.equal(cancelRes.status, "success");

    const remainingDrinks = await prisma.sharedBeverage.count({
      where: { participantId: pId },
    });
    assert.equal(remainingDrinks, 0);

    const participant = await prisma.participant.findUnique({
      where: { id: pId },
    });
    assert.equal(participant?.confirmed, false);
  });

  it("F06: Tentativa de alteração de bebidas por sessão forjada é rejeitada", async () => {
    resetRateLimits();
    const legitimate = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "full",
        name: "Vítima de Ataque",
        dependentsCount: "0",
        sharedBeverages: JSON.stringify([
          {
            category: "SUCO",
            quantity: 2,
            unitVolumeMl: 1000,
          },
        ]),
      }),
    );
    assert.equal(legitimate.status, "success");
    const pId = legitimate.participantId!;

    const attackRes = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "contribution",
        participantId: pId,
        participantToken: "forged-invalid-session-token-1234567890abcdef",
        sharedBeverages: "[]",
      }),
    );
    assert.equal(attackRes.status, "error");
    assert.match(attackRes.message, /Sua sessão expirou ou não pôde ser validada/);

    // Drinks remain intact
    const drinks = await prisma.sharedBeverage.findMany({
      where: { participantId: pId },
    });
    assert.equal(drinks.length, 1);
    assert.equal(drinks[0].category, "SUCO");
  });

  it("F06: Resumo agregado no dashboard agrupa por categoria e volume sem somar garrafas e latas como equivalentes", async () => {
    resetRateLimits();
    // Participant 1: 6 bottles of 2 L of Refrigerante (= 12 L)
    await registerOrUpdateParticipant(
      buildFormData({
        formScope: "full",
        name: "Participante 1",
        dependentsCount: "0",
        sharedBeverages: JSON.stringify([
          {
            category: "REFRIGERANTE",
            quantity: 6,
            unitVolumeMl: 2000,
          },
        ]),
      }),
    );

    // Participant 2: 4 cans of 350 mL of Refrigerante (= 1.4 L) + 3 bottles of 1 L of Suco (= 3 L)
    await registerOrUpdateParticipant(
      buildFormData({
        formScope: "full",
        name: "Participante 2",
        dependentsCount: "1",
        sharedBeverages: JSON.stringify([
          {
            category: "REFRIGERANTE",
            quantity: 4,
            unitVolumeMl: 350,
          },
          {
            category: "SUCO",
            quantity: 3,
            unitVolumeMl: 1000,
          },
        ]),
      }),
    );

    const dashboard = await getDashboardData();
    const summary = dashboard.sharedBeveragesSummary;

    // Total liters: 12 + 1.4 + 3 = 16.4 L
    assert.equal(summary.totalLiters, 16.4);
    assert.equal(summary.totalUnits, 13); // 6 + 4 + 3
    assert.equal(summary.groups.length, 2); // Refrigerante and Suco

    const refriGroup = summary.groups.find((g) => g.category === "REFRIGERANTE");
    assert.ok(refriGroup);
    assert.equal(refriGroup.totalLiters, 13.4);
    // Distinct breakdowns by packaging size:
    assert.equal(refriGroup.items.length, 2);

    const bottles2L = refriGroup.items.find((i) => i.unitVolumeMl === 2000);
    assert.ok(bottles2L);
    assert.equal(bottles2L.totalQuantity, 6);
    assert.equal(bottles2L.totalLiters, 12);
    assert.equal(bottles2L.containerLabel, "6 garrafas de 2 L");

    const cans350mL = refriGroup.items.find((i) => i.unitVolumeMl === 350);
    assert.ok(cans350mL);
    assert.equal(cans350mL.totalQuantity, 4);
    assert.equal(cans350mL.totalLiters, 1.4);
    assert.equal(cans350mL.containerLabel, "4 latas de 350 mL");

    const sucoGroup = summary.groups.find((g) => g.category === "SUCO");
    assert.ok(sucoGroup);
    assert.equal(sucoGroup.totalLiters, 3);
    assert.equal(sucoGroup.items.length, 1);
    assert.equal(sucoGroup.items[0].containerLabel, "3 garrafas de 1 L");
  });

  it("F06: Estado vazio acolhedor no dashboard quando não há bebidas declaradas", async () => {
    resetRateLimits();
    // Participant registered without shared beverages
    await registerOrUpdateParticipant(
      buildFormData({
        formScope: "presence",
        name: "Visitante Sem Bebida",
        dependentsCount: "0",
      }),
    );

    const dashboard = await getDashboardData();
    assert.equal(dashboard.sharedBeveragesSummary.totalLiters, 0);
    assert.equal(dashboard.sharedBeveragesSummary.totalUnits, 0);
    assert.equal(dashboard.sharedBeveragesSummary.groups.length, 0);
  });

  it("F06: Validação de limites — rejeição de quantidades ou volumes inválidos", async () => {
    resetRateLimits();
    // Quantity 0
    const zeroQty = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "full",
        name: "Teste Limite",
        dependentsCount: "0",
        sharedBeverages: JSON.stringify([
          {
            category: "REFRIGERANTE",
            quantity: 0,
            unitVolumeMl: 2000,
          },
        ]),
      }),
    );
    assert.equal(zeroQty.status, "error");

    // Quantity > 100
    const excessQty = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "full",
        name: "Teste Limite",
        dependentsCount: "0",
        sharedBeverages: JSON.stringify([
          {
            category: "REFRIGERANTE",
            quantity: 101,
            unitVolumeMl: 2000,
          },
        ]),
      }),
    );
    assert.equal(excessQty.status, "error");

    // Volume < 50 mL
    const tooSmallVol = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "full",
        name: "Teste Limite",
        dependentsCount: "0",
        sharedBeverages: JSON.stringify([
          {
            category: "AGUA",
            quantity: 1,
            unitVolumeMl: 10,
          },
        ]),
      }),
    );
    assert.equal(tooSmallVol.status, "error");

    // Volume > 10000 mL
    const tooLargeVol = await registerOrUpdateParticipant(
      buildFormData({
        formScope: "full",
        name: "Teste Limite",
        dependentsCount: "0",
        sharedBeverages: JSON.stringify([
          {
            category: "AGUA",
            quantity: 1,
            unitVolumeMl: 15000,
          },
        ]),
      }),
    );
    assert.equal(tooLargeVol.status, "error");
  });

  it("F06: Funções de formatação de rótulos e volumes em litros", () => {
    assert.equal(formatUnitVolume(200), "200 mL");
    assert.equal(formatUnitVolume(350), "350 mL");
    assert.equal(formatUnitVolume(500), "500 mL");
    assert.equal(formatUnitVolume(1000), "1 L");
    assert.equal(formatUnitVolume(1500), "1,5 L");
    assert.equal(formatUnitVolume(2000), "2 L");

    assert.equal(formatContainerLabel(1, 2000), "1 garrafa de 2 L");
    assert.equal(formatContainerLabel(6, 2000), "6 garrafas de 2 L");
    assert.equal(formatContainerLabel(1, 350), "1 lata de 350 mL");
    assert.equal(formatContainerLabel(4, 350), "4 latas de 350 mL");
    assert.equal(formatContainerLabel(1, 500), "1 garrafa de 500 mL");
    assert.equal(formatContainerLabel(12, 500), "12 garrafas de 500 mL");

    assert.equal(formatLiters(12), "12 L");
    assert.equal(formatLiters(1.4), "1,4 L");
    assert.equal(formatLiters(16.4), "16,4 L");

    assert.equal(
      formatBeverageItemSummary(6, 2000),
      "6 garrafas de 2 L — 12 L",
    );
    assert.equal(
      formatBeverageItemSummary(4, 350),
      "4 latas de 350 mL — 1,4 L",
    );
    assert.equal(
      formatBeverageItemSummary(2, 1000, "Chá gelado"),
      "Chá gelado: 2 garrafas de 1 L — 2 L",
    );
  });
});
