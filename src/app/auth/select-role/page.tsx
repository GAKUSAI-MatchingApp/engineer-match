import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SelectRoleCard } from "@/components/auth/SelectRoleCard";
import { createClient } from "@/lib/supabase/server";
import { getDashboardPathForRole, getUserAccount } from "@/lib/auth/account";

export const metadata: Metadata = {
  title: "利用方法を選択 | ENGINEER MATCH",
  description: "ENGINEER MATCHでの利用方法（エンジニア／企業）を選択してください。",
};

export default async function SelectRolePage() {
  // This page requires an authenticated session (created by
  // /auth/oauth/callback) but no public.users row yet — anyone else is sent
  // elsewhere rather than shown the picker.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const account = await getUserAccount(supabase, user.id);
  if (account) {
    // Already onboarded (or a pre-existing email/password account whose
    // OAuth identity was linked by Supabase) — nothing to select, go to
    // their dashboard. getDashboardPathForRole returns null for a role with
    // no dashboard yet (e.g. INSTRUCTOR); /login already renders correctly
    // for that authenticated-but-nowhere-to-go state.
    redirect(getDashboardPathForRole(account.role) ?? "/login");
  }

  return <SelectRoleCard />;
}
