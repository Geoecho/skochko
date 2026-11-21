import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { distanceMeters, MOCK_VENUES } from '@/features/venues/api';
import type { LatLng } from '@/types/domain';
import type { CommunityRoute, CommunitySort, RouteRatingItem, RouteStopDetail, RouteStopVenue } from './types';
import { useAuth } from '@/features/auth/AuthProvider';

// --- Mock Data ---

function venueToStop(venueIndex: number, plannedMinutes = 45): RouteStopVenue {
  const venue = MOCK_VENUES[venueIndex] ?? MOCK_VENUES[0];
  return {
    id: venue.id,
    name: venue.name,
    slug: venue.slug,
    category: venue.category,
    lat: venue.lat,
    lng: venue.lng,
    address: venue.address,
    photos: venue.photos,
  };
}

let mockRoutesStore: CommunityRoute[] = [
  {
    id: 'mock-route-1',
    owner_id: null,
    title: 'Дебар Маало Боемска Тура',
    description: 'Култна вечер низ срцето на Дебар Маало. Одлично локално пиво, мезе и урбана атмосфера.',
    city_id: 'mock-city-skopje',
    visibility: 'public',
    is_featured: true,
    is_curated: true,
    total_distance_m: 1350,
    total_duration_s: 8100, // 135 mins
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    author_name: 'Скочко Тим',
    stops_count: 3,
    avg_stars: 4.8,
    rating_count: 24,
    completed_count: 42,
    first_stop_location: { lat: MOCK_VENUES[0].lat, lng: MOCK_VENUES[0].lng },
    stops: [
      { id: 'mrs-1-1', position: 0, planned_minutes: 45, venue: venueToStop(0, 45) },
      { id: 'mrs-1-2', position: 1, planned_minutes: 45, venue: venueToStop(2, 45) },
      { id: 'mrs-1-3', position: 2, planned_minutes: 45, venue: venueToStop(1, 45) },
    ],
  },
  {
    id: 'mock-route-2',
    owner_id: 'mock-user-stefan',
    title: 'Стара Чаршија Ракија & Џез',
    description: 'Автентично чаршиско доживување со домашна жолта, калдрма и звуци на џез во Котур.',
    city_id: 'mock-city-skopje',
    visibility: 'public',
    is_featured: true,
    is_curated: false,
    total_distance_m: 1900,
    total_duration_s: 8400,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    author_name: 'Стефан П.',
    stops_count: 3,
    avg_stars: 4.9,
    rating_count: 31,
    completed_count: 68,
    first_stop_location: { lat: MOCK_VENUES[4].lat, lng: MOCK_VENUES[4].lng },
    stops: [
      { id: 'mrs-2-1', position: 0, planned_minutes: 45, venue: venueToStop(4, 45) },
      { id: 'mrs-2-2', position: 1, planned_minutes: 45, venue: venueToStop(1, 45) },
      { id: 'mrs-2-3', position: 2, planned_minutes: 45, venue: venueToStop(0, 45) },
    ],
  },
  {
    id: 'mock-route-3',
    owner_id: 'mock-user-marija',
    title: 'Винска и Коктел Вечер',
    description: 'Мирна вечер со селекција на македонски суви вина и одлични разговори.',
    city_id: 'mock-city-skopje',
    visibility: 'public',
    is_featured: false,
    is_curated: true,
    total_distance_m: 950,
    total_duration_s: 6900,
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    author_name: 'Марија К.',
    stops_count: 2,
    avg_stars: 4.6,
    rating_count: 14,
    completed_count: 19,
    first_stop_location: { lat: MOCK_VENUES[5].lat, lng: MOCK_VENUES[5].lng },
    stops: [
      { id: 'mrs-3-1', position: 0, planned_minutes: 60, venue: venueToStop(5, 60) },
      { id: 'mrs-3-2', position: 1, planned_minutes: 45, venue: venueToStop(0, 45) },
    ],
  },
  {
    id: 'mock-route-4',
    owner_id: 'mock-user-marko',
    title: 'Центар До Зора',
    description: 'Започни со кафе и краток пијалок, па продолжи со добра клубска музика во Епицентар.',
    city_id: 'mock-city-skopje',
    visibility: 'public',
    is_featured: false,
    is_curated: false,
    total_distance_m: 1600,
    total_duration_s: 11400,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    author_name: 'Марко Д.',
    stops_count: 3,
    avg_stars: 4.7,
    rating_count: 19,
    completed_count: 38,
    first_stop_location: { lat: MOCK_VENUES[1].lat, lng: MOCK_VENUES[1].lng },
    stops: [
      { id: 'mrs-4-1', position: 0, planned_minutes: 45, venue: venueToStop(1, 45) },
      { id: 'mrs-4-2', position: 1, planned_minutes: 45, venue: venueToStop(0, 45) },
      { id: 'mrs-4-3', position: 2, planned_minutes: 90, venue: venueToStop(3, 90) },
    ],
  },
  {
    id: 'mock-my-route-1',
    owner_id: 'current-user',
    title: 'Петочен круг со друштво',
    description: 'Мој сопствен избор за загревање пред викенд.',
    city_id: 'mock-city-skopje',
    visibility: 'private',
    is_featured: false,
    is_curated: false,
    total_distance_m: 800,
    total_duration_s: 5400,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    author_name: 'Јас',
    stops_count: 2,
    avg_stars: null,
    rating_count: 0,
    completed_count: 1,
    first_stop_location: { lat: MOCK_VENUES[0].lat, lng: MOCK_VENUES[0].lng },
    stops: [
      { id: 'mrs-my-1', position: 0, planned_minutes: 45, venue: venueToStop(0, 45) },
      { id: 'mrs-my-2', position: 1, planned_minutes: 45, venue: venueToStop(2, 45) },
    ],
  },
];

let mockRatingsStore: Record<string, RouteRatingItem[]> = {
  'mock-route-1': [
    {
      id: 'mr-1',
      route_id: 'mock-route-1',
      user_id: 'u-1',
      stars: 5,
      comment: 'Врвна тура! Растојанијата се кратки и пријатни за пешачење.',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      user_display_name: 'Горјан С.',
    },
    {
      id: 'mr-2',
      route_id: 'mock-route-1',
      user_id: 'u-2',
      stars: 5,
      comment: 'Стар Град и Котур се совршена комбинација за петок вечер.',
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      user_display_name: 'Ивана Т.',
    },
    {
      id: 'mr-3',
      route_id: 'mock-route-1',
      user_id: 'u-3',
      stars: 4,
      comment: 'Супер атмосфера, само во сабота треба однапред да се фати маса.',
      created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
      user_display_name: 'Никола М.',
    },
  ],
  'mock-route-2': [
    {
      id: 'mr-4',
      route_id: 'mock-route-2',
      user_id: 'u-4',
      stars: 5,
      comment: 'Ракијата во Чаршија нема замена. Чиста петка!',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      user_display_name: 'Бојан В.',
    },
  ],
};

function sortRoutes(routes: CommunityRoute[], sort: CommunitySort, origin?: LatLng): CommunityRoute[] {
  const list = [...routes];
  if (sort === 'topRated') {
    return list.sort((a, b) => (b.avg_stars ?? 0) - (a.avg_stars ?? 0) || b.rating_count - a.rating_count);
  }
  if (sort === 'trending') {
    return list.sort((a, b) => b.completed_count - a.completed_count || (b.avg_stars ?? 0) - (a.avg_stars ?? 0));
  }
  if (sort === 'nearMe' && origin) {
    return list.sort((a, b) => {
      const distA = a.first_stop_location ? distanceMeters(origin, a.first_stop_location) : Infinity;
      const distB = b.first_stop_location ? distanceMeters(origin, b.first_stop_location) : Infinity;
      return distA - distB;
    });
  }
  return list;
}

// --- Supabase Helpers ---

async function fetchStopsForRoutes(routeIds: string[]): Promise<Map<string, RouteStopDetail[]>> {
  if (routeIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from('route_stops')
    .select('id, route_id, position, planned_minutes, venue_id, venues(id, name, slug, category, lat, lng, address, photos)')
    .in('route_id', routeIds)
    .order('position', { ascending: true });

  if (error) throw error;

  const map = new Map<string, RouteStopDetail[]>();
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const routeId = String(row.route_id);
    const rawVenue = Array.isArray(row.venues) ? row.venues[0] : row.venues;
    if (!rawVenue) continue;

    const stopVenue: RouteStopVenue = {
      id: String((rawVenue as Record<string, unknown>).id),
      name: String((rawVenue as Record<string, unknown>).name ?? ''),
      slug: (rawVenue as Record<string, unknown>).slug as string | undefined,
      category: ((rawVenue as Record<string, unknown>).category ?? 'bar') as RouteStopVenue['category'],
      lat: Number((rawVenue as Record<string, unknown>).lat ?? 0),
      lng: Number((rawVenue as Record<string, unknown>).lng ?? 0),
      address: ((rawVenue as Record<string, unknown>).address as string | null) ?? null,
      photos: ((rawVenue as Record<string, unknown>).photos as string[] | null) ?? null,
    };

    const stop: RouteStopDetail = {
      id: String(row.id),
      position: Number(row.position ?? 0),
      planned_minutes: Number(row.planned_minutes ?? 45),
      venue: stopVenue,
    };

    const existing = map.get(routeId) ?? [];
    existing.push(stop);
    map.set(routeId, existing);
  }

  return map;
}

async function fetchStatsForRoutes(routeIds: string[]): Promise<Map<string, { avg_stars: number | null; rating_count: number; completed_count: number }>> {
  if (routeIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from('route_stats')
    .select('route_id, avg_stars, rating_count, completed_count')
    .in('route_id', routeIds);

  if (error) {
    // If route_stats view has an RLS or permission issue, fallback gracefully
    return new Map();
  }

  const map = new Map<string, { avg_stars: number | null; rating_count: number; completed_count: number }>();
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    map.set(String(row.route_id), {
      avg_stars: row.avg_stars != null ? Number(row.avg_stars) : null,
      rating_count: Number(row.rating_count ?? 0),
      completed_count: Number(row.completed_count ?? 0),
    });
  }
  return map;
}

async function fetchProfilesMap(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  const { data } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', userIds);

  const map = new Map<string, string>();
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    if (row.user_id && row.display_name) {
      map.set(String(row.user_id), String(row.display_name));
    }
  }
  return map;
}

// --- Query Functions ---

export async function fetchCommunityRoutes(sort: CommunitySort, origin?: LatLng): Promise<CommunityRoute[]> {
  if (process.env.NEXT_PUBLIC_USE_MOCK === '1') {
    const publicRoutes = mockRoutesStore.filter((r) => r.visibility === 'public');
    return sortRoutes(publicRoutes, sort, origin);
  }

  const { data: routes, error } = await supabase
    .from('routes')
    .select('id, owner_id, title, description, city_id, visibility, is_featured, is_curated, total_distance_m, total_duration_s, created_at, status')
    .eq('visibility', 'public')
    .eq('status', 'active');

  if (error) throw error;
  if (!routes || routes.length === 0) return [];

  const routeIds = routes.map((r) => r.id);
  const ownerIds = [...new Set(routes.map((r) => r.owner_id).filter(Boolean) as string[])];

  const [stopsMap, statsMap, profilesMap] = await Promise.all([
    fetchStopsForRoutes(routeIds),
    fetchStatsForRoutes(routeIds),
    fetchProfilesMap(ownerIds),
  ]);

  const items: CommunityRoute[] = routes.map((r) => {
    const stops = stopsMap.get(r.id) ?? [];
    const stats = statsMap.get(r.id);
    const author = r.owner_id ? profilesMap.get(r.owner_id) : null;
    const firstStopLoc = stops.length > 0 ? { lat: stops[0].venue.lat, lng: stops[0].venue.lng } : null;

    return {
      id: r.id,
      owner_id: r.owner_id,
      title: r.title,
      description: r.description,
      city_id: r.city_id,
      visibility: r.visibility,
      is_featured: !!r.is_featured,
      is_curated: !!r.is_curated,
      total_distance_m: r.total_distance_m,
      total_duration_s: r.total_duration_s,
      created_at: r.created_at,
      author_name: author || (r.is_curated ? 'Скочко Тим' : 'Корисник'),
      stops_count: stops.length,
      avg_stars: stats?.avg_stars ?? null,
      rating_count: stats?.rating_count ?? 0,
      completed_count: stats?.completed_count ?? 0,
      first_stop_location: firstStopLoc,
      stops,
    };
  });

  return sortRoutes(items, sort, origin);
}

export async function fetchFeaturedRoutes(): Promise<CommunityRoute[]> {
  if (process.env.NEXT_PUBLIC_USE_MOCK === '1') {
    return mockRoutesStore.filter((r) => r.visibility === 'public' && (r.is_featured || r.is_curated));
  }

  const { data: routes, error } = await supabase
    .from('routes')
    .select('id, owner_id, title, description, city_id, visibility, is_featured, is_curated, total_distance_m, total_duration_s, created_at, status')
    .eq('visibility', 'public')
    .eq('status', 'active')
    .or('is_featured.eq.true,is_curated.eq.true');

  if (error) throw error;
  if (!routes || routes.length === 0) return [];

  const routeIds = routes.map((r) => r.id);
  const ownerIds = [...new Set(routes.map((r) => r.owner_id).filter(Boolean) as string[])];

  const [stopsMap, statsMap, profilesMap] = await Promise.all([
    fetchStopsForRoutes(routeIds),
    fetchStatsForRoutes(routeIds),
    fetchProfilesMap(ownerIds),
  ]);

  return routes.map((r) => {
    const stops = stopsMap.get(r.id) ?? [];
    const stats = statsMap.get(r.id);
    const author = r.owner_id ? profilesMap.get(r.owner_id) : null;
    const firstStopLoc = stops.length > 0 ? { lat: stops[0].venue.lat, lng: stops[0].venue.lng } : null;

    return {
      id: r.id,
      owner_id: r.owner_id,
      title: r.title,
      description: r.description,
      city_id: r.city_id,
      visibility: r.visibility,
      is_featured: !!r.is_featured,
      is_curated: !!r.is_curated,
      total_distance_m: r.total_distance_m,
      total_duration_s: r.total_duration_s,
      created_at: r.created_at,
      author_name: author || (r.is_curated ? 'Скочко Тим' : 'Корисник'),
      stops_count: stops.length,
      avg_stars: stats?.avg_stars ?? null,
      rating_count: stats?.rating_count ?? 0,
      completed_count: stats?.completed_count ?? 0,
      first_stop_location: firstStopLoc,
      stops,
    };
  });
}

export async function fetchMyRoutes(userId: string | null): Promise<CommunityRoute[]> {
  if (!userId) return [];

  if (process.env.NEXT_PUBLIC_USE_MOCK === '1') {
    return mockRoutesStore.filter((r) => r.owner_id === userId || r.owner_id === 'current-user');
  }

  const { data: routes, error } = await supabase
    .from('routes')
    .select('id, owner_id, title, description, city_id, visibility, is_featured, is_curated, total_distance_m, total_duration_s, created_at, status')
    .eq('owner_id', userId)
    .neq('status', 'archived')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!routes || routes.length === 0) return [];

  const routeIds = routes.map((r) => r.id);

  const [stopsMap, statsMap] = await Promise.all([
    fetchStopsForRoutes(routeIds),
    fetchStatsForRoutes(routeIds),
  ]);

  return routes.map((r) => {
    const stops = stopsMap.get(r.id) ?? [];
    const stats = statsMap.get(r.id);
    const firstStopLoc = stops.length > 0 ? { lat: stops[0].venue.lat, lng: stops[0].venue.lng } : null;

    return {
      id: r.id,
      owner_id: r.owner_id,
      title: r.title,
      description: r.description,
      city_id: r.city_id,
      visibility: r.visibility,
      is_featured: !!r.is_featured,
      is_curated: !!r.is_curated,
      total_distance_m: r.total_distance_m,
      total_duration_s: r.total_duration_s,
      created_at: r.created_at,
      author_name: 'Јас',
      stops_count: stops.length,
      avg_stars: stats?.avg_stars ?? null,
      rating_count: stats?.rating_count ?? 0,
      completed_count: stats?.completed_count ?? 0,
      first_stop_location: firstStopLoc,
      stops,
    };
  });
}

export async function fetchRouteDetail(routeId: string): Promise<CommunityRoute | null> {
  if (process.env.NEXT_PUBLIC_USE_MOCK === '1') {
    const found = mockRoutesStore.find((r) => r.id === routeId);
    return found ? { ...found } : null;
  }

  const { data: route, error } = await supabase
    .from('routes')
    .select('*')
    .eq('id', routeId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  if (!route) return null;

  const [stopsMap, statsMap, profilesMap] = await Promise.all([
    fetchStopsForRoutes([route.id]),
    fetchStatsForRoutes([route.id]),
    route.owner_id ? fetchProfilesMap([route.owner_id]) : Promise.resolve(new Map<string, string>()),
  ]);

  const stops = stopsMap.get(route.id) ?? [];
  const stats = statsMap.get(route.id);
  const author = route.owner_id ? profilesMap.get(route.owner_id) : null;
  const firstStopLoc = stops.length > 0 ? { lat: stops[0].venue.lat, lng: stops[0].venue.lng } : null;

  return {
    id: route.id,
    owner_id: route.owner_id,
    title: route.title,
    description: route.description,
    city_id: route.city_id,
    visibility: route.visibility,
    is_featured: !!route.is_featured,
    is_curated: !!route.is_curated,
    total_distance_m: route.total_distance_m,
    total_duration_s: route.total_duration_s,
    created_at: route.created_at,
    author_name: author || (route.is_curated ? 'Скочко Тим' : 'Корисник'),
    stops_count: stops.length,
    avg_stars: stats?.avg_stars ?? null,
    rating_count: stats?.rating_count ?? 0,
    completed_count: stats?.completed_count ?? 0,
    first_stop_location: firstStopLoc,
    stops,
  };
}

export async function fetchRouteRatings(routeId: string): Promise<RouteRatingItem[]> {
  if (process.env.NEXT_PUBLIC_USE_MOCK === '1') {
    return mockRatingsStore[routeId] ?? [];
  }

  const { data: ratings, error } = await supabase
    .from('route_ratings')
    .select('id, route_id, user_id, stars, comment, created_at')
    .eq('route_id', routeId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  if (!ratings || ratings.length === 0) return [];

  const userIds = [...new Set(ratings.map((r) => r.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', userIds);

  const profileMap = new Map<string, { display_name: string; avatar_url: string | null }>();
  for (const p of profiles ?? []) {
    profileMap.set(p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url });
  }

  return ratings.map((r) => {
    const prof = profileMap.get(r.user_id);
    return {
      id: r.id,
      route_id: r.route_id,
      user_id: r.user_id,
      stars: r.stars,
      comment: r.comment,
      created_at: r.created_at,
      user_display_name: prof?.display_name || 'Член',
      user_avatar_url: prof?.avatar_url ?? null,
    };
  });
}

// --- Hooks ---

export function useCommunityRoutes(sort: CommunitySort = 'topRated', origin?: LatLng) {
  const originKey = origin ? `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}` : 'none';
  return useQuery({
    queryKey: ['community-routes', sort, originKey],
    queryFn: () => fetchCommunityRoutes(sort, origin),
  });
}

export function useFeaturedRoutes() {
  return useQuery({
    queryKey: ['featured-routes'],
    queryFn: fetchFeaturedRoutes,
  });
}

export function useMyRoutes() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  return useQuery({
    queryKey: ['my-routes', userId],
    queryFn: () => fetchMyRoutes(userId),
    enabled: !!userId || process.env.NEXT_PUBLIC_USE_MOCK === '1',
  });
}

export function useRouteDetail(routeId: string) {
  return useQuery({
    queryKey: ['route-detail', routeId],
    queryFn: () => fetchRouteDetail(routeId),
    enabled: !!routeId,
  });
}

export function useRouteRatings(routeId: string) {
  return useQuery({
    queryKey: ['route-ratings', routeId],
    queryFn: () => fetchRouteRatings(routeId),
    enabled: !!routeId,
  });
}

// --- Mutations ---

export function useToggleRouteVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ routeId, visibility }: { routeId: string; visibility: 'public' | 'private' }) => {
      if (process.env.NEXT_PUBLIC_USE_MOCK === '1') {
        const item = mockRoutesStore.find((r) => r.id === routeId);
        if (item) item.visibility = visibility;
        return item;
      }
      const { data, error } = await supabase
        .from('routes')
        .update({ visibility })
        .eq('id', routeId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-routes'] });
      queryClient.invalidateQueries({ queryKey: ['featured-routes'] });
      queryClient.invalidateQueries({ queryKey: ['my-routes'] });
      queryClient.invalidateQueries({ queryKey: ['route-detail'] });
    },
  });
}

export function useDeleteRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (routeId: string) => {
      if (process.env.NEXT_PUBLIC_USE_MOCK === '1') {
        mockRoutesStore = mockRoutesStore.filter((r) => r.id !== routeId);
        return;
      }
      const { error } = await supabase.from('routes').delete().eq('id', routeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-routes'] });
      queryClient.invalidateQueries({ queryKey: ['featured-routes'] });
      queryClient.invalidateQueries({ queryKey: ['my-routes'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    },
  });
}

export function useDuplicateRoute() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({ routeId, copySuffix = '(Копија)' }: { routeId: string; copySuffix?: string }) => {
      if (process.env.NEXT_PUBLIC_USE_MOCK === '1') {
        const original = mockRoutesStore.find((r) => r.id === routeId);
        if (!original) throw new Error('Route not found');
        const cloned: CommunityRoute = {
          ...original,
          id: `mock-route-${Date.now()}`,
          owner_id: session?.user.id ?? 'current-user',
          title: `${original.title} ${copySuffix}`,
          visibility: 'private',
          is_featured: false,
          is_curated: false,
          created_at: new Date().toISOString(),
          author_name: 'Јас',
          stops: original.stops?.map((s, idx) => ({
            ...s,
            id: `mrs-cloned-${Date.now()}-${idx}`,
          })),
        };
        mockRoutesStore = [cloned, ...mockRoutesStore];
        return cloned;
      }

      if (!session) throw new Error('Must be signed in to duplicate a route');

      // 1. Fetch original route and its stops
      const { data: original, error: origError } = await supabase
        .from('routes')
        .select('*')
        .eq('id', routeId)
        .single();
      if (origError || !original) throw origError || new Error('Route not found');

      const { data: stops, error: stopsError } = await supabase
        .from('route_stops')
        .select('*')
        .eq('route_id', routeId)
        .order('position', { ascending: true });
      if (stopsError) throw stopsError;

      // 2. Insert new route
      const { data: newRoute, error: newRouteError } = await supabase
        .from('routes')
        .insert({
          owner_id: session.user.id,
          city_id: original.city_id,
          title: `${original.title} ${copySuffix}`,
          description: original.description,
          visibility: 'private',
          is_featured: false,
          is_curated: false,
          total_distance_m: original.total_distance_m,
          total_duration_s: original.total_duration_s,
        })
        .select()
        .single();
      if (newRouteError || !newRoute) throw newRouteError || new Error('Failed to create route');

      // 3. Insert stops
      if (stops && stops.length > 0) {
        const stopsToInsert = stops.map((s) => ({
          route_id: newRoute.id,
          venue_id: s.venue_id,
          position: s.position,
          planned_minutes: s.planned_minutes,
        }));
        const { error: insStopsError } = await supabase.from('route_stops').insert(stopsToInsert);
        if (insStopsError) throw insStopsError;
      }

      return newRoute;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-routes'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    },
  });
}

export function useRateRoute() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({
      routeId,
      stars,
      comment,
    }: {
      routeId: string;
      stars: number;
      comment?: string;
    }) => {
      const trimmedComment = comment?.trim() || null;

      if (process.env.NEXT_PUBLIC_USE_MOCK === '1') {
        const existing = mockRatingsStore[routeId] ?? [];
        const filtered = existing.filter((r) => r.user_id !== (session?.user.id ?? 'current-user'));
        const newRating: RouteRatingItem = {
          id: `mr-${Date.now()}`,
          route_id: routeId,
          user_id: session?.user.id ?? 'current-user',
          stars,
          comment: trimmedComment,
          created_at: new Date().toISOString(),
          user_display_name: 'Јас',
        };
        mockRatingsStore[routeId] = [newRating, ...filtered];

        // Update avg stars in mock
        const route = mockRoutesStore.find((r) => r.id === routeId);
        if (route) {
          const allStars = mockRatingsStore[routeId].map((r) => r.stars);
          route.rating_count = allStars.length;
          route.avg_stars = Number((allStars.reduce((a, b) => a + b, 0) / allStars.length).toFixed(1));
        }
        return newRating;
      }

      if (!session) throw new Error('Must be signed in to rate');

      const { data, error } = await supabase
        .from('route_ratings')
        .upsert(
          {
            route_id: routeId,
            user_id: session.user.id,
            stars,
            comment: trimmedComment,
          },
          { onConflict: 'route_id,user_id' },
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['route-ratings', variables.routeId] });
      queryClient.invalidateQueries({ queryKey: ['route-detail', variables.routeId] });
      queryClient.invalidateQueries({ queryKey: ['community-routes'] });
      queryClient.invalidateQueries({ queryKey: ['featured-routes'] });
    },
  });
}

export function useReportRoute() {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({ routeId, reason }: { routeId: string; reason: string }) => {
      if (process.env.NEXT_PUBLIC_USE_MOCK === '1') {
        return { success: true };
      }
      if (!session) throw new Error('Must be signed in to report');

      const { error } = await supabase.from('reports').insert({
        target_type: 'route',
        target_id: routeId,
        reporter_id: session.user.id,
        reason: reason.trim(),
      });
      if (error) throw error;
      return { success: true };
    },
  });
}
