import { MessageCircle, Send } from "lucide-react";
import { AdminDetailSection } from "@/components/admin/shared/AdminDetailSection";
import { ADMIN_USER_DETAIL_SECTIONS } from "@/constants/admin-users";
import type { AdminUserDetail } from "@/lib/admin/users";

interface AdminUserActivitySectionProps {
  user: AdminUserDetail;
}

export function AdminUserActivitySection({ user }: AdminUserActivitySectionProps) {
  return (
    <div className="flex flex-col gap-6">
      {user.activityLabel && (
        <AdminDetailSection title={user.activityLabel}>
          {user.activity.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border">
              {user.activity.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Send className="h-4 w-4 text-primary" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {entry.title}
                      </p>
                      {entry.subtitle && (
                        <p className="truncate text-xs text-muted-foreground">{entry.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold text-foreground">{entry.statusLabel}</p>
                    <p className="text-xs text-muted-foreground">{entry.dateLabel}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">履歴はありません。</p>
          )}
        </AdminDetailSection>
      )}

      <AdminDetailSection title={ADMIN_USER_DETAIL_SECTIONS.messageHistory}>
        {user.recentMessages.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border">
            {user.recentMessages.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <MessageCircle className="h-4 w-4 text-primary" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {entry.counterpartName}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">{entry.dateLabel}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{entry.preview}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">メッセージ履歴はありません。</p>
        )}
      </AdminDetailSection>
    </div>
  );
}
