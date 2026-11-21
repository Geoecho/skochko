import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthProvider';
import type { CrawlHistoryItem, UserStats } from './types';

const MOCK_CRAWLS: CrawlHistoryItem[] = [
  {
    id: 'mock-crawl-1',
    user_id: 'current-user',
    route_id: 'mock-route-1',
    route_title: 'Дебар Маало Боемска Тура',
    started_at: new Date(Date.now() - 2 * 86400000 - 4 * 3600000).toISOString(),
    ended_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    distance_m: 1650,
    duration_s: 14400, // 4 hours
    stops_visited_count: 3,
    visited_venue_names: ['Стар Град', 'Пивница Стар Град', 'Котур'],
  },
  {
    id: 'mock-crawl-2',
    user_id: 'current-user',
    route_id: null,
    route_title: null,
    started_at: new Date(Date.now() - 6 * 86400000 - 3 * 3600000).toISOString(),
    ended_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    distance_m: 2100,
    duration_s: 10800, // 3 hours
    stops_visited_count: 2,
    visited_venue_names: ['Ракија Бар Калдрма', 'Стар Град'],
  },
  {
    id: 'mock-crawl-3',
    user_id: 'current-user',
    route_id: 'mock-route-3',
    route_title: 'Винска и Коктел Вечер',
    started_at: new Date(Date.now() - 14 * 86400000 - 3.5 * 3600000).toISOString(),
    ended_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    distance_m: 1100,
    duration_s: 12600, // 3.5 hours
    stops_visited_count: 2,
    visited_venue_names: ['Винотек', 'Стар Град'],
  },
];

export async function fetchCrawlHistory(userId: string | null): Promise<CrawlHistoryItem[]> {
  if (!userId && process.env.NEXT_PUBLIC_USE_MOCK !== '1') {
    return [];
  }

  if (process.env.NEXT_PUBLIC_USE_MOCK === '1') {
    return MOCK_CRAWLS;
  }

  const { data: crawls, error: crawlsError } = await supabase
    .from('crawls')
    .select('id, user_id, route_id, started_at, ended_at, distance_m, routes(id, title)')
    .eq('user_id', userId!)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false });

  if (crawlsError) throw crawlsError;
  if (!crawls || crawls.length === 0) return [];

  const crawlIds = crawls.map((c) => c.id);

  const { data: checkins, error: checkinsError } = await supabase
    .from('crawl_checkins')
    .select('crawl_id, venue_id, checked_in_at, venues(name)')
    .in('crawl_id', crawlIds)
    .order('checked_in_at', { ascending: true });

  if (checkinsError) throw checkinsError;

  const checkinsByCrawl = new Map<string, string[]>();
  for (const item of (checkins ?? []) as Record<string, unknown>[]) {
    const cid = String(item.crawl_id);
    const rawVenue = Array.isArray(item.venues) ? item.venues[0] : item.venues;
    const vname = rawVenue ? String((rawVenue as Record<string, unknown>).name ?? '') : '';
    const list = checkinsByCrawl.get(cid) ?? [];
    if (vname) list.push(vname);
    checkinsByCrawl.set(cid, list);
  }

  return crawls.map((c) => {
    const rawRoute = Array.isArray(c.routes) ? c.routes[0] : c.routes;
    const routeTitle = rawRoute ? String((rawRoute as Record<string, unknown>).title ?? '') : null;
    const venueNames = checkinsByCrawl.get(c.id) ?? [];

    const startMs = new Date(c.started_at).getTime();
    const endMs = c.ended_at ? new Date(c.ended_at).getTime() : startMs;
    const durationSeconds = Math.max(0, Math.round((endMs - startMs) / 1000));

    return {
      id: c.id,
      user_id: c.user_id,
      route_id: c.route_id,
      route_title: routeTitle,
      started_at: c.started_at,
      ended_at: c.ended_at,
      distance_m: c.distance_m ?? null,
      duration_s: durationSeconds,
      stops_visited_count: venueNames.length,
      visited_venue_names: venueNames,
    };
  });
}

export async function fetchUserStats(userId: string | null): Promise<UserStats> {
  if (!userId) {
    if (process.env.NEXT_PUBLIC_USE_MOCK === '1') {
      return { crawls_count: 3, routes_created_count: 1 };
    }
    return { crawls_count: 0, routes_created_count: 0 };
  }

  if (process.env.NEXT_PUBLIC_USE_MOCK === '1') {
    return { crawls_count: 3, routes_created_count: 1 };
  }

  const [{ count: crawlsCount, error: crawlsErr }, { count: routesCount, error: routesErr }] =
    await Promise.all([
      supabase
        .from('crawls')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('ended_at', 'is', null),
      supabase
        .from('routes')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .neq('status', 'archived'),
    ]);

  if (crawlsErr) throw crawlsErr;
  if (routesErr) throw routesErr;

  return {
    crawls_count: crawlsCount ?? 0,
    routes_created_count: routesCount ?? 0,
  };
}

export function useCrawlHistory() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  return useQuery({
    queryKey: ['crawl-history', userId],
    queryFn: () => fetchCrawlHistory(userId),
    enabled: !!userId || process.env.NEXT_PUBLIC_USE_MOCK === '1',
  });
}

export function useUserStats() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  return useQuery({
    queryKey: ['user-stats', userId],
    queryFn: () => fetchUserStats(userId),
    enabled: !!userId || process.env.NEXT_PUBLIC_USE_MOCK === '1',
  });
}
