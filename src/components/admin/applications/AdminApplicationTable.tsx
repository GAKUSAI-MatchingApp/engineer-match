import Link from "next/link";
import { AdminDataTable } from "@/components/admin/shared/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import {
  ADMIN_APPLICATION_ACTION_LABELS,
  ADMIN_APPLICATION_STATUS_LABEL,
  ADMIN_APPLICATION_STATUS_TONE,
  ADMIN_APPLICATION_TABLE_COLUMNS,
} from "@/constants/admin-applications";
import type { AdminApplicationListItem } from "@/lib/admin/applications";

interface AdminApplicationTableProps {
  applications: AdminApplicationListItem[];
}

export function AdminApplicationTable({ applications }: AdminApplicationTableProps) {
  return (
    <AdminDataTable
      columns={[...ADMIN_APPLICATION_TABLE_COLUMNS]}
      caption={ADMIN_APPLICATION_TABLE_COLUMNS.join("、")}
    >
      {applications.map((app) => (
        <tr key={app.id} className="align-top">
          <td className="px-4 py-3 text-sm font-semibold text-foreground">{app.applicantName}</td>
          <td className="px-4 py-3">
            <span className="line-clamp-2 max-w-xs text-sm text-foreground">{app.opportunityTitle}</span>
          </td>
          <td className="px-4 py-3 text-sm whitespace-nowrap text-foreground">{app.companyName}</td>
          <td className="px-4 py-3 text-sm whitespace-nowrap text-muted-foreground">
            {app.appliedAtLabel}
          </td>
          <td className="px-4 py-3">
            <AdminStatusBadge
              label={ADMIN_APPLICATION_STATUS_LABEL[app.status]}
              tone={ADMIN_APPLICATION_STATUS_TONE[app.status]}
            />
          </td>
          <td className="px-4 py-3 text-sm whitespace-nowrap text-muted-foreground">
            {app.updatedAtLabel}
          </td>
          <td className="px-4 py-3">
            <Link
              href={`/admin/applications/${app.id}`}
              className="rounded text-xs font-semibold text-primary hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {ADMIN_APPLICATION_ACTION_LABELS.viewDetails}
            </Link>
          </td>
        </tr>
      ))}
    </AdminDataTable>
  );
}
