import type { NearbyVenue } from '@/types/domain';

export function getFeaturedVenues(venues: NearbyVenue[]): NearbyVenue[] {
  return [...venues].sort((a, b) =>
    Number(b.is_promoted) - Number(a.is_promoted)
    || Number(Boolean(b.tonight_event_id)) - Number(Boolean(a.tonight_event_id))
    || Number(b.is_open_now) - Number(a.is_open_now)
    || b.rating_count - a.rating_count
    || a.distance_m - b.distance_m,
  ).slice(0, 4);
}
