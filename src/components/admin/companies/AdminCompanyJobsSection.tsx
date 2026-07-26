import Link from "next/link";
import { AdminDetailSection } from "@/components/admin/shared/AdminDetailSection";
import { ADMIN_COMPANY_DETAIL_SECTIONS } from "@/constants/admin-companies";
import type { AdminCompanyDetail } from "@/lib/admin/companies";

interface AdminCompanyJobsSectionProps {
  company: AdminCompanyDetail;
}

export function AdminCompanyJobsSection({ company }: AdminCompanyJobsSectionProps) {
  return (
    <AdminDetailSection title={ADMIN_COMPANY_DETAIL_SECTIONS.jobs}>
      {company.jobs.length > 0 ? (
        <ul className="flex flex-col divide-y divide-border">
          {company.jobs.map((job) => (
            <li key={job.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <Link
                  href={`/admin/opportunities/${job.id}`}
                  className="truncate rounded text-sm font-semibold text-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {job.title}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">応募者 {job.applicantCount}名</p>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                {job.statusLabel}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">掲載した求人・案件はありません。</p>
      )}
    </AdminDetailSection>
  );
}
