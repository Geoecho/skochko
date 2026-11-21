// Walking directions along real streets (OSRM foot profile, FOSSGIS public server: routing.openstreetmap.de).
// Free, no key; fair-use, so results are cached and requests are debounced by callers.
// Falls back to straight segments if the service is unreachable, so the UI never breaks.
import { useQuery } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import type { LatLng } from '@/types/domain';
import { haversineDistance, STREET_FACTOR, WALKING_METERS_PER_MINUTE } from './optimize';

const BASE = 'https://routing.openstreetmap.de/routed-foot/route/v1/driving';

export type Maneuver = {
  type: string; // turn, depart, arrive, roundabout, ...
  modifier?: string; // left, right, slight left, straight, uturn ...
  name: string; // street name ('' if unnamed)
  distance: number; // metres of this step
  location: [number, number]; // [lng, lat] where the maneuver happens
};

export type Directions = {
  coordinates: [number, number][]; // [lng, lat]
  distance: number; // metres
  duration: number; // seconds (our walking speed, not OSRM's)
  legs: { distance: number; steps: Maneuver[] }[];
  approximate: boolean; // true when using the straight-line fallback
};

function straight(points: LatLng[]): Directions {
  const legs = points.slice(1).map((p, i) => {
    const d = haversineDistance(points[i], p) * STREET_FACTOR;
    return { distance: d, steps: [] as Maneuver[] };
  });
  const distance = legs.reduce((a, l) => a + l.distance, 0);
  return {
    coordinates: points.map((p) => [p.lng, p.lat]),
    distance,
    duration: (distance / WALKING_METERS_PER_MINUTE) * 60,
    legs,
    approximate: true,
  };
}

const memo = new Map<string, Directions>();
const keyOf = (points: LatLng[]) => points.map((p) => `${p.lng.toFixed(5)},${p.lat.toFixed(5)}`).join(';');

export async function fetchDirections(points: LatLng[], signal?: AbortSignal): Promise<Directions> {
  if (points.length < 2) return straight(points);
  const key = keyOf(points);
  const hit = memo.get(key);
  if (hit) return hit;
  const request = new AbortController();
  const cancel = () => request.abort();
  if (signal?.aborted) cancel();
  else signal?.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(cancel, 8000);
  try {
    const res = await fetch(`${BASE}/${key}?overview=full&geometries=geojson&steps=true`, { signal: request.signal });
    if (!res.ok) throw new Error(`routing ${res.status}`);
    const json = await res.json();
    const route = json.routes?.[0];
    if (json.code !== 'Ok' || !route || !Array.isArray(route.geometry?.coordinates) || route.geometry.coordinates.length < 2) {
      throw new Error(json.code ?? 'no route');
    }
    const out: Directions = {
      coordinates: route.geometry.coordinates,
      distance: route.distance,
      duration: (route.distance / WALKING_METERS_PER_MINUTE) * 60,
      legs: route.legs.map((leg: { distance: number; steps: { maneuver: { type: string; modifier?: string; location: [number, number] }; name: string; distance: number }[] }) => ({
        distance: leg.distance,
        steps: leg.steps.map((s) => ({ type: s.maneuver.type, modifier: s.maneuver.modifier, name: s.name, distance: s.distance, location: s.maneuver.location })),
      })),
      approximate: false,
    };
    memo.set(key, out);
    return out;
  } catch (e) {
    if (signal?.aborted) throw e;
    return straight(points);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
}

/** Directions through `points` in order. Coordinates are rounded so tiny GPS jitter reuses the cache. */
export function useDirections(points: LatLng[] | null) {
  const key = points && points.length >= 2 ? keyOf(points) : null;
  return useQuery<Directions>({
    queryKey: ['directions', key],
    enabled: !!key,
    staleTime: query => query.state.data?.approximate ? 15_000 : Infinity,
    refetchInterval: query => query.state.data?.approximate ? 30_000 : false,
    gcTime: 30 * 60_000,
    retry: false,
    queryFn: ({ signal }) => fetchDirections(points!, signal),
  });
}

/** Human instruction for a maneuver, in the current language. */
export function instructionText(m: Maneuver, t: TFunction): string {
  const street = m.name ? t('nav.onto', { name: m.name }) : '';
  if (m.type === 'arrive') return t('nav.arrive');
  if (m.type === 'depart') return t('nav.depart') + street;
  if (m.type === 'roundabout' || m.type === 'rotary') return t('nav.roundabout') + street;
  const mod = (m.modifier ?? 'straight').replace(' ', '_');
  return t(`nav.${mod}`, { defaultValue: t('nav.straight') }) + street;
}
