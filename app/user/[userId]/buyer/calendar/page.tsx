'use client';

import React, { useState, useEffect } from 'react';
import AppCalendar from '@/app/components/shared/AppCalendar';
import CalendarHeader from '@/app/components/shared/CalendarHeader';
import CalendarEventComponent from '@/app/components/shared/CalendarEventComponent';
import { View } from 'react-big-calendar';
// Import the CSS module for this page
import styles from './BuyerCalendarPage.module.css';

// Define the interface for calendar events (should be consistent with WorkerCalendarPage)
interface CalendarEvent {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any;
  status?: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'UNAVAILABLE' | 'OFFER';
  eventType?: 'gig' | 'offer' | 'unavailability';
  buyerName?: string;
  workerName?: string;
  isMyGig?: boolean;
  isBuyerAccepted?: boolean;
}

const FILTERS = [
  'Manage availability',
  'Accepted gigs',
  'See gig offers',
];

const MOCK_EVENTS: CalendarEvent[] = [
  { title: 'Gig Accepted', start: new Date(2023, 11, 18, 9, 0), end: new Date(2023, 11, 18, 10, 30), status: 'ACCEPTED', isBuyerAccepted: true, buyerName: 'Jerimiah Jones' },
  { title: 'Bartender, Central Station', start: new Date(2023, 11, 18, 13, 0), end: new Date(2023, 11, 18, 21, 0), status: 'OFFER' },
  { title: 'Bartender, Central Station', start: new Date(2023, 11, 18, 13, 0), end: new Date(2023, 11, 18, 21, 0), status: 'ACCEPTED', workerName: 'Jessica Hersey' },
];

const BuyerCalendarPage = () => {
  // Real events would be fetched or passed in here
  const realEvents: CalendarEvent[] = [];

  // Set default view based on screen size
  const [view, setView] = useState<View>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'day';
    }
    return 'week';
  });
  const [date, setDate] = useState<Date>(new Date());
  const [activeFilter, setActiveFilter] = useState<string>(FILTERS[1]);
  const [events, setEvents] = useState<CalendarEvent[]>(realEvents);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isViewQA = localStorage.getItem('isViewQA') === 'true';
      setEvents(isViewQA ? MOCK_EVENTS : realEvents);
      // Ensure view is 'day' on mobile after mount (for SSR safety)
      if (window.innerWidth < 768) {
        setView('day');
      }
    }
  }, []);

  // Calendar navigation handler
  const handleNavigate = (action: 'TODAY' | 'PREV' | 'NEXT') => {
    const current = new Date(date);
    if (action === 'TODAY') {
      setDate(new Date());
    } else if (action === 'PREV') {
      if (view === 'day') current.setDate(current.getDate() - 1);
      if (view === 'week') current.setDate(current.getDate() - 7);
      if (view === 'month') current.setMonth(current.getMonth() - 1);
      setDate(current);
    } else if (action === 'NEXT') {
      if (view === 'day') current.setDate(current.getDate() + 1);
      if (view === 'week') current.setDate(current.getDate() + 7);
      if (view === 'month') current.setMonth(current.getMonth() + 1);
      setDate(current);
    }
  };

  return (
    <div className={styles.container}>
      <CalendarHeader
        date={date}
        view={view}
        onViewChange={setView}
        onNavigate={handleNavigate}
        filters={FILTERS}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
      <main className={styles.mainContent}>
        <AppCalendar
          events={events}
          view={view}
          onView={setView}
          onNavigate={setDate}
          components={{ event: (props: any) => <CalendarEventComponent {...props} userRole="buyer" /> }}
          hideToolbar={true}
        />
      </main>
      {/* No footer for buyer view as per design */}
    </div>
  );
};

export default BuyerCalendarPage; 