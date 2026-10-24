import { Suspense } from "react";
import { connection } from "next/server";
import { Loader2 } from "lucide-react";
import { getDashboardData } from "@/lib/dashboard-data";
import { ConfirmationForm } from "@/components/ConfirmationForm";
import { DashboardItems } from "@/components/DashboardItems";
import { HeaderStats } from "@/components/HeaderStats";
import { MyQuotaCard } from "@/components/MyQuotaCard";
import { PixContributionCard } from "@/components/PixContributionCard";
import { SharedTable } from "@/components/SharedTable";
import { OurStorySection } from "@/components/OurStorySection";

async function Dashboard() {
  await connection();
  const data = await getDashboardData();

  return (
    <div className="space-y-6 sm:space-y-8">
      <HeaderStats stats={data.stats} participants={data.participants} />

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-3">
          <ConfirmationForm
            items={data.items}
            participants={data.participants}
            totalPessoas={data.stats.totalPessoas}
          />
        </div>

        <aside className="min-w-0 space-y-6 has-[[data-participant-confirmed=true]]:order-first lg:col-span-2 lg:sticky lg:top-6 lg:has-[[data-participant-confirmed=true]]:order-none">
          <MyQuotaCard
            participants={data.participants}
            items={data.items}
            totalPessoas={data.stats.totalPessoas}
          />
        </aside>
      </div>

      <DashboardItems
        items={data.items}
        totalPessoas={data.stats.totalPessoas}
      />

      <SharedTable specialDishes={data.specialDishes} />

      <OurStorySection />

      <PixContributionCard />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden="true">
      <div className="h-72 rounded-3xl bg-orange-100/70" />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="h-[28rem] rounded-3xl bg-orange-100/70 lg:col-span-3" />
        <div className="space-y-6 lg:col-span-2">
          <div className="h-64 rounded-3xl bg-orange-100/70" />
        </div>
      </div>
      <div className="h-72 rounded-3xl bg-orange-100/70" />
      <div className="h-48 rounded-3xl bg-orange-100/70" />
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="space-y-6">
      <p
        role="status"
        aria-live="polite"
        className="flex items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800"
      >
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Carregando dados do encontro...
      </p>
      <DashboardSkeleton />
    </div>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <Suspense fallback={<DashboardLoading />}>
        <Dashboard />
      </Suspense>

      <footer className="mt-12 border-t border-orange-200/60 pt-6 text-center text-xs text-stone-600">
        Feito com carinho para a família Tavariando. Qualquer dúvida, fale com
        a organização.
      </footer>
    </main>
  );
}
