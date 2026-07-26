import Link from "next/link";
import {
  AdminDetailField,
  AdminDetailGrid,
  AdminDetailSection,
} from "@/components/admin/shared/AdminDetailSection";
import { ADMIN_REPORT_DETAIL_SECTIONS, ADMIN_REPORT_TARGET_TYPE_LABEL } from "@/constants/admin-reports";
import type { AdminReportDetail } from "@/lib/admin/reports";

interface AdminReportContentSectionProps {
  report: AdminReportDetail;
}

export function AdminReportContentSection({ report }: AdminReportContentSectionProps) {
  return (
    <div className="flex flex-col gap-6">
      <AdminDetailSection title={ADMIN_REPORT_DETAIL_SECTIONS.content}>
        <p className="text-sm whitespace-pre-wrap text-foreground">{report.reason}</p>
      </AdminDetailSection>

      <AdminDetailSection title={ADMIN_REPORT_DETAIL_SECTIONS.reporter}>
        <AdminDetailGrid>
          <AdminDetailField label="通報者" value={report.reporterName} />
          <AdminDetailField label="通報日" value={report.createdAtLabel} />
        </AdminDetailGrid>
        <Link
          href={`/admin/users/${report.reporterId}`}
          className="mt-3 inline-block rounded text-sm font-semibold text-primary hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          通報者アカウントを開く
        </Link>
      </AdminDetailSection>

      <AdminDetailSection title={ADMIN_REPORT_DETAIL_SECTIONS.target}>
        <AdminDetailGrid>
          <AdminDetailField label="対象種別" value={ADMIN_REPORT_TARGET_TYPE_LABEL[report.targetType]} />
          <AdminDetailField label="対象" value={report.targetLabel} />
        </AdminDetailGrid>
        {report.targetHref && (
          <Link
            href={report.targetHref}
            className="mt-3 inline-block rounded text-sm font-semibold text-primary hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            対象の詳細を開く
          </Link>
        )}
      </AdminDetailSection>

      <AdminDetailSection title={ADMIN_REPORT_DETAIL_SECTIONS.adminNote}>
        {report.adminNote ? (
          <p className="text-sm text-foreground">{report.adminNote}</p>
        ) : (
          <p className="text-sm text-muted-foreground">管理者メモはまだ登録されていません。</p>
        )}
        {report.handledAtLabel && (
          <p className="mt-2 text-xs text-muted-foreground">対応日：{report.handledAtLabel}</p>
        )}
      </AdminDetailSection>
    </div>
  );
}
