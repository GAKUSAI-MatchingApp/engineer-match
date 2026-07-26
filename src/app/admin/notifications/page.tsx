import type { Metadata } from "next";
import { BellOff } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { ADMIN_NAV } from "@/constants/admin";
import { getAdminIdentity } from "@/lib/admin/identity";
import { createClient } from "@/lib/supabase/server";

const PAGE_META = {
  title: "通知",
  description: "管理者向けの通知機能です。",
} as const;

export const metadata: Metadata = {
  title: `${PAGE_META.title} | ENGINEER MATCH`,
  description: PAGE_META.description,
};

export default async function AdminNotificationsPage() {
  const supabase = await createClient();
  const identity = await getAdminIdentity(supabase);

  return (
    <AdminShell
      navItems={ADMIN_NAV}
      activeHref="/admin/notifications"
      pageTitle={PAGE_META.title}
      userName={identity.name}
      userInitials={identity.initials}
    >
      <AdminPageHeader title={PAGE_META.title} description={PAGE_META.description} />
      <div className="mt-6">
        <AdminEmptyState
          icon={BellOff}
          title="管理者向け通知は現在利用できません。"
          description="既存の notifications テーブルはエンジニア・企業向けのイベント種別のみに対応しており、管理者宛の通知を生成する仕組みはまだ実装されていません。実装され次第、ここに表示されます。"
        />
      </div>
    </AdminShell>
  );
}
