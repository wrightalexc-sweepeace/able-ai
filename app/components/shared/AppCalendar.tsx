/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useState } from 'react';
import { Calendar as BigCalendar, Formats, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import { Eye } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from './AppCalendar.module.css';
import { CalendarEvent } from './CalendarEventComponent';
import WeekViewCalendar from './WeekViewCalendar';
import DayViewCalendar from './DayViewCalendar';

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
  userRole?: string;
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
  userRole,
}: AppCalendarProps<TEvent>) => {

  const [showDayViewModal, setShowDayViewModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // No filtering - let react-big-calendar handle the layout naturally
  const filteredEvents = events;

  // Event prop getter that applies dynamic colors based on event status
  const defaultEventPropGetter = (event: TEvent) => {
    // Get event background color based on status and user role
    const getEventBackgroundColor = (event: any) => {
      switch (event.status) {
        case 'ACCEPTED':
          return userRole === 'worker' ? 'var(--primary-color)' : 'var(--success-color)';
        case 'OFFER':
          return '#3b82f6'; // Blue color for offers (changed from amber)
        case 'IN_PROGRESS':
          return '#10b981'; // Emerald green
        case 'COMPLETED':
          return '#059669'; // Dark green
        case 'PENDING':
          return '#eab308'; // Yellow
        case 'UNAVAILABLE':
          return '#6b7280'; // Gray
        case 'CANCELLED':
          return '#dc2626'; // Red
        default:
          return '#9ca3af'; // Default: Light gray
      }
    };

    const backgroundColor = getEventBackgroundColor(event);
    
    const baseStyle: React.CSSProperties = {
      backgroundColor: backgroundColor,
      borderRadius: '4px',
      color: '#ffffff', // White text for better contrast on colored backgrounds
      border: '1px solid rgba(255, 255, 255, 0.2)',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
    };

    // Return style with !important for background color to override CSS
    return { 
      style: {
        ...baseStyle,
        backgroundColor: backgroundColor
      }
    };
  };

  // Custom date cell component for click-to-navigate functionality
  const DateCell = (props: any) => {
    const handleDateClick = () => {
      if (props.value) {
        setSelectedDate(props.value);
        setShowDayViewModal(true);
      }
    };

    // Check if this date has any events
    const hasEvents = filteredEvents.some(event => {
      const eventDate = moment((event as any).start).startOf('day');
      const cellDate = moment(props.value).startOf('day');
      return eventDate.isSame(cellDate);
    });

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

  // Custom event component for month view with view icon
  const EventComponent = (props: any) => {
    // Check if we're in month view by looking at the current view prop
    const isMonthView = view === 'month';
    
    // Add data attributes to the parent rbc-event element (for month view)
    React.useEffect(() => {
      // Use a more reliable method to find the parent rbc-event element
      const findParentEventElement = () => {
        // Try multiple selectors to find the parent event element
        const selectors = [
          '.rbc-event',
          `[title="${props.event.title}"]`,
          `[data-event-id="${props.event.id}"]`
        ];
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            const parentEvent = element.closest('.rbc-event') || element;
            if (parentEvent && parentEvent.classList.contains('rbc-event')) {
              return parentEvent;
            }
          }
        }
        
        // Fallback: find any rbc-event element
        return document.querySelector('.rbc-event');
      };
      
      const eventElement = findParentEventElement();
      if (eventElement) {
        eventElement.setAttribute('data-status', props.event.status || '');
        eventElement.setAttribute('data-role', userRole || '');
      }
    }, [props.event.status, userRole, props.event.title, props.event.id]);
    
         if (isMonthView) {
       // Month view: vertical layout with text on top, icon below
       return (
         <div className={styles.eventComponent}>
           <span style={{ fontSize: '2.5vw', color: '#fff', fontWeight: '500', whiteSpace: 'nowrap' }}>Open gig</span>
           <br />
           <Eye size={25} color="#fff" />
         </div>
       );
     } else {
       // Day/Agenda view: horizontal layout with icon and text side by side
       return (
         <div className={styles.eventComponentHorizontal}>
           <Eye size={8} color="#888" />
           <span style={{ fontSize: '1.5vw', color: '#fff', fontWeight: '500', whiteSpace: 'nowrap' }}>Open gig</span>
         </div>
       );
     }
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
    event: EventComponent,
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
          userRole={userRole || 'buyer'}
        />
      </div>
    );
  }

  // If it's day view, use our custom component
  if (view === 'day') {
    return (
      <div className={styles.calendarWrapper} style={{ height }}>
        <DayViewCalendar
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
          userRole={userRole || 'buyer'}
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