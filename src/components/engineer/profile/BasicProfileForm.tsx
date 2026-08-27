"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FormStatusMessage } from "@/components/ui/FormStatusMessage";
import { createClient } from "@/lib/supabase/client";
import { saveEngineerProfile, updateUserName, type EngineerProfile } from "@/lib/engineer/profile";
import {
  AVAILABILITY_STATUS_OPTIONS,
  BASIC_INFO_FORM_FIELDS,
  BASIC_INFO_FORM_META,
  JOB_CATEGORY_OPTIONS,
  VISIBILITY_FORM_LABEL,
  VISIBILITY_STATUS_LABEL,
  WORK_STYLE_OPTIONS,
} from "@/constants/engineer-profile";

const SELECT_CLASS =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

interface BasicProfileFormProps {
  userId: string;
  initialName: string;
  email: string;
  profile: EngineerProfile | null;
}

interface FormState {
  name: string;
  jobTitle: string;
  jobCategory: string;
  prefecture: string;
  yearsOfExperience: string;
  availabilityStatus: string;
  workStyle: string;
  desiredHourlyRate: string;
  minimumHourlyRate: string;
  desiredAnnualIncome: string;
  availableFrom: string;
  portfolioUrl: string;
  githubUrl: string;
  selfPr: string;
  isPublic: boolean;
}

function buildFormState(name: string, profile: EngineerProfile | null): FormState {
  return {
    name,
    jobTitle: profile?.job_title ?? "",
    jobCategory: profile?.job_category ?? "",
    prefecture: profile?.prefecture ?? "",
    yearsOfExperience:
      profile?.years_of_experience !== null && profile?.years_of_experience !== undefined
        ? String(profile.years_of_experience)
        : "",
    availabilityStatus: profile?.availability_status ?? "",
    workStyle: profile?.work_style ?? "",
    desiredHourlyRate: profile?.desired_hourly_rate_max
      ? String(profile.desired_hourly_rate_max)
      : "",
    minimumHourlyRate: profile?.desired_hourly_rate_min
      ? String(profile.desired_hourly_rate_min)
      : "",
    desiredAnnualIncome: profile?.desired_annual_income_yen
      ? String(profile.desired_annual_income_yen)
      : "",
    availableFrom: profile?.available_from ?? "",
    portfolioUrl: profile?.portfolio_url ?? "",
    githubUrl: profile?.github_url ?? "",
    selfPr: profile?.self_pr ?? "",
    isPublic: profile?.is_public ?? true,
  };
}

export function BasicProfileForm({ userId, initialName, email, profile }: BasicProfileFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => buildFormState(initialName, profile));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"error" | "success" | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setMessage(null);
    setStatus(null);

    const name = form.name.trim();
    if (!name) {
      setMessage(BASIC_INFO_FORM_META.nameRequired);
      setStatus("error");
      return;
    }

    // RD 4.2.6: 居住地・経験年数・希望の働き方・希望単価 are required fields.
    // Existing legacy profiles saved before this rule (including QA rows
    // with 0 skills / empty fields) are read/displayed unchanged -- this
    // only gates new saves, never rewrites a row the user didn't touch.
    const prefecture = form.prefecture.trim();
    if (!prefecture) {
      setMessage(BASIC_INFO_FORM_META.prefectureRequired);
      setStatus("error");
      return;
    }

    if (!form.yearsOfExperience.trim()) {
      setMessage(BASIC_INFO_FORM_META.yearsOfExperienceRequired);
      setStatus("error");
      return;
    }
    const yearsOfExperience = Number(form.yearsOfExperience);
    if (!Number.isInteger(yearsOfExperience) || yearsOfExperience < 0 || yearsOfExperience > 50) {
      setMessage(BASIC_INFO_FORM_META.invalidYearsOfExperience);
      setStatus("error");
      return;
    }

    if (!form.workStyle) {
      setMessage(BASIC_INFO_FORM_META.workStyleRequired);
      setStatus("error");
      return;
    }

    if (!form.desiredHourlyRate.trim() || !form.minimumHourlyRate.trim()) {
      setMessage(BASIC_INFO_FORM_META.desiredHourlyRateRequired);
      setStatus("error");
      return;
    }
    const desiredHourlyRate = Number(form.desiredHourlyRate);
    const minimumHourlyRate = Number(form.minimumHourlyRate);
    if (
      !Number.isInteger(desiredHourlyRate) ||
      desiredHourlyRate < 1 ||
      desiredHourlyRate > 99999 ||
      !Number.isInteger(minimumHourlyRate) ||
      minimumHourlyRate < 1 ||
      minimumHourlyRate > 99999
    ) {
      setMessage(BASIC_INFO_FORM_META.invalidHourlyRate);
      setStatus("error");
      return;
    }
    if (minimumHourlyRate > desiredHourlyRate) {
      setMessage(BASIC_INFO_FORM_META.invalidHourlyRateOrder);
      setStatus("error");
      return;
    }

    let desiredAnnualIncome: number | null = null;
    if (form.desiredAnnualIncome.trim()) {
      const parsed = Number(form.desiredAnnualIncome);
      if (!Number.isInteger(parsed) || parsed < 10000 || parsed > 99990000) {
        setMessage(BASIC_INFO_FORM_META.invalidAnnualIncome);
        setStatus("error");
        return;
      }
      desiredAnnualIncome = parsed;
    }

    if (form.selfPr.length > 2000) {
      setMessage(BASIC_INFO_FORM_META.invalidSelfPr);
      setStatus("error");
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();

      const [{ error: nameError }, { error: profileError }] = await Promise.all([
        name !== initialName ? updateUserName(supabase, userId, name) : Promise.resolve({ error: null }),
        saveEngineerProfile(supabase, userId, {
          prefecture,
          years_of_experience: yearsOfExperience,
          self_pr: form.selfPr.trim() || null,
          work_style: (form.workStyle || null) as EngineerProfile["work_style"],
          portfolio_url: form.portfolioUrl.trim() || null,
          is_public: form.isPublic,
          job_title: form.jobTitle.trim() || null,
          job_category: (form.jobCategory || null) as EngineerProfile["job_category"],
          availability_status: (form.availabilityStatus || null) as EngineerProfile["availability_status"],
          github_url: form.githubUrl.trim() || null,
          desired_annual_income_yen: desiredAnnualIncome,
          desired_hourly_rate_min: minimumHourlyRate,
          desired_hourly_rate_max: desiredHourlyRate,
          available_from: form.availableFrom || null,
        }),
      ]);

      if (nameError || profileError) {
        console.error("[engineer-profile] save failed:", nameError ?? profileError);
        setMessage(BASIC_INFO_FORM_META.saveFailedMessage);
        setStatus("error");
        return;
      }

      setMessage(BASIC_INFO_FORM_META.savedMessage);
      setStatus("success");
      router.refresh();
    } catch (err) {
      console.error("[engineer-profile] unexpected save error:", err);
      setMessage(BASIC_INFO_FORM_META.saveFailedMessage);
      setStatus("error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-name">
            {BASIC_INFO_FORM_FIELDS.name.label}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="basic-name"
            type="text"
            value={form.name}
            placeholder={BASIC_INFO_FORM_FIELDS.name.placeholder}
            onChange={(event) => updateField("name", event.target.value)}
            className="h-9"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-email">メールアドレス</Label>
          <Input
            id="basic-email"
            type="email"
            value={email}
            readOnly
            className="h-9 read-only:cursor-default read-only:bg-input/50 read-only:text-muted-foreground read-only:opacity-70"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-job-title">{BASIC_INFO_FORM_FIELDS.jobTitle.label}</Label>
          <Input
            id="basic-job-title"
            type="text"
            value={form.jobTitle}
            placeholder={BASIC_INFO_FORM_FIELDS.jobTitle.placeholder}
            onChange={(event) => updateField("jobTitle", event.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-job-category">{BASIC_INFO_FORM_FIELDS.jobCategory.label}</Label>
          <select
            id="basic-job-category"
            value={form.jobCategory}
            onChange={(event) => updateField("jobCategory", event.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">選択してください</option>
            {JOB_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-prefecture">
            {BASIC_INFO_FORM_FIELDS.prefecture.label}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="basic-prefecture"
            type="text"
            value={form.prefecture}
            placeholder={BASIC_INFO_FORM_FIELDS.prefecture.placeholder}
            onChange={(event) => updateField("prefecture", event.target.value)}
            className="h-9"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-years">
            {BASIC_INFO_FORM_FIELDS.yearsOfExperience.label}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="basic-years"
            type="number"
            inputMode="numeric"
            min={0}
            max={50}
            placeholder={BASIC_INFO_FORM_FIELDS.yearsOfExperience.placeholder}
            value={form.yearsOfExperience}
            onChange={(event) => updateField("yearsOfExperience", event.target.value)}
            className="h-9"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-availability-status">{BASIC_INFO_FORM_FIELDS.availabilityStatus.label}</Label>
          <select
            id="basic-availability-status"
            value={form.availabilityStatus}
            onChange={(event) => updateField("availabilityStatus", event.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">選択してください</option>
            {AVAILABILITY_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-work-style">
            {BASIC_INFO_FORM_FIELDS.workStyle.label}
            <span className="text-destructive">*</span>
          </Label>
          <select
            id="basic-work-style"
            value={form.workStyle}
            onChange={(event) => updateField("workStyle", event.target.value)}
            className={SELECT_CLASS}
            required
          >
            <option value="">選択してください</option>
            {WORK_STYLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-portfolio-url">{BASIC_INFO_FORM_FIELDS.portfolioUrl.label}</Label>
          <Input
            id="basic-portfolio-url"
            type="url"
            value={form.portfolioUrl}
            placeholder={BASIC_INFO_FORM_FIELDS.portfolioUrl.placeholder}
            onChange={(event) => updateField("portfolioUrl", event.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-github-url">{BASIC_INFO_FORM_FIELDS.githubUrl.label}</Label>
          <Input
            id="basic-github-url"
            type="url"
            value={form.githubUrl}
            placeholder={BASIC_INFO_FORM_FIELDS.githubUrl.placeholder}
            onChange={(event) => updateField("githubUrl", event.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-available-from">{BASIC_INFO_FORM_FIELDS.availableFrom.label}</Label>
          <Input
            id="basic-available-from"
            type="date"
            value={form.availableFrom}
            onChange={(event) => updateField("availableFrom", event.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-desired-hourly-rate">
            {BASIC_INFO_FORM_FIELDS.desiredHourlyRate.label}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="basic-desired-hourly-rate"
            type="number"
            inputMode="numeric"
            min={1}
            max={99999}
            placeholder={BASIC_INFO_FORM_FIELDS.desiredHourlyRate.placeholder}
            value={form.desiredHourlyRate}
            onChange={(event) => updateField("desiredHourlyRate", event.target.value)}
            className="h-9"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-minimum-hourly-rate">
            {BASIC_INFO_FORM_FIELDS.minimumHourlyRate.label}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="basic-minimum-hourly-rate"
            type="number"
            inputMode="numeric"
            min={1}
            max={99999}
            placeholder={BASIC_INFO_FORM_FIELDS.minimumHourlyRate.placeholder}
            value={form.minimumHourlyRate}
            onChange={(event) => updateField("minimumHourlyRate", event.target.value)}
            className="h-9"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-annual-income">{BASIC_INFO_FORM_FIELDS.desiredAnnualIncome.label}</Label>
          <Input
            id="basic-annual-income"
            type="number"
            inputMode="numeric"
            min={10000}
            max={99990000}
            placeholder={BASIC_INFO_FORM_FIELDS.desiredAnnualIncome.placeholder}
            value={form.desiredAnnualIncome}
            onChange={(event) => updateField("desiredAnnualIncome", event.target.value)}
            className="h-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="basic-self-pr">{BASIC_INFO_FORM_FIELDS.selfPr.label}</Label>
        <Textarea
          id="basic-self-pr"
          value={form.selfPr}
          onChange={(event) => updateField("selfPr", event.target.value)}
          maxLength={2000}
          rows={5}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm leading-none font-medium">{VISIBILITY_FORM_LABEL}</span>
        <div className="flex items-center gap-3">
          <Switch
            id="basic-visibility"
            checked={form.isPublic}
            onCheckedChange={(checked) => updateField("isPublic", checked)}
            aria-label={VISIBILITY_FORM_LABEL}
          />
          <Label htmlFor="basic-visibility" className="cursor-pointer text-foreground">
            {form.isPublic ? VISIBILITY_STATUS_LABEL.public : VISIBILITY_STATUS_LABEL.private}
          </Label>
        </div>
      </div>

      <FormStatusMessage message={message} status={status} />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          aria-busy={isSaving}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {isSaving ? BASIC_INFO_FORM_META.savingLabel : BASIC_INFO_FORM_META.saveLabel}
        </button>
      </div>
    </form>
  );
}
