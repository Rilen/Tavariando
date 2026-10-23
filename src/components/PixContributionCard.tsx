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
      className="overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm shadow-amber-900/5 sm:p-7 dark:border-amber-500/30 dark:from-amber-500/10 dark:to-orange-500/10"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            <QrCode className="size-5" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold tracking-tight text-amber-950 dark:text-amber-50">
            Ajuda de Custo do Encontro (Luz, Limpeza e Infra)
          </h2>
          <p className="text-sm leading-relaxed text-amber-900/80 dark:text-amber-100/80">
            Para ajudar com os custos do espaço e da infraestrutura (luz, gás,
            aluguel de mesas, cadeiras, limpeza e, se alcançarmos uma boa
            ajuda, o tão sonhado pula-pula para a criançada!), qualquer valor é
            muito bem-vindo e fica a critério de cada um!
          </p>
        </div>

        <div className="w-full space-y-3 rounded-2xl border border-amber-200 bg-white/80 p-4 shadow-sm lg:max-w-sm dark:border-amber-500/30 dark:bg-zinc-900/70">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              Pix de Claret/Sandra
            </p>
            <p className="mt-1 break-all font-mono text-sm font-medium text-zinc-900 dark:text-zinc-50">
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
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-50 dark:border-amber-500/40 dark:bg-zinc-950 dark:text-amber-200 dark:hover:bg-amber-500/10"
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
            <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
              A chave Pix é configurada pela organização no ambiente de
              produção.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
