import {
  BriefcaseBusiness,
  Building2,
  CircleCheck,
  Clock3,
  FolderKanban,
} from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SERVICE_CATEGORIES, SERVICES } from "@/constants/lp";

const ICON_MAP = {
  briefcase: BriefcaseBusiness,
  folder: FolderKanban,
  clock: Clock3,
  building: Building2,
} as const;

export function ServiceCategories() {
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="scroll-mt-[72px] bg-background py-16 md:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          headingId="services-heading"
          label={SERVICES.label}
          title={SERVICES.title}
          description={SERVICES.description}
          align="center"
        />

        <FadeIn className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE_CATEGORIES.map((category) => {
            const Icon = ICON_MAP[category.icon];
            return (
              <div
                key={category.name}
                className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>

                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {category.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {category.description}
                </p>

                <ul className="mt-4 flex flex-col gap-2">
                  {category.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <CircleCheck
                        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </FadeIn>
      </div>
    </section>
  );
}
