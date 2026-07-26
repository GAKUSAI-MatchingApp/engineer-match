import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminApplicationList } from "@/components/admin/applications/AdminApplicationList";
import { ADMIN_NAV } from "@/constants/admin";
import { ADMIN_APPLICATIONS_PAGE } from "@/constants/admin-applications";
import { getAdminIdentity } from "@/lib/admin/identity";
import { listAdminApplications } from "@/lib/admin/applications";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `${ADMIN_APPLICATIONS_PAGE.title} | ENGINEER MATCH`,
  description: ADMIN_APPLICATIONS_PAGE.description,
};

export default async function AdminApplicationsPage() {
  const supabase = await createClient();
  const [identity, applications] = await Promise.all([
    getAdminIdentity(supabase),
    listAdminApplications(supabase),
  ]);

  return (
    <AdminShell
      navItems={ADMIN_NAV}
      activeHref="/admin/applications"
      pageTitle={ADMIN_APPLICATIONS_PAGE.title}
      userName={identity.name}
      userInitials={identity.initials}
    >
      <AdminPageHeader
        title={ADMIN_APPLICATIONS_PAGE.title}
        description={ADMIN_APPLICATIONS_PAGE.description}
      />
      <div className="mt-6">
        <AdminApplicationList initialApplications={applications} />
      </div>
    </AdminShell>
  );
}
