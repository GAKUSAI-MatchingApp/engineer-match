import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Noto_Sans_JP } from "next/font/google";
import { RouteTransitionIndicator } from "@/components/navigation/RouteTransitionIndicator";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const SITE_URL = "https://engineer-match-5yvr.vercel.app";
const SITE_TITLE = "ENGINEER MATCH | エンジニア × IT企業 マッチングプラットフォーム";
const SITE_DESCRIPTION =
  "ENGINEER MATCHは、エンジニアとIT企業を結ぶマッチングプラットフォームです。スキルや希望条件に合った最適な出会いを実現します。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: SITE_URL,
    siteName: "ENGINEER MATCH",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/image/hero-engineer.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/image/hero-engineer.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansJP.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <Suspense fallback={null}>
          <RouteTransitionIndicator />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
