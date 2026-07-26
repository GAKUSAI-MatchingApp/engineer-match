import type { SupabaseClient } from "@supabase/supabase-js";
import { ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL, type AdminOpportunityContractType } from "@/lib/admin/opportunities";

/** public.applications.status (011_applications.sql widened by 049_application_completion_status.sql). */
export type AdminApplicationStatus =
  | "applied"
  | "screening"
  | "interview"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "completed";

export const ADMIN_APPLICATION_STATUS_LABEL: Record<AdminApplicationStatus, string> = {
  applied: "応募済み",
  screening: "書類選考中",
  interview: "面接",
  accepted: "内定",
  rejected: "不採用",
  withdrawn: "辞退",
  completed: "完了",
};

export const ADMIN_APPLICATION_STATUS_TONE: Record<
  AdminApplicationStatus,
  "positive" | "negative" | "warning" | "neutral" | "info"
> = {
  applied: "info",
  screening: "info",
  interview: "warning",
  accepted: "positive",
  rejected: "negative",
  withdrawn: "neutral",
  completed: "positive",
};

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export interface AdminApplicationListItem {
  id: string;
  applicantId: string;
  applicantName: string;
  opportunityId: string;
  opportunityTitle: string;
  companyId: string;
  companyName: string;
  contractType: AdminOpportunityContractType;
  status: AdminApplicationStatus;
  appliedAtLabel: string;
  appliedAtISO: string;
  updatedAtLabel: string;
}

const LIST_CAP = 1000;

export async function listAdminApplications(supabase: SupabaseClient): Promise<AdminApplicationListItem[]> {
  const { data: rows, error } = await supabase
    .from("applications")
    .select("id, opportunity_id, applicant_id, status, applied_at, updated_at")
    .order("applied_at", { ascending: false })
    .limit(LIST_CAP);

  if (error) {
    console.error("[admin] failed to list applications:", error);
    return [];
  }
  if (!rows || rows.length === 0) return [];

  const applicantIds = [...new Set(rows.map((r) => r.applicant_id as string))];
  const oppIds = [...new Set(rows.map((r) => r.opportunity_id as string))];

  const [{ data: applicants }, { data: opportunities }] = await Promise.all([
    supabase.from("users").select("id, name").in("id", applicantIds),
    supabase.from("opportunities").select("id, title, contract_type, posted_by").in("id", oppIds),
  ]);

  const applicantNameById = new Map((applicants ?? []).map((r) => [r.id as string, r.name as string]));
  const oppById = new Map((opportunities ?? []).map((r) => [r.id as string, r]));

  const companyIds = [...new Set((opportunities ?? []).map((o) => o.posted_by as string))];
  const { data: companies } =
    companyIds.length > 0
      ? await supabase.from("company_profiles").select("id, company_name").in("id", companyIds)
      : { data: [] as { id: string; company_name: string }[] };
  const companyNameById = new Map((companies ?? []).map((r) => [r.id as string, r.company_name as string]));

  return rows.map((row) => {
    const opp = oppById.get(row.opportunity_id as string);
    return {
      id: row.id as string,
      applicantId: row.applicant_id as string,
      applicantName: applicantNameById.get(row.applicant_id as string) ?? "不明なユーザー",
      opportunityId: row.opportunity_id as string,
      opportunityTitle: (opp?.title as string | undefined) ?? "（求人情報なし）",
      companyId: (opp?.posted_by as string | undefined) ?? "",
      companyName: opp ? (companyNameById.get(opp.posted_by as string) ?? "") : "",
      contractType: (opp?.contract_type as AdminOpportunityContractType | undefined) ?? "employment",
      status: row.status as AdminApplicationStatus,
      appliedAtLabel: formatDateLabel(row.applied_at as string),
      appliedAtISO: row.applied_at as string,
      updatedAtLabel: formatDateLabel(row.updated_at as string),
    };
  });
}

export interface AdminApplicationMessagePreview {
  chatRoomId: string;
  lastMessageBody: string;
  lastMessageAtLabel: string;
}

export interface AdminApplicationDetail extends AdminApplicationListItem {
  completedAtLabel: string | null;
  messagePreview: AdminApplicationMessagePreview | null;
}

export async function getAdminApplicationDetail(
  supabase: SupabaseClient,
  id: string,
): Promise<AdminApplicationDetail | null> {
  const { data: row, error } = await supabase
    .from("applications")
    .select("id, opportunity_id, applicant_id, status, applied_at, updated_at, completed_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin] failed to load application detail:", error);
    return null;
  }
  if (!row) return null;

  const [{ data: applicant }, { data: opportunity }, { data: chatRoom }] = await Promise.all([
    supabase.from("users").select("name").eq("id", row.applicant_id as string).maybeSingle(),
    supabase
      .from("opportunities")
      .select("id, title, contract_type, posted_by")
      .eq("id", row.opportunity_id as string)
      .maybeSingle(),
    supabase.from("chat_rooms").select("id").eq("application_id", id).maybeSingle(),
  ]);

  let companyName = "";
  if (opportunity) {
    const { data: company } = await supabase
      .from("company_profiles")
      .select("company_name")
      .eq("id", opportunity.posted_by as string)
      .maybeSingle();
    companyName = (company?.company_name as string | undefined) ?? "";
  }

  let messagePreview: AdminApplicationMessagePreview | null = null;
  if (chatRoom) {
    const { data: lastMessage } = await supabase
      .from("messages")
      .select("body, sent_at")
      .eq("chat_room_id", chatRoom.id as string)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastMessage) {
      messagePreview = {
        chatRoomId: chatRoom.id as string,
        lastMessageBody: lastMessage.body as string,
        lastMessageAtLabel: formatDateLabel(lastMessage.sent_at as string),
      };
    }
  }

  return {
    id: row.id as string,
    applicantId: row.applicant_id as string,
    applicantName: (applicant?.name as string | undefined) ?? "不明なユーザー",
    opportunityId: row.opportunity_id as string,
    opportunityTitle: (opportunity?.title as string | undefined) ?? "（求人情報なし）",
    companyId: (opportunity?.posted_by as string | undefined) ?? "",
    companyName,
    contractType: (opportunity?.contract_type as AdminOpportunityContractType | undefined) ?? "employment",
    status: row.status as AdminApplicationStatus,
    appliedAtLabel: formatDateLabel(row.applied_at as string),
    appliedAtISO: row.applied_at as string,
    updatedAtLabel: formatDateLabel(row.updated_at as string),
    completedAtLabel: row.completed_at ? formatDateLabel(row.completed_at as string) : null,
    messagePreview,
  };
}

export { ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL };
