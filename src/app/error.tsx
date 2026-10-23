"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro ao carregar Tavariando:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 text-center shadow-sm shadow-zinc-900/5 dark:border-red-500/30 dark:bg-zinc-900">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </span>

        <h1 className="mt-4 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Não foi possível carregar o evento
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Ocorreu um erro inesperado ao buscar os dados. Tente novamente em
          instantes.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
