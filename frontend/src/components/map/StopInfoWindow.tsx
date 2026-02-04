/**
 * Info window component for map markers.
 */

import { useEffect, useState } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import type { Stop, CalendarEvent, Location } from '../../types';

interface StopInfoWindowProps {
  position: Location;
  stop?: Stop;
  event?: CalendarEvent;
  onClose?: () => void;
}

export function StopInfoWindow({
  position,
  stop,
  event,
  onClose,
}: StopInfoWindowProps) {
  const map = useMap();
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    if (!map) return;

    const content = createInfoContent(stop, event);

    const iw = new google.maps.InfoWindow({
      position,
      content,
    });

    iw.open(map);

    if (onClose) {
      iw.addListener('closeclick', onClose);
    }

    setInfoWindow(iw);

    return () => {
      iw.close();
    };
  }, [map, position, stop, event, onClose]);

  return null;
}

function createInfoContent(stop?: Stop, event?: CalendarEvent): string {
  if (stop) {
    return `
      <div style="padding: 8px; max-width: 200px;">
        <h4 style="margin: 0 0 8px 0; font-size: 14px;">${escapeHtml(stop.name)}</h4>
        ${stop.address ? `<p style="margin: 0; font-size: 12px; color: #666;">${escapeHtml(stop.address)}</p>` : ''}
        ${stop.scheduled_arrival ? `<p style="margin: 4px 0 0 0; font-size: 12px;">Arrival: ${formatTime(stop.scheduled_arrival)}</p>` : ''}
      </div>
    `;
  }

  if (event) {
    return `
      <div style="padding: 8px; max-width: 200px;">
        <h4 style="margin: 0 0 8px 0; font-size: 14px;">${escapeHtml(event.title)}</h4>
        ${event.location ? `<p style="margin: 0; font-size: 12px; color: #666;">${escapeHtml(event.location)}</p>` : ''}
        <p style="margin: 4px 0 0 0; font-size: 12px;">
          ${event.all_day ? 'All day' : `${formatTime(event.start_time)} - ${formatTime(event.end_time)}`}
        </p>
      </div>
    `;
  }

  return '<div>No information available</div>';
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
