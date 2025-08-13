"use client";

// Worker Calendar Page Component
import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import AppCalendar from "@/app/components/shared/AppCalendar";
import CalendarHeader from "@/app/components/shared/CalendarHeader";
import CalendarEventComponent from "@/app/components/shared/CalendarEventComponent";
import EventDetailModal from "@/app/components/shared/EventDetailModal";
import { View } from "react-big-calendar";
import { useAuth } from "@/context/AuthContext";
import { CalendarEvent } from "@/app/types/CalendarEventTypes";
import { getCalendarEvents } from "@/actions/events/get-calendar-events";
// Import the CSS module for this page
import styles from "./WorkerCalendarPage.module.css";
import Image from "next/image";

const FILTERS = ["Manage availability", "Accepted gigs", "See gig offers"];

// Helper to filter events based on active filter
function filterEvents(events: CalendarEvent[], filter: string): CalendarEvent[] {
  switch (filter) {
    case 'Manage availability':
      return events.filter(e => e.status === 'UNAVAILABLE');
    case 'Accepted gigs':
      return events.filter(e => e.status === 'ACCEPTED');
    case 'See gig offers':
      return events.filter(e => e.status === 'OFFER');
    default:
      return events;
  }
}

const WorkerCalendarPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const pageUserId = params.userId as string;
  const { user, loading: loadingAuth } = useAuth();
  const authUserId = user?.uid;

  // Set default view based on screen size
  const [view, setView] = useState<View>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return "day";
    }
    return "week";
  });
  const [date, setDate] = useState<Date>(new Date());
  const [activeFilter, setActiveFilter] = useState<string>(FILTERS[2]); // Default to "See gig offers"
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterTransitioning, setIsFilterTransitioning] = useState(false);

  useEffect(() => {
    if (loadingAuth) {
      return;
    }

    if (!user) {
      router.push(`/signin?redirect=${pathname}`);
      return;
    }

    if (authUserId !== pageUserId) {
      router.push(`/signin?error=unauthorized`);
      return;
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingAuth]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) {
        return;
      }

      let res;
      try {
        res = await getCalendarEvents({ userId: user.uid, role: 'worker', isViewQA: false });

        if (res.error) {
          throw new Error(res.error);
        }
      } catch (error) {
        throw error;
      }

      const data: CalendarEvent[] = res.events;
      const parsed = data.map((event: CalendarEvent) => ({ ...event, start: new Date(event.start), end: new Date(event.end) }));
      
      setAllEvents(parsed);
      const filteredEvents = filterEvents(parsed, activeFilter);
      setEvents(filteredEvents);
    };

    fetchEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingAuth]);



  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  // Handle event clicks - different behavior for offers vs accepted gigs
  const handleEventClick = (event: CalendarEvent) => {
    if (event.status === 'OFFER') {
      // For offers, show modal instead of navigating to gig details
      // (since offers aren't assigned to workers yet)
      setSelectedEvent(event);
      setIsModalOpen(true);
    } else {
      // For other events, show modal
      setSelectedEvent(event);
      setIsModalOpen(true);
    }
  };

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

  // When filter changes, update events with smooth transition
  const handleFilterChange = (filter: string) => {
    setIsFilterTransitioning(true);
    
    // Add a small delay to show the transition
    setTimeout(() => {
      setActiveFilter(filter);
      setEvents(filterEvents(allEvents, filter));
      setIsFilterTransitioning(false);
    }, 150);
  };

  // Handle view changes with smooth transition
  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  return (
    <div className={styles.container}>
      <CalendarHeader
        date={date}
        view={view}
        role="worker"
        onViewChange={handleViewChange}
        onNavigate={handleNavigate}
        filters={FILTERS}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />
      
      <main className={`${styles.mainContent} ${isFilterTransitioning ? styles.filterTransitioning : ''}`}>
        <AppCalendar
          date={date}
          events={events}
          view={view}
          onView={setView}
          onNavigate={setDate}
          onSelectEvent={handleEventClick}
          userRole="worker"
          activeFilter={activeFilter}
          components={{
            event: (props: any) => (
              <CalendarEventComponent {...props} userRole="worker" view={view} activeFilter={activeFilter} />
            )
          }}
          hideToolbar={true}
        />
      </main>
      <footer className={styles.footer}>
        <button className={styles.homeButton} onClick={() => router.push(`/user/${pageUserId}/worker`)}>
          <Image src="/images/home.svg" alt="Home" width={24} height={24} />
        </button>
        <button className={styles.dashboardButton} onClick={() => router.push(`/user/${pageUserId}/worker`)}>
          Dashboard
        </button>
      </footer>

      <EventDetailModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        userRole="worker"
      />
    </div>
  );
};

export default WorkerCalendarPage; 