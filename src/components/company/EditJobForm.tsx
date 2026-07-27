"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  JobFormActions,
  JobFormFields,
  buildInitialFormState,
  buildOpportunityInput,
  validateJobForm,
  type JobFormState,
} from "@/components/company/CreateJobForm";
import { createClient } from "@/lib/supabase/client";
import { updateCompanyOpportunity, type OpportunityDetail, type Skill } from "@/lib/company/jobs";
import { EDIT_JOB_META, JOB_FORM_BUTTON_LABELS, JOB_FORM_ERRORS } from "@/constants/company-jobs";

interface EditJobFormProps {
  detail: OpportunityDetail;
  skills: Skill[];
}

export function EditJobForm({ detail, skills }: EditJobFormProps) {
  const router = useRouter();
  const [state, setState] = useState<JobFormState>(() => buildInitialFormState(detail));
  const [isSaving, setIsSaving] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<"error" | "success" | null>(null);
  const idPrefix = `edit-${detail.opportunity.id}`;

  function updateState(patch: Partial<JobFormState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setFormMessage(null);
    setFormStatus(null);

    const validationError = validateJobForm(state);
    if (validationError) {
      setFormMessage(validationError);
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
        setFormMessage(JOB_FORM_ERRORS.notSignedIn);
        setFormStatus("error");
        return;
      }

      const input = buildOpportunityInput(state);
      const { error, stage } = await updateCompanyOpportunity(
        supabase,
        detail.opportunity.id,
        input,
      );

      if (stage === "invalid_input") {
        setFormMessage(JOB_FORM_ERRORS.invalidInput);
        setFormStatus("error");
        return;
      }

      if (stage === "company_name_required") {
        setFormMessage(JOB_FORM_ERRORS.companyNameRequiredToPublish);
        setFormStatus("error");
        return;
      }

      if (error) {
        console.error("[job-form] update failed:", error, "stage:", stage);
        setFormMessage(JOB_FORM_ERRORS.saveFailed);
        setFormStatus("error");
        return;
      }

      setFormMessage(EDIT_JOB_META.saveSuccessMessage);
      setFormStatus("success");
      router.refresh();
    } catch (err) {
      console.error("[job-form] unexpected update error:", err);
      setFormMessage(JOB_FORM_ERRORS.saveFailed);
      setFormStatus("error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <JobFormFields
        state={state}
        onChange={updateState}
        skills={skills}
        idPrefix={idPrefix}
        isContractTypeLocked
      />
      <JobFormActions
        isSaving={isSaving}
        formMessage={formMessage}
        formStatus={formStatus}
        cancelHref={EDIT_JOB_META.cancelHref}
        saveLabel={JOB_FORM_BUTTON_LABELS.save}
      />
    </form>
  );
}
