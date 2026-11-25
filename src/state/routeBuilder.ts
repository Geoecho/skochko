import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@/lib/browser-storage';
import type { RouteStop } from '@/types/domain';

export const MAX_STOPS = 8;
export const DEFAULT_MINUTES = 45;
export const MIN_MINUTES = 15;
export const MAX_MINUTES = 120;
export const STEP_MINUTES = 15;

export function routeDraftSignature(stops: RouteStop[]) {
  return JSON.stringify(stops.map(({ venue, plannedMinutes }) => [venue.id, plannedMinutes]));
}

type SavedDraft = { ownerId: string; signature: string; isPublic: boolean };

type RouteBuilderState = {
  stops: RouteStop[];
  savedRouteId: string | null;
  savedRouteTitle: string | null;
  savedDraft: SavedDraft | null;
  add: (venue: RouteStop['venue']) => void;
  remove: (venueId: string) => void;
  move: (from: number, to: number) => void;
  updateMinutes: (venueId: string, minutes: number) => void;
  setStops: (stops: RouteStop[]) => void;
  setSavedRoute: (id: string | null, title?: string | null, draft?: SavedDraft | null) => void;
  clear: () => void;
  has: (venueId: string) => boolean;
};

// Guest route lives on device. On sign-up it's saved to the account.
export const useRouteBuilder = create<RouteBuilderState>()(
  persist(
    (set, get) => ({
      stops: [],
      savedRouteId: null,
      savedRouteTitle: null,
      savedDraft: null,
      add: (venue) =>
        set((s) =>
          s.stops.length >= MAX_STOPS || s.stops.some((x) => x.venue.id === venue.id)
            ? s
            : { stops: [...s.stops, { venue, plannedMinutes: DEFAULT_MINUTES }] },
        ),
      remove: (id) =>
        set((s) => ({
          stops: s.stops.filter((x) => x.venue.id !== id),
        })),
      move: (from, to) =>
        set((s) => {
          if (from === to || from < 0 || to < 0 || from >= s.stops.length || to >= s.stops.length) {
            return s;
          }
          const next = [...s.stops];
          const [item] = next.splice(from, 1);
          next.splice(to, 0, item);
          return { stops: next };
        }),
      updateMinutes: (id, minutes) =>
        set((s) => ({
          stops: s.stops.map((stop) =>
            stop.venue.id === id
              ? {
                  ...stop,
                  plannedMinutes: Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, minutes)),
                }
              : stop,
          ),
        })),
      setStops: (stops) => set({ stops: stops.slice(0, MAX_STOPS) }),
      setSavedRoute: (id, title, draft) => set({ savedRouteId: id, savedRouteTitle: title ?? null, savedDraft: draft ?? null }),
      clear: () => set({ stops: [], savedRouteId: null, savedRouteTitle: null, savedDraft: null }),
      has: (id) => get().stops.some((x) => x.venue.id === id),
    }),
    {
      name: 'skochko.route-draft',
      // AsyncStorage is backed by localStorage on web.
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
