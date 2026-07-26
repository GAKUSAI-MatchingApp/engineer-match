import {
  AdminDetailField,
  AdminDetailGrid,
  AdminDetailSection,
} from "@/components/admin/shared/AdminDetailSection";
import {
  ADMIN_APPLICATION_DETAIL_SECTIONS,
  ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL,
} from "@/constants/admin-applications";
import type { AdminApplicationDetail } from "@/lib/admin/applications";

interface AdminApplicationInfoSectionProps {
  application: AdminApplicationDetail;
}

export function AdminApplicationInfoSection({ application }: AdminApplicationInfoSectionProps) {
  return (
    <div className="flex flex-col gap-6">
      <AdminDetailSection title={ADMIN_APPLICATION_DETAIL_SECTIONS.applicantInfo}>
        <AdminDetailGrid>
          <AdminDetailField label="氏名" value={application.applicantName} />
          <AdminDetailField label="応募ID" value={application.id} />
          <AdminDetailField label="応募日" value={application.appliedAtLabel} />
          <AdminDetailField label="最終更新" value={application.updatedAtLabel} />
          {application.completedAtLabel && (
            <AdminDetailField label="完了日" value={application.completedAtLabel} />
          )}
        </AdminDetailGrid>
      </AdminDetailSection>

      <AdminDetailSection title={ADMIN_APPLICATION_DETAIL_SECTIONS.opportunityInfo}>
        <AdminDetailGrid>
          <AdminDetailField label="求人・案件名" value={application.opportunityTitle} />
          <AdminDetailField label="企業名" value={application.companyName || "—"} />
          <AdminDetailField
            label="サービス区分"
            value={ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL[application.contractType]}
          />
        </AdminDetailGrid>
      </AdminDetailSection>
    </div>
  );
}
