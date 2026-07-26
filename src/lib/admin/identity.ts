import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Real logged-in admin identity for the header/session chrome, replacing the
 * old hardcoded ADMIN_USER constant. Falls back to a generic label only if
 * the users row can't be read -- src/proxy.ts already guarantees an
 * authenticated ADMIN session reaches these pages, so this is defensive, not
 * the expected path.
 */
export interface AdminIdentity {
  name: string;
  email: string;
  initials: string;
}

const FALLBACK_IDENTITY: AdminIdentity = { name: "管理者", email: "", initials: "?" };

export async function getAdminIdentity(supabase: SupabaseClient): Promise<AdminIdentity> {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return FALLBACK_IDENTITY;

  const { data, error } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error || !data) {
    console.error("[admin] failed to load admin identity:", error);
    return { ...FALLBACK_IDENTITY, email: authUser.email ?? "" };
  }

  const name = (data.name as string) || FALLBACK_IDENTITY.name;
  return { name, email: data.email as string, initials: name.charAt(0) };
}
