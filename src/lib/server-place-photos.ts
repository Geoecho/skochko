import 'server-only';
import { createClient } from '@supabase/supabase-js';

export type PlacePhoto = { name: string; authorAttributions?: { displayName?: string; uri?: string }[] };
export async function getPlacePhotos(id: string): Promise<{ photos: PlacePhoto[]; url: string | null } | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key || !url || !anon) throw new Error('Photos unavailable');
  const db = createClient(url, anon, { auth: { persistSession: false } });
  const { data } = await db.from('venues').select('external_id').eq('id', id).eq('status', 'active').maybeSingle();
  const placeId = data?.external_id?.startsWith('google-places:') ? data.external_id.slice(14) : null;
  if (!placeId) return null;
  const response = await fetch('https://places.googleapis.com/v1/places/' + encodeURIComponent(placeId), {
    headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'photos,googleMapsUri' },
    next: { revalidate: 3600 }, signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error('Photos unavailable');
  const details = await response.json();
  return {
    photos: (Array.isArray(details.photos) ? details.photos : []).filter((p: PlacePhoto) =>
      typeof p.name === 'string' && p.name.startsWith('places/' + placeId + '/photos/')).slice(0, 3),
    url: typeof details.googleMapsUri === 'string' ? details.googleMapsUri : null,
  };
}
export const validVenueId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
