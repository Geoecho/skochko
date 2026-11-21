import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import type { NearbyVenue } from '@/types/domain';
import { normalizeVenue } from './api';

const useGuestFavourites = create<{ venues: NearbyVenue[]; toggle: (venue: NearbyVenue) => void }>()(
  persist(set => ({
    venues: [],
    toggle: venue => set(state => ({
      venues: state.venues.some(item => item.id === venue.id)
        ? state.venues.filter(item => item.id !== venue.id)
        : [venue, ...state.venues],
    })),
  }), { name: 'skochko.favourite-venues' }),
);

export function useFavourites() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const guestVenues = useGuestFavourites(state => state.venues);
  const toggleGuest = useGuestFavourites(state => state.toggle);
  const client = useQueryClient();
  const key = ['favourite-venues', userId] as const;
  const query = useQuery({
    queryKey: key,
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('favourites').select('venues(*)').eq('user_id', userId!).order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(row => normalizeVenue(row.venues)).filter((venue): venue is NearbyVenue => venue !== null);
    },
  });
  const mutation = useMutation({
    mutationFn: async ({ venue, remove }: { venue: NearbyVenue; remove: boolean }) => {
      if (!userId) return;
      const { error } = remove
        ? await supabase.from('favourites').delete().eq('user_id', userId).eq('venue_id', venue.id)
        : await supabase.from('favourites').insert({ user_id: userId, venue_id: venue.id });
      if (error && error.code !== '23505') throw error;
    },
    onSuccess: (_, { venue, remove }) => {
      client.setQueryData<NearbyVenue[]>(key, (items = []) => remove
        ? items.filter(item => item.id !== venue.id)
        : [venue, ...items.filter(item => item.id !== venue.id)]);
    },
  });
  const venues = userId ? query.data ?? [] : guestVenues;
  return {
    venues,
    loading: !!userId && query.isPending,
    error: !!userId && query.isError,
    retry: query.refetch,
    saving: mutation.isPending,
    saveError: mutation.isError,
    toggle(venue: NearbyVenue) {
      if (!userId) toggleGuest(venue);
      else mutation.mutate({ venue, remove: venues.some(item => item.id === venue.id) });
    },
  };
}
