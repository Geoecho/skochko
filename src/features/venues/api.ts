import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { LatLng, NearbyVenue, OpeningHours } from '@/types/domain';
import type { VenueCategory } from '@/theme/tokens';

export type VenueFilters = {
  categories?: VenueCategory[];
  openNow?: boolean;
  radiusM?: number;
};

const MOCK_HOURS: OpeningHours = {
  mon: [['08:00', '01:00']],
  tue: [['08:00', '01:00']],
  wed: [['08:00', '01:00']],
  thu: [['08:00', '02:00']],
  fri: [['08:00', '03:00']],
  sat: [['09:00', '03:00']],
  sun: [['09:00', '00:00']],
};

export const MOCK_VENUES: NearbyVenue[] = [
  {
    id: 'mock-venue-1',
    name: 'Стар Град',
    slug: 'star-grad',
    category: 'bar',
    lat: 41.9982,
    lng: 21.4255,
    address: 'Орце Николов 16',
    price_level: 2,
    hours: MOCK_HOURS,
    photos: ['https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=80'],
    distance_m: 0,
    is_open_now: true,
    is_promoted: true,
    tonight_event_id: 'mock-event-1',
    tonight_event_title_mk: 'Диџеј сет: После полноќ',
    tonight_event_title_en: 'DJ set: After Midnight',
    avg_rating: 4.8,
    rating_count: 126,
  },
  {
    id: 'mock-venue-2',
    name: 'Котур',
    slug: 'kotur',
    category: 'cafe',
    lat: 41.9969,
    lng: 21.4287,
    address: 'Никола Вапцаров 8',
    price_level: 2,
    hours: MOCK_HOURS,
    photos: ['https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80'],
    distance_m: 0,
    is_open_now: true,
    is_promoted: false,
    tonight_event_id: 'mock-event-2',
    tonight_event_title_mk: 'Џез трио во живо',
    tonight_event_title_en: 'Live jazz trio',
    avg_rating: 4.6,
    rating_count: 89,
  },
  {
    id: 'mock-venue-3',
    name: 'Пивница Стар Град',
    slug: 'pivnica-star-grad',
    category: 'pub',
    lat: 42.0001,
    lng: 21.4268,
    address: 'Боемска 12',
    price_level: 2,
    hours: MOCK_HOURS,
    photos: null,
    distance_m: 0,
    is_open_now: true,
    is_promoted: false,
    tonight_event_id: null,
    tonight_event_title_mk: null,
    tonight_event_title_en: null,
    avg_rating: 4.5,
    rating_count: 203,
  },
  {
    id: 'mock-venue-4',
    name: 'Епицентар',
    slug: 'epicentar',
    category: 'club',
    lat: 41.9928,
    lng: 21.4305,
    address: 'Македонија 24',
    price_level: 3,
    hours: MOCK_HOURS,
    photos: ['https://images.unsplash.com/photo-1566737236500-c8ac43014a8e?auto=format&fit=crop&w=1200&q=80'],
    distance_m: 0,
    is_open_now: false,
    is_promoted: false,
    tonight_event_id: 'mock-event-3',
    tonight_event_title_mk: 'Ноќна смена',
    tonight_event_title_en: 'Night Shift',
    avg_rating: 4.3,
    rating_count: 74,
  },
  {
    id: 'mock-venue-5',
    name: 'Ракија Бар Калдрма',
    slug: 'rakija-bar-kaldrma',
    category: 'rakija_bar',
    lat: 42.001,
    lng: 21.436,
    address: 'Стара чаршија',
    price_level: 1,
    hours: MOCK_HOURS,
    photos: null,
    distance_m: 0,
    is_open_now: true,
    is_promoted: false,
    tonight_event_id: null,
    tonight_event_title_mk: null,
    tonight_event_title_en: null,
    avg_rating: 4.7,
    rating_count: 51,
  },
  {
    id: 'mock-venue-6',
    name: 'Винотек',
    slug: 'vinotek',
    category: 'wine_bar',
    lat: 41.9945,
    lng: 21.4218,
    address: 'Ленинова 32',
    price_level: 3,
    hours: MOCK_HOURS,
    photos: null,
    distance_m: 0,
    is_open_now: true,
    is_promoted: false,
    tonight_event_id: null,
    tonight_event_title_mk: null,
    tonight_event_title_en: null,
    avg_rating: 4.4,
    rating_count: 38,
  },
];

export function distanceMeters(from: LatLng, to: LatLng): number {
  const earthRadius = 6_371_000;
  const radians = Math.PI / 180;
  const lat1 = from.lat * radians;
  const lat2 = to.lat * radians;
  const deltaLat = (to.lat - from.lat) * radians;
  const deltaLng = (to.lng - from.lng) * radians;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function coordinatesFromLocation(value: unknown): LatLng | null {
  if (value && typeof value === 'object' && 'coordinates' in value) {
    const coordinates = (value as { coordinates?: unknown }).coordinates;
    if (
      Array.isArray(coordinates) &&
      coordinates.length >= 2 &&
      typeof coordinates[0] === 'number' &&
      typeof coordinates[1] === 'number'
    ) {
      return { lng: coordinates[0], lat: coordinates[1] };
    }
  }

  if (typeof value === 'string') {
    const match = value.match(/POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/i);
    if (match) return { lng: Number(match[1]), lat: Number(match[2]) };
  }

  return null;
}

export function normalizeVenue(value: unknown): NearbyVenue | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const point =
    typeof row.lat === 'number' && typeof row.lng === 'number'
      ? { lat: row.lat, lng: row.lng }
      : coordinatesFromLocation(row.location);
  if (!point || typeof row.id !== 'string' || typeof row.name !== 'string' || typeof row.slug !== 'string') return null;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category as VenueCategory,
    lat: point.lat,
    lng: point.lng,
    address: typeof row.address === 'string' ? row.address : null,
    price_level: row.price_level == null ? null : (Number(row.price_level) as 1 | 2 | 3),
    hours: row.hours && typeof row.hours === 'object' ? (row.hours as OpeningHours) : null,
    photos: Array.isArray(row.photos) ? row.photos.filter((photo): photo is string => typeof photo === 'string') : null,
    distance_m: Number(row.distance_m) || 0,
    is_open_now: row.is_open_now === true,
    is_promoted: row.is_promoted === true,
    tonight_event_id: typeof row.tonight_event_id === 'string' ? row.tonight_event_id : null,
    tonight_event_title_mk: typeof row.tonight_event_title_mk === 'string' ? row.tonight_event_title_mk : null,
    tonight_event_title_en: typeof row.tonight_event_title_en === 'string' ? row.tonight_event_title_en : null,
    avg_rating: row.avg_rating == null ? null : Number(row.avg_rating),
    rating_count: Number(row.rating_count) || 0,
  };
}

async function fetchNearbyVenues(origin: LatLng, filters: VenueFilters): Promise<NearbyVenue[]> {
  if (process.env.NEXT_PUBLIC_USE_MOCK === '1') {
    return MOCK_VENUES.map((venue) => ({
      ...venue,
      distance_m: Math.round(distanceMeters(origin, venue)),
    }))
      .filter((venue) => !filters.openNow || venue.is_open_now)
      .filter((venue) => !filters.categories?.length || filters.categories.includes(venue.category))
      .filter((venue) => venue.distance_m <= (filters.radiusM ?? 3000))
      .sort((a, b) => Number(b.is_promoted) - Number(a.is_promoted) || a.distance_m - b.distance_m);
  }

  const { data, error } = await supabase.rpc('venues_nearby', {
    origin_lat: origin.lat,
    origin_lng: origin.lng,
    radius_m: filters.radiusM ?? 3000,
    categories: filters.categories?.length ? filters.categories : undefined,
    open_now: filters.openNow ?? false,
  });
  if (error) throw error;
  return ((data ?? []) as unknown[]).map(normalizeVenue).filter((venue): venue is NearbyVenue => venue !== null);
}

export function useNearbyVenues(origin: LatLng, filters: VenueFilters = {}) {
  const categoryKey = [...(filters.categories ?? [])].sort().join(',');
  return useQuery({
    queryKey: [
      'venues-nearby',
      origin.lat.toFixed(5),
      origin.lng.toFixed(5),
      filters.radiusM ?? 3000,
      filters.openNow ?? false,
      categoryKey,
    ],
    queryFn: () => fetchNearbyVenues(origin, filters),
  });
}
