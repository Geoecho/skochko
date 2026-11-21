export type CrawlHistoryItem = {
  id: string;
  user_id: string;
  route_id: string | null;
  route_title: string | null;
  started_at: string;
  ended_at: string;
  distance_m: number | null;
  duration_s: number;
  stops_visited_count: number;
  visited_venue_names: string[];
};

export type UserStats = {
  crawls_count: number;
  routes_created_count: number;
};
