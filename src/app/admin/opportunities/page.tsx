import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminOpportunityList } from "@/components/admin/opportunities/AdminOpportunityList";
import { ADMIN_NAV } from "@/constants/admin";
import { ADMIN_OPPORTUNITIES_PAGE } from "@/constants/admin-opportunities";
import { getAdminIdentity } from "@/lib/admin/identity";
import { listAdminOpportunities } from "@/lib/admin/opportunities";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `${ADMIN_OPPORTUNITIES_PAGE.title} | ENGINEER MATCH`,
  description: ADMIN_OPPORTUNITIES_PAGE.description,
};

export default async function AdminOpportunitiesPage() {
  const supabase = await createClient();
  const [identity, opportunities] = await Promise.all([
    getAdminIdentity(supabase),
    listAdminOpportunities(supabase),
  ]);

  return (
    <AdminShell
      navItems={ADMIN_NAV}
      activeHref="/admin/opportunities"
      pageTitle={ADMIN_OPPORTUNITIES_PAGE.title}
      userName={identity.name}
      userInitials={identity.initials}
    >
      <AdminPageHeader
        title={ADMIN_OPPORTUNITIES_PAGE.title}
        description={ADMIN_OPPORTUNITIES_PAGE.description}
      />
      <div className="mt-6">
        <AdminOpportunityList initialOpportunities={opportunities} />
      </div>
    </AdminShell>
  );
}
