import { AdminApplicationDetailHeader } from "@/components/admin/applications/AdminApplicationDetailHeader";
import { AdminApplicationInfoSection } from "@/components/admin/applications/AdminApplicationInfoSection";
import { AdminApplicationDetailsSection } from "@/components/admin/applications/AdminApplicationDetailsSection";
import type { AdminApplicationDetail } from "@/lib/admin/applications";

interface AdminApplicationDetailViewProps {
  application: AdminApplicationDetail;
}

export function AdminApplicationDetailView({ application }: AdminApplicationDetailViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <AdminApplicationDetailHeader application={application} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <AdminApplicationInfoSection application={application} />
        </div>
        <div className="flex flex-col gap-6">
          <AdminApplicationDetailsSection application={application} />
        </div>
      </div>
    </div>
  );
}
