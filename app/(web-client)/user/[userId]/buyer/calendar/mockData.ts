import { CalendarEvent, EventStatusEnum } from "@/app/types/CalendarEventTypes";

const startOfWeek = (() => {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7; // 0->6, 1->0 ... Monday-based
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - diffToMonday);
  return monday;
})();

const at = (offsetDays: number, hour: number, minute = 0) => {
  const d = new Date(startOfWeek);
  d.setDate(startOfWeek.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d;
};

export const BUYER_MOCK_EVENTS: CalendarEvent[] = [
  {
    id: "buyer-accepted-1",
    title: "Shift at cafe: Waiter: Accepted by Jerimiah Jones",
    start: at(0, 9, 0), // Monday 9:00
    end: at(0, 10, 30), // Monday 10:30
    status: EventStatusEnum.ACCEPTED,
    eventType: "gig",
    buyerName: "You",
    workerName: "Jerimiah Jones",
    location: "Grand Cafe",
    description: "Morning shift."
  },
  {
    id: "buyer-offer-1",
    title: "Bartender, Central Station: Offer",
    start: at(2, 13, 0), // Wednesday 1:00 PM
    end: at(2, 21, 0),   // Wednesday 9:00 PM
    status: EventStatusEnum.OFFER,
    eventType: "offer",
    buyerName: "You",
    workerName: "—",
    location: "Central Station",
    description: "Evening bar service."
  },
  {
    id: "buyer-inprogress-1",
    title: "Bartender, Central Station: Jessica Hersey",
    start: at(2, 13, 0), // Wednesday 1:00 PM
    end: at(2, 21, 0),   // Wednesday 9:00 PM
    status: EventStatusEnum.PENDING,
    eventType: "gig",
    buyerName: "You",
    workerName: "Jessica Hersey",
    location: "Central Station",
    description: "Awaiting buyer confirmation."
  }
];
