/**
 * Mock map view when Google Maps API key is not available.
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
        minHeight: '600px',
        background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Grid pattern overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          opacity: 0.5,
        }}
      />

      {/* Header */}
      <div
        style={{
          padding: '20px 24px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 700,
            color: '#1e293b',
          }}>
            Map Preview
          </h3>
          <p style={{
            margin: '4px 0 0',
            fontSize: '13px',
            color: '#64748b',
          }}>
            {eventsWithLocation.length} locations with coordinates
          </p>
        </div>
        <div
          style={{
            backgroundColor: '#fef3c7',
            color: '#92400e',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          Maps API key required
        </div>
      </div>

      {/* Location list */}
      <div
        style={{
          flex: 1,
          padding: '20px 24px',
          overflowY: 'auto',
          position: 'relative',
          zIndex: 5,
        }}
      >
        {eventsWithLocation.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#64748b',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
            <p style={{ margin: 0, fontSize: '15px' }}>
              No geocoded locations to display
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '13px', opacity: 0.8 }}>
              Add locations to your calendar events
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {eventsWithLocation.map((event, index) => {
              const isSelected = event.id === selectedEventId;
              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick?.(event)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    padding: '16px',
                    backgroundColor: isSelected ? 'white' : 'rgba(255, 255, 255, 0.7)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected
                      ? '0 8px 24px rgba(102, 126, 234, 0.2)'
                      : '0 2px 8px rgba(0, 0, 0, 0.05)',
                    border: isSelected
                      ? '2px solid #667eea'
                      : '2px solid transparent',
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                    }
                  }}
                >
                  {/* Number badge */}
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: isSelected ? '#667eea' : '#e2e8f0',
                      color: isSelected ? 'white' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '14px',
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '14px',
                        color: '#1e293b',
                        marginBottom: '4px',
                      }}
                    >
                      {event.title}
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#64748b',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>📍</span>
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {event.location}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 500,
                        }}
                      >
                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                      </span>
                      {event.location_geocoded && (
                        <span
                          style={{
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 500,
                          }}
                        >
                          {event.location_geocoded.lat.toFixed(4)}, {event.location_geocoded.lng.toFixed(4)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div
        style={{
          padding: '16px 24px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(0, 0, 0, 0.05)',
          textAlign: 'center',
          fontSize: '12px',
          color: '#64748b',
          position: 'relative',
          zIndex: 10,
        }}
      >
        Set <code style={{
          backgroundColor: '#f1f5f9',
          padding: '2px 6px',
          borderRadius: '4px',
          fontFamily: 'monospace',
        }}>VITE_GOOGLE_MAPS_API_KEY</code> to enable interactive map
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
