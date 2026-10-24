const ICE_MESSAGE =
  "🧊 Lembrete: quem leva bebida própria traz também 1 saco de gelo para manter seu cooler ou térmica geladinha o dia todo!";

export function IceReminder() {
  return (
    <p
      role="note"
      className="rounded-xl border border-sky-300 bg-sky-50 px-3.5 py-2.5 text-xs font-medium leading-relaxed text-sky-950"
    >
      {ICE_MESSAGE}
    </p>
  );
}
