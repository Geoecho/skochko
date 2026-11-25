import { useCallback, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Glass, Text } from '@/ui';
import { colors, radius, space, touch } from '@/theme/tokens';
import {
  MAX_MINUTES,
  MAX_STOPS,
  MIN_MINUTES,
  STEP_MINUTES,
  routeDraftSignature,
  useRouteBuilder,
} from '@/state/routeBuilder';
import { calculateRouteTotals, optimizeStops } from './optimize';
import type { LatLng, RouteStop } from '@/types/domain';
import { useRequireAuth } from '@/features/auth/SignInSheet';
import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/lib/supabase';

type Props = {
  onClose: () => void;
  onAddStops: () => void;
  userLocation?: LatLng | null;
};

export function RouteBuilder({ onClose, onAddStops, userLocation }: Props) {
  const { t } = useTranslation();
  const { requireAuth } = useRequireAuth();
  const { session } = useAuth();


  const stops = useRouteBuilder((state) => state.stops);
  const remove = useRouteBuilder((state) => state.remove);
  const move = useRouteBuilder((state) => state.move);
  const updateMinutes = useRouteBuilder((state) => state.updateMinutes);
  const setStops = useRouteBuilder((state) => state.setStops);
  const clear = useRouteBuilder((state) => state.clear);
  const savedDraft = useRouteBuilder((state) => state.savedDraft);
  const savedRouteTitle = useRouteBuilder((state) => state.savedRouteTitle);
  const setSavedRoute = useRouteBuilder((state) => state.setSavedRoute);

  const [title, setTitle] = useState(savedRouteTitle || t('route.defaultTitle'));
  const [isPublic, setIsPublic] = useState(savedDraft?.isPublic ?? false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const signature = routeDraftSignature(stops);
  const cleanTitle = title.trim() || t('route.defaultTitle');
  const saveSuccess = !!session && savedDraft?.ownerId === session.user.id && savedDraft.signature === signature && savedDraft.isPublic === isPublic && savedRouteTitle === cleanTitle;
  const [saveError, setSaveError] = useState<string | null>(null);
  const [optimizedNotice, setOptimizedNotice] = useState(false);

  const totals = calculateRouteTotals(stops);

  const handleOptimize = useCallback(() => {
    if (stops.length < 2) return;
    const optimized = optimizeStops(stops, userLocation);
    setStops(optimized);
    setOptimizedNotice(true);
    setTimeout(() => setOptimizedNotice(false), 3000);
  }, [stops, userLocation, setStops]);

  const handleSave = () => {
    if (savingRef.current || !stops.length || saveSuccess) return;
    requireAuth('save', async () => {
      if (savingRef.current) return;
      savingRef.current = true;
      setSaving(true);
      setSaveError(null);

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) throw new Error(t('auth.signInError'));
        const draft = { ownerId: session.user.id, signature, isPublic };
        if (process.env.NEXT_PUBLIC_USE_MOCK === '1') {
          setSavedRoute(`mock-route-${Date.now()}`, cleanTitle, draft);
          return;
        }

        const { data: city, error: cityError } = await supabase.from('cities').select('id').order('id').limit(1).single();
        if (cityError) throw cityError;

        const { data: route, error: routeError } = await supabase.from('routes').insert({
          owner_id: session.user.id,
          city_id: city.id,
          title: cleanTitle,
          visibility: isPublic ? 'public' : 'private',
          total_distance_m: totals.walkDistanceMeters,
          total_duration_s: totals.totalDurationMinutes * 60,
        }).select('id').single();
        if (routeError) throw routeError;

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
          throw stopsError;
        }
        setSavedRoute(route.id, cleanTitle, draft);
      } catch (err) {
        setSaveError(err && typeof err === 'object' && 'message' in err ? String(err.message) : t('auth.signInError'));
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    });
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${meters} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
  };

  if (stops.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.header}>
          <Text variant="headline" weight="bold">
            {t('route.builderTitle')}
          </Text>
          <Pressable
            accessibilityLabel={t('common.close')}
            accessibilityRole="button"
            hitSlop={12}
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
        </View>
        <View style={styles.emptyBody}>
          <Text variant="title" weight="bold" style={styles.emptyGlyph}>
            ↝
          </Text>
          <Text variant="headline" weight="semibold">
            {t('route.emptyTitle', 'No stops selected')}
          </Text>
          <Text tone="secondary" style={styles.emptyText}>
            {t('route.emptySubtitle', 'Select venues from the map to build your crawl')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text variant="headline" weight="bold">
            {t('route.builderTitle')}
          </Text>
          <Text tone="secondary" variant="caption">
            {t('route.stopsCount', { count: stops.length })} · max {MAX_STOPS}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={t('common.close')}
          accessibilityRole="button"
          hitSlop={12}
          onPress={onClose}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
      </View>

      <Button label={t('route.addMoreStops')} variant="secondary" full disabled={stops.length >= MAX_STOPS} onPress={onAddStops} />

      {/* Editable Route Title */}
      <View style={styles.titleInputWrap}>
        <TextInput
          accessibilityLabel={t('route.routeName')}
          maxLength={60}
          onChangeText={(text) => {
            setTitle(text);
          }}
          placeholder={t('route.routeNamePlaceholder')}
          placeholderTextColor={colors.textTertiary}
          style={styles.titleInput}
          value={title}
        />
        {saveSuccess ? (
          <View style={styles.savedBadge}>
            <Text tone="accent" variant="caption" weight="semibold">
              ✓ {t('route.savedBadge', 'Saved')}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Totals Summary Card */}
      <Glass rounded={radius.card} strong style={styles.totalsCard}>
        <View style={styles.totalItem}>
          <Text tone="secondary" variant="caption">
            {t('route.walkTime', 'Walk')}
          </Text>
          <Text variant="headline" weight="semibold">
            {formatDuration(totals.walkDurationMinutes)}
          </Text>
          <Text tone="tertiary" variant="caption">
            {formatDistance(totals.walkDistanceMeters)}
          </Text>
        </View>
        <View style={styles.totalsDivider} />
        <View style={styles.totalItem}>
          <Text tone="secondary" variant="caption">
            {t('route.atStops', 'At stops')}
          </Text>
          <Text variant="headline" weight="semibold">
            {formatDuration(totals.stopDurationMinutes)}
          </Text>
          <Text tone="tertiary" variant="caption">
            {stops.length} {t('route.stops').toLowerCase()}
          </Text>
        </View>
        <View style={styles.totalsDivider} />
        <View style={styles.totalItem}>
          <Text tone="accent" variant="caption" weight="semibold">
            {t('route.totalTime', 'Total')}
          </Text>
          <Text tone="accent" variant="headline" weight="bold">
            {formatDuration(totals.totalDurationMinutes)}
          </Text>
          <Text tone="tertiary" variant="caption">
            {t('route.plannedTime', 'estimated')}
          </Text>
        </View>
      </Glass>

      <View style={styles.actions}>
        <View style={styles.secondaryActions}>
          <Button
            disabled={saving || saveSuccess}
            full
            label={
              saving
                ? t('common.loading')
                : saveSuccess
                ? `${t('route.saveSuccess')} ✓`
                : t('route.saveRoute')
            }
            loading={saving}
            onPress={handleSave}
            variant="secondary"
          />
        </View>
      </View>
      {/* Optimization Notice */}
      {optimizedNotice ? (
        <View style={styles.noticeBar}>
          <Text tone="accent" variant="caption" weight="semibold">
            ✓ {t('route.autoOrderedNotice')}
          </Text>
        </View>
      ) : null}

      {/* List Toolbar (Optimize & Clear) */}
      <View style={styles.toolbar}>
        <Pressable
          accessibilityLabel={t('route.autoOrder')}
          accessibilityRole="button"
          disabled={stops.length < 2}
          onPress={handleOptimize}
          style={({ pressed }) => [
            styles.toolbarBtn,
            stops.length < 2 && styles.disabledBtn,
            pressed && styles.pressed,
          ]}
        >
          <Text tone={stops.length < 2 ? 'tertiary' : 'accent'} variant="caption" weight="semibold">
            ⚡ {t('route.autoOrder')}
          </Text>
        </Pressable>

        <Pressable
          accessibilityLabel={t('route.clearRoute')}
          accessibilityRole="button"
          onPress={clear}
          style={({ pressed }) => [styles.toolbarBtn, pressed && styles.pressed]}
        >
          <Text tone="secondary" variant="caption">
            {t('route.clearRoute')}
          </Text>
        </Pressable>
      </View>

      {/* Stop Items */}
      <View style={styles.stopList}>
        {stops.map((stop: RouteStop, index: number) => {
          const isFirst = index === 0;
          const isLast = index === stops.length - 1;
          const currentMinutes = stop.plannedMinutes || 45;

          return (
            <Glass key={stop.venue.id} rounded={radius.card} style={styles.stopRow}>
              {/* Number Badge */}
              <View style={styles.numberBadge}>
                <Text tone="onAccent" variant="caption" weight="bold">
                  {index + 1}
                </Text>
              </View>

              {/* Venue Info */}
              <View style={styles.stopInfo}>
                <Text numberOfLines={1} variant="body" weight="semibold">
                  {stop.venue.name}
                </Text>
                <Text tone="secondary" variant="caption">
                  {t(`categories.${stop.venue.category}`)}
                </Text>
              </View>

              {/* Minutes Stepper */}
              <View style={styles.stepper}>
                <Pressable
                  accessibilityLabel={`Decrease minutes for ${stop.venue.name}`}
                  accessibilityRole="button"
                  disabled={currentMinutes <= MIN_MINUTES}
                  hitSlop={6}
                  onPress={() => updateMinutes(stop.venue.id, currentMinutes - STEP_MINUTES)}
                  style={({ pressed }) => [
                    styles.stepperBtn,
                    currentMinutes <= MIN_MINUTES && styles.disabledBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text tone={currentMinutes <= MIN_MINUTES ? 'tertiary' : 'primary'} weight="bold">
                    –
                  </Text>
                </Pressable>

                <View style={styles.stepperValue}>
                  <Text variant="caption" weight="semibold">
                    {currentMinutes}m
                  </Text>
                </View>

                <Pressable
                  accessibilityLabel={`Increase minutes for ${stop.venue.name}`}
                  accessibilityRole="button"
                  disabled={currentMinutes >= MAX_MINUTES}
                  hitSlop={6}
                  onPress={() => updateMinutes(stop.venue.id, currentMinutes + STEP_MINUTES)}
                  style={({ pressed }) => [
                    styles.stepperBtn,
                    currentMinutes >= MAX_MINUTES && styles.disabledBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text tone={currentMinutes >= MAX_MINUTES ? 'tertiary' : 'primary'} weight="bold">
                    +
                  </Text>
                </Pressable>
              </View>

              {/* Up / Down Reorder */}
              <View style={styles.reorderControls}>
                <Pressable
                  accessibilityLabel={`Move ${stop.venue.name} up`}
                  accessibilityRole="button"
                  disabled={isFirst}
                  hitSlop={4}
                  onPress={() => move(index, index - 1)}
                  style={({ pressed }) => [
                    styles.reorderBtn,
                    isFirst && styles.disabledBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.arrowIcon, isFirst && styles.disabledText]}>▲</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={`Move ${stop.venue.name} down`}
                  accessibilityRole="button"
                  disabled={isLast}
                  hitSlop={4}
                  onPress={() => move(index, index + 1)}
                  style={({ pressed }) => [
                    styles.reorderBtn,
                    isLast && styles.disabledBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.arrowIcon, isLast && styles.disabledText]}>▼</Text>
                </Pressable>
              </View>

              {/* Remove Button */}
              <Pressable
                accessibilityLabel={`${t('common.remove')} ${stop.venue.name}`}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => remove(stop.venue.id)}
                style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}
              >
                <Text style={styles.removeIcon}>✕</Text>
              </Pressable>
            </Glass>
          );
        })}
      </View>

      {/* Share with community toggle */}
      <View style={styles.shareRow}>
        <View style={styles.shareText}>
          <Text variant="body" weight="semibold">
            {t('route.isPublic')}
          </Text>
          <Text tone="secondary" variant="caption">
            {t('route.shareWithCommunity', 'Share this route with the community')}
          </Text>
        </View>
        <Switch
          accessibilityLabel={t('route.isPublic')}
          onValueChange={(val) => {
            setIsPublic(val);
          }}
          thumbColor={isPublic ? colors.accent : '#71717A'}
          trackColor={{ false: 'rgba(255,255,255,0.12)', true: 'rgba(181,171,255,0.4)' }}
          value={isPublic}
        />
      </View>

      {/* Save Error */}
      {saveError ? (
        <View style={styles.errorNotice}>
          <Text tone="danger" variant="caption">
            {saveError}
          </Text>
        </View>
      ) : null}

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    gap: space.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touch.min,
  },
  headerTitleWrap: {
    flex: 1,
    gap: 2,
  },
  closeBtn: {
    width: touch.min,
    height: touch.min,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  closeIcon: {
    color: colors.text,
    fontSize: 16,
  },
  titleInputWrap: {
    minHeight: touch.min + 2,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
  },
  titleInput: {
    flex: 1,
    height: '100%',
    color: colors.text,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  savedBadge: {
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(181,171,255,0.15)',
  },
  totalsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    justifyContent: 'space-between',
  },
  totalItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  totalsDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.hairline,
  },
  noticeBar: {
    backgroundColor: 'rgba(181,171,255,0.14)',
    borderRadius: radius.card,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    alignItems: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.xs,
  },
  toolbarBtn: {
    minHeight: touch.min,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  stopList: {
    gap: space.sm,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    minHeight: 64,
    gap: space.sm,
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopInfo: {
    flex: 1,
    gap: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    height: 36,
  },
  stepperBtn: {
    width: 32,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    paddingHorizontal: space.xs,
    minWidth: 34,
    alignItems: 'center',
  },
  reorderControls: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  reorderBtn: {
    width: 36,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
  },
  arrowIcon: {
    color: colors.text,
    fontSize: 10,
  },
  removeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  removeIcon: {
    color: colors.textTertiary,
    fontSize: 14,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
    paddingHorizontal: space.xs,
  },
  shareText: {
    flex: 1,
    gap: 2,
  },
  errorNotice: {
    backgroundColor: 'rgba(255,90,95,0.15)',
    padding: space.sm,
    borderRadius: radius.card,
  },
  actions: {
    paddingTop: space.sm,
    gap: space.sm,
  },
  secondaryActions: {
    gap: space.sm,
  },
  emptyContainer: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    gap: space.xl,
  },
  emptyBody: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.xxl,
    gap: space.md,
  },
  emptyGlyph: {
    color: colors.accent,
    fontSize: 40,
  },
  emptyText: {
    textAlign: 'center',
    maxWidth: 260,
  },
  disabledBtn: {
    opacity: 0.35,
  },
  disabledText: {
    color: colors.textTertiary,
  },
  pressed: {
    opacity: 0.72,
  },
});
