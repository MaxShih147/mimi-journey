/**
 * Main map view component using @vis.gl/react-google-maps.
 */

import { Map, useMap } from '@vis.gl/react-google-maps';
import { useEffect, useCallback } from 'react';
import type { Location } from '../../types';

// Default center: Taipei
const DEFAULT_CENTER = { lat: 25.033, lng: 121.5654 };
const DEFAULT_ZOOM = 13;

interface MapViewProps {
  center?: Location;
  zoom?: number;
  markers?: MarkerData[];
  onMarkerClick?: (marker: MarkerData) => void;
  onMapClick?: (location: Location) => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export interface MarkerData {
  id: string;
  position: Location;
  title?: string;
  label?: string;
}

export function MapView({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  markers = [],
  onMarkerClick,
  onMapClick,
  children,
  style,
}: MapViewProps) {
  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (onMapClick && e.latLng) {
        onMapClick({
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        });
      }
    },
    [onMapClick]
  );

  return (
    <Map
      defaultCenter={center}
      defaultZoom={zoom}
      gestureHandling="greedy"
      disableDefaultUI={false}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        ...style,
      }}
      onClick={handleMapClick}
    >
      {markers.map((marker) => (
        <MapMarker
          key={marker.id}
          marker={marker}
          onClick={onMarkerClick}
        />
      ))}
      {children}
    </Map>
  );
}

interface MapMarkerProps {
  marker: MarkerData;
  onClick?: (marker: MarkerData) => void;
}

function MapMarker({ marker, onClick }: MapMarkerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const gMarker = new google.maps.Marker({
      position: marker.position,
      map,
      title: marker.title,
      label: marker.label,
    });

    if (onClick) {
      gMarker.addListener('click', () => onClick(marker));
    }

    return () => {
      gMarker.setMap(null);
    };
  }, [map, marker, onClick]);

  return null;
}

/**
 * Hook to fit map bounds to markers.
 */
export function useFitBounds(markers: MarkerData[]) {
  const map = useMap();

  useEffect(() => {
    if (!map || markers.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    markers.forEach((marker) => {
      bounds.extend(marker.position);
    });

    if (markers.length === 1) {
      map.setCenter(markers[0].position);
      map.setZoom(15);
    } else {
      map.fitBounds(bounds, { padding: 50 });
    }
  }, [map, markers]);
}
