import type { RouteStop } from '@/types/domain';

export type ActiveCrawl = {
  id: string;
  dbCrawlId: string | null;
  routeId: string | null;
  routeTitle: string;
  stops: RouteStop[];
  currentStopIndex: number;
  checkedInVenueIds: string[];
  startedAt: string;
  endedAt: string | null;
  totalDistanceMeters: number;
  isCompleted: boolean;
};
