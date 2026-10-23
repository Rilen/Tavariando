import { Suspense } from "react";
import { connection } from "next/server";
import { HeartHandshake, ListChecks, Loader2, Users } from "lucide-react";
import { getDashboardData } from "@/app/actions/event";
import { ConfirmationForm } from "@/components/ConfirmationForm";
import { DashboardItems } from "@/components/DashboardItems";
import { HeaderStats } from "@/components/HeaderStats";
import { MyQuotaCard } from "@/components/MyQuotaCard";

async function Dashboard() {
  await connection();
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <HeaderStats stats={data.stats} />

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ConfirmationForm items={data.items} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:col-span-2">
          <MyQuotaCard
            participants={data.participants}
            items={data.items}
            totalPessoas={data.stats.totalPessoas}
          />

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
              Como funciona
            </h2>
            <ol className="mt-4 space-y-4">
              <li className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <Users className="size-4" aria-hidden="true" />
                </span>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  Confirme presença e informe quantas pessoas vêm com você.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  <ListChecks className="size-4" aria-hidden="true" />
                </span>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  Escolha os pratos que pode levar. Cada item pode ter vários
                  voluntários.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300">
                  <HeartHandshake className="size-4" aria-hidden="true" />
                </span>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  A cota de cada família é recalculada automaticamente. Todo
                  mundo leva um pouco, ninguém leva tudo.
                </p>
              </li>
            </ol>
          </section>
        </aside>
      </div>

      <DashboardItems items={data.items} totalPessoas={data.stats.totalPessoas} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden="true">
      <div className="h-72 rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="h-[34rem] rounded-3xl bg-zinc-200 lg:col-span-3 dark:bg-zinc-800" />
        <div className="space-y-6 lg:col-span-2">
          <div className="h-60 rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-64 rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
      <div className="h-72 rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="space-y-6">
      <p
        role="status"
        aria-live="polite"
        className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
      >
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Carregando dados do evento...
      </p>
      <DashboardSkeleton />
    </div>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <Suspense fallback={<DashboardLoading />}>
        <Dashboard />
      </Suspense>

      <footer className="mt-10 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Feito com carinho para a família Tavariando. Qualquer dúvida, fale com
        a organização.
      </footer>
    </main>
  );
}
