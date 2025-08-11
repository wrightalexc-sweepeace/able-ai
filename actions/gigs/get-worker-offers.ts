"use server";

import { db } from "@/lib/drizzle/db";
import { and, eq, desc, asc, inArray, ne } from "drizzle-orm";
import { GigsTable, gigStatusEnum, UsersTable } from "@/lib/drizzle/schema";

// Gig statuses for offers (pending worker acceptance)
const PENDING_WORKER_ACCEPTANCE = "PENDING_WORKER_ACCEPTANCE";
const PAYMENT_HELD_PENDING_ACCEPTANCE = "PAYMENT_HELD_PENDING_ACCEPTANCE";

// Gig statuses for accepted gigs
const ACCEPTED = "ACCEPTED";
const IN_PROGRESS = "IN_PROGRESS";
const PENDING_COMPLETION_WORKER = "PENDING_COMPLETION_WORKER";
const PENDING_COMPLETION_BUYER = "PENDING_COMPLETION_BUYER";
const COMPLETED = "COMPLETED";
const AWAITING_PAYMENT = "AWAITING_PAYMENT";
const PAID = "PAID";

// Debug: Log the actual enum values
console.log("Debug - Enum values:", gigStatusEnum.enumValues);
console.log("Debug - PENDING_WORKER_ACCEPTANCE:", PENDING_WORKER_ACCEPTANCE);
console.log("Debug - ACCEPTED:", ACCEPTED);

export interface WorkerGigOffer {
  id: string;
  role: string;
  buyerName: string;
  locationSnippet: string;
  dateString: string;
  timeString: string;
  hourlyRate: number;
  estimatedHours?: number;
  totalPay?: number;
  tipsExpected?: boolean;
  expiresAt?: string;
  status: string;
  fullDescriptionLink?: string;
  gigDescription?: string;
  notesForWorker?: string;
}

export async function getWorkerOffers(userId: string) {
  try {
    console.log("Debug - getWorkerOffers called with userId:", userId);
    
    // First, verify the user exists and get their ID
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
      columns: {
        id: true,
      }
    });

    console.log("Debug - User found:", user);

    if (!user) {
      return { error: 'User not found', status: 404 };
    }

    // SIMPLIFIED APPROACH - Get all gigs and filter in memory for now
    console.log("Debug - Using simplified approach...");
    
    const allGigs = await db.query.GigsTable.findMany({
      columns: {
        id: true,
        titleInternal: true,
        statusInternal: true,
        workerUserId: true,
        buyerUserId: true,
        startTime: true,
        endTime: true,
        agreedRate: true,
        fullDescription: true,
        notesForWorker: true,
        addressJson: true,
        exactLocation: true,
      }
    });
    
    console.log("Debug - Total gigs fetched:", allGigs.length);
    
    // Filter for offers (pending worker acceptance, no worker, not created by this user)
    const offerGigs = allGigs.filter(gig => 
      gig.statusInternal === PENDING_WORKER_ACCEPTANCE &&
      !gig.workerUserId &&
      gig.buyerUserId !== user.id
    );
    
    console.log("Debug - Current user ID:", user.id);
    console.log("Debug - Gigs created by current user:", allGigs.filter(g => g.buyerUserId === user.id).length);
    console.log("Debug - Gigs by other users:", allGigs.filter(g => g.buyerUserId !== user.id).length);
    
    console.log("Debug - Offer gigs after filtering:", offerGigs.length);
    
    // Filter for accepted gigs (assigned to this worker)
    const acceptedGigs = allGigs.filter(gig => 
      gig.workerUserId === user.id &&
      [ACCEPTED, IN_PROGRESS, PENDING_COMPLETION_WORKER, PENDING_COMPLETION_BUYER, COMPLETED, AWAITING_PAYMENT, PAID].includes(gig.statusInternal)
    );
    
    console.log("Debug - Accepted gigs after filtering:", acceptedGigs.length);

    // Transform offer gigs to WorkerGigOffer format
    const offers: WorkerGigOffer[] = offerGigs.map(gig => {
      const startDate = new Date(gig.startTime);
      const endDate = new Date(gig.endTime);
      
      // Calculate estimated hours
      const hoursDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      const estimatedHours = Math.round(hoursDiff * 100) / 100;
      
      // Calculate total pay
      const totalPay = Number(gig.agreedRate) * estimatedHours;
      
      // Format date and time
      const dateString = startDate.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit' 
      });
      
      const timeString = `${startDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })} - ${endDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })}`;

      // Extract location from addressJson or exactLocation
      let locationSnippet = 'Location not specified';
      if (gig.addressJson && typeof gig.addressJson === 'object') {
        const address = gig.addressJson as any;
        if (address.formatted_address) {
          locationSnippet = address.formatted_address;
        } else if (address.address) {
          locationSnippet = address.address;
        } else if (address.city && address.country) {
          locationSnippet = `${address.city}, ${address.country}`;
        }
      } else if (gig.exactLocation) {
        locationSnippet = gig.exactLocation;
      }

      return {
        id: gig.id,
        role: gig.titleInternal,
        buyerName: 'Buyer (Details not loaded)',
        locationSnippet,
        dateString,
        timeString,
        hourlyRate: Number(gig.agreedRate),
        estimatedHours,
        totalPay: Math.round(totalPay * 100) / 100,
        tipsExpected: false,
        status: 'pending',
        fullDescriptionLink: `/user/${userId}/worker/gigs/${gig.id}`,
        gigDescription: gig.fullDescription,
        notesForWorker: gig.notesForWorker,
      };
    });

    // Transform accepted gigs to WorkerGigOffer format
    const accepted: WorkerGigOffer[] = acceptedGigs.map(gig => {
      const startDate = new Date(gig.startTime);
      const endDate = new Date(gig.endTime);
      
      // Calculate estimated hours
      const hoursDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      const estimatedHours = Math.round(hoursDiff * 100) / 100;
      
      // Calculate total pay
      const totalPay = Number(gig.agreedRate) * estimatedHours;
      
      // Format date and time
      const dateString = startDate.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit' 
      });
      
      const timeString = `${startDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })} - ${endDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })}`;

      // Extract location from addressJson or exactLocation
      let locationSnippet = 'Location not specified';
      if (gig.addressJson && typeof gig.addressJson === 'object') {
        const address = gig.addressJson as any;
        if (address.formatted_address) {
          locationSnippet = address.formatted_address;
        } else if (address.address) {
          locationSnippet = address.address;
        } else if (address.city && address.country) {
          locationSnippet = `${address.city}, ${address.country}`;
        }
      } else if (gig.exactLocation) {
        locationSnippet = gig.exactLocation;
      }

      return {
        id: gig.id,
        role: gig.titleInternal,
        buyerName: 'Buyer (Details not loaded)',
        locationSnippet,
        dateString,
        timeString,
        hourlyRate: Number(gig.agreedRate),
        estimatedHours,
        totalPay: Math.round(totalPay * 100) / 100,
        tipsExpected: false,
        status: gig.statusInternal,
        fullDescriptionLink: `/user/${userId}/worker/gigs/${gig.id}`,
        gigDescription: gig.fullDescription,
        notesForWorker: gig.notesForWorker,
      };
    });

    console.log("Debug - Final result - offers:", offers.length, "accepted:", accepted.length);
    console.log("Debug - Sample offer:", offers[0]);
    
    return {
      success: true,
      data: {
        offers,
        acceptedGigs: accepted,
      }
    };

  } catch (error: any) {
    console.error('Error fetching worker offers:', error);
    return { 
      error: error.message || 'Failed to fetch worker offers', 
      status: 500 
    };
  }
}
