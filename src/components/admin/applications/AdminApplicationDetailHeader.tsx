import Link from "next/link";
import { Send } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import { ADMIN_APPLICATION_STATUS_LABEL, ADMIN_APPLICATION_STATUS_TONE } from "@/constants/admin-applications";
import type { AdminApplicationDetail } from "@/lib/admin/applications";

interface AdminApplicationDetailHeaderProps {
  application: AdminApplicationDetail;
}

export function AdminApplicationDetailHeader({ application }: AdminApplicationDetailHeaderProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10"
            aria-hidden="true"
          >
            <Send className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">{application.applicantName}</h2>
              <AdminStatusBadge
                label={ADMIN_APPLICATION_STATUS_LABEL[application.status]}
                tone={ADMIN_APPLICATION_STATUS_TONE[application.status]}
              />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{application.opportunityTitle}</p>
            <p className="text-sm text-muted-foreground">{application.companyName}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/users/${application.applicantId}`}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            応募者アカウントを開く
          </Link>
          {application.companyId && (
            <Link
              href={`/admin/companies/${application.companyId}`}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              企業アカウントを開く
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
