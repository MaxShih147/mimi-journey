/**
 * API client with credentials handling for cookie-based authentication.
 */

import type {
  User,
  CalendarEventsResponse,
  DayPlan,
  DayPlanSummary,
  DayPlansResponse,
  CreateDayPlanRequest,
  UpdateDayPlanRequest,
  Stop,
  StopsResponse,
  CreateStopRequest,
  UpdateStopRequest,
  ReorderStopsRequest,
  RoutePreviewRequest,
  RoutePreviewResponse,
  GeneratedItinerary,
  GenerateItineraryRequest,
  Trace,
  TracesResponse,
  CreateTraceRequest,
  UploadPointsRequest,
  UploadPointsResponse,
  StayPointsResponse,
  StayPoint,
  UpdateStayPointRequest,
  PlacesSearchResponse,
  GeocodeResult,
  Place,
  ApiError,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Include cookies for session auth
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        code: 'UNKNOWN_ERROR',
        message: response.statusText,
      }));
      throw new ApiClientError(error.message, error.code, response.status, error.details);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  private get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  private post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  private patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  private delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ============ Auth ============

  getLoginUrl(): string {
    return `${this.baseUrl}/auth/google/login`;
  }

  async getMe(): Promise<User> {
    return this.get<User>('/auth/me');
  }

  async logout(): Promise<void> {
    return this.post<void>('/auth/logout');
  }

  // ============ Calendar ============

  async getCalendarEvents(date: string): Promise<CalendarEventsResponse> {
    return this.get<CalendarEventsResponse>(`/calendar/events?date=${encodeURIComponent(date)}`);
  }

  // ============ Day Plans ============

  async getDayPlans(params?: {
    start_date?: string;
    end_date?: string;
    status?: string;
  }): Promise<DayPlansResponse> {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    if (params?.status) searchParams.set('status', params.status);

    const query = searchParams.toString();
    return this.get<DayPlansResponse>(`/day-plans${query ? `?${query}` : ''}`);
  }

  async getDayPlan(planId: string): Promise<DayPlan> {
    return this.get<DayPlan>(`/day-plans/${planId}`);
  }

  async createDayPlan(data: CreateDayPlanRequest): Promise<DayPlan> {
    return this.post<DayPlan>('/day-plans', data);
  }

  async updateDayPlan(planId: string, data: UpdateDayPlanRequest): Promise<DayPlan> {
    return this.patch<DayPlan>(`/day-plans/${planId}`, data);
  }

  async deleteDayPlan(planId: string): Promise<void> {
    return this.delete<void>(`/day-plans/${planId}`);
  }

  async generateItinerary(
    planId: string,
    data?: GenerateItineraryRequest
  ): Promise<GeneratedItinerary> {
    return this.post<GeneratedItinerary>(`/day-plans/${planId}/generate`, data);
  }

  // ============ Stops ============

  async getStops(planId: string): Promise<StopsResponse> {
    return this.get<StopsResponse>(`/day-plans/${planId}/stops`);
  }

  async createStop(planId: string, data: CreateStopRequest): Promise<Stop> {
    return this.post<Stop>(`/day-plans/${planId}/stops`, data);
  }

  async updateStop(planId: string, stopId: string, data: UpdateStopRequest): Promise<Stop> {
    return this.patch<Stop>(`/day-plans/${planId}/stops/${stopId}`, data);
  }

  async deleteStop(planId: string, stopId: string): Promise<void> {
    return this.delete<void>(`/day-plans/${planId}/stops/${stopId}`);
  }

  async reorderStops(planId: string, data: ReorderStopsRequest): Promise<StopsResponse> {
    return this.post<StopsResponse>(`/day-plans/${planId}/stops/reorder`, data);
  }

  // ============ Routes ============

  async previewRoute(data: RoutePreviewRequest): Promise<RoutePreviewResponse> {
    return this.post<RoutePreviewResponse>('/routes/preview', data);
  }

  // ============ Traces ============

  async getTraces(params?: { date?: string; status?: string }): Promise<TracesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.date) searchParams.set('date', params.date);
    if (params?.status) searchParams.set('status', params.status);

    const query = searchParams.toString();
    return this.get<TracesResponse>(`/traces${query ? `?${query}` : ''}`);
  }

  async getTrace(
    traceId: string,
    params?: { include_points?: boolean; simplified?: boolean }
  ): Promise<Trace> {
    const searchParams = new URLSearchParams();
    if (params?.include_points !== undefined)
      searchParams.set('include_points', String(params.include_points));
    if (params?.simplified !== undefined)
      searchParams.set('simplified', String(params.simplified));

    const query = searchParams.toString();
    return this.get<Trace>(`/traces/${traceId}${query ? `?${query}` : ''}`);
  }

  async startTrace(data?: CreateTraceRequest): Promise<Trace> {
    return this.post<Trace>('/traces', data);
  }

  async stopTrace(traceId: string): Promise<Trace> {
    return this.post<Trace>(`/traces/${traceId}/stop`);
  }

  async uploadTracePoints(traceId: string, data: UploadPointsRequest): Promise<UploadPointsResponse> {
    return this.post<UploadPointsResponse>(`/traces/${traceId}/points`, data);
  }

  async getStayPoints(traceId: string): Promise<StayPointsResponse> {
    return this.get<StayPointsResponse>(`/traces/${traceId}/stay-points`);
  }

  async updateStayPoint(
    traceId: string,
    stayPointId: string,
    data: UpdateStayPointRequest
  ): Promise<StayPoint> {
    return this.patch<StayPoint>(`/traces/${traceId}/stay-points/${stayPointId}`, data);
  }

  // ============ Places ============

  async searchPlaces(query: string, location?: string): Promise<PlacesSearchResponse> {
    const searchParams = new URLSearchParams({ q: query });
    if (location) searchParams.set('location', location);

    return this.get<PlacesSearchResponse>(`/places/search?${searchParams}`);
  }

  async geocode(address: string): Promise<GeocodeResult> {
    return this.get<GeocodeResult>(`/places/geocode?address=${encodeURIComponent(address)}`);
  }

  async reverseGeocode(lat: number, lng: number): Promise<Place> {
    return this.get<Place>(`/places/reverse-geocode?lat=${lat}&lng=${lng}`);
  }
}

export class ApiClientError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    status: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.details = details;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isValidationError(): boolean {
    return this.status === 422;
  }
}

export const api = new ApiClient();
