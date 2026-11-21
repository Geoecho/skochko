// Shared domain types. Mirror supabase/migrations. Keep in sync when schema changes.
import type { VenueCategory } from '@/theme/tokens';

export type LatLng = { lat: number; lng: number };

export type OpeningHours = Partial<
  Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', [string, string][]>
>;

// Row returned by RPC venues_nearby
export type NearbyVenue = {
  id: string;
  name: string;
  slug: string;
  category: VenueCategory;
  lat: number;
  lng: number;
  address: string | null;
  price_level: 1 | 2 | 3 | null;
  hours: OpeningHours | null;
  photos: string[] | null;
  distance_m: number;
  is_open_now: boolean;
  is_promoted: boolean;
  tonight_event_id: string | null;
  tonight_event_title_mk: string | null;
  tonight_event_title_en: string | null;
  avg_rating: number | null;
  rating_count: number;
};

export type TonightEvent = {
  id: string;
  venue_id: string;
  venue_name: string;
  title_mk: string;
  title_en: string | null;
  starts_at: string;
  ends_at: string | null;
  cover_url: string | null;
  price: number | null;
  tags: string[] | null;
  lat: number;
  lng: number;
  is_promoted: boolean;
};

export type RouteStop = { venue: Pick<NearbyVenue, 'id' | 'name' | 'category' | 'lat' | 'lng'>; plannedMinutes: number };
