"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, CalendarDays, MessageSquare } from "lucide-react";
import { ApplicationStatusBadge } from "@/components/applications/ApplicationStatusBadge";
import { WithdrawDialog } from "@/components/applications/WithdrawDialog";
import {
  APPLICATION_LIST_META,
  APPLICATION_SUMMARY_LABELS,
  CONTRACT_TYPE_LABEL,
  DETAIL_META,
  COMPANY_INFO_LABELS,
  WITHDRAWABLE_STATUSES,
  WITHDRAW_DIALOG_LABELS,
} from "@/constants/applications";
import { formatDateJa } from "@/lib/engineer/format";
import { withdrawApplication, type ApplicationDetail } from "@/lib/engineer/applications";
import { createClient } from "@/lib/supabase/client";

interface ApplicationDetailViewProps {
  detail: ApplicationDetail;
}

export function ApplicationDetailView({ detail }: ApplicationDetailViewProps) {
  const [status, setStatus] = useState(detail.status);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const companyInitial = detail.company?.company_name.slice(0, 1) ?? "";
  const canWithdraw = (WITHDRAWABLE_STATUSES as readonly string[]).includes(status);

  function showToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3000);
  }

  async function handleConfirmWithdraw() {
    const supabase = createClient();
    const { data, error } = await withdrawApplication(supabase, detail.id, status);
    setIsDialogOpen(false);

    if (error || !data) {
      console.error("[application-detail] withdraw failed:", error);
      showToast(WITHDRAW_DIALOG_LABELS.errorMessage);
      return;
    }

    setStatus("withdrawn");
    showToast(WITHDRAW_DIALOG_LABELS.toastMessage);
  }

  return (
    <>
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <ApplicationStatusBadge status={status} />

        <h2 className="mt-3 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {detail.opportunityTitle ?? "求人情報"}
        </h2>

        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
          {detail.company && (
            <div className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              <dt className="sr-only">会社名</dt>
              <dd>{detail.company.company_name}</dd>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            <dt className="sr-only">{APPLICATION_LIST_META.appliedPrefix}</dt>
            <dd>
              {APPLICATION_LIST_META.appliedPrefix}
              {formatDateJa(detail.applied_at)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
            <h3 className="text-base font-semibold text-foreground">
              {DETAIL_META.summaryTitle}
            </h3>
            <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">
                  {APPLICATION_SUMMARY_LABELS.positionLabel}
                </dt>
                <dd className="mt-1 text-sm font-medium text-foreground">
                  {detail.opportunityTitle ?? "-"}
                </dd>
              </div>
              {detail.opportunityContractType && (
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {APPLICATION_SUMMARY_LABELS.contractLabel}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {CONTRACT_TYPE_LABEL[detail.opportunityContractType]}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-muted-foreground">
                  {APPLICATION_SUMMARY_LABELS.statusLabel}
                </dt>
                <dd className="mt-1">
                  <ApplicationStatusBadge status={status} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {APPLICATION_SUMMARY_LABELS.appliedDateLabel}
                </dt>
                <dd className="mt-1 text-sm font-medium text-foreground">
                  {formatDateJa(detail.applied_at)}
                </dd>
              </div>
            </dl>
          </section>

          {detail.company && (
            <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base font-bold text-primary"
                  aria-hidden="true"
                >
                  {companyInitial}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {DETAIL_META.companyInfoTitle}
                  </h3>
                  <p className="text-sm text-muted-foreground">{detail.company.company_name}</p>
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {detail.company.industry && (
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {COMPANY_INFO_LABELS.industryLabel}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">
                      {detail.company.industry}
                    </dd>
                  </div>
                )}
                {detail.company.company_size && (
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {COMPANY_INFO_LABELS.employeesLabel}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">
                      {detail.company.company_size}
                    </dd>
                  </div>
                )}
              </dl>

              {detail.company.website_url && (
                <div className="mt-5 min-w-0">
                  <dt className="text-xs text-muted-foreground">
                    {COMPANY_INFO_LABELS.websiteLabel}
                  </dt>
                  <dd className="mt-1 truncate text-sm font-medium">
                    <a
                      href={detail.company.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary underline underline-offset-2 transition-colors duration-200 hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{detail.company.website_url}</span>
                    </a>
                  </dd>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <p className="text-xs text-muted-foreground">現在のステータス</p>
            <div className="mt-2">
              <ApplicationStatusBadge status={status} />
            </div>

            <Link
              href={`/messages/${detail.id}`}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              メッセージを送る
            </Link>

            {canWithdraw && (
              <button
                type="button"
                onClick={() => setIsDialogOpen(true)}
                className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-700 transition-colors duration-200 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {WITHDRAW_DIALOG_LABELS.triggerLabel}
              </button>
            )}

            {detail.opportunityTitle && (
              <Link
                href={`/engineer/jobs/${detail.opportunity_id}`}
                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                求人詳細を見る
              </Link>
            )}
          </div>
        </div>
      </div>

      <WithdrawDialog
        isOpen={isDialogOpen}
        onCancel={() => setIsDialogOpen(false)}
        onConfirm={handleConfirmWithdraw}
      />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 sm:justify-end sm:pr-6"
        >
          <div className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-white shadow-lg">
            {toastMessage}
          </div>
        </div>
      )}
    </>
  );
}
