/**
 * TypeScript types derived from OpenAPI specification.
 */

// ============ Common ============

export interface Location {
  lat: number;
  lng: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============ Auth ============

export interface User {
  id: string;
  email: string;
  name: string;
  picture_url?: string;
}

// ============ Calendar ============

export interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  location_geocoded?: Location;
  all_day: boolean;
}

export interface CalendarEventsResponse {
  events: CalendarEvent[];
}

// ============ Day Plans ============

export type PlanStatus = 'draft' | 'confirmed' | 'completed';

export type TransportMode = 'walking' | 'driving' | 'transit' | 'bicycling';

export interface DayPlanSummary {
  id: string;
  plan_date: string;
  title?: string;
  status: PlanStatus;
  stop_count: number;
}

export interface DayPlan {
  id: string;
  plan_date: string;
  title?: string;
  status: PlanStatus;
  default_transport: TransportMode;
  stops: Stop[];
  legs: Leg[];
  created_at: string;
  updated_at: string;
}

export interface CreateDayPlanRequest {
  plan_date: string;
  title?: string;
  default_transport?: TransportMode;
  import_calendar?: boolean;
}

export interface UpdateDayPlanRequest {
  title?: string;
  status?: PlanStatus;
  default_transport?: TransportMode;
}

export interface DayPlansResponse {
  plans: DayPlanSummary[];
}

// ============ Stops ============

export type StopType = 'origin' | 'destination' | 'waypoint' | 'rest_stop';

export type StopSource = 'calendar' | 'manual' | 'detected';

export interface Stop {
  id: string;
  sequence: number;
  name: string;
  address?: string;
  location: Location;
  place_id?: string;
  stop_type: StopType;
  source: StopSource;
  scheduled_arrival?: string;
  scheduled_departure?: string;
  stay_duration_minutes: number;
  notes?: string;
  calendar_event_id?: string;
}

export interface CreateStopRequest {
  name: string;
  address?: string;
  location: Location;
  place_id?: string;
  stop_type?: StopType;
  scheduled_arrival?: string;
  stay_duration_minutes?: number;
  notes?: string;
  insert_after_stop_id?: string;
}

export interface UpdateStopRequest {
  name?: string;
  address?: string;
  location?: Location;
  scheduled_arrival?: string;
  stay_duration_minutes?: number;
  notes?: string;
}

export interface StopsResponse {
  stops: Stop[];
}

export interface ReorderStopsRequest {
  stop_ids: string[];
}

// ============ Legs ============

export interface Leg {
  id: string;
  from_stop_id: string;
  to_stop_id: string;
  sequence: number;
  transport_mode: TransportMode;
  distance_meters: number;
  duration_seconds: number;
  polyline: string;
}

// ============ Routes ============

export interface RoutePreviewStop {
  id?: string;
  location: Location;
}

export interface RoutePreviewRequest {
  stops: RoutePreviewStop[];
  transport_mode: TransportMode;
  optimize_order?: boolean;
}

export interface RoutePreviewLeg {
  from_index: number;
  to_index: number;
  distance_meters: number;
  duration_seconds: number;
  polyline: string;
}

export interface RoutePreviewResponse {
  legs: RoutePreviewLeg[];
  optimized_order?: number[];
  total_distance_meters: number;
  total_duration_seconds: number;
}

// ============ Itinerary Generation ============

export interface Conflict {
  type: 'time_overlap' | 'insufficient_travel_time';
  stop_ids: string[];
  message: string;
}

export interface GeneratedItinerary {
  stops: Stop[];
  legs: Leg[];
  total_distance_meters: number;
  total_duration_seconds: number;
  conflicts: Conflict[];
}

export interface GenerateItineraryRequest {
  optimize_order?: boolean;
}

// ============ Traces ============

export type TraceStatus = 'active' | 'paused' | 'completed';

export interface TraceSummary {
  id: string;
  started_at: string;
  ended_at?: string;
  status: TraceStatus;
  total_distance_meters: number;
  total_duration_seconds: number;
}

export interface Trace {
  id: string;
  day_plan_id?: string;
  started_at: string;
  ended_at?: string;
  status: TraceStatus;
  total_distance_meters: number;
  total_duration_seconds: number;
  point_count: number;
  polyline?: string;
  current_location?: Location;
}

export interface TracesResponse {
  traces: TraceSummary[];
}

export interface CreateTraceRequest {
  day_plan_id?: string;
}

export interface TracePointInput {
  lat: number;
  lng: number;
  recorded_at: string;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
}

export interface UploadPointsRequest {
  points: TracePointInput[];
}

export interface UploadPointsResponse {
  accepted_count: number;
  rejected_count: number;
  current_location?: Location;
}

// ============ Stay Points ============

export type StayPointStatus = 'detected' | 'confirmed' | 'ignored';

export interface StayPoint {
  id: string;
  location: Location;
  arrived_at: string;
  departed_at?: string;
  duration_minutes: number;
  status: StayPointStatus;
  place_name?: string;
  matched_stop_id?: string;
}

export interface StayPointsResponse {
  stay_points: StayPoint[];
}

export interface UpdateStayPointRequest {
  status: StayPointStatus;
}

// ============ Places ============

export interface Place {
  place_id: string;
  name: string;
  address: string;
  location: Location;
  types?: string[];
}

export interface PlacesSearchResponse {
  places: Place[];
}

export interface GeocodeResult {
  location: Location;
  formatted_address: string;
  place_id: string;
}
