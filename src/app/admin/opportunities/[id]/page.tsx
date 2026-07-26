import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { AdminOpportunityDetailView } from "@/components/admin/opportunities/AdminOpportunityDetailView";
import { ADMIN_NAV } from "@/constants/admin";
import { ADMIN_OPPORTUNITY_NOT_FOUND } from "@/constants/admin-opportunities";
import { getAdminIdentity } from "@/lib/admin/identity";
import { getAdminOpportunityDetail } from "@/lib/admin/opportunities";
import { createClient } from "@/lib/supabase/server";

interface AdminOpportunityDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: AdminOpportunityDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const opportunity = await getAdminOpportunityDetail(supabase, id);
  return {
    title: opportunity
      ? `${opportunity.title} | 求人・案件管理 | ENGINEER MATCH`
      : `求人・案件管理 | ENGINEER MATCH`,
  };
}

export default async function AdminOpportunityDetailPage({
  params,
}: AdminOpportunityDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const [identity, opportunity] = await Promise.all([
    getAdminIdentity(supabase),
    getAdminOpportunityDetail(supabase, id),
  ]);

  return (
    <AdminShell
      navItems={ADMIN_NAV}
      activeHref="/admin/opportunities"
      pageTitle={opportunity ? opportunity.title : ADMIN_OPPORTUNITY_NOT_FOUND.title}
      userName={identity.name}
      userInitials={identity.initials}
    >
      {opportunity ? (
        <AdminOpportunityDetailView opportunity={opportunity} />
      ) : (
        <div className="flex flex-col items-center gap-4">
          <AdminEmptyState
            title={ADMIN_OPPORTUNITY_NOT_FOUND.title}
            description={ADMIN_OPPORTUNITY_NOT_FOUND.description}
          />
          <Link
            href={ADMIN_OPPORTUNITY_NOT_FOUND.ctaHref}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {ADMIN_OPPORTUNITY_NOT_FOUND.ctaLabel}
          </Link>
        </div>
      )}
    </AdminShell>
  );
}
