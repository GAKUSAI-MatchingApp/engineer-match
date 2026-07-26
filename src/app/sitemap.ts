import type { MetadataRoute } from "next";

const SITE_URL = "https://engineer-match-5yvr.vercel.app";

/**
 * Only genuinely public, unauthenticated pages. Deliberately excludes
 * /engineer/*, /company/dashboard and siblings, /admin/* (all auth-gated),
 * and /messages, /notifications (also auth-gated) -- see robots.ts.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["", "/login", "/signup", "/company", "/contact", "/terms", "/privacy"];
  return staticPaths.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));
}
