import { Ban, Building2, ShieldCheck, UserPlus, UserRound, Users } from "lucide-react";
import { AdminSummaryCard } from "@/components/admin/shared/AdminSummaryCard";
import { ADMIN_USER_SUMMARY_LABELS } from "@/constants/admin-users";
import type { AdminUserListItem } from "@/lib/admin/users";

interface AdminUserSummaryCardsProps {
  users: AdminUserListItem[];
}

function isThisMonth(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export function AdminUserSummaryCards({ users }: AdminUserSummaryCardsProps) {
  const total = users.length;
  const engineers = users.filter((user) => user.role === "ENGINEER").length;
  const companyStaff = users.filter((user) => user.role === "COMPANY").length;
  const admins = users.filter((user) => user.role === "ADMIN").length;
  const suspended = users.filter((user) => user.status === "SUSPENDED").length;
  const newThisMonth = users.filter((user) => isThisMonth(user.createdAtISO)).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <AdminSummaryCard label={ADMIN_USER_SUMMARY_LABELS.total} value={`${total}人`} icon={Users} />
      <AdminSummaryCard
        label={ADMIN_USER_SUMMARY_LABELS.engineers}
        value={`${engineers}人`}
        icon={UserRound}
      />
      <AdminSummaryCard
        label={ADMIN_USER_SUMMARY_LABELS.companyStaff}
        value={`${companyStaff}人`}
        icon={Building2}
      />
      <AdminSummaryCard label={ADMIN_USER_SUMMARY_LABELS.admins} value={`${admins}人`} icon={ShieldCheck} />
      <AdminSummaryCard
        label={ADMIN_USER_SUMMARY_LABELS.suspended}
        value={`${suspended}人`}
        icon={Ban}
        tone="negative"
      />
      <AdminSummaryCard
        label={ADMIN_USER_SUMMARY_LABELS.newThisMonth}
        value={`${newThisMonth}人`}
        icon={UserPlus}
        tone="positive"
      />
    </div>
  );
}
