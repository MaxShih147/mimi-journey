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

    const marker = new google.maps.Marker({
      position,
      map,
      title,
      label: index !== undefined ? String(index + 1) : undefined,
      icon: isSelected
        ? {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          }
        : undefined,
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
