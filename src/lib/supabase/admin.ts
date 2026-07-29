import { createClient } from "@supabase/supabase-js";

/**
 * Server-only client authenticated with the Supabase service role key.
 * Bypasses RLS entirely -- never import this from a "use client" file or
 * anything reachable from the browser bundle.
 *
 * Scope: read-only aggregate/status lookups (e.g. landing page stats, or
 * checking whether a posting company's account is ACTIVE) that a legitimate
 * anonymous visitor should see but for which RLS on public.users has no
 * anon-readable path (only the row owner, admins, or an applicant company
 * can read another user's status). Never use this to fetch row-level data
 * that RLS deliberately hides from a given visitor (e.g. opportunity listing
 * rows for anonymous users) -- that would silently defeat an intentional
 * access-control decision made elsewhere in the schema.
 *
 * Returns null (never throws) when SUPABASE_SERVICE_ROLE_KEY isn't
 * configured, so callers can degrade gracefully instead of crashing SSR.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
