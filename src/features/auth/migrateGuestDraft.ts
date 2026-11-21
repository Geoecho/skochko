import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@/lib/browser-storage';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouteBuilder } from '@/state/routeBuilder';
import i18n from '@/i18n';

const decisionKey = (userId: string) => `skochko.guest-draft-migration:${userId}`;

export function useGuestDraftMigration(session: Session | null) {
  const stops = useRouteBuilder((state) => state.stops);
  const clear = useRouteBuilder((state) => state.clear);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const inspectedUser = useRef<string | null>(null);

  useEffect(() => {
    if (!session || stops.length < 2 || inspectedUser.current === session.user.id) return;
    inspectedUser.current = session.user.id;

    AsyncStorage.getItem(decisionKey(session.user.id)).then((decision) => {
      if (!decision) setVisible(true);
    });
  }, [session, stops.length]);

  const finish = async () => {
    if (!session) return;
    await AsyncStorage.setItem(decisionKey(session.user.id), 'handled');
    setVisible(false);
  };

  const save = async () => {
    if (!session) return;
    setSaving(true);
    setError(false);

    const { data: city, error: cityError } = await supabase.from('cities').select('id').limit(1).single();
    if (cityError || !city) {
      setError(true);
      setSaving(false);
      return;
    }

    const { data: route, error: routeError } = await supabase
      .from('routes')
      .insert({
        owner_id: session.user.id,
        city_id: city.id,
        title: i18n.t('route.defaultTitle'),
        visibility: 'private',
      })
      .select('id')
      .single();

    if (routeError || !route) {
      setError(true);
      setSaving(false);
      return;
    }

    const { error: stopsError } = await supabase.from('route_stops').insert(
      stops.map((stop, position) => ({
        route_id: route.id,
        venue_id: stop.venue.id,
        position,
        planned_minutes: stop.plannedMinutes,
      })),
    );

    if (stopsError) {
      await supabase.from('routes').delete().eq('id', route.id);
      setError(true);
      setSaving(false);
      return;
    }

    clear();
    await finish();
    setSaving(false);
  };

  return { visible, saving, error, save, dismiss: finish };
}


