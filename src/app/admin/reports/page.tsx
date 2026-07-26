import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminReportList } from "@/components/admin/reports/AdminReportList";
import { ADMIN_NAV } from "@/constants/admin";
import { ADMIN_REPORTS_PAGE } from "@/constants/admin-reports";
import { getAdminIdentity } from "@/lib/admin/identity";
import { listAdminReports } from "@/lib/admin/reports";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `${ADMIN_REPORTS_PAGE.title} | ENGINEER MATCH`,
  description: ADMIN_REPORTS_PAGE.description,
};

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const [identity, reports] = await Promise.all([
    getAdminIdentity(supabase),
    listAdminReports(supabase),
  ]);

  return (
    <AdminShell
      navItems={ADMIN_NAV}
      activeHref="/admin/reports"
      pageTitle={ADMIN_REPORTS_PAGE.title}
      userName={identity.name}
      userInitials={identity.initials}
    >
      <AdminPageHeader
        title={ADMIN_REPORTS_PAGE.title}
        description={ADMIN_REPORTS_PAGE.description}
      />
      <div className="mt-6">
        <AdminReportList initialReports={reports} />
      </div>
    </AdminShell>
  );
}
