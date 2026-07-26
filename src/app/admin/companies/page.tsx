import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminCompanyList } from "@/components/admin/companies/AdminCompanyList";
import { ADMIN_NAV } from "@/constants/admin";
import { ADMIN_COMPANIES_PAGE } from "@/constants/admin-companies";
import { getAdminIdentity } from "@/lib/admin/identity";
import { listAdminCompanies } from "@/lib/admin/companies";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `${ADMIN_COMPANIES_PAGE.title} | ENGINEER MATCH`,
  description: ADMIN_COMPANIES_PAGE.description,
};

export default async function AdminCompaniesPage() {
  const supabase = await createClient();
  const [identity, companies] = await Promise.all([
    getAdminIdentity(supabase),
    listAdminCompanies(supabase),
  ]);

  return (
    <AdminShell
      navItems={ADMIN_NAV}
      activeHref="/admin/companies"
      pageTitle={ADMIN_COMPANIES_PAGE.title}
      userName={identity.name}
      userInitials={identity.initials}
    >
      <AdminPageHeader
        title={ADMIN_COMPANIES_PAGE.title}
        description={ADMIN_COMPANIES_PAGE.description}
      />
      <div className="mt-6">
        <AdminCompanyList initialCompanies={companies} />
      </div>
    </AdminShell>
  );
}
