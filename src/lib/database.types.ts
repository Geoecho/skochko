
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "cities": {
                  Row: {
                    "bbox": unknown,"center": unknown,"created_at": string,"id": string,"name_en": string,"name_mk": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bbox"?: unknown,"center": unknown,"created_at"?: string,"id"?: string,"name_en": string,"name_mk": string,"updated_at"?: string
                  }
                  Update: {
                    "bbox"?: unknown,"center"?: unknown,"created_at"?: string,"id"?: string,"name_en"?: string,"name_mk"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"client_errors": {
                  Row: {
                    "app_version": string | null,"created_at": string,"id": string,"kind": string,"message": string,"path": string | null,"stack": string | null,"user_agent": string | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version"?: string | null,"created_at"?: string,"id"?: string,"kind": string,"message": string,"path"?: string | null,"stack"?: string | null,"user_agent"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "app_version"?: string | null,"created_at"?: string,"id"?: string,"kind"?: string,"message"?: string,"path"?: string | null,"stack"?: string | null,"user_agent"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"crawl_checkins": {
                  Row: {
                    "checked_in_at": string,"crawl_id": string,"created_at": string,"id": string,"updated_at": string,"venue_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "checked_in_at"?: string,"crawl_id": string,"created_at"?: string,"id"?: string,"updated_at"?: string,"venue_id": string
                  }
                  Update: {
                    "checked_in_at"?: string,"crawl_id"?: string,"created_at"?: string,"id"?: string,"updated_at"?: string,"venue_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "crawl_checkins_crawl_id_fkey"
      columns: ["crawl_id"]
isOneToOne: false
      referencedRelation: "crawls"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "crawl_checkins_venue_id_fkey"
      columns: ["venue_id"]
isOneToOne: false
      referencedRelation: "venues"
      referencedColumns: ["id"]
    }
                  ]
                },"crawls": {
                  Row: {
                    "created_at": string,"distance_m": number | null,"ended_at": string | null,"id": string,"route_id": string | null,"started_at": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"distance_m"?: number | null,"ended_at"?: string | null,"id"?: string,"route_id"?: string | null,"started_at"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"distance_m"?: number | null,"ended_at"?: string | null,"id"?: string,"route_id"?: string | null,"started_at"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "crawls_route_id_fkey"
      columns: ["route_id"]
isOneToOne: false
      referencedRelation: "route_stats"
      referencedColumns: ["route_id"]
    },{
      foreignKeyName: "crawls_route_id_fkey"
      columns: ["route_id"]
isOneToOne: false
      referencedRelation: "routes"
      referencedColumns: ["id"]
    }
                  ]
                },"events": {
                  Row: {
                    "cover_url": string | null,"created_at": string,"ends_at": string,"id": string,"price": number | null,"starts_at": string,"status": Database["public"]['Enums']["content_status"],"tags": (string)[],"title_en": string,"title_mk": string,"updated_at": string,"venue_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cover_url"?: string | null,"created_at"?: string,"ends_at": string,"id"?: string,"price"?: number | null,"starts_at": string,"status"?: Database["public"]['Enums']["content_status"],"tags"?: (string)[],"title_en": string,"title_mk": string,"updated_at"?: string,"venue_id": string
                  }
                  Update: {
                    "cover_url"?: string | null,"created_at"?: string,"ends_at"?: string,"id"?: string,"price"?: number | null,"starts_at"?: string,"status"?: Database["public"]['Enums']["content_status"],"tags"?: (string)[],"title_en"?: string,"title_mk"?: string,"updated_at"?: string,"venue_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "events_venue_id_fkey"
      columns: ["venue_id"]
isOneToOne: false
      referencedRelation: "venues"
      referencedColumns: ["id"]
    }
                  ]
                },"favourites": {
                  Row: {
                    "created_at": string,"id": string,"updated_at": string,"user_id": string,"venue_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"updated_at"?: string,"user_id": string,"venue_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"updated_at"?: string,"user_id"?: string,"venue_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "favourites_venue_id_fkey"
      columns: ["venue_id"]
isOneToOne: false
      referencedRelation: "venues"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"created_at": string,"display_name": string,"id": string,"locale": string,"role": Database["public"]['Enums']["user_role"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"created_at"?: string,"display_name": string,"id"?: string,"locale"?: string,"role"?: Database["public"]['Enums']["user_role"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "avatar_url"?: string | null,"created_at"?: string,"display_name"?: string,"id"?: string,"locale"?: string,"role"?: Database["public"]['Enums']["user_role"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"promotions": {
                  Row: {
                    "created_at": string,"ends_at": string,"id": string,"placement": Database["public"]['Enums']["promo_placement"],"starts_at": string,"status": Database["public"]['Enums']["content_status"],"target_id": string,"target_type": Database["public"]['Enums']["promo_target"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"ends_at": string,"id"?: string,"placement": Database["public"]['Enums']["promo_placement"],"starts_at": string,"status"?: Database["public"]['Enums']["content_status"],"target_id": string,"target_type": Database["public"]['Enums']["promo_target"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"ends_at"?: string,"id"?: string,"placement"?: Database["public"]['Enums']["promo_placement"],"starts_at"?: string,"status"?: Database["public"]['Enums']["content_status"],"target_id"?: string,"target_type"?: Database["public"]['Enums']["promo_target"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"reports": {
                  Row: {
                    "created_at": string,"id": string,"reason": string,"reporter_id": string,"target_id": string,"target_type": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"reason": string,"reporter_id": string,"target_id": string,"target_type": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"reason"?: string,"reporter_id"?: string,"target_id"?: string,"target_type"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"route_ratings": {
                  Row: {
                    "comment": string | null,"created_at": string,"id": string,"route_id": string,"stars": number,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "comment"?: string | null,"created_at"?: string,"id"?: string,"route_id": string,"stars": number,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "comment"?: string | null,"created_at"?: string,"id"?: string,"route_id"?: string,"stars"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "route_ratings_route_id_fkey"
      columns: ["route_id"]
isOneToOne: false
      referencedRelation: "route_stats"
      referencedColumns: ["route_id"]
    },{
      foreignKeyName: "route_ratings_route_id_fkey"
      columns: ["route_id"]
isOneToOne: false
      referencedRelation: "routes"
      referencedColumns: ["id"]
    }
                  ]
                },"route_stops": {
                  Row: {
                    "created_at": string,"id": string,"planned_minutes": number,"position": number,"route_id": string,"updated_at": string,"venue_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"planned_minutes"?: number,"position": number,"route_id": string,"updated_at"?: string,"venue_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"planned_minutes"?: number,"position"?: number,"route_id"?: string,"updated_at"?: string,"venue_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "route_stops_route_id_fkey"
      columns: ["route_id"]
isOneToOne: false
      referencedRelation: "route_stats"
      referencedColumns: ["route_id"]
    },{
      foreignKeyName: "route_stops_route_id_fkey"
      columns: ["route_id"]
isOneToOne: false
      referencedRelation: "routes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "route_stops_venue_id_fkey"
      columns: ["venue_id"]
isOneToOne: false
      referencedRelation: "venues"
      referencedColumns: ["id"]
    }
                  ]
                },"routes": {
                  Row: {
                    "city_id": string,"created_at": string,"description": string | null,"id": string,"is_curated": boolean,"is_featured": boolean,"owner_id": string | null,"path": unknown,"status": Database["public"]['Enums']["content_status"],"title": string,"total_distance_m": number | null,"total_duration_s": number | null,"updated_at": string,"visibility": Database["public"]['Enums']["route_visibility"]
                  }
                  ComputedFields: never
                  Insert: {
                    "city_id": string,"created_at"?: string,"description"?: string | null,"id"?: string,"is_curated"?: boolean,"is_featured"?: boolean,"owner_id"?: string | null,"path"?: unknown,"status"?: Database["public"]['Enums']["content_status"],"title": string,"total_distance_m"?: number | null,"total_duration_s"?: number | null,"updated_at"?: string,"visibility"?: Database["public"]['Enums']["route_visibility"]
                  }
                  Update: {
                    "city_id"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"is_curated"?: boolean,"is_featured"?: boolean,"owner_id"?: string | null,"path"?: unknown,"status"?: Database["public"]['Enums']["content_status"],"title"?: string,"total_distance_m"?: number | null,"total_duration_s"?: number | null,"updated_at"?: string,"visibility"?: Database["public"]['Enums']["route_visibility"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "routes_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    }
                  ]
                },"venue_ratings": {
                  Row: {
                    "comment": string | null,"created_at": string,"id": string,"stars": number,"updated_at": string,"user_id": string,"venue_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "comment"?: string | null,"created_at"?: string,"id"?: string,"stars": number,"updated_at"?: string,"user_id": string,"venue_id": string
                  }
                  Update: {
                    "comment"?: string | null,"created_at"?: string,"id"?: string,"stars"?: number,"updated_at"?: string,"user_id"?: string,"venue_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "venue_ratings_venue_id_fkey"
      columns: ["venue_id"]
isOneToOne: false
      referencedRelation: "venues"
      referencedColumns: ["id"]
    }
                  ]
                },"venues": {
                  Row: {
                    "address": string | null,"category": Database["public"]['Enums']["venue_category"],"city_id": string,"created_at": string,"external_id": string | null,"google_details": Json | null,"hours": NonNullable<Json>,"id": string,"instagram": string | null,"lat": number | null,"lng": number | null,"location": unknown,"name": string,"name_en": string | null,"phone": string | null,"photos": (string)[],"price_level": number,"slug": string,"source": string,"status": Database["public"]['Enums']["content_status"],"updated_at": string,"website": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"category": Database["public"]['Enums']["venue_category"],"city_id": string,"created_at"?: string,"external_id"?: string | null,"google_details"?: Json | null,"hours"?: NonNullable<Json>,"id"?: string,"instagram"?: string | null,"lat"?: never,"lng"?: never,"location": unknown,"name": string,"name_en"?: string | null,"phone"?: string | null,"photos"?: (string)[],"price_level"?: number,"slug": string,"source"?: string,"status"?: Database["public"]['Enums']["content_status"],"updated_at"?: string,"website"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"category"?: Database["public"]['Enums']["venue_category"],"city_id"?: string,"created_at"?: string,"external_id"?: string | null,"google_details"?: Json | null,"hours"?: NonNullable<Json>,"id"?: string,"instagram"?: string | null,"lat"?: never,"lng"?: never,"location"?: unknown,"name"?: string,"name_en"?: string | null,"phone"?: string | null,"photos"?: (string)[],"price_level"?: number,"slug"?: string,"source"?: string,"status"?: Database["public"]['Enums']["content_status"],"updated_at"?: string,"website"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "venues_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "route_stats": {
                  Row: {
                    "avg_stars": number | null,"completed_count": number | null,"rating_count": number | null,"route_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "delete_my_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"events_tonight":
{ Args: { "city": string }; Returns: {
              "cover_url": string,"ends_at": string,"id": string,"is_promoted": boolean,"lat": number,"lng": number,"price": number,"starts_at": string,"tags": (string)[],"title_en": string,"title_mk": string,"venue_id": string,"venue_name": string
            }[]
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_venue_open":
{ Args: { "at": string,"hours": Json }; Returns: boolean
                           },
"tonight_bounds":
{ Args: { "at_time"?: string }; Returns: {
              "ends_at": string,"starts_at": string
            }[]
                           },
"venues_nearby":
{ Args: { "categories"?: (Database["public"]['Enums']["venue_category"])[],"open_now"?: boolean,"origin_lat": number,"origin_lng": number,"radius_m"?: number }; Returns: {
              "address": string,"avg_rating": number,"category": Database["public"]['Enums']["venue_category"],"distance_m": number,"hours": Json,"id": string,"instagram": string,"is_open_now": boolean,"is_promoted": boolean,"lat": number,"lng": number,"name": string,"phone": string,"photos": (string)[],"price_level": number,"rating_count": number,"slug": string,"tonight_event_id": string,"tonight_event_title_en": string,"tonight_event_title_mk": string,"website": string
            }[]
                           }
          }
          Enums: {
            "content_status": "active"|"archived"|"hidden","promo_placement": "map"|"list"|"both","promo_target": "venue"|"event","route_visibility": "private"|"public","user_role": "member"|"admin","venue_category": "bar"|"pub"|"cafe"|"club"|"rakija_bar"|"wine_bar"|"cocktail_bar"|"brewery"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "content_status": ["active", "archived", "hidden"],"promo_placement": ["map", "list", "both"],"promo_target": ["venue", "event"],"route_visibility": ["private", "public"],"user_role": ["member", "admin"],"venue_category": ["bar", "pub", "cafe", "club", "rakija_bar", "wine_bar", "cocktail_bar", "brewery"]
          }
        }
} as const
