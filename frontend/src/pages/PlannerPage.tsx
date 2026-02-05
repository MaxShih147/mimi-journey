/**
 * Planner page - main planning interface.
 */

import { useState, useEffect, useCallback } from 'react';
import { CalendarEventList } from '../components/planner/CalendarEventList';
import { MapView } from '../components/map/MapView';
import { MockMapView } from '../components/map/MockMapView';
import { EventMarkers } from '../components/map/StopMarker';
import { useAuth } from '../hooks/useAuth';
import { useDayPlan, getTodayString } from '../hooks/useDayPlan';
import type { CalendarEvent } from '../types';

// Check if Google Maps API key is available
const HAS_MAPS_API_KEY = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  } as React.CSSProperties,
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '16px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)',
  } as React.CSSProperties,
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  } as React.CSSProperties,
  logoText: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'white',
    letterSpacing: '-0.5px',
  } as React.CSSProperties,
  demoBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  } as React.CSSProperties,
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: 'white',
  } as React.CSSProperties,
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '2px solid rgba(255, 255, 255, 0.3)',
  } as React.CSSProperties,
  userName: {
    fontWeight: 500,
    fontSize: '14px',
  } as React.CSSProperties,
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  main: {
    padding: '32px',
    maxWidth: '1400px',
    margin: '0 auto',
  } as React.CSSProperties,
  dateSection: {
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  } as React.CSSProperties,
  dateLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  dateInput: {
    padding: '10px 16px',
    fontSize: '15px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    backgroundColor: 'white',
    color: '#1e293b',
    fontWeight: 500,
    outline: 'none',
    transition: 'border-color 0.2s ease',
  } as React.CSSProperties,
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '380px 1fr',
    gap: '24px',
  } as React.CSSProperties,
  panel: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
  } as React.CSSProperties,
  eventsPanel: {
    padding: '24px',
    maxHeight: 'calc(100vh - 220px)',
    overflowY: 'auto' as const,
  } as React.CSSProperties,
  mapPanel: {
    minHeight: '600px',
    position: 'relative' as const,
  } as React.CSSProperties,
  errorMsg: {
    padding: '16px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '8px',
    fontSize: '14px',
  } as React.CSSProperties,
};

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

  const handleDeselect = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  // Handle Esc key to deselect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDeselect();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleDeselect]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <h1 style={styles.logoText}>Mimi Journey</h1>
          {isDemoMode && <span style={styles.demoBadge}>Demo</span>}
        </div>
        <div style={styles.userSection}>
          {user && (
            <div style={styles.userInfo}>
              {user.picture_url && (
                <img
                  src={user.picture_url}
                  alt={user.name}
                  style={styles.avatar}
                />
              )}
              <span style={styles.userName}>{user.name}</span>
            </div>
          )}
          <button
            onClick={logout}
            disabled={isLoggingOut}
            style={styles.logoutBtn}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main
        style={styles.main}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleDeselect();
        }}
      >
        {/* Date selector */}
        <div style={styles.dateSection}>
          <label htmlFor="date-select" style={styles.dateLabel}>
            Select Date
          </label>
          <input
            id="date-select"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            style={styles.dateInput}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#667eea';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          />
        </div>

        {/* Content grid */}
        <div
          style={styles.contentGrid}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleDeselect();
          }}
        >
          {/* Left panel - Calendar events */}
          <div
            style={{ ...styles.panel, ...styles.eventsPanel }}
            onClick={(e) => {
              if (e.target === e.currentTarget) handleDeselect();
            }}
          >
            {isError ? (
              <div style={styles.errorMsg}>
                Error loading events: {error?.message}
              </div>
            ) : (
              <CalendarEventList
                events={events}
                isLoading={isLoading}
                onEventClick={handleEventClick}
                selectedEventId={selectedEvent?.id}
                onDeselect={handleDeselect}
              />
            )}
          </div>

          {/* Right panel - Map */}
          <div style={{ ...styles.panel, ...styles.mapPanel }}>
            {HAS_MAPS_API_KEY ? (
              <MapView onMapClick={handleDeselect}>
                <EventMarkers
                  events={events}
                  onEventClick={handleEventClick}
                  selectedEventId={selectedEvent?.id}
                />
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
