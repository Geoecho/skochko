import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import {
  AttributionControl,
  Map as MapLibreMap,
  Marker,
  getVersion,
  setWorkerUrl,
  type GeoJSONSource,
  type MapLayerMouseEvent,
} from 'maplibre-gl';
import type { FeatureCollection, Point } from 'geojson';
import { colors, radius, space, touch } from '@/theme/tokens';
import { Glass, IconButton, Text } from '@/ui';
import { TopBar } from './TopBar';
import { getFeaturedVenues } from '@/features/venues/featured';
import type { NearbyVenue } from '@/types/domain';
import type { MapViewProps } from './types';
import { addPinImages } from './pinImages';
import { addRouteLayers, RouteAnimator } from './routeAnimation';
import { reportError } from '@/lib/errorReporting';

const VENUE_SOURCE = 'venues';
const CLUSTER_LAYER = 'venue-clusters';
const CLUSTER_COUNT_LAYER = 'venue-cluster-count';
const PIN_LAYER = 'venue-pins';
const FEATURED_SOURCE = 'featured-venues';
const VENUE_PULSE_LAYER = 'venue-featured-pulse';
setWorkerUrl(`/map/maplibre-gl-worker.mjs?v=${getVersion()}`);

function venueCollection(venues: NearbyVenue[], selectedVenueId: string | null): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: venues.map((venue) => ({
      type: 'Feature',
      id: venue.id,
      geometry: { type: 'Point', coordinates: [venue.lng, venue.lat] },
      properties: {
        id: venue.id,
        name: venue.name,
        category: venue.category,
        // Unknown hours are not "closed": only dim venues we know are closed.
        is_open: venue.is_open_now || !venue.hours || Object.keys(venue.hours).length === 0,
        is_promoted: venue.is_promoted,
        is_selected: venue.id === selectedVenueId,
      },
    })),
  };
}


function createUserMarker(): Marker {
  const element = document.createElement('div');
  element.className = 'map-user-location';
  element.setAttribute('role', 'img');
  const emblem = document.createElement('span');
  emblem.className = 'map-user-location-emblem';
  emblem.setAttribute('aria-hidden', 'true');
  for (let step = 0; step < 2; step++) {
    const footprint = document.createElement('span');
    footprint.className = 'map-user-footprint';
    emblem.append(footprint);
  }
  element.append(emblem);
  return new Marker({ element, anchor: 'center' });
}

export function MapView({
  venues,
  selectedVenueId,
  location,
  userLocation,
  sheetHeight,
  locating,
  locationIssue,
  onLocate,
  onSelectVenue,
  onProfilePress,
  onSettingsPress,
  onFavouritesPress,
  onSearchPress,
  onMapTap,
  routeLine,
  routeMuted,
  fitRoute,
  routeStops,
}: MapViewProps) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const loadedRef = useRef(false);
  const stopMarkersRef = useRef<Marker[]>([]);
  const routeLineRef = useRef(routeLine);
  const routeMutedRef = useRef(routeMuted);
  const routeAnimRef = useRef<RouteAnimator | null>(null);
  const venuesRef = useRef(venues);
  const onSelectRef = useRef(onSelectVenue);
  const onMapTapRef = useRef(onMapTap);
  const [mapFailed, setMapFailed] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const data = useMemo(() => venueCollection(venues, selectedVenueId), [selectedVenueId, venues]);
  const dataRef = useRef(data);

  // Map event handlers (registered once) read the latest props through these refs.
  useLayoutEffect(() => {
    dataRef.current = data;
    venuesRef.current = venues;
    onSelectRef.current = onSelectVenue;
    onMapTapRef.current = onMapTap;
    routeLineRef.current = routeLine;
    routeMutedRef.current = routeMuted;
  });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: MapLibreMap;
    try {
      map = new MapLibreMap({
        container: containerRef.current,
        style: '/map/skochko-light.json',
        center: [location.lng, location.lat],
        zoom: 15,
        pitch: 0,
        bearing: 0,
        dragRotate: false,
        pitchWithRotate: false,
        attributionControl: false,
        pixelRatio: Math.min(window.devicePixelRatio || 1, 3),
        canvasContextAttributes: { antialias: true },
        fadeDuration: 0,
      });
    } catch (error) {
      reportError('webgl', error);
      // WebGL unavailable: flag it after this effect (no synchronous setState in the effect body).
      queueMicrotask(() => setMapFailed(true));
      return;
    }

    mapRef.current = map;
    const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(() => map.resize()) : null;
    resizeObserver?.observe(containerRef.current);
    const canvasEl = map.getCanvas();
    const onContextLost = (event: Event) => {
      event.preventDefault(); // allow the browser to restore the context
      reportError('webgl', new Error('WebGL context lost'));
      setContextLost(true);
    };
    const onContextRestored = () => setContextLost(false);
    canvasEl.addEventListener('webglcontextlost', onContextLost);
    canvasEl.addEventListener('webglcontextrestored', onContextRestored);
    map.touchZoomRotate.disableRotation();
    map.addControl(
      new AttributionControl({ compact: true, customAttribution: '© OpenStreetMap contributors' }),
      'bottom-left',
    );

    const selectVenue = (event: MapLayerMouseEvent) => {
      const id = String(event.features?.[0]?.properties?.id ?? '');
      const venue = venuesRef.current.find((candidate) => candidate.id === id);
      if (venue) onSelectRef.current(venue);
    };

    const expandCluster = async (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature || feature.geometry.type !== 'Point') return;
      const source = map.getSource(VENUE_SOURCE) as GeoJSONSource | undefined;
      const clusterId = Number(feature.properties?.cluster_id);
      if (!source || !Number.isFinite(clusterId)) return;
      const zoom = await source.getClusterExpansionZoom(clusterId);
      map.easeTo({ center: feature.geometry.coordinates as [number, number], zoom, duration: reduceMotion ? 0 : 300 });
    };

    const showPointer = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const hidePointer = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('load', () => {
      loadedRef.current = true;
      setMapFailed(false);
      setMapReady(true);
      map.addSource(VENUE_SOURCE, {
        type: 'geojson',
        data: dataRef.current,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 44,
      });
      addRouteLayers(map);
      routeAnimRef.current = new RouteAnimator(map, !!reduceMotion);
      routeAnimRef.current.setMuted(routeMutedRef.current);
      routeAnimRef.current.setActive(routeLineRef.current);
      map.addLayer({
        id: CLUSTER_LAYER,
        type: 'circle',
        source: VENUE_SOURCE,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': colors.bgElevated,
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 30, 24],
          'circle-stroke-color': colors.accent,
          'circle-stroke-width': 1.5,
        },
      });
      map.addLayer({
        id: CLUSTER_COUNT_LAYER,
        type: 'symbol',
        source: VENUE_SOURCE,
        filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12, 'text-font': ['Noto Sans Regular'] },
        paint: { 'text-color': colors.accent },
      });
      map.addSource(FEATURED_SOURCE, { type: 'geojson', data: venueCollection(getFeaturedVenues(venuesRef.current), null) });
      map.addLayer({
        id: VENUE_PULSE_LAYER,
        type: 'circle',
        source: FEATURED_SOURCE,
        minzoom: 15,
        paint: {
          'circle-radius': 25,
          'circle-opacity': 0,
          'circle-stroke-color': colors.accent,
          'circle-stroke-width': 2.2,
          'circle-stroke-opacity': 0,
          'circle-translate': [0, -30],
          'circle-translate-anchor': 'viewport',
          'circle-radius-transition': { duration: 0 },
          'circle-stroke-opacity-transition': { duration: 0 },
        },
      });
      addPinImages(map);
      // Fixed-size monochrome badges; selection changes contrast, never scale.
      map.addLayer({
        id: PIN_LAYER,
        type: 'symbol',
        source: VENUE_SOURCE,
        filter: ['!', ['has', 'point_count']],
        layout: {
          'icon-image': ['concat','pin-',['get','category'],
            ['case',['==',['get','is_promoted'],true],'-promo',''],
            ['case',['==',['get','is_selected'],true],'-selected','']],
          'icon-anchor': 'bottom',
          'icon-size': 1,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          // Selected and promoted pins draw on top.
          'symbol-sort-key': ['case', ['==', ['get', 'is_selected'], true], 2, ['==', ['get', 'is_promoted'], true], 1, 0],
        },
        paint: {
          'icon-opacity': ['case', ['any', ['==', ['get', 'is_selected'], true], ['==', ['get', 'is_open'], true]], 1, 0.65],
        },
      });

      map.on('click', event => {
        if (!onMapTapRef.current) return;
        const target = event.originalEvent.target;
        if (target instanceof Element && target.closest('.maplibregl-marker, .maplibregl-ctrl')) return;
        if (!map.queryRenderedFeatures(event.point, { layers: [PIN_LAYER, CLUSTER_LAYER, CLUSTER_COUNT_LAYER] }).length) {
          onMapTapRef.current();
        }
      });
      map.on('click', PIN_LAYER, selectVenue);
      map.on('click', CLUSTER_LAYER, expandCluster);
      map.on('mouseenter', PIN_LAYER, showPointer);
      map.on('mouseenter', CLUSTER_LAYER, showPointer);
      map.on('mouseleave', PIN_LAYER, hidePointer);
      map.on('mouseleave', CLUSTER_LAYER, hidePointer);
    });

    map.on('error', (event) => {
      // Tile/glyph/image hiccups are recoverable; only fail when the style never loaded.
      if (!event.error || map.isStyleLoaded() || loadedRef.current) {
        if (event.error) console.warn('[map]', event.error.message);
        return;
      }
      setMapFailed(true);
    });

    return () => {
      resizeObserver?.disconnect();
      canvasEl.removeEventListener('webglcontextlost', onContextLost);
      canvasEl.removeEventListener('webglcontextrestored', onContextRestored);
      routeAnimRef.current?.destroy();
      routeAnimRef.current = null;
      loadedRef.current = false;
      markerRef.current?.remove();
      markerRef.current = null;
      stopMarkersRef.current.forEach((marker) => marker.remove());
      stopMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    const source = mapRef.current?.getSource(VENUE_SOURCE) as GeoJSONSource | undefined;
    source?.setData(data);
    const featured = mapRef.current?.getSource(FEATURED_SOURCE) as GeoJSONSource | undefined;
    featured?.setData(venueCollection(getFeaturedVenues(venues), null));
  }, [data, venues]);

  const hasFeaturedVenues = venues.length > 0;
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || contextLost || !map?.getLayer(VENUE_PULSE_LAYER) || !hasFeaturedVenues) return;
    const ripple = VENUE_PULSE_LAYER;
    if (reduceMotion) {
      map.setPaintProperty(ripple, 'circle-stroke-opacity', 0);
      return;
    }

    let frame: number;
    let lastUpdate = -Infinity;
    const start = performance.now();
    const tick = (time: number) => {
      if (time - lastUpdate >= 40) {
        lastUpdate = time;
        const phase = ((time - start) % 2800) / 2200;
        const progress = Math.min(1, phase);
        map.setPaintProperty(ripple, 'circle-radius', 25 + 23 * (1 - (1 - progress) ** 2));
        map.setPaintProperty(ripple, 'circle-stroke-opacity', 0.78 * Math.min(1, progress * 10) * (1 - progress));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [contextLost, hasFeaturedVenues, mapReady, reduceMotion]);

  useEffect(() => {
    if (mapReady) routeAnimRef.current?.setActive(routeLine);
  }, [routeLine, mapReady]);

  useEffect(() => {
    if (mapReady) routeAnimRef.current?.setMuted(routeMuted);
  }, [routeMuted, mapReady]);

  const routeForBounds = routeLine ?? routeMuted;
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !fitRoute || !routeForBounds || routeForBounds.length < 2) return;
    const lngs = routeForBounds.map(([lng]) => lng);
    const lats = routeForBounds.map(([, lat]) => lat);
    map.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: { top: 90, left: 48, right: 48, bottom: Math.min(sheetHeightRef.current + 40, map.getContainer().clientHeight * 0.55) }, maxZoom: 17, duration: reduceMotion ? 0 : 650 },
    );
  }, [fitRoute, mapReady, reduceMotion, routeForBounds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    stopMarkersRef.current.forEach((marker) => marker.remove());
    stopMarkersRef.current = [];

    if (!routeStops || routeStops.length === 0) return;

    routeStops.forEach((stop) => {
      const el = document.createElement('div');
      el.className = 'route-stop-marker';
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', `${stop.position}. ${stop.name ?? ''}`);
      Object.assign(el.style, {
        width: '24px',
        height: '24px',
        borderRadius: '999px',
        backgroundColor: colors.accentFill,
        color: colors.onAccent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: '700',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        border: '2px solid #0B0B0F',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        cursor: 'pointer',
      });
      el.textContent = String(stop.position);
      el.addEventListener('click', () => {
        const venue = venuesRef.current.find((v) => v.id === stop.id);
        if (venue) onSelectRef.current(venue);
      });

      const marker = new Marker({ element: el, anchor: 'center' })
        .setLngLat([stop.lng, stop.lat])
        .addTo(map);
      stopMarkersRef.current.push(marker);
    });
  }, [routeStops, mapReady]);

  const selectedVenue = venues.find((candidate) => candidate.id === selectedVenueId);
  const selectedLng = selectedVenue?.lng;
  const selectedLat = selectedVenue?.lat;
  const sheetHeightRef = useRef(sheetHeight);
  // eslint-disable-next-line react-hooks/immutability -- Commit-time ref update avoids recentering the map during sheet animation.
  useLayoutEffect(() => { sheetHeightRef.current = sheetHeight; }, [sheetHeight]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current || selectedLng == null || selectedLat == null) return;
    map.flyTo({
      center: [selectedLng, selectedLat],
      zoom: Math.max(16, map.getZoom()),
      offset: [0, -sheetHeightRef.current / 2],
      duration: reduceMotion ? 0 : 650,
      essential: false,
    });
  }, [mapReady, reduceMotion, selectedVenueId, selectedLng, selectedLat]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    if (!userLocation) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    // Position must be set before addTo(): MapLibre reads the marker's lngLat while adding it.
    if (!markerRef.current) {
      markerRef.current = createUserMarker().setLngLat([userLocation.lng, userLocation.lat]).addTo(map);
    }
    markerRef.current.getElement().setAttribute('aria-label', t('map.yourLocation'));
    markerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
    map.easeTo({ center: [userLocation.lng, userLocation.lat], zoom: Math.max(15, map.getZoom()), duration: reduceMotion ? 0 : 500 });
  }, [mapReady, reduceMotion, t, userLocation]);

  const handleLocate = () => {
    if (userLocation) {
      mapRef.current?.easeTo({
        center: [userLocation.lng, userLocation.lat], zoom: 16, duration: reduceMotion ? 0 : 550,
      });
    }
    onLocate();
  };
  const changeZoom = (amount: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ zoom: map.getZoom() + amount, duration: reduceMotion ? 0 : 220 });
  };

  return (
    <View style={styles.root}>
      <div ref={containerRef} aria-label={t('map.accessibilityLabel')} style={domStyles.map} />

      {mapFailed || contextLost ? (
        <iframe
          title={t('map.accessibilityLabel')}
          src="https://www.openstreetmap.org/export/embed.html?bbox=21.397%2C41.973%2C21.469%2C42.019&layer=mapnik"
          style={{ ...domStyles.map, border: 0, height: `calc(100% - ${sheetHeight}px)` }}
        />
      ) : null}

      {onProfilePress && onFavouritesPress && onSettingsPress ? (
        <TopBar onProfilePress={onProfilePress} onFavouritesPress={onFavouritesPress} onSettingsPress={onSettingsPress} />
      ) : null}

      <div className="map-edge-blur map-edge-blur-top" aria-hidden="true" />
      <div className="map-edge-blur map-edge-blur-bottom" aria-hidden="true" />

      {/* Hidden when the sheet covers most of the map: it would float over the sheet's edge. */}
      {mapReady && !mapFailed && !contextLost && sheetHeight < windowHeight * 0.7 ? (
        <View pointerEvents="box-none" style={[styles.controls, { bottom: sheetHeight + space.lg }]}>
          {windowWidth >= 768 && onSearchPress ? (
            <Glass rounded={radius.sm} style={styles.zoomGroup}>
              <IconButton icon="plus" label={t('map.zoomIn')} tone="plain" size={19} onPress={() => changeZoom(1)} />
              <View style={styles.controlDivider} />
              <IconButton icon="minus" label={t('map.zoomOut')} tone="plain" size={19} onPress={() => changeZoom(-1)} />
            </Glass>
          ) : null}
          <IconButton icon="locate" label={userLocation ? t('nav.recenter') : t('map.useLocation')} loop={locating} selected={!!userLocation} onPress={handleLocate} />
        </View>
      ) : null}

      {locationIssue && !userLocation && sheetHeight < windowHeight * 0.7 ? (
        <View accessibilityLiveRegion="polite" pointerEvents="none" style={[styles.locationNotice, { bottom: sheetHeight + space.lg }]}>
          <Text variant="caption" weight="semibold">{t(`map.locationIssue.${locationIssue}`)}</Text>
        </View>
      ) : null}

      <View style={styles.screenReaderPins}>
        {venues.map((venue) => (
          <Pressable
            key={venue.id}
            accessibilityRole="button"
            accessibilityLabel={`${venue.name}, ${t(`categories.${venue.category}`)}${venue.is_open_now ? `, ${t('common.openNow')}` : Object.keys(venue.hours ?? {}).length ? `, ${t('common.closed')}` : ''}`}
            onPress={() => onSelectVenue(venue)}
          >
            <Text>{venue.name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const domStyles = {
  map: { position: 'absolute', inset: 0, width: '100%', height: '100%' } as React.CSSProperties,
};

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: colors.bg },
  controls: { position: 'absolute', right: space.lg, alignItems: 'center', gap: space.sm },
  zoomGroup: { overflow: 'hidden' },
  controlDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline },
  locationNotice: {
    position: 'absolute', left: space.lg, right: space.lg + touch.min + 16,
    maxWidth: 280, padding: space.sm, borderRadius: radius.sm, backgroundColor: colors.bgElevated,
  },
  screenReaderPins: {
    position: 'absolute',
    left: -10000,
    width: 1,
    height: 1,
    overflow: 'hidden',
  },
});
