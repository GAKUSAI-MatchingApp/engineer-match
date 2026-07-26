import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPendingApprovals } from "@/components/admin/AdminPendingApprovals";
import { AdminQuickActions } from "@/components/admin/AdminQuickActions";
import { AdminRecentActivity } from "@/components/admin/AdminRecentActivity";
import { AdminSummaryCards } from "@/components/admin/AdminSummaryCards";
import { ADMIN_DASHBOARD_PAGE, ADMIN_NAV } from "@/constants/admin";
import { getAdminIdentity } from "@/lib/admin/identity";
import { getAdminDashboardData } from "@/lib/admin/dashboard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `${ADMIN_DASHBOARD_PAGE.title} | ENGINEER MATCH`,
  description: ADMIN_DASHBOARD_PAGE.description,
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const [identity, dashboard] = await Promise.all([
    getAdminIdentity(supabase),
    getAdminDashboardData(supabase),
  ]);

  return (
    <AdminShell
      navItems={ADMIN_NAV}
      activeHref="/admin"
      pageTitle={ADMIN_DASHBOARD_PAGE.title}
      userName={identity.name}
      userInitials={identity.initials}
    >
      <p className="text-sm text-muted-foreground">
        {ADMIN_DASHBOARD_PAGE.description}
      </p>

      <AdminSummaryCards cards={dashboard.summaryCards} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <AdminPendingApprovals items={dashboard.pendingApprovals} />
          <AdminRecentActivity items={dashboard.recentActivity} />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-4">
          <AdminQuickActions />
        </div>
      </div>
    </AdminShell>
  );
}
