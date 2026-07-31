import { memo } from "react";
import { Ban, Building2, CheckCircle2, UserPlus } from "lucide-react";
import { AdminSummaryCard } from "@/components/admin/shared/AdminSummaryCard";
import { ADMIN_COMPANY_SUMMARY_LABELS } from "@/constants/admin-companies";
import type { AdminCompanyListItem } from "@/lib/admin/companies";

interface AdminCompanySummaryCardsProps {
  companies: AdminCompanyListItem[];
}

function isThisMonth(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export const AdminCompanySummaryCards = memo(function AdminCompanySummaryCards({
  companies,
}: AdminCompanySummaryCardsProps) {
  const total = companies.length;
  const active = companies.filter((c) => c.usageStatus === "ACTIVE").length;
  const suspended = companies.filter((c) => c.usageStatus === "SUSPENDED").length;
  const newThisMonth = companies.filter((c) => isThisMonth(c.createdAtISO)).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AdminSummaryCard label={ADMIN_COMPANY_SUMMARY_LABELS.total} value={`${total}社`} icon={Building2} />
      <AdminSummaryCard
        label={ADMIN_COMPANY_SUMMARY_LABELS.active}
        value={`${active}社`}
        icon={CheckCircle2}
        tone="positive"
      />
      <AdminSummaryCard
        label={ADMIN_COMPANY_SUMMARY_LABELS.suspended}
        value={`${suspended}社`}
        icon={Ban}
        tone="negative"
      />
      <AdminSummaryCard
        label={ADMIN_COMPANY_SUMMARY_LABELS.newThisMonth}
        value={`${newThisMonth}社`}
        icon={UserPlus}
        tone="positive"
      />
    </div>
  );
});
