import { Pencil, Power } from "lucide-react";
import { AdminMobileCardList } from "@/components/admin/shared/AdminMobileCardList";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import { MASTER_DATA_LABELS } from "@/constants/admin-master-data";
import type { AdminMasterDataItem } from "@/lib/admin/master-data";

interface MasterDataMobileCardsProps {
  items: AdminMasterDataItem[];
  canToggleActive: boolean;
  onEdit: (item: AdminMasterDataItem) => void;
  onToggleActive?: (item: AdminMasterDataItem) => void;
}

export function MasterDataMobileCards({ items, canToggleActive, onEdit, onToggleActive }: MasterDataMobileCardsProps) {
  return (
    <AdminMobileCardList>
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{item.displayName}</p>
              {item.context && <p className="text-xs text-muted-foreground">{item.context}</p>}
            </div>
            <AdminStatusBadge
              label={item.active ? "有効" : "無効"}
              tone={item.active ? "positive" : "neutral"}
            />
          </div>
          {item.description && <p className="mt-2 text-sm text-foreground">{item.description}</p>}
          <p className="mt-2 text-xs text-muted-foreground">利用件数：{item.usageCount}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              {MASTER_DATA_LABELS.editLabel}
            </button>
            {canToggleActive && onToggleActive && (
              <button
                type="button"
                onClick={() => onToggleActive(item)}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <Power className="h-3.5 w-3.5" aria-hidden="true" />
                {item.active ? MASTER_DATA_LABELS.disableLabel : MASTER_DATA_LABELS.enableLabel}
              </button>
            )}
          </div>
        </div>
      ))}
    </AdminMobileCardList>
  );
}
