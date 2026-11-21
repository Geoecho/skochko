import { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/features/auth/SignInSheet';
import { useRouteBuilder } from '@/state/routeBuilder';
import type { NearbyVenue } from '@/types/domain';
import { MapView } from './MapView';
import { useUserLocation } from './useUserLocation';
import { distanceMeters, useNearbyVenues, type VenueFilters } from '@/features/venues/api';
import { useTonightEvents } from '@/features/events/api';
import { BottomSheet, PEEK_BASE, type BottomSheetHandle } from '@/features/sheet/BottomSheet';
import { HomeSheet, type HomeSheetHandle } from '@/features/sheet/HomeSheet';
import { FavouritesSheet } from '@/features/venues/FavouritesSheet';
import { VenueActions, VenueDetail } from '@/features/venues/VenueDetail';
import { RouteBuilder } from '@/features/route/RouteBuilder';
import { RouteCTA, CTA_INSET } from '@/features/route/RouteCTA';
import { useDirections } from '@/features/route/directions';

export function MapScreen() {
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const { width } = useWindowDimensions();
  const splitLayout = Platform.OS === 'web' && width >= 768;
  const desktop = splitLayout && width >= 1200;
  const panelWidth = desktop ? Math.min(600, Math.round(width * 0.38)) : 340;
  const location = useUserLocation();
  const [filters, setFilters] = useState<VenueFilters>({});
  const [selectedVenue, setSelectedVenue] = useState<NearbyVenue | null>(null);
  const [favouritesOpen, setFavouritesOpen] = useState(false);
  const [routeBuilderOpen, setRouteBuilderOpen] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(PEEK_BASE);
  const sheetRef = useRef<BottomSheetHandle>(null);
  const homeRef = useRef<HomeSheetHandle>(null);
  const venuesQuery = useNearbyVenues(location.location, filters);
  const eventsQuery = useTonightEvents();
  const stops = useRouteBuilder((state) => state.stops);
  const routeStopsCount = stops.length;
  const venues = venuesQuery.data ?? [];
  const events = eventsQuery.data ?? [];
  const selectedEvent = selectedVenue
    ? events.find((event) => event.venue_id === selectedVenue.id)
    : undefined;

  const showVenue = useCallback((venue: NearbyVenue) => {
    setRouteBuilderOpen(false);
    setSelectedVenue(venue);
    sheetRef.current?.snapTo('half');
  }, []);

  const showCTA = routeStopsCount > 0 && !routeBuilderOpen && !selectedVenue && !favouritesOpen;
  const showRouteBuilder = () => {
    setSelectedVenue(null);
    setRouteBuilderOpen(true);
    setFavouritesOpen(false);
    sheetRef.current?.snapTo('full');
  };
  const browseStops = () => {
    setFavouritesOpen(false);
    setRouteBuilderOpen(false);
    setSelectedVenue(null);
    sheetRef.current?.snapTo('full');
  };
  // Street-following preview from you (if located) through every stop.
  // The user position is snapped to ~10 m so GPS jitter doesn't refetch directions.
  const userLat = location.userLocation ? Number(location.userLocation.lat.toFixed(4)) : null;
  const userLng = location.userLocation ? Number(location.userLocation.lng.toFixed(4)) : null;
  const routePoints = useMemo(() => {
    const pts = stops.map((s) => ({ lat: s.venue.lat, lng: s.venue.lng }));
    if (userLat != null && userLng != null && pts.length) pts.unshift({ lat: userLat, lng: userLng });
    return pts.length >= 2 ? pts : null;
  }, [stops, userLat, userLng]);
  const directions = useDirections(routePoints);
  const routeLine = directions.data?.approximate ? undefined : directions.data?.coordinates;
  const routeStopMarkers = useMemo(() => stops.length > 0
    ? stops.map((s, idx) => ({
        id: s.venue.id,
        lat: s.venue.lat,
        lng: s.venue.lng,
        name: s.venue.name,
        position: idx + 1,
      }))
    : undefined, [stops]);

  const updateSheetHeight = useCallback((_snap: string, visibleHeight: number) => {
    setSheetHeight(visibleHeight);
  }, []);

  return (
    <View style={styles.screen}>
      <View style={[styles.map, splitLayout && { left: panelWidth }]}>
        <MapView
          locating={location.locating}
          location={location.location}
          locationIssue={location.issue}
          onLocate={location.locate}
          onProfilePress={() => requireAuth('account', () => router.push('/profile'))}
          onFavouritesPress={() => {
            setSelectedVenue(null);
            setRouteBuilderOpen(false);
            setFavouritesOpen(true);
            sheetRef.current?.snapTo('half');
          }}
          onMapTap={() => sheetRef.current?.snapTo('peek')}
          onSelectVenue={showVenue}
          routeLine={routeLine}
          fitRoute={routeBuilderOpen}
          routeStops={routeStopMarkers}
          selectedVenueId={selectedVenue?.id ?? null}
          sheetHeight={splitLayout ? 0 : sheetHeight}
          userLocation={location.userLocation}
          venues={venues}
        />
      </View>

      <View pointerEvents={splitLayout ? 'auto' : 'box-none'} style={[styles.browser, splitLayout && { right: undefined, width: panelWidth }]}>
        <BottomSheet
          ref={sheetRef}
          docked={splitLayout}
          onSnapChange={updateSheetHeight}
          footerInset={showCTA ? CTA_INSET : 0}
          contentKey={routeBuilderOpen ? 'route-builder' : selectedVenue?.id ?? (favouritesOpen ? 'favourites' : 'browse')}
          footer={selectedVenue ? <VenueActions venue={selectedVenue} onViewRoute={showRouteBuilder} /> : undefined}
        >
          {routeBuilderOpen ? (
            <RouteBuilder
              onClose={() => setRouteBuilderOpen(false)}
              onAddStops={browseStops}
              onStartCrawl={() => router.push('/crawl')}
              userLocation={location.userLocation ?? location.location}
            />
          ) : selectedVenue ? (
            <VenueDetail
              event={selectedEvent}
              onBack={() => setSelectedVenue(null)}
              venue={selectedVenue}
            />
          ) : favouritesOpen ? (
            <FavouritesSheet
              onClose={() => setFavouritesOpen(false)}
              onSelect={venue => showVenue(venues.find(item => item.id === venue.id) ?? { ...venue, distance_m: distanceMeters(location.location, venue) })}
            />
          ) : (
            <HomeSheet
              ref={homeRef}
              desktop={desktop}
              events={events}
              eventsError={eventsQuery.isError}
              eventsLoading={eventsQuery.isLoading}
              filters={filters}
              onFiltersChange={setFilters}
              onRetryEvents={() => void eventsQuery.refetch()}
              onRetryVenues={() => void venuesQuery.refetch()}
              onVenuePress={showVenue}
              onExpand={(snap) => sheetRef.current?.snapTo(snap)}
              origin={location.location}
              venues={venues}
              venuesError={venuesQuery.isError}
              venuesLoading={venuesQuery.isLoading}
            />
          )}
        </BottomSheet>

        {showCTA ? (
          <RouteCTA
            count={routeStopsCount}
            onStart={() => router.push('/crawl')}
            onEdit={showRouteBuilder}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, overflow: 'hidden' },
  map: { ...StyleSheet.absoluteFill },
  browser: { ...StyleSheet.absoluteFill },
});
