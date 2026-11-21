import { useEffect, useRef, useLayoutEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import * as maplibregl from 'maplibre-gl';
import { colors, radius } from '@/theme/tokens';
import type { Coordinates } from './types';

export function LocationPicker({ value, onChange }: { value: Coordinates; onChange: (coordinates: Coordinates) => void }) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const valueRef = useRef(value);
  useLayoutEffect(() => {
    valueRef.current = value;
  });

  useEffect(() => {
    if (!elementRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: elementRef.current,
      style: '/map/skochko-dark.json',
      center: [valueRef.current.lng, valueRef.current.lat],
      zoom: 13,
      attributionControl: false,
    });
    const marker = new maplibregl.Marker({ color: colors.accent, draggable: true })
      .setLngLat([valueRef.current.lng, valueRef.current.lat])
      .addTo(map);
    map.on('click', (event: maplibregl.MapMouseEvent) => {
      marker.setLngLat(event.lngLat);
      onChange({ lng: event.lngLat.lng, lat: event.lngLat.lat });
    });
    marker.on('dragend', () => {
      const position = marker.getLngLat();
      onChange({ lng: position.lng, lat: position.lat });
    });
    mapRef.current = map;
    markerRef.current = marker;
    return () => {
      marker.remove();
      map.remove();
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [onChange]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    const current = marker.getLngLat();
    if (current.lat !== value.lat || current.lng !== value.lng) marker.setLngLat([value.lng, value.lat]);
  }, [value.lat, value.lng]);

  return <View style={styles.frame}><div ref={elementRef} style={webStyle} /></View>;
}

const webStyle = { width: '100%', height: '100%' } as const;
const styles = StyleSheet.create({
  frame: { height: 280, overflow: 'hidden', borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline },
});
