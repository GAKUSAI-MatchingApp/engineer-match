import {
  AdminDetailField,
  AdminDetailGrid,
  AdminDetailSection,
} from "@/components/admin/shared/AdminDetailSection";
import { ADMIN_USER_DETAIL_SECTIONS } from "@/constants/admin-users";
import type { AdminUserDetail } from "@/lib/admin/users";

interface AdminUserProfileSectionProps {
  user: AdminUserDetail;
}

const WORK_STYLE_LABEL: Record<string, string> = {
  REMOTE: "リモート",
  ONSITE: "常駐",
  HYBRID: "ハイブリッド",
  ONLINE: "オンライン",
};

export function AdminUserProfileSection({ user }: AdminUserProfileSectionProps) {
  const hasProfile = user.role === "ENGINEER" || user.role === "INSTRUCTOR";

  return (
    <div className="flex flex-col gap-6">
      <AdminDetailSection title={ADMIN_USER_DETAIL_SECTIONS.basicInfo}>
        <AdminDetailGrid>
          <AdminDetailField label="氏名" value={user.name} />
          <AdminDetailField label="メールアドレス" value={user.email} />
          <AdminDetailField label="ユーザーID" value={user.id} />
          <AdminDetailField label="所属企業" value={user.companyName ?? "—"} />
        </AdminDetailGrid>
      </AdminDetailSection>

      {hasProfile && (
        <AdminDetailSection title={ADMIN_USER_DETAIL_SECTIONS.profileInfo}>
          <AdminDetailGrid>
            <AdminDetailField label="居住地" value={user.prefecture ?? "—"} />
            <AdminDetailField
              label="経験年数"
              value={user.yearsOfExperience !== null ? `${user.yearsOfExperience}年` : "—"}
            />
            <AdminDetailField
              label="働き方"
              value={user.workStyle ? (WORK_STYLE_LABEL[user.workStyle] ?? user.workStyle) : "—"}
            />
            <AdminDetailField
              label="プロフィール公開設定"
              value={user.isPublic === null ? "—" : user.isPublic ? "公開" : "非公開"}
            />
          </AdminDetailGrid>
          {user.selfPr && <p className="mt-4 text-sm text-foreground">{user.selfPr}</p>}
        </AdminDetailSection>
      )}

      <AdminDetailSection title={ADMIN_USER_DETAIL_SECTIONS.registrationStatus}>
        <AdminDetailGrid>
          <AdminDetailField label="登録日" value={user.createdAtLabel} />
        </AdminDetailGrid>
      </AdminDetailSection>
    </div>
  );
}
