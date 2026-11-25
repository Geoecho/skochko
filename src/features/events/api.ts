import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { TonightEvent } from '@/types/domain';
import { MOCK_VENUES } from '@/features/venues/api';

function mockStart(hour: number, minutes = 0): string {
  const now = new Date();
  const night = new Date(now);
  if (now.getHours() < 6) night.setDate(night.getDate() - 1);
  night.setHours(hour, minutes, 0, 0);
  return night.toISOString();
}

function mockEnd(hour: number, minutes = 0): string {
  const end = new Date(mockStart(18));
  end.setDate(end.getDate() + 1);
  end.setHours(hour, minutes, 0, 0);
  return end.toISOString();
}

function mockEvents(): TonightEvent[] {
  return [
    {
      id: 'mock-event-1',
      venue_id: 'mock-venue-1',
      venue_name: MOCK_VENUES[0].name,
      title_mk: 'Диџеј сет: После полноќ',
      title_en: 'DJ set: After Midnight',
      starts_at: mockStart(22),
      ends_at: mockEnd(2),
      cover_url: 'https://images.unsplash.com/photo-1571266028243-d220c9c3b2d2?auto=format&fit=crop&w=1200&q=80',
      price: 300,
      tags: ['dj', 'electronic'],
      lat: MOCK_VENUES[0].lat,
      lng: MOCK_VENUES[0].lng,
      is_promoted: true,
    },
    {
      id: 'mock-event-2',
      venue_id: 'mock-venue-2',
      venue_name: MOCK_VENUES[1].name,
      title_mk: 'Џез трио во живо',
      title_en: 'Live jazz trio',
      starts_at: mockStart(20, 30),
      ends_at: mockStart(23, 30),
      cover_url: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?auto=format&fit=crop&w=1200&q=80',
      price: null,
      tags: ['jazz', 'live'],
      lat: MOCK_VENUES[1].lat,
      lng: MOCK_VENUES[1].lng,
      is_promoted: false,
    },
    {
      id: 'mock-event-3',
      venue_id: 'mock-venue-4',
      venue_name: MOCK_VENUES[3].name,
      title_mk: 'Ноќна смена',
      title_en: 'Night Shift',
      starts_at: mockStart(23, 30),
      ends_at: mockEnd(5),
      cover_url: null,
      price: 500,
      tags: ['house'],
      lat: MOCK_VENUES[3].lat,
      lng: MOCK_VENUES[3].lng,
      is_promoted: false,
    },
  ];
}

async function fetchTonightEvents(): Promise<TonightEvent[]> {
  if (process.env.NEXT_PUBLIC_USE_MOCK === '1') return mockEvents();

  const { data: city, error: cityError } = await supabase
    .from('cities')
    .select('id')
    .eq('name_en', 'Skopje')
    .limit(1)
    .maybeSingle();
  if (cityError) throw cityError;
  if (!city?.id) throw new Error('Skopje city row is missing');

  // events_tonight already joins venue name/coords and promotion flag (migration 0002).
  const { data: rows, error: eventsError } = await supabase.rpc('events_tonight', { city: city.id });
  if (eventsError) throw eventsError;

  return ((rows ?? []) as Record<string, unknown>[]).map(
    (row) =>
      ({
        id: String(row.id),
        venue_id: String(row.venue_id),
        venue_name: String(row.venue_name),
        title_mk: String(row.title_mk),
        title_en: typeof row.title_en === 'string' ? row.title_en : null,
        starts_at: String(row.starts_at),
        ends_at: typeof row.ends_at === 'string' ? row.ends_at : null,
        cover_url: typeof row.cover_url === 'string' ? row.cover_url : null,
        price: row.price == null ? null : Number(row.price),
        tags: Array.isArray(row.tags) ? row.tags.filter((tag): tag is string => typeof tag === 'string') : null,
        lat: Number(row.lat),
        lng: Number(row.lng),
        is_promoted: row.is_promoted === true,
      }) satisfies TonightEvent,
  );
}

export function useLiveEventBanners() {
  return useQuery({
    queryKey: ['live-event-banners'],
    queryFn: async () => {
      const now = new Date().toISOString();
      if (process.env.NEXT_PUBLIC_USE_MOCK === '1') {
        return mockEvents().filter(event => event.starts_at <= now && event.ends_at && event.ends_at > now);
      }
      const { data, error } = await supabase.from('events')
        .select('id, venue_id, title_en, title_mk, starts_at, ends_at, cover_url')
        .eq('status', 'active')
        .lte('starts_at', now)
        .gt('ends_at', now)
        .order('ends_at')
        .limit(12);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30_000,
  });
}

export function useTonightEvents() {
  return useQuery({
    queryKey: ['events-tonight', new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Skopje' })],
    queryFn: fetchTonightEvents,
  });
}
