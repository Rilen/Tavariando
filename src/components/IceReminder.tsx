type IceReminderProps = {
  compact?: boolean;
};

const ICE_MESSAGE =
  "🧊 Atenção: Quem for levar bebida, não se esqueça de trazer o seu próprio saco de gelo para garantir o cooler/térmica gelada o dia todo!";

export function IceReminder({ compact = false }: IceReminderProps) {
  if (compact) {
    return (
      <p
        role="note"
        className="mt-3 rounded-xl border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-medium leading-relaxed text-sky-900 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-200"
      >
        {ICE_MESSAGE}
      </p>
    );
  }

  return (
    <aside
      role="note"
      className="mb-6 rounded-2xl border-2 border-sky-300 bg-sky-50 p-4 shadow-sm shadow-sky-900/5 dark:border-sky-500/40 dark:bg-sky-500/10"
    >
      <p className="text-sm font-semibold leading-relaxed text-sky-950 sm:text-base dark:text-sky-100">
        {ICE_MESSAGE}
      </p>
      <p className="mt-1 text-xs text-sky-800/80 dark:text-sky-200/80">
        O gelo não entra no rateio dos pratos: cada cooler/térmica leva o seu.
      </p>
    </aside>
  );
}
