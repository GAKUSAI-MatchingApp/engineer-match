import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminUserList } from "@/components/admin/users/AdminUserList";
import { ADMIN_NAV } from "@/constants/admin";
import { ADMIN_USERS_PAGE } from "@/constants/admin-users";
import { getAdminIdentity } from "@/lib/admin/identity";
import { listAdminUsers } from "@/lib/admin/users";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `${ADMIN_USERS_PAGE.title} | ENGINEER MATCH`,
  description: ADMIN_USERS_PAGE.description,
};

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const [identity, users] = await Promise.all([
    getAdminIdentity(supabase),
    listAdminUsers(supabase),
  ]);

  return (
    <AdminShell
      navItems={ADMIN_NAV}
      activeHref="/admin/users"
      pageTitle={ADMIN_USERS_PAGE.title}
      userName={identity.name}
      userInitials={identity.initials}
    >
      <AdminPageHeader
        title={ADMIN_USERS_PAGE.title}
        description={ADMIN_USERS_PAGE.description}
      />
      <div className="mt-6">
        <AdminUserList initialUsers={users} />
      </div>
    </AdminShell>
  );
}
