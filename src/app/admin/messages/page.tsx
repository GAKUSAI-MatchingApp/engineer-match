import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminMessageList } from "@/components/admin/messages/AdminMessageList";
import { ADMIN_NAV } from "@/constants/admin";
import { ADMIN_MESSAGES_PAGE } from "@/constants/admin-messages";
import { getAdminIdentity } from "@/lib/admin/identity";
import { listAdminConversations } from "@/lib/admin/messages";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `${ADMIN_MESSAGES_PAGE.title} | ENGINEER MATCH`,
  description: ADMIN_MESSAGES_PAGE.description,
};

export default async function AdminMessagesPage() {
  const supabase = await createClient();
  const [identity, conversations] = await Promise.all([
    getAdminIdentity(supabase),
    listAdminConversations(supabase),
  ]);

  return (
    <AdminShell
      navItems={ADMIN_NAV}
      activeHref="/admin/messages"
      pageTitle={ADMIN_MESSAGES_PAGE.title}
      userName={identity.name}
      userInitials={identity.initials}
    >
      <AdminPageHeader
        title={ADMIN_MESSAGES_PAGE.title}
        description={ADMIN_MESSAGES_PAGE.description}
      />
      <div className="mt-6">
        <AdminMessageList conversations={conversations} />
      </div>
    </AdminShell>
  );
}
