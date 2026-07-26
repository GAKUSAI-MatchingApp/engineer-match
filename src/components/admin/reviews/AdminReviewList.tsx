"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { AdminReviewSummaryCards } from "@/components/admin/reviews/AdminReviewSummaryCards";
import { AdminSearchInput } from "@/components/admin/shared/AdminSearchInput";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { AdminPagination } from "@/components/admin/shared/AdminPagination";
import type { AdminReviewListItem } from "@/lib/admin/reviews";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`評価 ${rating} / 5`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={cn("h-4 w-4", value <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground")}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

interface AdminReviewListProps {
  reviews: AdminReviewListItem[];
}

export function AdminReviewList({ reviews }: AdminReviewListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredReviews = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return reviews;
    return reviews.filter((r) =>
      `${r.engineerName} ${r.companyName} ${r.opportunityTitle} ${r.comment}`.toLowerCase().includes(query),
    );
  }, [reviews, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / PAGE_SIZE));
  const pagedReviews = filteredReviews.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <AdminReviewSummaryCards reviews={reviews} />

      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <AdminSearchInput
          id="admin-review-search"
          label="レビューを検索"
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value);
            setCurrentPage(1);
          }}
          placeholder="エンジニア名・企業名・求人名・コメントで検索"
        />
      </div>

      <p className="text-sm text-muted-foreground">{filteredReviews.length}件のレビュー</p>

      {filteredReviews.length === 0 ? (
        <AdminEmptyState
          title="レビューはまだありません。"
          description="応募が完了ステータスになり企業がレビューを投稿すると、ここに表示されます。"
        />
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {pagedReviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/users/${review.engineerUserId}`}
                        className="rounded text-sm font-semibold text-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        {review.engineerName}
                      </Link>
                      <span className="text-xs text-muted-foreground">評価元：{review.companyName}</span>
                    </div>
                    <Link
                      href={`/admin/opportunities/${review.opportunityId}`}
                      className="mt-0.5 inline-block rounded text-xs text-muted-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      {review.opportunityTitle}
                    </Link>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StarRating rating={review.rating} />
                    <span className="text-xs text-muted-foreground">{review.createdAtLabel}</span>
                  </div>
                </div>

                <p className="mt-3 text-sm text-foreground">{review.comment}</p>

                {review.engineerReply && (
                  <div className="mt-3 rounded-xl bg-muted px-4 py-3">
                    <p className="text-xs font-semibold text-muted-foreground">
                      エンジニアからの返信 ・ {review.repliedAtLabel}
                    </p>
                    <p className="mt-1 text-sm text-foreground">{review.engineerReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            previousLabel="前へ"
            nextLabel="次へ"
            pageLabelPrefix="ページ"
          />
        </>
      )}
    </div>
  );
}
