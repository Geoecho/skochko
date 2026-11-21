import type { OpeningHours } from '@/types/domain';
import type { VenueCategory } from '@/theme/tokens';

export type Coordinates = { lat: number; lng: number };
export type ContentStatus = 'active' | 'archived' | 'hidden';
export type PromoPlacement = 'map' | 'list' | 'both';

export type AdminVenue = {
  id: string;
  city_id: string;
  name: string;
  slug: string;
  category: VenueCategory;
  location?: unknown;
  coordinates: Coordinates | null;
  address: string | null;
  price_level: 1 | 2 | 3;
  hours: OpeningHours;
  photos: string[];
  phone: string | null;
  instagram: string | null;
  website: string | null;
  status: ContentStatus;
  created_at: string;
};

export type VenueDraft = {
  name: string;
  slug: string;
  category: VenueCategory;
  coordinates: Coordinates;
  address: string;
  priceLevel: 1 | 2 | 3;
  hours: OpeningHours;
  phone: string;
  instagram: string;
  website: string;
  status: ContentStatus;
};

export type AdminEvent = {
  id: string;
  venue_id: string;
  venue_name: string;
  title_mk: string;
  title_en: string;
  starts_at: string;
  ends_at: string;
  cover_url: string | null;
  price: number | null;
  tags: string[];
  status: ContentStatus;
  created_at: string;
};

export type AdminPromotion = {
  id: string;
  target_type: 'venue' | 'event';
  target_id: string;
  placement: PromoPlacement;
  starts_at: string;
  ends_at: string;
  status: ContentStatus;
  created_at: string;
};

export type AdminRoute = {
  id: string;
  title: string;
  description: string | null;
  visibility: 'public' | 'private';
  is_featured: boolean;
  status: ContentStatus;
  created_at: string;
};

export type AdminReport = {
  id: string;
  target_type: 'venue' | 'event' | 'route' | 'route_rating' | 'venue_rating';
  target_id: string;
  reporter_id: string;
  reason: string;
  created_at: string;
};
