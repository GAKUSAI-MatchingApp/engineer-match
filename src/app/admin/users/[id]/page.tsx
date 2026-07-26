import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { AdminUserDetailView } from "@/components/admin/users/AdminUserDetailView";
import { ADMIN_NAV } from "@/constants/admin";
import { ADMIN_USER_NOT_FOUND } from "@/constants/admin-users";
import { getAdminIdentity } from "@/lib/admin/identity";
import { countActiveAdmins, getAdminUserDetail } from "@/lib/admin/users";
import { createClient } from "@/lib/supabase/server";

interface AdminUserDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: AdminUserDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getAdminUserDetail(supabase, id);
  return {
    title: user
      ? `${user.name} | ユーザー管理 | ENGINEER MATCH`
      : `ユーザー管理 | ENGINEER MATCH`,
  };
}

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const [identity, user, activeAdminCount] = await Promise.all([
    getAdminIdentity(supabase),
    getAdminUserDetail(supabase, id),
    countActiveAdmins(supabase),
  ]);

  return (
    <AdminShell
      navItems={ADMIN_NAV}
      activeHref="/admin/users"
      pageTitle={user ? user.name : ADMIN_USER_NOT_FOUND.title}
      userName={identity.name}
      userInitials={identity.initials}
    >
      {user ? (
        <AdminUserDetailView
          user={user}
          currentAdminId={identity.id}
          activeAdminCount={activeAdminCount}
        />
      ) : (
        <div className="flex flex-col items-center gap-4">
          <AdminEmptyState
            title={ADMIN_USER_NOT_FOUND.title}
            description={ADMIN_USER_NOT_FOUND.description}
          />
          <Link
            href={ADMIN_USER_NOT_FOUND.ctaHref}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {ADMIN_USER_NOT_FOUND.ctaLabel}
          </Link>
        </div>
      )}
    </AdminShell>
  );
}
