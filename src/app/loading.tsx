export default function Loading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <span
          className="size-9 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent dark:border-emerald-400 dark:border-t-transparent"
          aria-hidden="true"
        />
        <p className="animate-pulse text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Carregando Tavariando...
        </p>
      </div>
    </div>
  );
}
