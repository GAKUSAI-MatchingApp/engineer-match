import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminReviewList } from "@/components/admin/reviews/AdminReviewList";
import { ADMIN_NAV } from "@/constants/admin";
import { getAdminIdentity } from "@/lib/admin/identity";
import { listAllAdminReviews } from "@/lib/admin/reviews";
import { createClient } from "@/lib/supabase/server";

const PAGE_META = {
  title: "レビュー確認",
  description: "企業からエンジニアへのレビューを確認できます（閲覧のみ）。",
} as const;

export const metadata: Metadata = {
  title: `${PAGE_META.title} | ENGINEER MATCH`,
  description: PAGE_META.description,
};

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const [identity, reviews] = await Promise.all([
    getAdminIdentity(supabase),
    listAllAdminReviews(supabase),
  ]);

  return (
    <AdminShell
      navItems={ADMIN_NAV}
      activeHref="/admin/reviews"
      pageTitle={PAGE_META.title}
      userName={identity.name}
      userInitials={identity.initials}
    >
      <AdminPageHeader title={PAGE_META.title} description={PAGE_META.description} />
      <div className="mt-6">
        <AdminReviewList reviews={reviews} />
      </div>
    </AdminShell>
  );
}
