import {
  AdminDetailField,
  AdminDetailGrid,
  AdminDetailSection,
} from "@/components/admin/shared/AdminDetailSection";
import { ADMIN_COMPANY_DETAIL_SECTIONS, ADMIN_COMPANY_SIZE_LABEL } from "@/constants/admin-companies";
import type { AdminCompanyDetail } from "@/lib/admin/companies";

interface AdminCompanyOverviewProps {
  company: AdminCompanyDetail;
}

export function AdminCompanyOverview({ company }: AdminCompanyOverviewProps) {
  return (
    <div className="flex flex-col gap-6">
      <AdminDetailSection title={ADMIN_COMPANY_DETAIL_SECTIONS.basicInfo}>
        <AdminDetailGrid>
          <AdminDetailField label="企業名" value={company.name} />
          <AdminDetailField label="企業ID" value={company.id} />
          <AdminDetailField label="業種" value={company.industry ?? "—"} />
          <AdminDetailField
            label="企業規模"
            value={company.companySize ? (ADMIN_COMPANY_SIZE_LABEL[company.companySize] ?? company.companySize) : "—"}
          />
          <AdminDetailField label="設立年" value={company.establishedYear ? `${company.establishedYear}年` : "—"} />
          <AdminDetailField label="所在地" value={company.address ?? "—"} />
          <AdminDetailField label="コーポレートサイト" value={company.websiteUrl ?? "—"} />
          <AdminDetailField label="登録日" value={company.createdAtLabel} />
        </AdminDetailGrid>
      </AdminDetailSection>

      <AdminDetailSection title={ADMIN_COMPANY_DETAIL_SECTIONS.contactInfo}>
        <AdminDetailGrid>
          <AdminDetailField label="担当者名" value={company.contactName ?? "—"} />
          <AdminDetailField label="メールアドレス" value={company.contactEmail || "—"} />
        </AdminDetailGrid>
      </AdminDetailSection>

      <AdminDetailSection title={ADMIN_COMPANY_DETAIL_SECTIONS.profile}>
        <p className="text-sm text-foreground">{company.businessDescription || "未設定"}</p>
      </AdminDetailSection>
    </div>
  );
}
