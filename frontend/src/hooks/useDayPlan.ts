/**
 * Hook for managing day plan and calendar events.
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { CalendarEvent } from '../types';

// Demo mode
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// Mock events for demo mode (Taipei locations)
const DEMO_EVENTS: CalendarEvent[] = [
  {
    id: 'demo-1',
    title: '台北101觀景台',
    start_time: new Date().toISOString().split('T')[0] + 'T10:00:00',
    end_time: new Date().toISOString().split('T')[0] + 'T12:00:00',
    location: '台北市信義區信義路五段7號',
    location_geocoded: { lat: 25.0339, lng: 121.5645 },
    all_day: false,
  },
  {
    id: 'demo-2',
    title: '午餐 - 鼎泰豐',
    start_time: new Date().toISOString().split('T')[0] + 'T12:30:00',
    end_time: new Date().toISOString().split('T')[0] + 'T13:30:00',
    location: '台北市大安區信義路二段194號',
    location_geocoded: { lat: 25.0336, lng: 121.5296 },
    all_day: false,
  },
  {
    id: 'demo-3',
    title: '中正紀念堂',
    start_time: new Date().toISOString().split('T')[0] + 'T14:00:00',
    end_time: new Date().toISOString().split('T')[0] + 'T16:00:00',
    location: '台北市中正區中山南路21號',
    location_geocoded: { lat: 25.0349, lng: 121.5218 },
    all_day: false,
  },
  {
    id: 'demo-4',
    title: '西門町逛街',
    start_time: new Date().toISOString().split('T')[0] + 'T16:30:00',
    end_time: new Date().toISOString().split('T')[0] + 'T18:30:00',
    location: '台北市萬華區西門町',
    location_geocoded: { lat: 25.0421, lng: 121.5081 },
    all_day: false,
  },
  {
    id: 'demo-5',
    title: '晚餐 - 士林夜市',
    start_time: new Date().toISOString().split('T')[0] + 'T19:00:00',
    end_time: new Date().toISOString().split('T')[0] + 'T21:00:00',
    location: '台北市士林區基河路101號',
    location_geocoded: { lat: 25.0879, lng: 121.5243 },
    all_day: false,
  },
];

interface UseDayPlanOptions {
  date: string;
  enabled?: boolean;
}

export function useDayPlan({ date, enabled = true }: UseDayPlanOptions) {
  // Query for calendar events
  const calendarQuery = useQuery({
    queryKey: ['calendar', 'events', date],
    queryFn: () => {
      if (DEMO_MODE) {
        // Return mock events in demo mode
        return Promise.resolve({ events: DEMO_EVENTS });
      }
      return api.getCalendarEvents(date);
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    events: calendarQuery.data?.events ?? [],
    isLoading: calendarQuery.isLoading,
    isError: calendarQuery.isError,
    error: calendarQuery.error,
    refetch: calendarQuery.refetch,
  };
}

/**
 * Format date as YYYY-MM-DD string.
 */
export function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get today's date as YYYY-MM-DD string.
 */
export function getTodayString(): string {
  return formatDateString(new Date());
}
