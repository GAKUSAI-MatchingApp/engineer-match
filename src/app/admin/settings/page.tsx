import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import {
  AdminDetailField,
  AdminDetailGrid,
  AdminDetailSection,
} from "@/components/admin/shared/AdminDetailSection";
import { ADMIN_NAV } from "@/constants/admin";
import { getAdminIdentity } from "@/lib/admin/identity";
import { createClient } from "@/lib/supabase/server";

const PAGE_META = {
  title: "システム設定",
  description: "管理者アカウント情報とシステム設定です。",
} as const;

export const metadata: Metadata = {
  title: `${PAGE_META.title} | ENGINEER MATCH`,
  description: PAGE_META.description,
};

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const identity = await getAdminIdentity(supabase);

  return (
    <AdminShell
      navItems={ADMIN_NAV}
      activeHref="/admin/settings"
      pageTitle={PAGE_META.title}
      userName={identity.name}
      userInitials={identity.initials}
    >
      <AdminPageHeader title={PAGE_META.title} description={PAGE_META.description} />

      <div className="mt-6 flex flex-col gap-6">
        <AdminDetailSection title="アカウント情報">
          <AdminDetailGrid>
            <AdminDetailField label="氏名" value={identity.name} />
            <AdminDetailField label="メールアドレス" value={identity.email || "—"} />
            <AdminDetailField label="ロール" value="管理者" />
          </AdminDetailGrid>
        </AdminDetailSection>

        <AdminEmptyState
          icon={Settings}
          title="その他の設定機能は現在利用できません。"
          description="通知設定・セキュリティ設定・メンテナンスモードなどを保存するテーブルはまだ存在しません。実装され次第、ここに表示されます。"
        />
      </div>
    </AdminShell>
  );
}
