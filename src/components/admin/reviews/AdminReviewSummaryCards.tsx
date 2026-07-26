import { MessageCircle, Star } from "lucide-react";
import { AdminSummaryCard } from "@/components/admin/shared/AdminSummaryCard";
import type { AdminReviewListItem } from "@/lib/admin/reviews";

interface AdminReviewSummaryCardsProps {
  reviews: AdminReviewListItem[];
}

export function AdminReviewSummaryCards({ reviews }: AdminReviewSummaryCardsProps) {
  const total = reviews.length;
  const average =
    total === 0 ? null : Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10;
  const replied = reviews.filter((r) => r.engineerReply).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <AdminSummaryCard label="全レビュー" value={`${total}件`} icon={Star} />
      <AdminSummaryCard label="平均評価" value={average !== null ? `★ ${average}` : "—"} icon={Star} tone="positive" />
      <AdminSummaryCard label="返信済み" value={`${replied}件`} icon={MessageCircle} />
    </div>
  );
}
