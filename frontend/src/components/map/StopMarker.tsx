/**
 * Stop marker component for the map.
 */

import { useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import type { Stop, CalendarEvent, Location } from '../../types';

interface StopMarkerProps {
  stop?: Stop;
  event?: CalendarEvent;
  index?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export function StopMarker({
  stop,
  event,
  index,
  isSelected = false,
  onClick,
}: StopMarkerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    let position: Location | null = null;
    let title = '';

    if (stop) {
      position = stop.location;
      title = stop.name;
    } else if (event?.location_geocoded) {
      position = event.location_geocoded;
      title = event.title;
    }

    if (!position) return;

    // Create SVG marker for selected state
    const selectedIcon = {
      url: 'data:image/svg+xml,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3"/>
          <circle cx="24" cy="24" r="8" fill="white"/>
        </svg>
      `),
      scaledSize: new google.maps.Size(48, 48),
      anchor: new google.maps.Point(24, 24),
    };

    const marker = new google.maps.Marker({
      position,
      map,
      title,
      label: index !== undefined
        ? {
            text: String(index + 1),
            color: isSelected ? '#1d4ed8' : 'white',
            fontWeight: 'bold',
            fontSize: isSelected ? '14px' : '12px',
          }
        : undefined,
      icon: isSelected ? selectedIcon : undefined,
    });

    if (onClick) {
      marker.addListener('click', onClick);
    }

    return () => {
      marker.setMap(null);
    };
  }, [map, stop, event, index, isSelected, onClick]);

  return null;
}

interface EventMarkersProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  selectedEventId?: string;
}

export function EventMarkers({
  events,
  onEventClick,
  selectedEventId,
}: EventMarkersProps) {
  const eventsWithLocation = events.filter((e) => e.location_geocoded);

  return (
    <>
      {eventsWithLocation.map((event, index) => (
        <StopMarker
          key={event.id}
          event={event}
          index={index}
          isSelected={event.id === selectedEventId}
          onClick={() => onEventClick?.(event)}
        />
      ))}
    </>
  );
}
