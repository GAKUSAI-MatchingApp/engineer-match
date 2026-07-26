import { Pencil, Power } from "lucide-react";
import { AdminDataTable } from "@/components/admin/shared/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import { MASTER_DATA_LABELS, MASTER_DATA_TABLE_COLUMNS } from "@/constants/admin-master-data";
import type { AdminMasterDataItem } from "@/lib/admin/master-data";

interface MasterDataTableProps {
  items: AdminMasterDataItem[];
  canToggleActive: boolean;
  onEdit: (item: AdminMasterDataItem) => void;
  onToggleActive?: (item: AdminMasterDataItem) => void;
}

export function MasterDataTable({ items, canToggleActive, onEdit, onToggleActive }: MasterDataTableProps) {
  return (
    <AdminDataTable columns={[...MASTER_DATA_TABLE_COLUMNS]} caption="マスタデータ一覧">
      {items.map((item) => (
        <tr key={item.id} className="hover:bg-muted/40">
          <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{item.displayName}</td>
          <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{item.context || "—"}</td>
          <td className="max-w-[240px] px-4 py-3 text-muted-foreground">
            <span className="line-clamp-1">{item.description || "—"}</span>
          </td>
          <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{item.usageCount}</td>
          <td className="px-4 py-3 whitespace-nowrap">
            <AdminStatusBadge
              label={item.active ? "有効" : "無効"}
              tone={item.active ? "positive" : "neutral"}
            />
          </td>
          <td className="px-4 py-3 whitespace-nowrap">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(item)}
                aria-label={`${item.displayName}を${MASTER_DATA_LABELS.editLabel}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
              {canToggleActive && onToggleActive && (
                <button
                  type="button"
                  onClick={() => onToggleActive(item)}
                  aria-label={`${item.displayName}を${item.active ? MASTER_DATA_LABELS.disableLabel : MASTER_DATA_LABELS.enableLabel}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <Power className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </td>
        </tr>
      ))}
    </AdminDataTable>
  );
}
