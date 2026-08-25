import type { SupabaseClient } from "@supabase/supabase-js";
import { getEngineerProfile, computeProfileCompletion } from "@/lib/engineer/profile";
import { listUserSkills } from "@/lib/engineer/skills";
import { listUserQualifications } from "@/lib/engineer/qualifications";
import { listWorkExperiences } from "@/lib/engineer/work-experience";
import { listLanguages } from "@/lib/engineer/languages";
import { listMyApplications, type ApplicationListItem } from "@/lib/engineer/applications";
import { listMyFavoriteOpportunityIds } from "@/lib/engineer/favorites";
import { listMyConversations, type ConversationListItem } from "@/lib/engineer/chat";
import { listPublishedOpportunities, type HydratedOpportunity } from "@/lib/engineer/opportunities";

/**
 * All real, Supabase-backed dashboard data for one engineer. No fabricated
 * statistics (profile-view counts, rankings, analytics) -- only what the
 * existing schema actually tracks. Batches the underlying reads via
 * Promise.all rather than sequential round-trips.
 */
export interface EngineerDashboardData {
  applicationsCount: number;
  screeningCount: number;
  favoritesCount: number;
  profileCompletion: { percentage: number; missingItems: string[] };
  recentApplications: ApplicationListItem[];
  recommendedOpportunities: HydratedOpportunity[];
  recentConversations: ConversationListItem[];
  topSkills: string[];
  maxItssLevel: number | null;
}

const SCREENING_STATUSES = new Set(["screening", "interview"]);

export async function getEngineerDashboardData(
  supabase: SupabaseClient,
  userId: string,
): Promise<EngineerDashboardData> {
  const [
    applications,
    favoriteIds,
    profile,
    technicalSkills,
    qualifications,
    conversations,
    publishedResult,
    workExperiences,
    languages,
  ] = await Promise.all([
    listMyApplications(supabase, userId),
    listMyFavoriteOpportunityIds(supabase, userId),
    getEngineerProfile(supabase, userId),
    listUserSkills(supabase, userId),
    listUserQualifications(supabase, userId),
    listMyConversations(supabase, userId),
    listPublishedOpportunities(supabase, { sort: "newest", limit: 6 }),
    listWorkExperiences(supabase, userId),
    listLanguages(supabase, userId),
  ]);

  const appliedOpportunityIds = new Set(applications.map((app) => app.opportunity_id));
  const recommendedOpportunities = publishedResult.items
    .filter((item) => !appliedOpportunityIds.has(item.id))
    .slice(0, 3);

  const profileCompletion = computeProfileCompletion({
    hasSelfPr: Boolean(profile?.self_pr),
    hasPrefecture: Boolean(profile?.prefecture),
    hasYearsOfExperience:
      profile?.years_of_experience !== null && profile?.years_of_experience !== undefined,
    hasWorkStyle: Boolean(profile?.work_style),
    hasDesiredRate: Boolean(profile?.desired_hourly_rate_min && profile?.desired_hourly_rate_max),
    hasTechnicalSkill: technicalSkills.length > 0,
    hasQualification: qualifications.length > 0,
    hasJobTitle: Boolean(profile?.job_title),
    hasWorkExperience: workExperiences.length > 0,
    hasLanguage: languages.length > 0,
  });

  const maxItssLevel = technicalSkills.reduce<number | null>((max, skill) => {
    if (skill.level === null) return max;
    return max === null ? skill.level : Math.max(max, skill.level);
  }, null);

  return {
    applicationsCount: applications.length,
    screeningCount: applications.filter((app) => SCREENING_STATUSES.has(app.status)).length,
    favoritesCount: favoriteIds.size,
    profileCompletion,
    recentApplications: applications.slice(0, 4),
    recommendedOpportunities,
    recentConversations: conversations.slice(0, 3),
    topSkills: technicalSkills.slice(0, 5).map((skill) => skill.name),
    maxItssLevel,
  };
}
