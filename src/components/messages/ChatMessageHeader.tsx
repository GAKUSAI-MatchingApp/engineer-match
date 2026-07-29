import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, FileText, LoaderCircle, RefreshCw } from "lucide-react";
import {
  APPLICATION_STATUS_BADGE_STYLES,
  APPLICATION_STATUS_LABEL,
  CONTRACT_TYPE_BADGE_STYLES,
  CONTRACT_TYPE_LABEL,
} from "@/constants/applications";

interface ChatMessageHeaderProps {
  counterpartName: string;
  opportunityTitle: string;
  applicationStatus: string;
  contractType: string;
  listHref: string;
  opportunityHref: string;
  applicationHref: string;
  backLabel: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}

function initialsFor(name: string): string {
  return name.trim().slice(0, 2) || "?";
}

export function ChatMessageHeader({
  counterpartName,
  opportunityTitle,
  applicationStatus,
  contractType,
  listHref,
  opportunityHref,
  applicationHref,
  backLabel,
  isRefreshing,
  onRefresh,
}: ChatMessageHeaderProps) {
  return (
    <header className="shrink-0 border-b border-border bg-surface px-3 py-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href={listHref}
          aria-label={backLabel}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
          aria-hidden="true"
        >
          {initialsFor(counterpartName)}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-foreground">{counterpartName}</h2>
          <p className="line-clamp-1 text-xs text-muted-foreground">{opportunityTitle}</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="メッセージを更新"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
        >
          {isRefreshing ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              APPLICATION_STATUS_BADGE_STYLES[applicationStatus] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {APPLICATION_STATUS_LABEL[applicationStatus] ?? applicationStatus}
          </span>
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              CONTRACT_TYPE_BADGE_STYLES[contractType] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {CONTRACT_TYPE_LABEL[contractType] ?? contractType}
          </span>
        </div>
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5">
          <Link
            href={opportunityHref}
            className="inline-flex min-w-0 items-center gap-1 rounded text-xs font-semibold text-primary hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <BriefcaseBusiness className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">求人・案件詳細</span>
          </Link>
          <Link
            href={applicationHref}
            className="inline-flex min-w-0 items-center gap-1 rounded text-xs font-semibold text-primary hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">応募詳細</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
