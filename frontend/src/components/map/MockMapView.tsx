/**
 * Mock map view for demo mode without Google Maps API key.
 */

import type { CalendarEvent } from '../../types';

interface MockMapViewProps {
  events: CalendarEvent[];
  selectedEventId?: string;
  onEventClick?: (event: CalendarEvent) => void;
}

export function MockMapView({ events, selectedEventId, onEventClick }: MockMapViewProps) {
  const eventsWithLocation = events.filter((e) => e.location_geocoded);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: '500px',
        backgroundColor: '#e8f4e8',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
      }}
    >
      {/* Map background pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(200, 230, 200, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(200, 230, 200, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Demo mode banner */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          zIndex: 10,
        }}
      >
        Demo Mode - Add VITE_GOOGLE_MAPS_API_KEY for real map
      </div>

      {/* Markers */}
      {eventsWithLocation.map((event, index) => {
        const isSelected = event.id === selectedEventId;
        // Position markers in a rough layout based on their coordinates
        const x = ((event.location_geocoded!.lng - 121.5) * 2000 + 200) % 400 + 50;
        const y = ((25.1 - event.location_geocoded!.lat) * 2000 + 100) % 300 + 80;

        return (
          <div
            key={event.id}
            onClick={() => onEventClick?.(event)}
            style={{
              position: 'absolute',
              left: `${x}px`,
              top: `${y}px`,
              cursor: 'pointer',
              zIndex: isSelected ? 20 : 10,
              transform: 'translate(-50%, -100%)',
            }}
          >
            {/* Marker pin */}
            <div
              style={{
                width: '30px',
                height: '40px',
                position: 'relative',
              }}
            >
              <svg viewBox="0 0 24 36" fill="none" style={{ width: '100%', height: '100%' }}>
                <path
                  d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z"
                  fill={isSelected ? '#2196F3' : '#F44336'}
                />
                <circle cx="12" cy="12" r="6" fill="white" />
                <text
                  x="12"
                  y="16"
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill={isSelected ? '#2196F3' : '#F44336'}
                >
                  {index + 1}
                </text>
              </svg>
            </div>

            {/* Info popup for selected marker */}
            {isSelected && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '45px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                  minWidth: '200px',
                  zIndex: 30,
                }}
              >
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>{event.title}</h4>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>
                  {event.location}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                  {formatTime(event.start_time)} - {formatTime(event.end_time)}
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          backgroundColor: 'white',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          fontSize: '12px',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Taipei Day Trip</div>
        {eventsWithLocation.map((event, index) => (
          <div
            key={event.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '4px',
              backgroundColor: event.id === selectedEventId ? '#e3f2fd' : 'transparent',
            }}
            onClick={() => onEventClick?.(event)}
          >
            <span
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: event.id === selectedEventId ? '#2196F3' : '#F44336',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 'bold',
              }}
            >
              {index + 1}
            </span>
            <span>{event.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
