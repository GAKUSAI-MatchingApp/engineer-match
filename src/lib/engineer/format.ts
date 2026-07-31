import type { CompanyContractType } from "@/lib/engineer/opportunities";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function formatDateJa(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatTimeJa(iso: string): string {
  const date = new Date(iso);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** First 2 characters of a name, used as an avatar-circle fallback (e.g. chat conversation lists). */
export function initialsFor(name: string): string {
  return name.trim().slice(0, 2) || "?";
}

export function formatRelativeDaysJa(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  if (diffDays === 0) return "本日";
  if (diffDays < 7) return `${diffDays}日前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`;
  return `${Math.floor(diffDays / 30)}ヶ月前`;
}

/** Salary/budget/rate display label for a hydrated list-row, contract-type aware. */
export function formatSalaryLabel(item: {
  contract_type: CompanyContractType;
  salaryMin: number | null;
  salaryMax: number | null;
  budget: number | null;
  hourlyRate: number | null;
}): string {
  if (item.contract_type === "employment" && item.salaryMin != null && item.salaryMax != null) {
    return `年収 ${item.salaryMin}万円〜${item.salaryMax}万円`;
  }
  if (item.contract_type === "project" && item.budget != null) {
    return `予算 ${item.budget}万円`;
  }
  if (item.contract_type === "hourly" && item.hourlyRate != null) {
    return `時給 ${item.hourlyRate.toLocaleString("ja-JP")}円`;
  }
  return "";
}

export function formatSalaryLabelFromDetail(params: {
  contractType: CompanyContractType;
  employment: { salary_min: number; salary_max: number } | null;
  project: { budget: number } | null;
  hourly: { hourly_rate: number } | null;
}): string {
  return formatSalaryLabel({
    contract_type: params.contractType,
    salaryMin: params.employment?.salary_min ?? null,
    salaryMax: params.employment?.salary_max ?? null,
    budget: params.project?.budget ?? null,
    hourlyRate: params.hourly?.hourly_rate ?? null,
  });
}
