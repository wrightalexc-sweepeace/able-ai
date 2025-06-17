export default interface GigDetails {
  id: string;
  role: string; // e.g., Bartender
  gigTitle: string; // e.g., "at The Grand Cafe" or full title if preferred
  buyerName: string;
  buyerAvatarUrl?: string;
  date: string; // ISO
  startTime: string; // ISO
  endTime: string; // ISO
  duration?: string; // e.g., "5 hours" - can be calculated
  location: string;
  hourlyRate: number;
  estimatedEarnings: number;
  specialInstructions?: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'AWAITING_BUYER_CONFIRMATION' | 'COMPLETED' | 'CANCELLED' | 'CONFIRMED' | 'REQUESTED'; // From Prisma enum
  hiringManager?: string; // Optional, if available
  hiringManagerUsername?: string; // Optional, if available
  isWorkerSubmittedFeedback?: boolean; // Indicates if worker has submitted feedback
  isBuyerSubmittedFeedback?: boolean; // Indicates if buyer has submitted feedback
}
