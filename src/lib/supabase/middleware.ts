import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";
import { ACTIVE_STATUS, getDashboardPathForRole, getUserAccount } from "@/lib/auth/account";

/**
 * Role required to access a given pathname, keyed by top-level route prefix.
 * Role dashboards and the Engineer routes that live outside /engineer are
 * gated here. Company messaging/notifications remain covered by /company.
 *
 * publicAtRoot: the bare prefix path itself (e.g. exactly "/company", not
 * "/company/anything") is a real public page and must stay reachable by
 * everyone — only src/app/company/page.tsx uses this today (it's the public
 * "運営会社" about page, not part of the Company-role dashboard). Every
 * sub-path under the prefix is still protected as normal.
 */
const PROTECTED_PREFIXES: ReadonlyArray<{ prefix: string; role: string; publicAtRoot?: boolean }> = [
  { prefix: "/engineer", role: "ENGINEER" },
  { prefix: "/messages", role: "ENGINEER" },
  { prefix: "/notifications", role: "ENGINEER" },
  { prefix: "/company", role: "COMPANY", publicAtRoot: true },
  { prefix: "/admin", role: "ADMIN" },
];

function getRequiredRole(pathname: string): string | null {
  const match = PROTECTED_PREFIXES.find(({ prefix, publicAtRoot }) => {
    if (pathname === prefix) return !publicAtRoot;
    return pathname.startsWith(`${prefix}/`);
  });
  return match?.role ?? null;
}

/**
 * Refreshes the Supabase auth session on every request and keeps the
 * request/response cookies in sync. Called from src/proxy.ts (Next.js 16's
 * successor to middleware.ts) rather than a Server Component, because Server
 * Components cannot write cookies themselves.
 *
 * Uses supabase.auth.getUser(), not getSession() — getUser() revalidates the
 * token against Supabase Auth on every call instead of trusting whatever is
 * in the (possibly stale or tampered) cookie.
 *
 * Also enforces role/status-based route protection for /engineer, /messages,
 * /notifications, /company, and /admin: role and ACTIVE status are re-read from
 * public.users here (never trusted from client state), matching the same
 * getUserAccount() helper already used by the login/signup pages.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const requiredRole = getRequiredRole(request.nextUrl.pathname);
  if (!requiredRole) {
    return supabaseResponse;
  }

  // Redirects must carry over any refreshed session cookies from
  // supabaseResponse, or a token refresh that happened during getUser()
  // above would be silently dropped.
  function redirectTo(path: string) {
    const redirectResponse = NextResponse.redirect(new URL(path, request.url));
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  if (!user) {
    return redirectTo("/login");
  }

  const account = await getUserAccount(supabase, user.id);

  // Authenticated (auth.users row exists) but no public.users row yet: a
  // brand-new OAuth signup pending role selection (migration 071, draft —
  // not yet applied). They may reach ONLY /auth/select-role — never an
  // Engineer/Company/Admin route — until finalize_oauth_role() creates their
  // public.users row.
  if (!account) {
    return redirectTo("/auth/select-role");
  }

  // Not ACTIVE (SUSPENDED/WITHDRAWN): never allowed into a protected
  // dashboard. Sent to /login rather than signed out here — the login page
  // itself already renders correctly for this exact state (authenticated
  // but inactive account falls through to the login form instead of
  // redirecting, see src/app/login/page.tsx).
  if (account.status !== ACTIVE_STATUS) {
    return redirectTo("/login");
  }

  if (account.role !== requiredRole) {
    // Wrong role for this area: send them to their own dashboard instead.
    // getDashboardPathForRole() returns null for roles with no dashboard yet
    // (e.g. INSTRUCTOR) — fall back to /login, which already renders the
    // "no dashboard for this role" state correctly for that case.
    return redirectTo(getDashboardPathForRole(account.role) ?? "/login");
  }

  return supabaseResponse;
}
