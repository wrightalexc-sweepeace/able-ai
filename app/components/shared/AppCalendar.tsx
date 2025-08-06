/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useState } from 'react';
import { Calendar as BigCalendar, Formats, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from './AppCalendar.module.css';
import { CalendarEvent } from './CalendarEventComponent';
import WeekViewCalendar from './WeekViewCalendar';

const localizer = momentLocalizer(moment);

type AppCalendarProps<TEvent> = {
  events: TEvent[];
  date: Date;
  view?: View;
  defaultView?: View;
  onSelectEvent?: (event: CalendarEvent) => void;
  onNavigate?: (date: Date) => void;
  onView?: (view: View) => void;
  minTime?: Date;
  maxTime?: Date;
  eventPropGetter?: (event: TEvent) => { style: React.CSSProperties };
  components?: Record<string, React.ComponentType<unknown>>;
  height?: string;
  hideToolbar?: boolean;
  formats?: Formats | undefined;
};

const AppCalendar = <TEvent extends object>({
  events = [],
  view,
  date,
  defaultView = 'month',
  onSelectEvent,
  onNavigate,
  onView,
  minTime,
  maxTime,
  eventPropGetter,
  components,
  height = "70vh",
  hideToolbar = false,
  formats = {
    eventTimeRangeFormat: () => ''
  },
}: AppCalendarProps<TEvent>) => {

  const role = localStorage.getItem('lastRoleUsed');
  const [showDayViewModal, setShowDayViewModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // No filtering - let react-big-calendar handle the layout naturally
  const filteredEvents = events;

  // Simple event prop getter that forces proper positioning
  const defaultEventPropGetter = (event: TEvent) => {
    const baseStyle: React.CSSProperties = {
      backgroundColor: '#3a3a3a',
      borderRadius: '4px',
      color: '#e0e0e0',
      border: '1px solid #525252',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    };

    return { style: baseStyle };
  };

  // Custom date cell component for click-to-navigate functionality
  const DateCell = (props: any) => {
    const handleDateClick = () => {
      if (props.value) {
        setSelectedDate(props.value);
        setShowDayViewModal(true);
      }
    };

    return (
      <div 
        className={styles.clickableDateCell}
        onClick={handleDateClick}
        style={{ cursor: 'pointer' }}
      >
        {props.children}
      </div>
    );
  };

  // Handle navigation to day view
  const handleNavigateToDayView = () => {
    if (selectedDate && onNavigate && onView) {
      onNavigate(selectedDate);
      onView('day');
    }
    setShowDayViewModal(false);
    setSelectedDate(null);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowDayViewModal(false);
    setSelectedDate(null);
  };

  // Simple calendar components
  const calendarComponents = {
    ...components,
    ...(hideToolbar ? { toolbar: () => null } : {}),
    dateCellWrapper: DateCell,
  };

  // Wrap onSelectEvent to match the expected signature
  const handleSelectEvent = onSelectEvent
    ? (event: object) => onSelectEvent(event as CalendarEvent)
    : undefined;

  // Wrap eventPropGetter to match the expected signature
  const handleEventPropGetter = eventPropGetter
    ? (event: object) => eventPropGetter(event as TEvent)
    : defaultEventPropGetter;

  // Simple formats
  const calendarFormats = {
    ...formats,
    eventTimeRangeFormat: () => '', // Hide time in month view
  };

  // If it's week view, use our custom component
  if (view === 'week') {
    return (
      <div className={styles.calendarWrapper} style={{ height }}>
        <WeekViewCalendar
          events={filteredEvents as any[]}
          currentDate={date}
          onEventClick={(event) => {
            if (handleSelectEvent) {
              handleSelectEvent(event as any);
            }
          }}
          onDateClick={(clickedDate) => {
            if (onNavigate) {
              onNavigate(clickedDate);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.calendarWrapper} style={{ height }}>
      <BigCalendar
        localizer={localizer}
        events={filteredEvents}
        date={date}
        view={view}
        startAccessor={(event: TEvent) => (event as { start: Date }).start}
        endAccessor={(event: TEvent) => (event as { end: Date }).end}
        allDayAccessor={(event: TEvent) => (event as { allDay?: boolean }).allDay || false}
        titleAccessor={(event: TEvent & { title?: string }) => event.title || ''}
        defaultView={defaultView}
        views={['month', 'week', 'day', 'agenda']}
        selectable={false}
        onSelectEvent={handleSelectEvent}
        onNavigate={onNavigate}
        onView={onView}
        min={minTime}
        max={maxTime}
        eventPropGetter={handleEventPropGetter}
        components={calendarComponents}
        formats={calendarFormats}
        popup
        step={60}
        timeslots={1}
        showMultiDayTimes={false}
        dayLayoutAlgorithm="no-overlap"
      />

      {/* Day View Navigation Modal */}
      {showDayViewModal && selectedDate && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Switch to Day View</h3>
              <button className={styles.closeButton} onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Would you like to switch to day view for:</p>
              <p className={styles.selectedDate}>
                {moment(selectedDate).format('dddd, MMMM Do, YYYY')}
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelButton} onClick={handleCloseModal}>
                Cancel
              </button>
              <button className={styles.confirmButton} onClick={handleNavigateToDayView}>
                Go to Day View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppCalendar; 