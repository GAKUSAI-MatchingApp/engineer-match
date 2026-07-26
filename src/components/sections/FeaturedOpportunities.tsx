import Link from "next/link";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  FEATURED_OPPORTUNITIES,
  FEATURED_OPPORTUNITIES_EMPTY,
  OPPORTUNITY_CTA_LABEL,
} from "@/constants/lp";
import { CONTRACT_TYPE_BADGE_STYLES, CONTRACT_TYPE_LABEL } from "@/constants/jobs";
import { formatRelativeDaysJa, formatSalaryLabel } from "@/lib/engineer/format";
import type { HydratedOpportunity } from "@/lib/engineer/opportunities";

interface FeaturedOpportunitiesProps {
  opportunities: HydratedOpportunity[];
}

export function FeaturedOpportunities({ opportunities }: FeaturedOpportunitiesProps) {
  return (
    <section
      id="opportunities"
      aria-labelledby="opportunities-heading"
      className="scroll-mt-[72px] bg-background py-16 md:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          headingId="opportunities-heading"
          label={FEATURED_OPPORTUNITIES.label}
          title={FEATURED_OPPORTUNITIES.title}
          description={FEATURED_OPPORTUNITIES.description}
          align="center"
        />

        {opportunities.length === 0 ? (
          <div className="mt-12 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-sm">
            <p className="text-sm font-semibold text-foreground">
              {FEATURED_OPPORTUNITIES_EMPTY.title}
            </p>
            <p className="text-sm text-muted-foreground">
              {FEATURED_OPPORTUNITIES_EMPTY.description}
            </p>
            <Link
              href="/signup"
              className="mt-2 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {FEATURED_OPPORTUNITIES_EMPTY.ctaLabel}
            </Link>
          </div>
        ) : (
          <FadeIn className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((opportunity) => {
              const salaryLabel = formatSalaryLabel(opportunity);
              return (
                <div
                  key={opportunity.id}
                  className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                >
                  <p className="text-sm text-muted-foreground">
                    {opportunity.companyName}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">
                    {opportunity.title}
                  </h3>

                  <span
                    className={`mt-3 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${CONTRACT_TYPE_BADGE_STYLES[opportunity.contract_type]}`}
                  >
                    {CONTRACT_TYPE_LABEL[opportunity.contract_type]}
                  </span>

                  {opportunity.requiredSkillNames.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {opportunity.requiredSkillNames.slice(0, 5).map((skill) => (
                        <li
                          key={skill}
                          className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                        >
                          {skill}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-4 flex flex-col gap-1 text-sm text-muted-foreground">
                    {salaryLabel && (
                      <p className="font-semibold text-foreground">{salaryLabel}</p>
                    )}
                    <p>公開日：{formatRelativeDaysJa(opportunity.created_at)}</p>
                  </div>

                  <div className="mt-auto pt-6">
                    <Link
                      href={`/engineer/jobs/${opportunity.id}`}
                      className="w-fit rounded-lg text-sm font-semibold text-primary transition-colors duration-200 hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      {OPPORTUNITY_CTA_LABEL}
                    </Link>
                  </div>
                </div>
              );
            })}
          </FadeIn>
        )}

        <div className="mt-12 flex justify-center">
          <Link
            href="/engineer/jobs"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-6 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {FEATURED_OPPORTUNITIES.viewAllCta}
          </Link>
        </div>
      </div>
    </section>
  );
}
