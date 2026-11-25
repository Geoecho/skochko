import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Json } from '@/lib/database.types';

function object(value: Json | undefined) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function positiveNumber(value: Json | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function httpsUrl(value: Json | undefined) {
  return typeof value === 'string' && /^https:\/\//i.test(value) ? value : null;
}

export function useGoogleVenueDetails(venueId: string, venueName: string) {
  return useQuery({
    queryKey: ['google-venue-details', venueId, venueName],
    enabled: process.env.NEXT_PUBLIC_USE_MOCK !== '1',
    staleTime: 30 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.from('venues').select('google_details, external_id').eq('id', venueId).maybeSingle();
      if (error) throw error;
      const details = object(data?.google_details);
      const externalId = data?.external_id;
      const googlePlaceId = externalId?.startsWith('google-places:') ? externalId.slice('google-places:'.length) : null;
      if (!details && !googlePlaceId) return null;
      const fallbackUrl = googlePlaceId ? `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query: venueName, query_place_id: googlePlaceId })}` : null;
      const reviews = Array.isArray(details?.reviews) ? details.reviews.flatMap((value) => {
        const review = object(value);
        if (!review || typeof review.id !== 'string' || typeof review.author !== 'string' || typeof review.text !== 'string') return [];
        return [{ id: review.id, author: review.author, text: review.text, rating: positiveNumber(review.rating), url: httpsUrl(review.url) }];
      }) : [];
      return { rating: positiveNumber(details?.rating), count: positiveNumber(details?.count), url: httpsUrl(details?.url) ?? fallbackUrl, reviews };
    },
  });
}
