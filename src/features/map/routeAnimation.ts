// Crisp cased route line drawn in progressively, a muted remaining-route line,
// and a slow "flow" dash moving along the active leg. All animation is skipped with reduced motion.
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import type { Feature, LineString } from 'geojson';
import { colors } from '@/theme/tokens';

export const ROUTE_SRC = 'route-line';
export const ROUTE_MUTED_SRC = 'route-muted';
const L_MUTED = 'route-muted-layer';
const L_CASING = 'route-casing';
const L_MAIN = 'route-line-layer';
const L_FLOW = 'route-flow';

const line = (coords: [number, number][]): Feature<LineString> => ({
  type: 'Feature',
  properties: {},
  geometry: { type: 'LineString', coordinates: coords.length >= 2 ? coords : [] },
});

export function addRouteLayers(map: MapLibreMap, beforeId?: string) {
  map.addSource(ROUTE_MUTED_SRC, { type: 'geojson', data: line([]) });
  map.addSource(ROUTE_SRC, { type: 'geojson', data: line([]), lineMetrics: true });
  const layout = { 'line-join': 'round', 'line-cap': 'round' } as const;
  map.addLayer({ id: L_MUTED, type: 'line', source: ROUTE_MUTED_SRC, layout, paint: { 'line-color': colors.accent, 'line-width': 3, 'line-opacity': 0.35, 'line-dasharray': [1.2, 1.6] } }, beforeId);
  map.addLayer({ id: L_CASING, type: 'line', source: ROUTE_SRC, layout, paint: { 'line-color': '#FFFFFF', 'line-width': 8, 'line-opacity': 1 } }, beforeId);
  map.addLayer({ id: L_MAIN, type: 'line', source: ROUTE_SRC, layout, paint: { 'line-color': '#252525', 'line-width': 4.5, 'line-blur': 0 } }, beforeId);
  map.addLayer({ id: L_FLOW, type: 'line', source: ROUTE_SRC, layout, paint: { 'line-color': '#FFFFFF', 'line-width': 2, 'line-opacity': 0.75, 'line-dasharray': [0, 4, 3] } }, beforeId);
}

// Cumulative distances (in degrees-ish, fine for proportional slicing at city scale).
function cumulative(coords: [number, number][]) {
  const out = [0];
  for (let i = 1; i < coords.length; i++) {
    const [x0, y0] = coords[i - 1];
    const [x1, y1] = coords[i];
    out.push(out[i - 1] + Math.hypot((x1 - x0) * Math.cos((y0 * Math.PI) / 180), y1 - y0));
  }
  return out;
}

function slice(coords: [number, number][], cum: number[], t: number): [number, number][] {
  const target = cum[cum.length - 1] * t;
  const out: [number, number][] = [coords[0]];
  for (let i = 1; i < coords.length; i++) {
    if (cum[i] <= target) out.push(coords[i]);
    else {
      const seg = cum[i] - cum[i - 1] || 1;
      const k = (target - cum[i - 1]) / seg;
      out.push([coords[i - 1][0] + (coords[i][0] - coords[i - 1][0]) * k, coords[i - 1][1] + (coords[i][1] - coords[i - 1][1]) * k]);
      break;
    }
  }
  return out;
}

// Marching-dash frames (MapLibre "animate a line" technique).
const DASH_FRAMES: number[][] = [
  [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0],
  [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5],
];

export class RouteAnimator {
  private raf = 0;
  private flowTimer: ReturnType<typeof setInterval> | null = null;
  constructor(private map: MapLibreMap, private reduceMotion: boolean) {}

  setMuted(coords?: [number, number][]) {
    (this.map.getSource(ROUTE_MUTED_SRC) as GeoJSONSource | undefined)?.setData(line(coords ?? []));
  }

  /** Draws the active line in over ~900 ms (or instantly with reduced motion), then starts the flow dash. */
  setActive(coords?: [number, number][]) {
    cancelAnimationFrame(this.raf);
    const src = this.map.getSource(ROUTE_SRC) as GeoJSONSource | undefined;
    if (!src) return;
    if (!coords || coords.length < 2) {
      src.setData(line([]));
      this.stopFlow();
      return;
    }
    if (this.reduceMotion) {
      src.setData(line(coords));
      return;
    }
    const cum = cumulative(coords);
    const start = performance.now();
    const DURATION = 900;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      src.setData(line(slice(coords, cum, Math.max(0.001, eased))));
      if (t < 1) this.raf = requestAnimationFrame(step);
      else this.startFlow();
    };
    this.raf = requestAnimationFrame(step);
  }

  private startFlow() {
    if (this.flowTimer || this.reduceMotion) return;
    let i = 0;
    // ~12 fps is plenty for a subtle flow and keeps phones cool.
    this.flowTimer = setInterval(() => {
      if (!this.map.getLayer(L_FLOW)) return;
      i = (i + 1) % DASH_FRAMES.length;
      this.map.setPaintProperty(L_FLOW, 'line-dasharray', DASH_FRAMES[i]);
    }, 80);
  }

  private stopFlow() {
    if (this.flowTimer) clearInterval(this.flowTimer);
    this.flowTimer = null;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.stopFlow();
  }
}
