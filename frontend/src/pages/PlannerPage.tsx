/**
 * Planner page - main planning interface.
 */

import { useState } from 'react';
import { CalendarEventList } from '../components/planner/CalendarEventList';
import { MapView } from '../components/map/MapView';
import { MockMapView } from '../components/map/MockMapView';
import { EventMarkers } from '../components/map/StopMarker';
import { StopInfoWindow } from '../components/map/StopInfoWindow';
import { useAuth } from '../hooks/useAuth';
import { useDayPlan, getTodayString } from '../hooks/useDayPlan';
import type { CalendarEvent } from '../types';

// Check if Google Maps API key is available
const HAS_MAPS_API_KEY = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export function PlannerPage() {
  const { user, logout, isLoggingOut, isDemoMode } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const { events, isLoading, isError, error } = useDayPlan({
    date: selectedDate,
  });

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    setSelectedEvent(null);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleInfoWindowClose = () => {
    setSelectedEvent(null);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8' }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: 'white',
          padding: '16px 24px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Mimi Journey</h1>
          {isDemoMode && (
            <span
              style={{
                backgroundColor: '#ff9800',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              DEMO
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user.picture_url && (
                <img
                  src={user.picture_url}
                  alt={user.name}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                  }}
                />
              )}
              <span>{user.name}</span>
            </div>
          )}
          <button
            onClick={logout}
            disabled={isLoggingOut}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f0f0f0',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Date selector */}
        <div style={{ marginBottom: '24px' }}>
          <label
            htmlFor="date-select"
            style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}
          >
            Select Date
          </label>
          <input
            id="date-select"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            style={{
              padding: '8px 12px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>

        {/* Content grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: '24px',
          }}
        >
          {/* Left panel - Calendar events */}
          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          >
            {isError ? (
              <div style={{ color: 'red' }}>
                Error loading events: {error?.message}
              </div>
            ) : (
              <CalendarEventList
                events={events}
                isLoading={isLoading}
                onEventClick={handleEventClick}
              />
            )}
          </div>

          {/* Right panel - Map */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              minHeight: '500px',
            }}
          >
            {HAS_MAPS_API_KEY ? (
              <MapView>
                <EventMarkers
                  events={events}
                  onEventClick={handleEventClick}
                  selectedEventId={selectedEvent?.id}
                />
                {selectedEvent?.location_geocoded && (
                  <StopInfoWindow
                    position={selectedEvent.location_geocoded}
                    event={selectedEvent}
                    onClose={handleInfoWindowClose}
                  />
                )}
              </MapView>
            ) : (
              <MockMapView
                events={events}
                selectedEventId={selectedEvent?.id}
                onEventClick={handleEventClick}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
