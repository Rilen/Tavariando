"use client";

import { useState } from "react";
import { Check, Copy, Heart, MessageCircle, QrCode } from "lucide-react";
import { normalizePixKey, normalizeWhatsappUrl } from "@/lib/format";

const DEFAULT_PIX_KEY = process.env.NEXT_PUBLIC_PIX_KEY ?? "";
const DEFAULT_WHATSAPP_URL = process.env.NEXT_PUBLIC_WHATSAPP_URL ?? "";

type PixContributionCardProps = {
  pixKey?: string;
  whatsappUrl?: string;
};

export function PixContributionCard({
  pixKey = DEFAULT_PIX_KEY,
  whatsappUrl = DEFAULT_WHATSAPP_URL,
}: PixContributionCardProps = {}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const validPixKey = normalizePixKey(pixKey);
  const validWhatsappUrl = normalizeWhatsappUrl(whatsappUrl);

  async function handleCopy() {
    if (!validPixKey) return;

    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(validPixKey);
      setCopied(true);
      setCopyError(false);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  }

  return (
    <section
      id="ajuda-de-custo"
      aria-labelledby="ajuda-de-custo-heading"
      className="overflow-hidden rounded-3xl border border-orange-200/80 bg-white p-5 shadow-sm shadow-orange-950/5 sm:p-7"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
              <QrCode className="size-5" aria-hidden="true" />
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-900">
              <Heart className="size-3.5 text-orange-700" aria-hidden="true" />
              Contribuição voluntária e livre
            </span>
          </div>

          <h2
            id="ajuda-de-custo-heading"
            className="text-lg font-bold tracking-tight text-orange-950 sm:text-xl"
          >
            Ajuda de custo do encontro (opcional)
          </h2>

          <p className="text-sm leading-relaxed text-stone-700">
            Quem quiser e puder colaborar com qualquer valor ajuda nas despesas
            do espaço — luz, gás, aluguel de mesas e cadeiras, limpeza e o
            pula-pula das crianças. O valor é totalmente livre!
          </p>
        </div>

        <div className="w-full space-y-3 rounded-2xl border border-orange-200/80 bg-orange-50/40 p-4 lg:max-w-sm">
          {validPixKey ? (
            <>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-orange-900">
                  Destinatário: Claret / Sandra
                </p>
                <p
                  aria-label="Chave Pix para cópia"
                  className="select-all break-all rounded-xl border border-orange-200 bg-white px-3 py-2 font-mono text-sm font-semibold text-stone-900"
                >
                  {validPixKey}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-2"
                >
                  {copied ? (
                    <>
                      <Check className="size-4" aria-hidden="true" />
                      Chave Pix copiada!
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" aria-hidden="true" />
                      Copiar chave Pix
                    </>
                  )}
                </button>

                {validWhatsappUrl && (
                  <a
                    href={validWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-orange-300 bg-white px-4 py-2.5 text-sm font-bold text-orange-900 transition hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700"
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                    Falar com a organização no WhatsApp
                  </a>
                )}
              </div>

              <div role="status" aria-live="polite">
                {copied && (
                  <p className="text-xs font-semibold text-emerald-800">
                    Pronto! Agora é só colar na área Pix do aplicativo do seu
                    banco.
                  </p>
                )}
                {copyError && (
                  <p className="text-xs font-medium text-amber-950">
                    Não foi possível copiar automaticamente. Toque e segure na
                    chave acima para selecioná-la e copiar.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-orange-900">
                  Organização: Claret e Sandra
                </p>
                <p className="text-sm leading-relaxed text-stone-800">
                  Quer enviar uma ajuda de custo via Pix? Peça a chave
                  diretamente para <strong>Claret ou Sandra</strong> no grupo da
                  família no WhatsApp.
                </p>
              </div>

              {validWhatsappUrl && (
                <a
                  href={validWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-orange-300 bg-white px-4 py-2.5 text-sm font-bold text-orange-900 transition hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Pedir chave no WhatsApp da organização
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
