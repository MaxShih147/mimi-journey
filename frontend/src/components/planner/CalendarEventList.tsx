/**
 * Calendar event list component.
 */

import type { CalendarEvent } from '../../types';

interface CalendarEventListProps {
  events: CalendarEvent[];
  isLoading?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
  selectedEventId?: string;
  onDeselect?: () => void;
}

const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    minHeight: '100%',
    cursor: 'default',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  } as React.CSSProperties,
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 700,
    color: '#1e293b',
  } as React.CSSProperties,
  count: {
    backgroundColor: '#667eea',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
  } as React.CSSProperties,
  list: {
    listStyle: 'none',
    padding: 0,
    paddingBottom: '40px',
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  } as React.CSSProperties,
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    color: '#64748b',
  } as React.CSSProperties,
  empty: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: '#64748b',
  } as React.CSSProperties,
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  } as React.CSSProperties,
  emptyText: {
    margin: 0,
    fontSize: '15px',
  } as React.CSSProperties,
};

export function CalendarEventList({
  events,
  isLoading = false,
  onEventClick,
  selectedEventId,
  onDeselect,
}: CalendarEventListProps) {
  const handleContainerClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the container (blank space)
    if (e.target === e.currentTarget && onDeselect) {
      onDeselect();
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <span>Loading events...</span>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>📅</div>
          <p style={styles.emptyText}>No events scheduled for this day</p>
        </div>
      </div>
    );
  }

  // Pre-calculate marker numbers (only for events with GPS location)
  const markerNumbers = new Map<string, number>();
  let markerCount = 0;
  events.forEach((event) => {
    if (event.location_geocoded) {
      markerCount++;
      markerNumbers.set(event.id, markerCount);
    }
  });

  return (
    <div style={styles.container} onClick={handleContainerClick}>
      <div style={styles.header}>
        <h3 style={styles.title}>Today's Events</h3>
        <span style={styles.count}>{events.length}</span>
      </div>
      <ul style={styles.list} onClick={handleContainerClick}>
        {events.map((event) => (
          <CalendarEventItem
            key={event.id}
            event={event}
            markerNumber={markerNumbers.get(event.id)}
            onClick={onEventClick}
            isSelected={event.id === selectedEventId}
          />
        ))}
      </ul>
    </div>
  );
}

interface CalendarEventItemProps {
  event: CalendarEvent;
  markerNumber?: number;
  onClick?: (event: CalendarEvent) => void;
  isSelected?: boolean;
}

const eventColors = [
  { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
  { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
  { bg: '#fefce8', border: '#eab308', text: '#854d0e' },
  { bg: '#fdf4ff', border: '#d946ef', text: '#86198f' },
  { bg: '#fff7ed', border: '#f97316', text: '#9a3412' },
];

function getEventColor(id: string) {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return eventColors[hash % eventColors.length];
}

function CalendarEventItem({ event, markerNumber, onClick, isSelected }: CalendarEventItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(event);
  };

  const timeDisplay = event.all_day
    ? 'All day'
    : formatTimeRange(event.start_time, event.end_time);

  const color = getEventColor(event.id);
  const hasMarker = markerNumber !== undefined;

  const itemStyle: React.CSSProperties = {
    padding: '16px',
    paddingLeft: '12px',
    backgroundColor: isSelected ? color.bg : 'white',
    borderRadius: '12px',
    cursor: onClick ? 'pointer' : 'default',
    borderLeft: `4px solid ${color.border}`,
    boxShadow: isSelected
      ? `0 4px 12px rgba(0, 0, 0, 0.1)`
      : '0 1px 3px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s ease',
    border: isSelected ? `1px solid ${color.border}` : '1px solid #f1f5f9',
    borderLeftWidth: '4px',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  };

  const numberBadgeStyle: React.CSSProperties = {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: hasMarker ? '#ef4444' : '#94a3b8',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 700,
    flexShrink: 0,
    marginTop: '2px',
  };

  return (
    <li
      onClick={handleClick}
      style={itemStyle}
      onMouseOver={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = '#f8fafc';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
        }
      }}
      onMouseOut={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
        }
      }}
    >
      <div style={numberBadgeStyle}>
        {hasMarker ? markerNumber : '—'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 600,
          marginBottom: '6px',
          color: '#1e293b',
          fontSize: '15px',
        }}>
          {event.title}
        </div>
        <div style={{
          fontSize: '13px',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span>🕐</span>
          <span>{timeDisplay}</span>
        </div>
        {event.location && (
          <div style={{
            fontSize: '13px',
            color: '#64748b',
            marginTop: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span>📍</span>
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {event.location}
            </span>
          </div>
        )}
      </div>
    </li>
  );
}

function formatTimeRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return `${formatTime(startDate)} - ${formatTime(endDate)}`;
}
