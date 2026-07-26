import Link from "next/link";
import { SearchX } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center md:py-32">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <SearchX className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          お探しのページが見つかりませんでした。
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          URLが変更・削除されたか、入力に誤りがある可能性があります。
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          トップページに戻る
        </Link>
      </main>
      <Footer />
    </>
  );
}
