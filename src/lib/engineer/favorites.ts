import type { SupabaseClient } from "@supabase/supabase-js";
import { hydrateOpportunities, type HydratedOpportunity } from "@/lib/engineer/opportunities";

/** public.favorites, per 014_favorites.sql. */
export interface Favorite {
  id: string;
  user_id: string;
  opportunity_id: string;
  created_at: string;
}

export interface FavoriteOpportunity extends HydratedOpportunity {
  favoriteId: string;
  favoritedAt: string;
}

/** The opportunity ids the current user has favorited — cheap set for card "is favorited" state. */
export async function listMyFavoriteOpportunityIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const favoriteIds = new Set<string>();
  const batchSize = 500;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("favorites")
      .select("opportunity_id")
      .eq("user_id", userId)
      .order("opportunity_id")
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error("[engineer-favorites] failed to list favorite ids:", error);
      return new Set();
    }

    const batch = data ?? [];
    for (const row of batch) favoriteIds.add(row.opportunity_id as string);
    if (batch.length < batchSize) break;
    offset += batch.length;
  }

  return favoriteIds;
}

/** Full favorited-job cards for the favorites page, newest-favorited first. */
export async function listMyFavoriteOpportunities(
  supabase: SupabaseClient,
  userId: string,
): Promise<FavoriteOpportunity[]> {
  const { data: favorites, error } = await supabase
    .from("favorites")
    .select("id, opportunity_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[engineer-favorites] failed to list favorites:", error);
    return [];
  }

  const rows = (favorites ?? []) as Favorite[];
  if (rows.length === 0) return [];

  const opportunityIds = rows.map((row) => row.opportunity_id);
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("id, title, description, contract_type, created_at, updated_at, posted_by")
    .in("id", opportunityIds);

  const hydrated = await hydrateOpportunities(supabase, opportunities ?? []);
  const hydratedById = new Map(hydrated.map((item) => [item.id, item]));

  return rows
    .map((row) => {
      const opportunity = hydratedById.get(row.opportunity_id);
      if (!opportunity) return null;
      return {
        ...opportunity,
        favoriteId: row.id,
        favoritedAt: row.created_at,
      };
    })
    .filter((item): item is FavoriteOpportunity => item !== null);
}

/** Whether the current user has favorited a single opportunity — used on the job detail page. */
export async function isOpportunityFavorited(
  supabase: SupabaseClient,
  userId: string,
  opportunityId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  if (error) {
    console.error("[engineer-favorites] failed to check favorite state:", error);
    return false;
  }

  return data !== null;
}

export async function addFavorite(
  supabase: SupabaseClient,
  userId: string,
  opportunityId: string,
) {
  return supabase
    .from("favorites")
    .insert({ user_id: userId, opportunity_id: opportunityId })
    .select("id")
    .single();
}

export async function removeFavorite(
  supabase: SupabaseClient,
  userId: string,
  opportunityId: string,
) {
  return supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("opportunity_id", opportunityId);
}
