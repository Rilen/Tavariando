"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, QrCode } from "lucide-react";

const PIX_KEY = process.env.NEXT_PUBLIC_PIX_KEY?.trim() ?? "";
const WHATSAPP_URL = process.env.NEXT_PUBLIC_WHATSAPP_URL?.trim() ?? "";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Olá! Acabei de confirmar minha presença no Tavariando e quero avisar a organização.",
);
const WHATSAPP_HREF =
  WHATSAPP_URL || `https://wa.me/?text=${WHATSAPP_MESSAGE}`;

export function PixContributionCard() {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function handleCopy() {
    if (!PIX_KEY) return;

    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopied(true);
      setCopyError(false);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <section
      id="ajuda-de-custo"
      className="overflow-hidden rounded-3xl border border-orange-100 bg-white p-5 shadow-md shadow-orange-950/5 sm:p-7"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            <QrCode className="size-5" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-bold tracking-tight text-orange-950">
            Ajuda de Custo do Encontro (Luz, Limpeza e Infra)
          </h2>
          <p className="text-sm leading-relaxed text-neutral-700">
            Para ajudar com os custos do espaço e da infraestrutura (luz, gás,
            aluguel de mesas, cadeiras, limpeza e, se alcançarmos uma boa
            ajuda, o tão sonhado pula-pula para a criançada!), qualquer valor é
            muito bem-vindo e fica a critério de cada um!
          </p>
        </div>

        <div className="w-full space-y-3 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm shadow-orange-950/5 lg:max-w-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-700">
              Pix de Claret/Sandra
            </p>
            <p className="mt-1 break-all font-mono text-sm font-medium text-neutral-900 dark:text-zinc-50">
              {PIX_KEY || "Combine a chave Pix com Claret ou Sandra"}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!PIX_KEY}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400 bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-zinc-900"
            >
              {copied ? (
                <>
                  <Check className="size-4" aria-hidden="true" />
                  Chave copiada!
                </>
              ) : (
                <>
                  <Copy className="size-4" aria-hidden="true" />
                  Copiar Chave Pix
                </>
              )}
            </button>

            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-orange-800 transition hover:bg-orange-50"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              Avisar no WhatsApp da Organização
            </a>
          </div>

          {copyError && (
            <p className="text-xs text-orange-700 dark:text-amber-300">
              Não foi possível copiar automaticamente. Selecione a chave acima.
            </p>
          )}

          {!PIX_KEY && (
            <p className="text-xs text-neutral-500">
              A chave Pix é configurada pela organização no ambiente de
              produção.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
