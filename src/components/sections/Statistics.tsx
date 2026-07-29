import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { STATS_LABELS } from "@/constants/lp";
import type { LandingStats } from "@/lib/landing/stats";

interface StatisticsProps {
  stats: LandingStats | null;
}

export function Statistics({ stats }: StatisticsProps) {
  // Live counts unavailable (e.g. service-role config missing) -- hide the
  // section rather than show a fabricated or stale number.
  if (!stats) return null;

  const items = (Object.keys(STATS_LABELS) as (keyof LandingStats)[]).map((key) => ({
    key,
    label: STATS_LABELS[key],
    value: stats[key],
  }));

  return (
    <section
      id="statistics"
      aria-label="サービス実績"
      className="scroll-mt-[72px] border-y border-border bg-surface py-16 md:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {items.map((item) => (
            <div
              key={item.key}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-muted p-6 text-center sm:p-8"
            >
              <dt className="order-2 text-sm text-muted-foreground md:text-base">
                {item.label}
              </dt>
              <dd className="order-1 text-3xl font-bold text-primary md:text-4xl">
                <AnimatedNumber value={item.value} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
