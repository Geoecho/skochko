import { supabase } from '@/lib/supabase';

export async function startDBCrawl(userId: string, routeId?: string | null): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_USE_MOCK === '1') {
    return `mock-crawl-${Date.now()}`;
  }

  try {
    const { data, error } = await supabase
      .from('crawls')
      .insert({
        user_id: userId,
        route_id: routeId ?? null,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !data) {
      console.warn('Failed to insert crawl into Supabase:', error);
      return null;
    }
    return data.id;
  } catch (err) {
    console.warn('Crawl insertion exception:', err);
    return null;
  }
}

export async function recordDBCheckin(dbCrawlId: string, venueId: string): Promise<void> {
  if (process.env.NEXT_PUBLIC_USE_MOCK === '1') {
    return;
  }

  try {
    const { error } = await supabase.from('crawl_checkins').insert({
      crawl_id: dbCrawlId,
      venue_id: venueId,
      checked_in_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Failed to record checkin in Supabase:', error);
    }
  } catch (err) {
    console.warn('Checkin exception:', err);
  }
}

export async function finishDBCrawl(dbCrawlId: string, distanceMeters: number): Promise<void> {
  if (process.env.NEXT_PUBLIC_USE_MOCK === '1') {
    return;
  }

  try {
    const { error } = await supabase
      .from('crawls')
      .update({
        ended_at: new Date().toISOString(),
        distance_m: Math.round(distanceMeters),
      })
      .eq('id', dbCrawlId);

    if (error) {
      console.warn('Failed to finish crawl in Supabase:', error);
    }
  } catch (err) {
    console.warn('Finish crawl exception:', err);
  }
}

export async function rateDBRoute(
  routeId: string,
  userId: string,
  stars: number,
  comment?: string,
): Promise<boolean> {
  if (process.env.NEXT_PUBLIC_USE_MOCK === '1') {
    return true;
  }

  try {
    const { error } = await supabase.from('route_ratings').upsert(
      {
        route_id: routeId,
        user_id: userId,
        stars,
        comment: comment ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'route_id,user_id' },
    );

    if (error) {
      console.warn('Failed to rate route:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Rating exception:', err);
    return false;
  }
}
