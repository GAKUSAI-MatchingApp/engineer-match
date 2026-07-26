import type { MetadataRoute } from "next";

const SITE_URL = "https://engineer-match-5yvr.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // All three role-dashboard areas require auth and redirect to /login
      // for any crawler anyway, but disallowing them keeps crawl budget on
      // the actual public pages and avoids indexing a wall of login
      // redirects. Trailing slash on /company/ and /engineer/ is
      // deliberate: the bare "/company" page is the real public "運営会社"
      // about page (see src/lib/supabase/middleware.ts's publicAtRoot),
      // only its sub-paths are the protected Company dashboard.
      disallow: ["/admin", "/engineer/", "/company/", "/messages", "/notifications"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
