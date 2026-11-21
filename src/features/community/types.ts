import type { VenueCategory } from '@/theme/tokens';
import type { LatLng } from '@/types/domain';

export type RouteStopVenue = {
  id: string;
  name: string;
  slug?: string;
  category: VenueCategory;
  lat: number;
  lng: number;
  address: string | null;
  photos?: string[] | null;
};

export type RouteStopDetail = {
  id: string;
  position: number;
  planned_minutes: number;
  venue: RouteStopVenue;
};

export type CommunityRoute = {
  id: string;
  owner_id: string | null;
  title: string;
  description: string | null;
  city_id: string;
  visibility: 'public' | 'private';
  is_featured: boolean;
  is_curated: boolean;
  total_distance_m: number | null;
  total_duration_s: number | null;
  created_at: string;
  author_name: string;
  stops_count: number;
  avg_stars: number | null;
  rating_count: number;
  completed_count: number;
  first_stop_location?: LatLng | null;
  stops?: RouteStopDetail[];
};

export type RouteRatingItem = {
  id: string;
  route_id: string;
  user_id: string;
  stars: number;
  comment: string | null;
  created_at: string;
  user_display_name?: string;
  user_avatar_url?: string | null;
};

export type CommunitySort = 'topRated' | 'trending' | 'nearMe';
