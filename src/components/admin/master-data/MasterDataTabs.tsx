"use client";

import { MASTER_DATA_TABS, type MasterDataTabKey } from "@/constants/admin-master-data";
import { cn } from "@/lib/utils";

interface MasterDataTabsProps {
  active: MasterDataTabKey;
  onChange: (tab: MasterDataTabKey) => void;
}

export function MasterDataTabs({ active, onChange }: MasterDataTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="マスタデータのカテゴリ"
      className="flex flex-wrap gap-2 border-b border-border pb-3"
    >
      {MASTER_DATA_TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`master-data-tab-${tab.key}`}
            aria-selected={isActive}
            aria-controls="master-data-panel"
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.key)}
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-xl px-3.5 text-sm font-semibold transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
              isActive
                ? "bg-primary text-white"
                : "border border-border bg-surface text-muted-foreground hover:bg-muted",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
