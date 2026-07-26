import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { AdminReportDetailView } from "@/components/admin/reports/AdminReportDetailView";
import { ADMIN_NAV } from "@/constants/admin";
import { ADMIN_REPORT_NOT_FOUND } from "@/constants/admin-reports";
import { getAdminIdentity } from "@/lib/admin/identity";
import { getAdminReportDetail } from "@/lib/admin/reports";
import { createClient } from "@/lib/supabase/server";

interface AdminReportDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: AdminReportDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const report = await getAdminReportDetail(supabase, id);
  return {
    title: report ? `${report.id.slice(0, 8)} | 通報管理 | ENGINEER MATCH` : `通報管理 | ENGINEER MATCH`,
  };
}

export default async function AdminReportDetailPage({ params }: AdminReportDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const [identity, report] = await Promise.all([
    getAdminIdentity(supabase),
    getAdminReportDetail(supabase, id),
  ]);

  return (
    <AdminShell
      navItems={ADMIN_NAV}
      activeHref="/admin/reports"
      pageTitle={report ? report.id.slice(0, 8) : ADMIN_REPORT_NOT_FOUND.title}
      userName={identity.name}
      userInitials={identity.initials}
    >
      {report ? (
        <AdminReportDetailView report={report} />
      ) : (
        <div className="flex flex-col items-center gap-4">
          <AdminEmptyState
            title={ADMIN_REPORT_NOT_FOUND.title}
            description={ADMIN_REPORT_NOT_FOUND.description}
          />
          <Link
            href={ADMIN_REPORT_NOT_FOUND.ctaHref}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {ADMIN_REPORT_NOT_FOUND.ctaLabel}
          </Link>
        </div>
      )}
    </AdminShell>
  );
}
