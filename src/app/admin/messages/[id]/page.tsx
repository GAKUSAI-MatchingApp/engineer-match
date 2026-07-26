import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { AdminMessageDetailView } from "@/components/admin/messages/AdminMessageDetailView";
import { ADMIN_NAV } from "@/constants/admin";
import { ADMIN_MESSAGE_NOT_FOUND } from "@/constants/admin-messages";
import { getAdminIdentity } from "@/lib/admin/identity";
import { getAdminConversationDetail } from "@/lib/admin/messages";
import { createClient } from "@/lib/supabase/server";

interface AdminMessageDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: AdminMessageDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const conversation = await getAdminConversationDetail(supabase, id);
  return {
    title: conversation
      ? `${conversation.engineerName} | メッセージ管理 | ENGINEER MATCH`
      : `メッセージ管理 | ENGINEER MATCH`,
  };
}

export default async function AdminMessageDetailPage({ params }: AdminMessageDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const [identity, conversation] = await Promise.all([
    getAdminIdentity(supabase),
    getAdminConversationDetail(supabase, id),
  ]);

  return (
    <AdminShell
      navItems={ADMIN_NAV}
      activeHref="/admin/messages"
      pageTitle={conversation ? conversation.engineerName : ADMIN_MESSAGE_NOT_FOUND.title}
      userName={identity.name}
      userInitials={identity.initials}
    >
      {conversation ? (
        <AdminMessageDetailView conversation={conversation} />
      ) : (
        <div className="flex flex-col items-center gap-4">
          <AdminEmptyState
            title={ADMIN_MESSAGE_NOT_FOUND.title}
            description={ADMIN_MESSAGE_NOT_FOUND.description}
          />
          <Link
            href={ADMIN_MESSAGE_NOT_FOUND.ctaHref}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {ADMIN_MESSAGE_NOT_FOUND.ctaLabel}
          </Link>
        </div>
      )}
    </AdminShell>
  );
}
