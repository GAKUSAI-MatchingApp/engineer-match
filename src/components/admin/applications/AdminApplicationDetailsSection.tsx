import { MessageCircle } from "lucide-react";
import { AdminDetailSection } from "@/components/admin/shared/AdminDetailSection";
import { ADMIN_APPLICATION_DETAIL_SECTIONS } from "@/constants/admin-applications";
import type { AdminApplicationDetail } from "@/lib/admin/applications";

interface AdminApplicationDetailsSectionProps {
  application: AdminApplicationDetail;
}

export function AdminApplicationDetailsSection({ application }: AdminApplicationDetailsSectionProps) {
  return (
    <AdminDetailSection title={ADMIN_APPLICATION_DETAIL_SECTIONS.messages}>
      {application.messagePreview ? (
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-foreground">{application.messagePreview.lastMessageBody}</p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {application.messagePreview.lastMessageAtLabel}
          </span>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">やり取りされたメッセージはまだありません。</p>
      )}
    </AdminDetailSection>
  );
}
