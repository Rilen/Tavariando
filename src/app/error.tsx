"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h2 className="mb-2 text-xl font-bold text-orange-950">
        Ops, algo deu errado!
      </h2>
      <p className="mb-4 text-sm text-neutral-700">
        {error.message || "Erro ao carregar os dados."}
      </p>
      <button
        onClick={() => reset()}
        className="rounded-lg bg-orange-500 px-4 py-2 text-white transition hover:bg-orange-600"
      >
        Tentar novamente
      </button>
    </div>
  );
}
