import { supabase } from '@/lib/supabase';
import type { OpeningHours } from '@/types/domain';
import type { AdminEvent, AdminPromotion, AdminReport, AdminRoute, AdminVenue, Coordinates, VenueDraft } from './types';

const pointPattern = /POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i;

type VenueRow = Omit<AdminVenue, 'coordinates' | 'hours' | 'price_level'> & { lat: number | null; lng: number | null; hours: unknown; price_level: number };
type EventRow = Omit<AdminEvent, 'venue_name'> & { venues: { name: string }[] | { name: string } | null };

export function parseCoordinates(value: unknown): Coordinates | null {
  if (typeof value === 'string') {
    const match = pointPattern.exec(value);
    if (match) return { lng: Number(match[1]), lat: Number(match[2]) };
  }
  if (value && typeof value === 'object') {
    const geometry = value as { coordinates?: unknown };
    if (Array.isArray(geometry.coordinates) && geometry.coordinates.length >= 2) {
      return { lng: Number(geometry.coordinates[0]), lat: Number(geometry.coordinates[1]) };
    }
  }
  return null;
}

export function toGeography({ lat, lng }: Coordinates) {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function fetchVenues(): Promise<AdminVenue[]> {
  const { data, error } = await supabase
    .from('venues')
    .select('id, city_id, name, slug, category, lat, lng, address, price_level, hours, photos, phone, instagram, website, status, created_at')
    .order('name');
  throwIfError(error);
  const rows: VenueRow[] = data ?? [];
  return rows.map(({ lat, lng, ...row }) => ({
    ...row,
    hours: (row.hours ?? {}) as OpeningHours,
    price_level: row.price_level as 1 | 2 | 3,
    coordinates: lat != null && lng != null ? { lat, lng } : null,
  }));
}

export async function fetchEvents(): Promise<AdminEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, venue_id, title_mk, title_en, starts_at, ends_at, cover_url, price, tags, status, created_at, venues(name)')
    .order('starts_at');
  throwIfError(error);
  const rows: EventRow[] = data ?? [];
  return rows.map((row) => ({ ...row, venue_name: Array.isArray(row.venues) ? row.venues[0]?.name ?? '—' : row.venues?.name ?? '—' }));
}

export async function fetchPromotions(): Promise<AdminPromotion[]> {
  const { data, error } = await supabase
    .from('promotions')
    .select('id, target_type, target_id, placement, starts_at, ends_at, status, created_at')
    .order('starts_at', { ascending: false });
  throwIfError(error);
  return data ?? [];
}

export async function fetchRoutes(): Promise<AdminRoute[]> {
  const { data, error } = await supabase
    .from('routes')
    .select('id, title, description, visibility, is_featured, status, created_at')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false });
  throwIfError(error);
  return data ?? [];
}

export async function fetchReports(): Promise<AdminReport[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('id, target_type, target_id, reporter_id, reason, created_at')
    .order('created_at', { ascending: false });
  throwIfError(error);
  return (data ?? []) as AdminReport[];
}

async function firstCityId() {
  const { data, error } = await supabase.from('cities').select('id').limit(1).maybeSingle();
  throwIfError(error);
  if (!data) throw new Error('Create a city before adding a venue.');
  return data.id;
}

export async function saveVenue(draft: VenueDraft, id?: string) {
  const payload = {
    name: draft.name.trim(),
    slug: draft.slug.trim(),
    category: draft.category,
    location: toGeography(draft.coordinates),
    address: draft.address.trim() || null,
    price_level: draft.priceLevel,
    hours: draft.hours as OpeningHours,
    phone: draft.phone.trim() || null,
    instagram: draft.instagram.trim().replace(/^@/, '') || null,
    website: draft.website.trim() || null,
    status: draft.status,
  };
  if (id) {
    const { data, error } = await supabase.from('venues').update(payload).eq('id', id).select('id').single();
    throwIfError(error);
    return { id: data!.id };
  }
  const city_id = await firstCityId();
  const { data, error } = await supabase.from('venues').insert({ ...payload, city_id }).select('id').single();
  throwIfError(error);
  return { id: data!.id };
}

export async function setVenuePhotos(venueId: string, photos: string[]) {
  const { error } = await supabase.from('venues').update({ photos }).eq('id', venueId);
  throwIfError(error);
}

export async function archiveVenue(id: string, archive: boolean) {
  const { error } = await supabase.from('venues').update({ status: archive ? 'archived' : 'active' }).eq('id', id);
  throwIfError(error);
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from('events').delete().eq('id', id);
  throwIfError(error);
}

export async function saveEvent(event: Omit<AdminEvent, 'id' | 'venue_name' | 'created_at'>, id?: string) {
  const payload = { ...event, price: event.price == null ? null : Number(event.price) };
  if (id) {
    const { data, error } = await supabase.from('events').update(payload).eq('id', id).select('id').single();
    throwIfError(error);
    return { id: data!.id };
  }
  const { data, error } = await supabase.from('events').insert(payload).select('id').single();
  throwIfError(error);
  return { id: data!.id };
}

export async function savePromotion(promotion: Omit<AdminPromotion, 'id' | 'created_at'>, id?: string) {
  if (id) {
    const { data, error } = await supabase.from('promotions').update(promotion).eq('id', id).select().single();
    throwIfError(error);
    return data as AdminPromotion;
  }
  const { data, error } = await supabase.from('promotions').insert(promotion).select().single();
  throwIfError(error);
  return data as AdminPromotion;
}

export async function updateRoute(id: string, update: Pick<AdminRoute, 'is_featured' | 'status'>) {
  const { error } = await supabase.from('routes').update(update).eq('id', id);
  throwIfError(error);
}

export async function resolveReport(id: string) {
  const { error } = await supabase.from('reports').delete().eq('id', id);
  throwIfError(error);
}

function pathFromPublicUrl(bucket: 'venue-photos' | 'event-covers', url: string) {
  const segment = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(segment);
  return index >= 0 ? decodeURIComponent(url.slice(index + segment.length)) : null;
}

export async function removePublicFile(bucket: 'venue-photos' | 'event-covers', url: string) {
  const path = pathFromPublicUrl(bucket, url);
  if (!path) return;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  throwIfError(error);
}

export async function uploadPublicFile(bucket: 'venue-photos' | 'event-covers', ownerId: string, file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${ownerId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type || 'image/jpeg' });
  throwIfError(error);
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
