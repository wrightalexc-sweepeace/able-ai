/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
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
import { getWorkerAvailability } from "@/actions/availability/manage-availability";
import { convertAvailabilitySlotsToEvents } from "@/app/utils/availabilityUtils";
import { AvailabilitySlot } from "@/app/types/AvailabilityTypes";
import NewAvailabilityModal from "@/app/components/availability/NewAvailabilityModal";
import ClearAvailabilityAlert from "@/app/components/availability/ClearAvailabilityAlert";
import WeeklyAvailabilityView from "@/app/components/availability/WeeklyAvailabilityView";
import DailyAvailabilityView from "@/app/components/availability/DailyAvailabilityView";
import MonthlyAvailabilityView from "@/app/components/availability/MonthlyAvailabilityView";
// Import the CSS module for this page
import styles from "./WorkerCalendarPage.module.css";
import Image from "next/image";
import ScreenHeaderWithBack from "@/app/components/layout/ScreenHeaderWithBack";
import { getWorkerOffers, WorkerGigOffer } from "@/actions/gigs/get-worker-offers";
import { acceptGigOffer } from "@/actions/gigs/accept-gig-offer";
import { updateGigOfferStatus } from "@/actions/gigs/update-gig-offer-status";
import { X } from "lucide-react";

const FILTERS = ["Manage availability", "Accepted gigs", "See gig offers"];

// Helper to filter events based on active filter
function filterEvents(events: CalendarEvent[], filter: string): CalendarEvent[] {
  switch (filter) {
    case 'Manage availability':
      return events.filter(e => e.status === 'AVAILABLE');
    case 'Accepted gigs':
      return events.filter(e => e.status === 'ACCEPTED');
    case 'See gig offers':
      return events.filter(e => e.status === 'OFFER');
    default:
      return events;
  }
}

type GigOffer = WorkerGigOffer;

async function fetchWorkerData(
  userId: string,
  filters?: string[],
): Promise<{ offers: GigOffer[]; 
  acceptedGigs: GigOffer[] }> {
  console.log(
    "Fetching worker data for workerId:",
    userId,
    "with filters:",
    filters
  );

  const result = await getWorkerOffers(userId);
  
  if (result.error) {
    throw new Error(result.error);
  }

  if (!result.data) {
    throw new Error('No data received from server');
  }

  return result.data;
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
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [selectedAvailabilitySlot, setSelectedAvailabilitySlot] = useState<AvailabilitySlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isEditingSingleOccurrence, setIsEditingSingleOccurrence] = useState(false);
  const [showEditOptionsModal, setShowEditOptionsModal] = useState(false);
  const [processingOfferId, setProcessingOfferId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<"accept" | "decline" | null>(null);
  const [offers, setOffers] = useState<GigOffer[]>([]);
    const [acceptedGigs, setAcceptedGigs] = useState<GigOffer[]>([]);

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

      try {
        // Fetch calendar events
        const calendarRes = await getCalendarEvents({ userId: user.uid, role: 'worker', isViewQA: false });
        if (calendarRes.error) {
          throw new Error(calendarRes.error);
        }

        // Fetch availability slots
        const availabilityRes = await getWorkerAvailability(user.uid);
        if (availabilityRes.error) {
          console.error('Error fetching availability:', availabilityRes.error);
        }

        // Debug: Log what we're getting
        console.log('availabilityRes:', availabilityRes);
        console.log('availabilityRes.availability:', availabilityRes.availability);
        console.log('typeof availabilityRes.availability:', typeof availabilityRes.availability);
        console.log('Array.isArray(availabilityRes.availability):', Array.isArray(availabilityRes.availability));

        // Debug: Log what we're getting
        console.log('availabilityRes:', availabilityRes);
        console.log('availabilityRes.availability:', availabilityRes.availability);
        console.log('typeof availabilityRes.availability:', typeof availabilityRes.availability);
        console.log('Array.isArray(availabilityRes.availability):', Array.isArray(availabilityRes.availability));

        const calendarData: CalendarEvent[] = calendarRes.events;
        const parsed = calendarData.map((event: CalendarEvent) => ({ ...event, start: new Date(event.start), end: new Date(event.end) }));
        
        // Convert availability slots to events
        const availabilityEvents = convertAvailabilitySlotsToEvents(
          availabilityRes.availability || [],
          new Date(date.getFullYear(), date.getMonth(), 1),
          new Date(date.getFullYear(), date.getMonth() + 1, 0)
        );

        // Combine all events
        const allEventsCombined = [...parsed, ...availabilityEvents];
        
        setAllEvents(allEventsCombined);
        
        // Ensure availabilitySlots is always an array
        const availabilityArray = Array.isArray(availabilityRes.availability) 
          ? availabilityRes.availability 
          : availabilityRes.availability 
            ? [availabilityRes.availability] 
            : [];
        setAvailabilitySlots(availabilityArray);
        
        const filteredEvents = filterEvents(allEventsCombined, activeFilter);
        setEvents(filteredEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeFilter, date]);

  useEffect(() => {
    // Check if user is authorized to view this page
    if (!loadingAuth && user && authUserId === pageUserId) {
      console.log("Debug - User authorized, fetching worker data...");
      fetchWorkerData(pageUserId)
        .then((data) => {
          console.log("Debug - offer received:", data);
          setOffers(data.offers);
          setAcceptedGigs(data.acceptedGigs);
        })
        .catch((err) => {
          console.error("Error fetching worker data:", err);
          setOffers([]);
          setAcceptedGigs([]);
        })
      }
  }, [user, loadingAuth, authUserId, pageUserId]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  // Handle event clicks - different behavior for offers vs accepted gigs
  const handleEventClick = (event: CalendarEvent) => {
    if (event.status === 'AVAILABLE') {
      // For availability events, check if it's a recurring pattern
      const slot = Array.isArray(availabilitySlots) ? availabilitySlots.find(s => s.id === event.originalSlotId) : null;
      
      if (slot && slot.frequency !== 'never') {
        // It's a recurring pattern, show edit options
        setSelectedAvailabilitySlot(slot);
        setSelectedDate(event.start);
        setShowEditOptionsModal(true);
      } else {
        // Single occurrence or non-recurring, edit directly
        setSelectedAvailabilitySlot(slot || null);
        setIsEditingSingleOccurrence(false);
        setIsAvailabilityModalOpen(true);
      }
    } else if (event.status === 'OFFER') {
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

  // Handle availability management
  const handleAvailabilitySave = async (data: any) => {
    console.log('handleAvailabilitySave called with data:', data);
    console.log('handleAvailabilitySave data type:', typeof data);
    console.log('handleAvailabilitySave data keys:', Object.keys(data || {}));
    console.log('isEditingSingleOccurrence:', isEditingSingleOccurrence);
    
    if (!user) {
      console.log('No user found');
      return;
    }

    // Test server action first
    try {
      const { testAvailabilityAction } = await import('@/actions/availability/test-availability');
      console.log('Testing server action...');
      const testResult = await testAvailabilityAction(user.uid);
      console.log('Test result:', testResult);
    } catch (testError) {
      console.error('Test action failed:', testError);
    }

    try {
      if (selectedAvailabilitySlot) {
        if (isEditingSingleOccurrence) {
          // Create a new single occurrence slot for this specific date
          console.log('Creating new single occurrence slot');
          const { createAvailabilitySlot } = await import('@/actions/availability/manage-availability');
          const result = await createAvailabilitySlot(user.uid, data);
          console.log('Create single occurrence result:', result);
          
          if (result.error) {
            console.error('Create single occurrence failed:', result.error);
            alert(`Failed to create single occurrence: ${result.error}`);
            return;
          }
          
          console.log('Successfully created single occurrence slot');
        } else {
          // Update existing slot (recurring pattern)
          console.log('Updating existing slot:', selectedAvailabilitySlot.id);
          const { updateAvailabilitySlot } = await import('@/actions/availability/manage-availability');
          const result = await updateAvailabilitySlot(user.uid, selectedAvailabilitySlot.id, data);
          console.log('Update result:', result);
          
          if (result.error) {
            console.error('Update failed:', result.error);
            alert(`Failed to update availability: ${result.error}`);
            return;
          }
          
          console.log('Successfully updated availability slot');
        }
      } else {
        // Create new slot
        console.log('Creating new slot');
        const { createAvailabilitySlot } = await import('@/actions/availability/manage-availability');
        console.log('createAvailabilitySlot function imported:', typeof createAvailabilitySlot);
        console.log('About to call createAvailabilitySlot with:', { userId: user.uid, data });
        console.log('createAvailabilitySlot function imported:', typeof createAvailabilitySlot);
        console.log('About to call createAvailabilitySlot with:', { userId: user.uid, data });
        const result = await createAvailabilitySlot(user.uid, data);
        console.log('Create result:', result);
        console.log('Create result type:', typeof result);
        console.log('Create result keys:', Object.keys(result || {}));
        
        if (result.error) {
          console.error('Create failed:', result.error);
          console.error('Full result object:', result);
          console.error('Error details:', result.details);
          console.error('Error type:', result.errorType);
          alert(`Failed to create availability: ${result.error}`);
          return;
        }
        
        console.log('Successfully created availability slot');
      }
      
      // Close the modal
      handleAvailabilityModalClose();
      
      // Refresh events
      const fetchEvents = async () => {
        const calendarRes = await getCalendarEvents({ userId: user.uid, role: 'worker', isViewQA: false });
        const availabilityRes = await getWorkerAvailability(user.uid);
        
        const calendarData: CalendarEvent[] = calendarRes.events || [];
        const parsed = calendarData.map((event: CalendarEvent) => ({ ...event, start: new Date(event.start), end: new Date(event.end) }));
        
        const availabilityEvents = convertAvailabilitySlotsToEvents(
          availabilityRes.availability || [],
          new Date(date.getFullYear(), date.getMonth(), 1),
          new Date(date.getFullYear(), date.getMonth() + 1, 0)
        );

        const allEventsCombined = [...parsed, ...availabilityEvents];
        setAllEvents(allEventsCombined);
        
        // Ensure availabilitySlots is always an array
        const availabilityArray = Array.isArray(availabilityRes.availability) 
          ? availabilityRes.availability 
          : availabilityRes.availability 
            ? [availabilityRes.availability] 
            : [];
        setAvailabilitySlots(availabilityArray);

        setEvents(filterEvents(allEventsCombined, activeFilter));
      };
      
      fetchEvents();
    } catch (error) {
      console.error('Error saving availability:', error);
      // You could add a toast notification here for user feedback
      alert(`Error saving availability: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAvailabilityDelete = async () => {
    if (!user || !selectedAvailabilitySlot) return;

    try {
      const { deleteAvailabilitySlot } = await import('@/actions/availability/manage-availability');
      await deleteAvailabilitySlot(user.uid, selectedAvailabilitySlot.id);
      
      // Close the modal
      handleAvailabilityModalClose();
      
      // Refresh events
      const fetchEvents = async () => {
        const calendarRes = await getCalendarEvents({ userId: user.uid, role: 'worker', isViewQA: false });
        const availabilityRes = await getWorkerAvailability(user.uid);
        
        const calendarData: CalendarEvent[] = calendarRes.events || [];
        const parsed = calendarData.map((event: CalendarEvent) => ({ ...event, start: new Date(event.start), end: new Date(event.end) }));
        
        const availabilityEvents = convertAvailabilitySlotsToEvents(
          availabilityRes.availability || [],
          new Date(date.getFullYear(), date.getMonth(), 1),
          new Date(date.getFullYear(), date.getMonth() + 1, 0)
        );

        const allEventsCombined = [...parsed, ...availabilityEvents];
        setAllEvents(allEventsCombined);
        
        // Ensure availabilitySlots is always an array
        const availabilityArray = Array.isArray(availabilityRes.availability) 
          ? availabilityRes.availability 
          : availabilityRes.availability 
            ? [availabilityRes.availability] 
            : [];
        setAvailabilitySlots(availabilityArray);

        setEvents(filterEvents(allEventsCombined, activeFilter));
      };
      
      fetchEvents();
    } catch (error) {
      console.error('Error deleting availability:', error);
    }
  };

  const handleAvailabilityModalClose = () => {
    setIsAvailabilityModalOpen(false);
    setSelectedAvailabilitySlot(null);
    setSelectedDate(null);
    setIsEditingSingleOccurrence(false);
  };

  const handleEditOptionsModalClose = () => {
    setShowEditOptionsModal(false);
    setSelectedAvailabilitySlot(null);
    setSelectedDate(null);
  };

  const handleEditRecurringPattern = () => {
    setIsEditingSingleOccurrence(false);
    setShowEditOptionsModal(false);
    setIsAvailabilityModalOpen(true);
  };

  const handleEditSingleOccurrence = () => {
    setIsEditingSingleOccurrence(true);
    setShowEditOptionsModal(false);
    setIsAvailabilityModalOpen(true);
  };

  const handleDateSelect = (slotInfo: { start: Date; end: Date; slots: Date[] } | Date, selectedTime?: string) => {
    console.log('handleDateSelect called with:', { slotInfo, selectedTime });
    
    if (typeof slotInfo === 'object' && 'start' in slotInfo) {
      // Handle regular calendar date selection
      console.log('Setting selected date from slotInfo.start:', slotInfo.start);
      setSelectedDate(slotInfo.start);
      setSelectedTime(selectedTime || null);
      setIsAvailabilityModalOpen(true);
    } else if (slotInfo instanceof Date) {
      // Handle availability view date selection
      console.log('Setting selected date from Date:', slotInfo);
      setSelectedDate(slotInfo);
      setSelectedTime(selectedTime || null);
      setIsAvailabilityModalOpen(true);
    }
    
    console.log('Modal should now be open');
  };

  const handleClearAllAvailability = async () => {
    if (!user) return;
    try {
      const { clearAllAvailability } = await import('@/actions/availability/manage-availability');
      await clearAllAvailability(user.uid);
      
      // Refresh events
      const fetchEvents = async () => {
        const calendarRes = await getCalendarEvents({ userId: user.uid, role: 'worker', isViewQA: false });
        const availabilityRes = await getWorkerAvailability(user.uid);
        
        const calendarData: CalendarEvent[] = calendarRes.events || [];
        const parsed = calendarData.map((event: CalendarEvent) => ({ ...event, start: new Date(event.start), end: new Date(event.end) }));
        
        const availabilityEvents = convertAvailabilitySlotsToEvents(
          availabilityRes.availability || [],
          new Date(date.getFullYear(), date.getMonth(), 1),
          new Date(date.getFullYear(), date.getMonth() + 1, 0)
        );

        const allEventsCombined = [...parsed, ...availabilityEvents];
        setAllEvents(allEventsCombined);
        
        // Ensure availabilitySlots is always an array
        const availabilityArray = Array.isArray(availabilityRes.availability) 
          ? availabilityRes.availability 
          : availabilityRes.availability 
            ? [availabilityRes.availability] 
            : [];
        setAvailabilitySlots(availabilityArray);

        setEvents(filterEvents(allEventsCombined, activeFilter));
      };
      
      fetchEvents();
      setShowClearModal(false);
    } catch (error) {
      console.error('Error clearing availability:', error);
    }
  };

  const handleAvailabilityEdit = (slot: AvailabilitySlot) => {
    setSelectedAvailabilitySlot(slot);
    setIsAvailabilityModalOpen(true);
  };

 const handleAcceptOffer = async (offerId: string) => {
    if (!authUserId) {
      return;
    }

    setProcessingOfferId(offerId);
    setProcessingAction("accept");  
    try {    
      // Use the Firebase UID directly, not the page user ID
      const result = await acceptGigOffer({ gigId: offerId, userId: authUserId });   
      if (result.error) {
        throw new Error(result.error);
      }

      // On success: remove from offers list and add to accepted gigs
      setOffers((prev) => prev.filter((o) => o.id !== offerId));
      
      // Find the accepted offer to add to accepted gigs
      const acceptedOffer = offers.find(o => o.id === offerId);
      if (acceptedOffer) {
        const acceptedGig = { ...acceptedOffer, status: 'ACCEPTED' };
        setAcceptedGigs((prev) => [...prev, acceptedGig]);
      }
    } catch (err) {
      console.error("Error accepting offer:", err);
    } finally {
      setProcessingOfferId(null);
      setProcessingAction(null);
    }
 };
 
  const handleDeclineOffer = async (offerId: string) => {
    if (!authUserId) {
      return;
    }

    setProcessingOfferId(offerId);
    setProcessingAction("decline"); 
    try {
      // For declining, we can just remove it from the offers list
      // since the worker is not assigned to the gig yet
      setOffers((prev) => prev.filter((o) => o.id !== offerId));
      updateGigOfferStatus({ gigId: offerId, userId: authUserId, role: 'worker', action: 'cancel' });
      
    } catch (err) {
      console.error("Error declining offer:", err);
      // Show error message (you can add toast here)
    } finally {
      setProcessingOfferId(null);
      setProcessingAction(null);
    }
  };

  return (
    <div className={styles.container}>
      <ScreenHeaderWithBack onBackClick={() => router.back()} />
      <CalendarHeader
        date={date}
        view={view}
        role="worker"
        onViewChange={handleViewChange}
        onNavigate={handleNavigate}
        filters={FILTERS}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        onDateSelect={activeFilter === 'Manage availability' ? (date) => handleDateSelect(date) : undefined}
      />
      
      <main className={`${styles.mainContent} ${isFilterTransitioning ? styles.filterTransitioning : ''}`}>
        {activeFilter === 'Manage availability' ? (
          <>
            {/* Availability Views based on existing calendar view */}
            {view === 'day' && (
              <DailyAvailabilityView
                events={events}
                availabilitySlots={availabilitySlots}
                currentDate={date}
                onEventClick={handleEventClick}
                onDateSelect={handleDateSelect}
                onAvailabilityEdit={handleAvailabilityEdit}
                onAvailabilityDelete={handleAvailabilityDelete}
                onClearAll={() => setShowClearModal(true)}
                selectedDate={date}
              />
            )}
            {view === 'week' && (
              <WeeklyAvailabilityView
                events={events}
                availabilitySlots={availabilitySlots}
                currentDate={date}
                onEventClick={handleEventClick}
                onDateSelect={handleDateSelect}
                onAvailabilityEdit={handleAvailabilityEdit}
                onAvailabilityDelete={handleAvailabilityDelete}
                onClearAll={() => setShowClearModal(true)}
              />
            )}
            {view === 'month' && (
              <MonthlyAvailabilityView
                events={events}
                availabilitySlots={availabilitySlots}
                currentDate={date}
                onEventClick={handleEventClick}
                onDateSelect={handleDateSelect}
                onAvailabilityEdit={handleAvailabilityEdit}
                onAvailabilityDelete={handleAvailabilityDelete}
                onClearAll={() => setShowClearModal(true)}
                selectedDate={date}
              />
            )}
          </>
        ) : (
          <AppCalendar
            date={date}
            events={events}
            view={view}
            onView={setView}
            onNavigate={setDate}
            onSelectEvent={handleEventClick}
            onSelectSlot={handleDateSelect}
            userRole="worker"
            activeFilter={activeFilter}
            components={{
              event: (props: any) => (
                <CalendarEventComponent {...props} userRole="worker" view={view} activeFilter={activeFilter} />
              )
            }}
            hideToolbar={true}
          />
        )}
      </main>


      <EventDetailModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        userRole="worker"
        onAccept={() => selectedEvent && selectedEvent.id && handleAcceptOffer(selectedEvent.id)}
        onDecline={() => selectedEvent && selectedEvent.id && handleDeclineOffer(selectedEvent.id)}
        isProcessingAccept={
          selectedEvent != null &&
          processingOfferId === selectedEvent.id &&
          processingAction === "accept"
        }
        isProcessingDecline={
          selectedEvent != null &&
          processingOfferId === selectedEvent.id &&
          processingAction === "decline"
        }
      />

             <NewAvailabilityModal
         isOpen={isAvailabilityModalOpen}
         onClose={handleAvailabilityModalClose}
         slot={selectedAvailabilitySlot}
         onSave={handleAvailabilitySave}
         onDelete={handleAvailabilityDelete}
         selectedDate={selectedDate || undefined}
         selectedTime={selectedTime || undefined}
         isEditingSingleOccurrence={isEditingSingleOccurrence}
       />

             <ClearAvailabilityAlert
         isOpen={showClearModal}
         onClose={() => setShowClearModal(false)}
         onConfirm={handleClearAllAvailability}
       />

       {/* Edit Options Modal */}
       {showEditOptionsModal && selectedAvailabilitySlot && selectedDate && (
         <div style={{
           position: 'fixed',
           top: 0,
           left: 0,
           right: 0,
           bottom: 0,
           backgroundColor: 'rgba(0, 0, 0, 0.5)',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           zIndex: 1000
         }} onClick={handleEditOptionsModalClose}>
           <div style={{
             backgroundColor: '#232323',
             borderRadius: '12px',
             padding: '20px',
             maxWidth: '400px',
             width: '90%',
             color: '#fff'
           }} onClick={(e) => e.stopPropagation()}>
             <div style={{
               display: 'flex',
               justifyContent: 'space-between',
               alignItems: 'center',
               marginBottom: '20px'
             }}>
               <h3 style={{ margin: 0 }}>Edit Availability</h3>
               <button 
                 style={{
                   background: 'none',
                   border: 'none',
                   color: '#fff',
                   cursor: 'pointer',
                   fontSize: '20px'
                 }}
                 onClick={handleEditOptionsModalClose}
               >
                 ×
               </button>
             </div>
             <div>
               <p style={{ marginBottom: '20px' }}>
                 This is a recurring availability pattern. What would you like to edit?
               </p>
               <div style={{
                 display: 'flex',
                 flexDirection: 'column',
                 gap: '10px'
               }}>
                 <button 
                   style={{
                     background: '#41a1e8',
                     border: 'none',
                     borderRadius: '8px',
                     padding: '12px 16px',
                     color: '#fff',
                     cursor: 'pointer',
                     fontWeight: '600'
                   }}
                   onClick={handleEditRecurringPattern}
                 >
                   Edit recurring pattern
                 </button>
                 <button 
                   style={{
                     background: '#7eeef9',
                     border: 'none',
                     borderRadius: '8px',
                     padding: '12px 16px',
                     color: '#000',
                     cursor: 'pointer',
                     fontWeight: '600'
                   }}
                   onClick={handleEditSingleOccurrence}
                 >
                   Edit just this occurrence
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default WorkerCalendarPage; 