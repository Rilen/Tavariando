const ICE_MESSAGE =
  "🧊 Atenção: Quem for levar bebida, não se esqueça de trazer o seu próprio saco de gelo para garantir o cooler/térmica gelada o dia todo!";

export function IceReminder() {
  return (
    <p
      role="note"
      className="mt-3 rounded-xl border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-medium leading-relaxed text-sky-900 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-200"
    >
      {ICE_MESSAGE}
    </p>
  );
}
