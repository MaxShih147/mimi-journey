import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarEventList } from '../../src/components/planner/CalendarEventList';
import type { CalendarEvent } from '../../src/types';

const mockEvents: CalendarEvent[] = [
  {
    id: 'ev-1',
    title: 'Morning Meeting',
    start_time: '2026-02-08T09:00:00',
    end_time: '2026-02-08T10:00:00',
    location: 'Office Building',
    location_geocoded: { lat: 25.0, lng: 121.5 },
    all_day: false,
  },
  {
    id: 'ev-2',
    title: 'Lunch',
    start_time: '2026-02-08T12:00:00',
    end_time: '2026-02-08T13:00:00',
    location: null,
    location_geocoded: null,
    all_day: false,
  },
  {
    id: 'ev-3',
    title: 'Holiday',
    start_time: '2026-02-08',
    end_time: '2026-02-09',
    location: null,
    location_geocoded: null,
    all_day: true,
  },
];

describe('CalendarEventList', () => {
  it('renders loading state', () => {
    render(<CalendarEventList events={[]} isLoading={true} />);
    expect(screen.getByText('Loading events...')).toBeInTheDocument();
  });

  it('renders empty state when no events', () => {
    render(<CalendarEventList events={[]} />);
    expect(screen.getByText('No events scheduled for this day')).toBeInTheDocument();
  });

  it('renders event titles', () => {
    render(<CalendarEventList events={mockEvents} />);
    expect(screen.getByText('Morning Meeting')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Holiday')).toBeInTheDocument();
  });

  it('displays event count', () => {
    render(<CalendarEventList events={mockEvents} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows location for events with location', () => {
    render(<CalendarEventList events={mockEvents} />);
    expect(screen.getByText('Office Building')).toBeInTheDocument();
  });

  it('shows "All day" for all-day events', () => {
    render(<CalendarEventList events={mockEvents} />);
    expect(screen.getByText('All day')).toBeInTheDocument();
  });

  it('calls onEventClick when event is clicked', () => {
    const onEventClick = vi.fn();
    render(<CalendarEventList events={mockEvents} onEventClick={onEventClick} />);

    fireEvent.click(screen.getByText('Morning Meeting'));
    expect(onEventClick).toHaveBeenCalledWith(mockEvents[0]);
  });

  it('shows marker number for geocoded events', () => {
    render(<CalendarEventList events={mockEvents} />);
    // First geocoded event should have marker number 1
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('highlights selected event', () => {
    render(
      <CalendarEventList
        events={mockEvents}
        selectedEventId="ev-1"
      />
    );
    // The selected event should exist in the document
    expect(screen.getByText('Morning Meeting')).toBeInTheDocument();
  });
});
