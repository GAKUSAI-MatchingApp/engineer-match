/**
 * public.applications.status transition graph (RD-2026-001 BR-53/BR-54).
 * Shared by the engineer withdraw flow (src/lib/engineer/applications.ts) and
 * the company screening-pipeline flow (src/lib/company/applicants.ts) so both
 * enforce the exact same rules the DB trigger
 * (trg_applications_status_transition, see supabase/migrations) enforces.
 *
 * 'accepted' may only ever move to 'completed' (the president's
 * offer-accepted -> work-finished -> review flow); it may never move back to
 * an earlier stage or be withdrawn/rejected. 'completed', 'rejected', and
 * 'withdrawn' are terminal -- no further transitions from any of them.
 */
export type ApplicationStatusValue =
  | "applied"
  | "screening"
  | "interview"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "completed";

export const APPLICATION_STATUS_TRANSITIONS: Record<
  ApplicationStatusValue,
  readonly ApplicationStatusValue[]
> = {
  applied: ["screening", "rejected", "withdrawn"],
  screening: ["interview", "rejected", "withdrawn"],
  interview: ["accepted", "rejected", "withdrawn"],
  accepted: ["completed"],
  rejected: [],
  withdrawn: [],
  completed: [],
};

export function canTransitionApplicationStatus(
  from: ApplicationStatusValue,
  to: ApplicationStatusValue,
): boolean {
  return APPLICATION_STATUS_TRANSITIONS[from].includes(to);
}
