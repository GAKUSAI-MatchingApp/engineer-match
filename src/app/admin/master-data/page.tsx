import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { MasterDataList } from "@/components/admin/master-data/MasterDataList";
import { ADMIN_NAV } from "@/constants/admin";
import { ADMIN_MASTER_DATA_PAGE } from "@/constants/admin-master-data";
import { getAdminIdentity } from "@/lib/admin/identity";
import { getAdminMasterData } from "@/lib/admin/master-data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `${ADMIN_MASTER_DATA_PAGE.title} | ENGINEER MATCH`,
  description: ADMIN_MASTER_DATA_PAGE.description,
};

export default async function AdminMasterDataPage() {
  const supabase = await createClient();
  const [identity, masterData] = await Promise.all([
    getAdminIdentity(supabase),
    getAdminMasterData(supabase),
  ]);

  return (
    <AdminShell
      navItems={ADMIN_NAV}
      activeHref="/admin/master-data"
      pageTitle={ADMIN_MASTER_DATA_PAGE.title}
      userName={identity.name}
      userInitials={identity.initials}
    >
      <AdminPageHeader
        title={ADMIN_MASTER_DATA_PAGE.title}
        description={ADMIN_MASTER_DATA_PAGE.description}
      />
      <div className="mt-6">
        <MasterDataList data={masterData} />
      </div>
    </AdminShell>
  );
}
