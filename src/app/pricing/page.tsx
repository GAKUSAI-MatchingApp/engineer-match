import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, UsersRound } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PRICING_PAGE } from "@/constants/pages";

const ICON_MAP = {
  building2: Building2,
  usersRound: UsersRound,
} as const;

export const metadata: Metadata = {
  title: "料金プラン | ENGINEER MATCH",
  description: PRICING_PAGE.hero.description,
};

export default function PricingPage() {
  return (
    <>
      <Header />
      <PageHeader
        title={PRICING_PAGE.hero.title}
        description={PRICING_PAGE.hero.description}
      />

      <main>
        <section
          id="plans"
          aria-labelledby="plans-heading"
          className="bg-background py-16 md:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <SectionHeading
              headingId="plans-heading"
              label={PRICING_PAGE.section.label}
              title={PRICING_PAGE.section.title}
              description={PRICING_PAGE.section.description}
              align="center"
            />

            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
              {PRICING_PAGE.plans.map((plan) => {
                const Icon = ICON_MAP[plan.icon];
                return (
                  <div
                    key={plan.audience}
                    className={`flex flex-col rounded-2xl border p-6 sm:p-8 ${
                      plan.highlighted
                        ? "border-primary/30 bg-surface shadow-lg"
                        : "border-border bg-surface shadow-sm"
                    }`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>

                    <h3 className="mt-4 text-base font-semibold text-foreground">
                      {plan.audience}
                    </h3>

                    <p className="mt-4 flex items-baseline gap-1.5">
                      <span className="text-4xl font-bold tracking-tight text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">
                        {plan.priceSuffix}
                      </span>
                    </p>

                    {plan.billingLabel && (
                      <span className="mt-3 inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {plan.billingLabel}
                      </span>
                    )}

                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {plan.note}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="pricing-cta-heading"
          className="bg-surface py-16 md:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="flex flex-col items-center rounded-2xl border border-primary/20 bg-primary/5 p-10 text-center md:p-14">
              <h2
                id="pricing-cta-heading"
                className="text-2xl leading-tight font-bold tracking-tight text-foreground sm:text-3xl"
              >
                {PRICING_PAGE.cta.title}
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                {PRICING_PAGE.cta.description}
              </p>
              <Link
                href={PRICING_PAGE.cta.href}
                className="group mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {PRICING_PAGE.cta.buttonLabel}
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
