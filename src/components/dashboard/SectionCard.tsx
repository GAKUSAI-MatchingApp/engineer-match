import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SectionCardProps {
  id?: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  children: ReactNode;
}

export function SectionCard({
  id,
  title,
  description,
  action,
  children,
}: SectionCardProps) {
  return (
    <section id={id} className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8 scroll-mt-24">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && (
          <Link
            href={action.href}
            className="group inline-flex shrink-0 items-center gap-1 rounded text-sm font-semibold text-primary transition-colors duration-200 hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {action.label}
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        )}
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}
