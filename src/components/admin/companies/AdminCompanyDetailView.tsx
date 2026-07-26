import { AdminCompanyDetailHeader } from "@/components/admin/companies/AdminCompanyDetailHeader";
import { AdminCompanyOverview } from "@/components/admin/companies/AdminCompanyOverview";
import { AdminCompanyJobsSection } from "@/components/admin/companies/AdminCompanyJobsSection";
import type { AdminCompanyDetail } from "@/lib/admin/companies";

interface AdminCompanyDetailViewProps {
  company: AdminCompanyDetail;
}

export function AdminCompanyDetailView({ company }: AdminCompanyDetailViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <AdminCompanyDetailHeader company={company} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <AdminCompanyOverview company={company} />
        </div>
        <div className="flex flex-col gap-6">
          <AdminCompanyJobsSection company={company} />
        </div>
      </div>
    </div>
  );
}
