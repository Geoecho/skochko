import type { LatLng, RouteStop } from '@/types/domain';

export const STREET_FACTOR = 1.3;
export const WALKING_METERS_PER_MINUTE = 80;

export function haversineDistance(a: LatLng, b: LatLng): number {
  const earthRadius = 6_371_000;
  const radians = Math.PI / 180;
  const lat1 = a.lat * radians;
  const lat2 = b.lat * radians;
  const deltaLat = (b.lat - a.lat) * radians;
  const deltaLng = (b.lng - a.lng) * radians;
  const sinLat = Math.sin(deltaLat / 2);
  const sinLng = Math.sin(deltaLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function streetDistance(a: LatLng, b: LatLng): number {
  return haversineDistance(a, b) * STREET_FACTOR;
}

export function walkingTimeMinutes(distanceMeters: number): number {
  if (distanceMeters <= 0) return 0;
  return Math.max(1, Math.round(distanceMeters / WALKING_METERS_PER_MINUTE));
}

export type RouteTotals = {
  walkDistanceMeters: number;
  walkDurationMinutes: number;
  stopDurationMinutes: number;
  totalDurationMinutes: number;
};

export function calculateRouteTotals(stops: RouteStop[]): RouteTotals {
  let walkDistanceMeters = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    walkDistanceMeters += streetDistance(stops[i].venue, stops[i + 1].venue);
  }

  const roundedDistance = Math.round(walkDistanceMeters);
  const walkDurationMinutes = walkingTimeMinutes(roundedDistance);
  const stopDurationMinutes = stops.reduce((sum, s) => sum + (s.plannedMinutes || 0), 0);
  const totalDurationMinutes = walkDurationMinutes + stopDurationMinutes;

  return {
    walkDistanceMeters: roundedDistance,
    walkDurationMinutes,
    stopDurationMinutes,
    totalDurationMinutes,
  };
}

export function optimizeStops<T extends { venue: LatLng }>(stops: T[], start?: LatLng | null): T[] {
  if (stops.length <= 2 && !start) {
    return [...stops];
  }
  if (stops.length === 0) {
    return [];
  }

  // Phase 1: Nearest-neighbour construction
  const unvisited = [...stops];
  const ordered: T[] = [];
  let currentPos: LatLng;

  if (start) {
    currentPos = start;
  } else {
    // Keep first stop fixed
    const first = unvisited.shift()!;
    ordered.push(first);
    currentPos = first.venue;
  }

  while (unvisited.length > 0) {
    let bestIndex = 0;
    let bestDist = Infinity;
    for (let i = 0; i < unvisited.length; i++) {
      const d = haversineDistance(currentPos, unvisited[i].venue);
      if (d < bestDist) {
        bestDist = d;
        bestIndex = i;
      }
    }
    const [next] = unvisited.splice(bestIndex, 1);
    ordered.push(next);
    currentPos = next.venue;
  }

  if (ordered.length <= 2) {
    return ordered;
  }

  // Phase 2: 2-opt pass on the open path
  const pathCost = (path: T[]): number => {
    let cost = 0;
    if (start && path.length > 0) {
      cost += haversineDistance(start, path[0].venue);
    }
    for (let i = 0; i < path.length - 1; i++) {
      cost += haversineDistance(path[i].venue, path[i + 1].venue);
    }
    return cost;
  };

  let bestPath = [...ordered];
  let bestCost = pathCost(bestPath);
  let improved = true;
  let iterations = 0;
  const maxIterations = 50;
  const startIndex = start ? 0 : 1;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = startIndex; i < bestPath.length - 1; i++) {
      for (let j = i + 1; j < bestPath.length; j++) {
        const candidate = [
          ...bestPath.slice(0, i),
          ...bestPath.slice(i, j + 1).reverse(),
          ...bestPath.slice(j + 1),
        ];
        const cost = pathCost(candidate);
        if (cost < bestCost - 1e-4) {
          bestPath = candidate;
          bestCost = cost;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  return bestPath;
}
