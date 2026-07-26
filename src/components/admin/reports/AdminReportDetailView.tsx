"use client";

import { useState } from "react";
import { AdminReportDetailHeader } from "@/components/admin/reports/AdminReportDetailHeader";
import { AdminReportContentSection } from "@/components/admin/reports/AdminReportContentSection";
import { AdminReportStatusForm } from "@/components/admin/reports/AdminReportStatusForm";
import type { AdminReportDetail, AdminReportStatus } from "@/lib/admin/reports";

interface AdminReportDetailViewProps {
  report: AdminReportDetail;
}

export function AdminReportDetailView({ report: initial }: AdminReportDetailViewProps) {
  const [report, setReport] = useState(initial);

  function handleUpdated(status: AdminReportStatus, adminNote: string | null, handledAtLabel: string) {
    setReport((prev) => ({ ...prev, status, adminNote, handledAtLabel }));
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminReportDetailHeader report={report} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <AdminReportContentSection report={report} />
        </div>
        <div className="flex flex-col gap-6">
          <AdminReportStatusForm report={report} onUpdated={handleUpdated} />
        </div>
      </div>
    </div>
  );
}
