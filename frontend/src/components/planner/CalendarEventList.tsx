/**
 * Calendar event list component.
 */

import type { CalendarEvent } from '../../types';

interface CalendarEventListProps {
  events: CalendarEvent[];
  isLoading?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
}

export function CalendarEventList({
  events,
  isLoading = false,
  onEventClick,
}: CalendarEventListProps) {
  if (isLoading) {
    return (
      <div className="calendar-event-list loading">
        <p>Loading events...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="calendar-event-list empty">
        <p>No events for this day</p>
      </div>
    );
  }

  return (
    <div className="calendar-event-list">
      <h3>Calendar Events</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {events.map((event) => (
          <CalendarEventItem
            key={event.id}
            event={event}
            onClick={onEventClick}
          />
        ))}
      </ul>
    </div>
  );
}

interface CalendarEventItemProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
}

function CalendarEventItem({ event, onClick }: CalendarEventItemProps) {
  const handleClick = () => {
    onClick?.(event);
  };

  const timeDisplay = event.all_day
    ? 'All day'
    : formatTimeRange(event.start_time, event.end_time);

  return (
    <li
      onClick={handleClick}
      style={{
        padding: '12px',
        marginBottom: '8px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        cursor: onClick ? 'pointer' : 'default',
        borderLeft: '4px solid #4285f4',
      }}
    >
      <div style={{ fontWeight: 500, marginBottom: '4px' }}>{event.title}</div>
      <div style={{ fontSize: '14px', color: '#666' }}>{timeDisplay}</div>
      {event.location && (
        <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
          {event.location}
        </div>
      )}
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
