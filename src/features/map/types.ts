import type { NearbyVenue, LatLng } from '@/types/domain';

import type { LocationIssue } from './useUserLocation';

export type RouteStopMarker = {
  id: string;
  lat: number;
  lng: number;
  name?: string;
  position: number;
};

export type MapViewProps = {
  venues: NearbyVenue[];
  selectedVenueId: string | null;
  location: LatLng;
  userLocation: LatLng | null;
  sheetHeight: number;
  locating: boolean;
  locationIssue: LocationIssue | null;
  onLocate: () => void;
  onSelectVenue: (venue: NearbyVenue) => void;
  onProfilePress?: () => void;
  onFavouritesPress?: () => void;
  onSearchPress?: () => void;
  onMapTap?: () => void;
  /** Active leg/route, drawn bold and animated. [lng, lat] */
  routeLine?: [number, number][];
  /** Rest of the route, drawn faint and dashed. */
  routeMuted?: [number, number][];
  /** Move the camera to fit routeLine when it changes. */
  fitRoute?: boolean;
  routeStops?: RouteStopMarker[];
};
