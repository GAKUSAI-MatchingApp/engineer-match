"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, MapPin, SquarePen, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import {
  saveCompanyProfile,
  type CompanyProfile,
  type IndustryCategoryOption,
} from "@/lib/company/profile";
import {
  COMPANY_PROFILE_ERRORS,
  COMPANY_PROFILE_FORM,
  COMPANY_PROFILE_PAGE,
  COMPANY_SIZE_OPTIONS,
} from "@/constants/company";

const SELECT_CLASS =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

interface CompanyProfileHeaderProps {
  profile: CompanyProfile | null;
  /** Active public.industry_categories rows, per 064_industry_categories.sql draft (Phase 5 決定事項③). Empty until that migration is applied and seeded. */
  industryCategories: IndustryCategoryOption[];
}

interface FormState {
  companyName: string;
  /** public.company_profiles.industry_category_id -- replaces the old free-text `industry` form field per Phase 5 決定事項③. The legacy `industry` text itself is never edited here; it is passed straight through unmodified on save (see handleSubmit). */
  industryCategoryId: string;
  companySize: string;
  prefecture: string;
  address: string;
  websiteUrl: string;
  establishedYear: string;
  logoUrl: string;
  contactPerson: string;
  businessDescription: string;
}

function buildFormState(profile: CompanyProfile | null): FormState {
  return {
    companyName: profile?.company_name ?? "",
    industryCategoryId: profile?.industry_category_id ?? "",
    companySize: profile?.company_size ?? "",
    prefecture: profile?.prefecture ?? "",
    address: profile?.address ?? "",
    websiteUrl: profile?.website_url ?? "",
    establishedYear: profile?.established_year ? String(profile.established_year) : "",
    logoUrl: profile?.logo_url ?? "",
    contactPerson: profile?.contact_person ?? "",
    businessDescription: profile?.business_description ?? "",
  };
}

export function CompanyProfileHeader({ profile, industryCategories }: CompanyProfileHeaderProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<FormState>(() => buildFormState(profile));
  const [isSaving, setIsSaving] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<"error" | "success" | null>(null);
  const [previewNotice, setPreviewNotice] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formMessage) {
      errorRef.current?.focus();
    }
  }, [formMessage]);

  function startEditing() {
    setForm(buildFormState(profile));
    setFormMessage(null);
    setFormStatus(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setFormMessage(null);
    setFormStatus(null);
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setFormMessage(null);
    setFormStatus(null);

    const companyName = form.companyName.trim();
    if (!companyName) {
      setFormMessage(COMPANY_PROFILE_ERRORS.nameRequired);
      setFormStatus("error");
      return;
    }

    let establishedYear: number | null = null;
    if (form.establishedYear.trim()) {
      const parsed = Number(form.establishedYear);
      const currentYear = new Date().getFullYear();
      if (!Number.isInteger(parsed) || parsed < 1800 || parsed > 2100) {
        setFormMessage(COMPANY_PROFILE_ERRORS.invalidYear);
        setFormStatus("error");
        return;
      }
      if (parsed > currentYear) {
        setFormMessage(COMPANY_PROFILE_ERRORS.invalidYearFuture);
        setFormStatus("error");
        return;
      }
      establishedYear = parsed;
    }

    if (form.businessDescription.length > 2000) {
      setFormMessage(COMPANY_PROFILE_ERRORS.descriptionTooLong);
      setFormStatus("error");
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setFormMessage(COMPANY_PROFILE_ERRORS.notSignedIn);
        setFormStatus("error");
        return;
      }

      const { error } = await saveCompanyProfile(supabase, user.id, {
        company_name: companyName,
        // Legacy free-text column: intentionally passed through unmodified,
        // never cleared/overwritten by this form (Phase 5 決定事項③).
        industry: profile?.industry ?? null,
        industry_category_id: form.industryCategoryId || null,
        company_size: form.companySize || null,
        prefecture: form.prefecture.trim() || null,
        address: form.address.trim() || null,
        website_url: form.websiteUrl.trim() || null,
        established_year: establishedYear,
        logo_url: form.logoUrl.trim() || null,
        contact_person: form.contactPerson.trim() || null,
        business_description: form.businessDescription.trim() || null,
      });

      if (error) {
        console.error("[company-profile] save failed:", error);
        setFormMessage(COMPANY_PROFILE_ERRORS.saveFailed);
        setFormStatus("error");
        return;
      }

      setFormMessage(COMPANY_PROFILE_FORM.savedMessage);
      setFormStatus("success");
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error("[company-profile] unexpected save error:", err);
      setFormMessage(COMPANY_PROFILE_ERRORS.saveFailed);
      setFormStatus("error");
    } finally {
      setIsSaving(false);
    }
  }

  const logoInitial = profile?.company_name?.trim().charAt(0) || "?";
  const headquarters = [profile?.prefecture, profile?.address]
    .filter(Boolean)
    .join(" ");
  const sizeLabel = COMPANY_SIZE_OPTIONS.find(
    (option) => option.value === profile?.company_size,
  )?.label;
  // Prefer the resolved master category name; fall back to the legacy
  // free-text value for companies that haven't picked a category yet.
  const industryDisplay =
    industryCategories.find((option) => option.id === profile?.industry_category_id)?.name ??
    profile?.industry ??
    null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      {!isEditing ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex min-w-0 items-start gap-4">
              {profile?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL, no next/image domain config for this
                <img
                  src={profile.logo_url}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                />
              ) : (
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary"
                  aria-hidden="true"
                >
                  {logoInitial}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {profile?.company_name || COMPANY_PROFILE_FORM.emptyNameMessage}
                </h2>
                {industryDisplay && (
                  <p className="mt-1 text-sm text-muted-foreground">{industryDisplay}</p>
                )}
                <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                  {sizeLabel && (
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <dt className="sr-only">従業員数</dt>
                      <dd>{sizeLabel}</dd>
                    </div>
                  )}
                  {headquarters && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <dt className="sr-only">本社所在地</dt>
                      <dd>{headquarters}</dd>
                    </div>
                  )}
                  {profile?.website_url && (
                    <div className="flex min-w-0 items-center gap-1.5">
                      <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <dt className="sr-only">コーポレートサイト</dt>
                      <dd className="min-w-0 truncate">
                        <a
                          href={profile.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline underline-offset-2 transition-colors duration-200 hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                          {profile.website_url}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-3">
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <SquarePen className="h-4 w-4" aria-hidden="true" />
                {COMPANY_PROFILE_PAGE.editLabel}
              </button>
              <button
                type="button"
                onClick={() => setPreviewNotice(COMPANY_PROFILE_PAGE.previewDemoMessage)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                {COMPANY_PROFILE_PAGE.previewLabel}
              </button>
            </div>
          </div>

          {previewNotice && (
            <p
              role="status"
              className="mt-4 rounded-xl bg-muted px-4 py-2.5 text-xs text-muted-foreground"
            >
              {previewNotice}
            </p>
          )}
        </>
      ) : (
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-company-name">
                {COMPANY_PROFILE_FORM.companyNameLabel}
              </Label>
              <Input
                id="profile-company-name"
                value={form.companyName}
                onChange={(event) => updateField("companyName", event.target.value)}
                placeholder={COMPANY_PROFILE_FORM.companyNamePlaceholder}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-industry">{COMPANY_PROFILE_FORM.industryLabel}</Label>
              <select
                id="profile-industry"
                value={form.industryCategoryId}
                onChange={(event) => updateField("industryCategoryId", event.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">{COMPANY_PROFILE_FORM.industryCategoryPlaceholder}</option>
                {industryCategories.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-company-size">
                {COMPANY_PROFILE_FORM.companySizeLabel}
              </Label>
              <select
                id="profile-company-size"
                value={form.companySize}
                onChange={(event) => updateField("companySize", event.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">{COMPANY_PROFILE_FORM.companySizePlaceholder}</option>
                {COMPANY_SIZE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-established-year">
                {COMPANY_PROFILE_FORM.establishedYearLabel}
              </Label>
              <Input
                id="profile-established-year"
                type="number"
                inputMode="numeric"
                min={1800}
                max={new Date().getFullYear()}
                value={form.establishedYear}
                onChange={(event) => updateField("establishedYear", event.target.value)}
                placeholder={COMPANY_PROFILE_FORM.establishedYearPlaceholder}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-prefecture">
                {COMPANY_PROFILE_FORM.prefectureLabel}
              </Label>
              <Input
                id="profile-prefecture"
                value={form.prefecture}
                onChange={(event) => updateField("prefecture", event.target.value)}
                placeholder={COMPANY_PROFILE_FORM.prefecturePlaceholder}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-address">{COMPANY_PROFILE_FORM.addressLabel}</Label>
              <Input
                id="profile-address"
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
                placeholder={COMPANY_PROFILE_FORM.addressPlaceholder}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-website">{COMPANY_PROFILE_FORM.websiteLabel}</Label>
              <Input
                id="profile-website"
                type="url"
                value={form.websiteUrl}
                onChange={(event) => updateField("websiteUrl", event.target.value)}
                placeholder={COMPANY_PROFILE_FORM.websitePlaceholder}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-logo-url">{COMPANY_PROFILE_FORM.logoUrlLabel}</Label>
              <Input
                id="profile-logo-url"
                type="url"
                value={form.logoUrl}
                onChange={(event) => updateField("logoUrl", event.target.value)}
                placeholder={COMPANY_PROFILE_FORM.logoUrlPlaceholder}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-contact-person">
                {COMPANY_PROFILE_FORM.contactPersonLabel}
              </Label>
              <Input
                id="profile-contact-person"
                value={form.contactPerson}
                onChange={(event) => updateField("contactPerson", event.target.value)}
                placeholder={COMPANY_PROFILE_FORM.contactPersonPlaceholder}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-business-description">
              {COMPANY_PROFILE_FORM.businessDescriptionLabel}
            </Label>
            <Textarea
              id="profile-business-description"
              value={form.businessDescription}
              onChange={(event) => updateField("businessDescription", event.target.value)}
              placeholder={COMPANY_PROFILE_FORM.businessDescriptionPlaceholder}
              maxLength={2000}
              rows={5}
            />
          </div>

          {formMessage && (
            <div
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              aria-live="assertive"
              className={
                formStatus === "success"
                  ? "rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 focus:outline-none"
                  : "rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 focus:outline-none"
              }
            >
              {formMessage}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSaving}
              aria-busy={isSaving}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isSaving ? COMPANY_PROFILE_FORM.savingLabel : COMPANY_PROFILE_FORM.saveLabel}
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              disabled={isSaving}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface px-5 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {COMPANY_PROFILE_PAGE.cancelLabel}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
