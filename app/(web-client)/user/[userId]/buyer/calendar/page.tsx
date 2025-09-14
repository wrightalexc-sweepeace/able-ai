"use client";

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
import styles from "./BuyerCalendarPage.module.css";
import ScreenHeaderWithBack from "@/app/components/layout/ScreenHeaderWithBack";

const FILTERS = ["Accepted gigs", "See gig offers"];

function filterEvents(events: CalendarEvent[], filter: string): CalendarEvent[] {
  switch (filter) {
    case 'Accepted gigs':
      return events.filter(e => e.status === 'ACCEPTED');
    case 'See gig offers':
      return events.filter(e => e.status === 'OFFER');
    default:
      return events;
  }
}

const BuyerCalendarPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const pageUserId = params.userId as string;
  const { user, loading: loadingAuth } = useAuth();
  const authUserId = user?.uid;

  const [view, setView] = useState<View>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return "day";
    }
    return "week";
  });
  const [date, setDate] = useState<Date>(new Date());
  const [activeFilter, setActiveFilter] = useState<string>(FILTERS[0]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (loadingAuth) {
      return;
    }

    if (!user) {
      router.push(`/?redirect=${pathname}`);
      return;
    }

    if (authUserId !== pageUserId) {
      router.push(`/?error=unauthorized`);
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingAuth]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;

      // Use real DB-backed events so newly created gigs appear
      const isViewQA = true;
      const res = await getCalendarEvents({ userId: user.uid, role: 'buyer', isViewQA });
      if (res.error) throw new Error(res.error);
      const source = res.events as CalendarEvent[];

      const parsed = source.map((event: CalendarEvent) => ({ ...event, start: new Date(event.start), end: new Date(event.end) }));

      // Normalize buyer-facing fields so modal shows correct roles
      const normalized = parsed.map(e => {
        const next = { ...e } as CalendarEvent;
        next.buyerName = 'You';
        if (!next.workerName || next.workerName === 'You') {
          const match = typeof next.title === 'string' ? next.title.split(':').pop()?.trim() : undefined;
          if (match && match.length > 0 && match !== next.title) {
            next.workerName = match;
          }
        }
        return next;
      });

      setAllEvents(normalized);
      setEvents(filterEvents(normalized, activeFilter));
    };

    fetchEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingAuth]);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleNavigate = (action: "TODAY" | "PREV" | "NEXT") => {
    const current = new Date(date);
    if (action === "TODAY") {
      setDate(new Date());
    } else if (action === "PREV") {
      if (view === "day") current.setDate(current.getDate() - 1);
      if (view === "week") current.setDate(current.getDate() - 7);
      if (view === "month") current.setMonth(current.getMonth() - 1);
      setDate(current);
    } else if (action === "NEXT") {
      if (view === "day") current.setDate(current.getDate() + 1);
      if (view === "week") current.setDate(current.getDate() + 7);
      if (view === "month") current.setMonth(current.getMonth() + 1);
      setDate(current);
    }
  };

  const handleFilterChange = (filter: string) => {
    setEvents(filterEvents(allEvents, filter));
    setActiveFilter(filter);
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  return (
    <div className={styles.container}>
      <ScreenHeaderWithBack />
      <CalendarHeader
        date={date}
        view={view}
        role="buyer"
        onViewChange={handleViewChange}
        onNavigate={handleNavigate}
        filters={FILTERS}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />
      <main className={styles.mainContent}>
        <AppCalendar
          events={events}
          date={date}
          view={view}
          onView={setView}
          onNavigate={setDate}
          onSelectEvent={handleEventClick}
          userRole="buyer"
          activeFilter={activeFilter}
          components={{
            event: (({ event }: { event: CalendarEvent; title: string }) => (
              <CalendarEventComponent event={event} userRole="buyer" view={view} activeFilter={activeFilter} />
            )) as React.ComponentType<unknown>,
          }}
          hideToolbar={true}
        />
      </main>


      <EventDetailModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        userRole="buyer"
      />
    </div>
  );
};

export default BuyerCalendarPage;
