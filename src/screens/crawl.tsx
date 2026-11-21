import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConfirmation } from '@/ui/Confirmation';
import { Button, Glass, Text } from '@/ui';
import { colors, radius, space, touch } from '@/theme/tokens';
import { MapView } from '@/features/map/MapView';
import { useUserLocation } from '@/features/map/useUserLocation';
import { useRouteBuilder } from '@/state/routeBuilder';
import { useAuth } from '@/features/auth/AuthProvider';
import { haversineDistance, streetDistance, walkingTimeMinutes } from '@/features/route/optimize';
import { DirectionsLink } from '@/features/route/DirectionsLink';
import { instructionText, useDirections } from '@/features/route/directions';
import { finishDBCrawl, recordDBCheckin, startDBCrawl } from '@/features/crawl/api';
import { clearActiveCrawl, loadActiveCrawl, saveActiveCrawl } from '@/features/crawl/storage';
import { CrawlSummary } from '@/features/crawl/CrawlSummary';
import type { ActiveCrawl } from '@/features/crawl/types';
import type { LatLng } from '@/types/domain';

const CHECKIN_RADIUS_M = 50;

function arrowFor(type?: string, modifier?: string): string {
  if (type === 'arrive') return '◎';
  if (type === 'roundabout' || type === 'rotary') return '↻';
  switch (modifier) {
    case 'left': case 'sharp left': return '←';
    case 'right': case 'sharp right': return '→';
    case 'slight left': return '↖';
    case 'slight right': return '↗';
    case 'uturn': return '↩';
    default: return '↑';
  }
}
const CARD_HEIGHT = 300;

function walkedDistance(crawl: ActiveCrawl): number {
  // Street-adjusted distance between consecutive visited stops, in route order.
  const visited = crawl.stops.filter((s) => crawl.checkedInVenueIds.includes(s.venue.id));
  let total = 0;
  for (let i = 1; i < visited.length; i++) total += streetDistance(visited[i - 1].venue, visited[i].venue);
  return Math.round(total);
}

export default function CrawlScreen() {
  const router = useRouter();
  const confirm = useConfirmation();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const location = useUserLocation();
  const draft = useRouteBuilder();
  const [crawl, setCrawl] = useState<ActiveCrawl | null>(null);
  const [position, setPosition] = useState<LatLng | null>(null);
  const [dismissedNearId, setDismissedNearId] = useState<string | null>(null);
  const startedRef = useRef(false);

  const update = useCallback((next: ActiveCrawl) => {
    setCrawl(next);
    void saveActiveCrawl(next);
  }, []);

  // Resume an active crawl, otherwise start one from the route draft.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    (async () => {
      const existing = await loadActiveCrawl();
      if (existing && !existing.isCompleted) return setCrawl(existing);
      if (draft.stops.length < 1) return router.replace('/');
      const dbCrawlId = session ? await startDBCrawl(session.user.id, draft.savedRouteId) : null;
      update({
        id: `local-${Date.now()}`,
        dbCrawlId,
        routeId: draft.savedRouteId,
        routeTitle: draft.savedRouteTitle ?? t('route.defaultTitle'),
        stops: draft.stops,
        currentStopIndex: 0,
        checkedInVenueIds: [],
        startedAt: new Date().toISOString(),
        endedAt: null,
        totalDistanceMeters: 0,
        isCompleted: false,
      });
    })();
  }, [draft, router, session, t, update]);

  const hasLocation = !!location.userLocation;

  // Watch position only while this screen is open (PWA has no background location).
  useEffect(() => {
    const geolocation = navigator.geolocation;
    if (!hasLocation || !window.isSecureContext || !geolocation) return;
    const watch = geolocation.watchPosition(
      ({ coords }) => setPosition({ lat: coords.latitude, lng: coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
    return () => {
      geolocation.clearWatch(watch);
      setPosition(null);
    };
  }, [hasLocation]);

  const current = crawl?.stops[crawl.currentStopIndex];
  const next = crawl?.stops[crawl.currentStopIndex + 1];
  const isLast = !!crawl && crawl.currentStopIndex >= crawl.stops.length - 1;
  const checkedIn = !!current && !!crawl?.checkedInVenueIds.includes(current.venue.id);
  const here = hasLocation ? position ?? location.userLocation : null;
  const distanceToCurrent = here && current ? streetDistance(here, current.venue) : null;
  const nearCurrent =
    !!current && !checkedIn && distanceToCurrent != null && distanceToCurrent <= CHECKIN_RADIUS_M && dismissedNearId !== current.venue.id;

  const checkIn = () => {
    if (!crawl || !current || checkedIn) return;
    if (crawl.dbCrawlId) void recordDBCheckin(crawl.dbCrawlId, current.venue.id);
    update({ ...crawl, checkedInVenueIds: [...crawl.checkedInVenueIds, current.venue.id] });
  };

  const finish = () => {
    if (!crawl) return;
    const distance = walkedDistance(crawl);
    if (crawl.dbCrawlId) void finishDBCrawl(crawl.dbCrawlId, distance);
    update({ ...crawl, endedAt: new Date().toISOString(), totalDistanceMeters: distance, isCompleted: true });
  };

  const advance = () => {
    if (!crawl) return;
    if (isLast) return finish();
    update({ ...crawl, currentStopIndex: crawl.currentStopIndex + 1 });
  };

  // Re-route origin is snapped to a ~30 m grid so GPS jitter doesn't spam the routing service.
  const snapLat = here ? Math.round(here.lat / 0.0003) * 0.0003 : null;
  const snapLng = here ? Math.round(here.lng / 0.0004) * 0.0004 : null;
  const routeOrigin = useMemo(() => (snapLat != null && snapLng != null ? { lat: snapLat, lng: snapLng } : null), [snapLat, snapLng]);
  const previous = crawl && crawl.currentStopIndex > 0 ? crawl.stops[crawl.currentStopIndex - 1].venue : null;
  const legStart = routeOrigin ?? previous;
  const legPoints = useMemo(
    () => (legStart && current ? [legStart, { lat: current.venue.lat, lng: current.venue.lng }] : null),
    [legStart, current],
  );
  const leg = useDirections(legPoints);
  const restPoints = useMemo(
    () => (crawl ? crawl.stops.slice(crawl.currentStopIndex).map((x) => ({ lat: x.venue.lat, lng: x.venue.lng })) : null),
    [crawl],
  );
  const rest = useDirections(restPoints && restPoints.length >= 2 ? restPoints : null);
  const routeLine = leg.data?.approximate ? undefined : leg.data?.coordinates;
  const routeMuted = rest.data?.approximate ? undefined : rest.data?.coordinates;

  // Next maneuver: the first step after "depart" (the leg restarts from you each re-route).
  const steps = leg.data?.legs[0]?.steps ?? [];
  const nextStep = steps.length > 1 ? steps[1] : steps[0];
  const toManeuver = here && nextStep ? haversineDistance(here, { lng: nextStep.location[0], lat: nextStep.location[1] }) : null;
  const legLeft = leg.data ? leg.data.distance : distanceToCurrent;
  const fmtM = (m: number) => (m < 1000 ? `${Math.max(5, Math.round(m / 5) * 5)} m` : `${(m / 1000).toFixed(1)} km`);

  const markers = useMemo(
    () => crawl?.stops.map((s, i) => ({ id: s.venue.id, lat: s.venue.lat, lng: s.venue.lng, name: s.venue.name, position: i + 1 })),
    [crawl?.stops],
  );

  if (!crawl) return <View style={styles.root} />;

  if (crawl.isCompleted) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <CrawlSummary crawl={crawl} />
        <ClearOnLeave />
      </View>
    );
  }

  const walkMin = next && current ? walkingTimeMinutes(streetDistance(current.venue, next.venue)) : null;

  return (
    <View style={styles.root}>
      <MapView
        venues={[]}
        selectedVenueId={null}
        location={current ? { lat: current.venue.lat, lng: current.venue.lng } : location.location}
        userLocation={here}
        sheetHeight={CARD_HEIGHT + insets.bottom}
        locating={location.locating}
        locationIssue={location.issue}
        onLocate={location.locate}
        onSelectVenue={() => {}}
        routeLine={routeLine}
        routeMuted={routeMuted}
        fitRoute
        routeStops={markers}
      />

      <Glass rounded={radius.pill} style={[styles.close, { top: insets.top + space.md }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('crawl.finishCrawl')}
          onPress={() => confirm({ title: t('crawl.endConfirm'), confirmLabel: t('crawl.finishCrawl'), onConfirm: finish })}
          style={styles.closeHit}
        >
          <Text weight="semibold">{t('crawl.finishCrawl')}</Text>
        </Pressable>
      </Glass>

      {nearCurrent && current ? (
        <Glass strong rounded={radius.card} style={[styles.toast, { top: insets.top + 72 }]}>
          <Text weight="semibold" style={{ flex: 1 }}>{t('crawl.nearStopPrompt', { name: current.venue.name })}</Text>
          <Button label={t('crawl.checkIn')} onPress={checkIn} />
          <Pressable accessibilityLabel={t('common.close')} onPress={() => setDismissedNearId(current.venue.id)} style={styles.toastClose}>
            <Text tone="secondary">✕</Text>
          </Pressable>
        </Glass>
      ) : null}

      <Glass strong rounded={radius.sheet} style={[styles.card, { paddingBottom: space.xl + insets.bottom }]}>
        <View style={styles.dots} accessibilityLabel={`${crawl.currentStopIndex + 1} / ${crawl.stops.length}`}>
          {crawl.stops.map((s, i) => (
            <View
              key={s.venue.id}
              style={[
                styles.dot,
                crawl.checkedInVenueIds.includes(s.venue.id) && styles.dotDone,
                i === crawl.currentStopIndex && styles.dotCurrent,
              ]}
            />
          ))}
        </View>
        {current && !checkedIn ? (
          <View style={styles.navRow} accessibilityLiveRegion="polite">
            <View style={styles.navArrow}><Text weight="bold" tone="onAccent" style={styles.navArrowText}>{arrowFor(nextStep?.type, nextStep?.modifier)}</Text></View>
            <View style={{ flex: 1 }}>
              <Text variant="headline" weight="bold" numberOfLines={2}>
                {nextStep ? instructionText(nextStep, t) : t('nav.toStop', { name: current.venue.name })}
              </Text>
              <Text variant="caption" tone="secondary">
                {toManeuver != null && nextStep?.type !== 'arrive' ? `${t('nav.inMeters', { distance: fmtM(toManeuver) })} · ` : ''}
                {legLeft != null ? `${fmtM(legLeft)} · ${t('crawl.walkToNext', { minutes: walkingTimeMinutes(legLeft) })}` : ''}
                {leg.data?.approximate ? ` · ${t('nav.approx')}` : ''}
              </Text>
            </View>
            {(!leg.data || leg.data.approximate) && <DirectionsLink destination={current.venue} />}
          </View>
        ) : null}
        <Text variant="caption" tone="secondary" weight="semibold">
          {isLast ? t('crawl.lastStop') : t('crawl.currentStop')} · {crawl.currentStopIndex + 1}/{crawl.stops.length}
        </Text>
        <Text variant="title" weight="bold" numberOfLines={1}>{current?.venue.name}</Text>
        <Text tone="secondary" numberOfLines={1}>
          {next ? `${t('crawl.nextStop')}: ${next.venue.name} · ${t('crawl.walkToNext', { minutes: walkMin })}` : t('crawl.lastStop')}
        </Text>
        {checkedIn ? (
          <Button label={isLast ? t('crawl.finishCrawl') : t('crawl.nextButton')} full onPress={advance} />
        ) : (
          <View style={styles.row}>
            <Button label={t('crawl.checkIn')} full onPress={checkIn} style={{ flex: 1 }} />
            <Button label={isLast ? t('crawl.finishCrawl') : t('crawl.nextButton')} variant="secondary" onPress={advance} />
          </View>
        )}
      </Glass>
    </View>
  );
}

// Clears the stored crawl when the summary unmounts (user went home).
function ClearOnLeave() {
  const clearDraft = useRouteBuilder((s) => s.clear);
  useEffect(
    () => () => {
      void clearActiveCrawl();
      clearDraft();
    },
    [clearDraft],
  );
  return null;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  close: { position: 'absolute', right: space.lg, zIndex: 20 },
  closeHit: { minHeight: touch.min, paddingHorizontal: space.lg, justifyContent: 'center' },
  toast: {
    position: 'absolute', left: space.lg, right: space.lg, zIndex: 20,
    flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md,
  },
  toastClose: { width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center' },
  card: {
    position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: CARD_HEIGHT,
    padding: space.xl, gap: space.sm, borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
  },
  dots: { flexDirection: 'row', gap: 6, marginBottom: space.xs },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.14)' },
  dotDone: { backgroundColor: colors.accentFill },
  dotCurrent: { backgroundColor: colors.text },
  row: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingBottom: space.sm, marginBottom: space.xs, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline },
  navArrow: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.accentFill, alignItems: 'center', justifyContent: 'center' },
  navArrowText: { fontSize: 24, lineHeight: 28 },
});
