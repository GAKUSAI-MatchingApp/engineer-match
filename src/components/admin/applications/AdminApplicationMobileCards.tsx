import Link from "next/link";
import { AdminMobileCardList } from "@/components/admin/shared/AdminMobileCardList";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import {
  ADMIN_APPLICATION_ACTION_LABELS,
  ADMIN_APPLICATION_STATUS_LABEL,
  ADMIN_APPLICATION_STATUS_TONE,
} from "@/constants/admin-applications";
import type { AdminApplicationListItem } from "@/lib/admin/applications";

interface AdminApplicationMobileCardsProps {
  applications: AdminApplicationListItem[];
}

export function AdminApplicationMobileCards({ applications }: AdminApplicationMobileCardsProps) {
  return (
    <AdminMobileCardList>
      {applications.map((app) => (
        <div key={app.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{app.applicantName}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{app.opportunityTitle}</p>
            </div>
            <AdminStatusBadge
              label={ADMIN_APPLICATION_STATUS_LABEL[app.status]}
              tone={ADMIN_APPLICATION_STATUS_TONE[app.status]}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{app.companyName}</span>
            <span>{app.appliedAtLabel}</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-3">
            <Link
              href={`/admin/applications/${app.id}`}
              className="rounded text-xs font-semibold text-primary hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {ADMIN_APPLICATION_ACTION_LABELS.viewDetails}
            </Link>
          </div>
        </div>
      ))}
    </AdminMobileCardList>
  );
}
