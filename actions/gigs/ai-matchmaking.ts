"use server";

import { db } from "@/lib/drizzle/db";
import {
  UsersTable,
  WorkerAvailabilityTable,
  GigsTable
} from "@/lib/drizzle/schema";
import { eq, and, sql } from "drizzle-orm";


// Helper function to calculate distance between two coordinates in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper function to extract coordinates from location string
function extractCoordinates(location: string): { lat: number; lng: number } | null {
  // Handle "Coordinates: lat, lng" format
  const coordMatch = location.match(/Coordinates:\s*([+-]?\d+\.?\d*),\s*([+-]?\d+\.?\d*)/);
  if (coordMatch) {
    return {
      lat: parseFloat(coordMatch[1]),
      lng: parseFloat(coordMatch[2])
    };
  }
  
  // Handle other coordinate formats if needed
  const directMatch = location.match(/([+-]?\d+\.?\d*),\s*([+-]?\d+\.?\d*)/);
  if (directMatch) {
    return {
      lat: parseFloat(directMatch[1]),
      lng: parseFloat(directMatch[2])
    };
  }
  
  return null;
}

export interface WorkerMatch {
  workerId: string;
  workerName: string;
  primarySkill: string;
  bio?: string;
  location?: string;
  hourlyRate: number;
  experienceYears: number;
  matchScore: number;
  matchReasons: string[];
  availability: {
    days: string[];
    startTime: string;
    endTime: string;
  }[];
  skills: {
    name: string;
    experienceYears: number;
    agreedRate: number;
  }[];
}

export interface MatchmakingResult {
  success: boolean;
  matches?: WorkerMatch[];
  error?: string;
  totalWorkersAnalyzed?: number;
}

// Helper function to find the most relevant skill for a specific gig
function findMostRelevantSkill(workerSkills: any[], gigTitle: string, gigDescription: string): {
  skill: any;
  relevanceScore: number;
} {
  if (!workerSkills || workerSkills.length === 0) {
    return { skill: null, relevanceScore: 0 };
  }

  if (workerSkills.length === 1) {
    return { skill: workerSkills[0], relevanceScore: 50 }; // Default score for single skill
  }

  const gigText = `${gigTitle} ${gigDescription}`.toLowerCase();
  let bestSkill = workerSkills[0];
  let bestScore = 0;

  for (const skill of workerSkills) {
    const skillName = skill.name?.toLowerCase() || '';
    let score = 0;

    // Direct keyword matches (highest score)
    if (gigText.includes('baker') && (skillName.includes('baker') || skillName.includes('cake') || skillName.includes('pastry'))) {
      score = 100;
    } else if (gigText.includes('chef') && (skillName.includes('chef') || skillName.includes('cook'))) {
      score = 100;
    } else if (gigText.includes('server') && (skillName.includes('server') || skillName.includes('waiter') || skillName.includes('bartender'))) {
      score = 100;
    } else if (gigText.includes('bartender') && (skillName.includes('bartender') || skillName.includes('mixologist'))) {
      score = 100;
    } else if (gigText.includes('waiter') && (skillName.includes('waiter') || skillName.includes('server'))) {
      score = 100;
    } else if (gigText.includes('cook') && (skillName.includes('cook') || skillName.includes('chef'))) {
      score = 100;
    }
    // Related matches (high score)
    else if (gigText.includes('baker') && (skillName.includes('chef') || skillName.includes('cook'))) {
      score = 80;
    } else if (gigText.includes('server') && (skillName.includes('chef') || skillName.includes('cook'))) {
      score = 70;
    } else if (gigText.includes('bartender') && (skillName.includes('server') || skillName.includes('waiter'))) {
      score = 80;
    } else if (gigText.includes('waiter') && (skillName.includes('bartender') || skillName.includes('server'))) {
      score = 80;
    } else if (gigText.includes('chef') && (skillName.includes('baker') || skillName.includes('pastry'))) {
      score = 80;
    }
    // Hospitality/service matches (medium score)
    else if ((gigText.includes('server') || gigText.includes('waiter') || gigText.includes('bartender')) && 
             (skillName.includes('hospitality') || skillName.includes('service') || skillName.includes('customer'))) {
      score = 60;
    }
    // Food service matches (medium score)
    else if ((gigText.includes('chef') || gigText.includes('cook') || gigText.includes('baker')) && 
             (skillName.includes('food') || skillName.includes('kitchen') || skillName.includes('culinary'))) {
      score = 60;
    }
    // Event service matches (medium score)
    else if ((gigText.includes('event') || gigText.includes('catering') || gigText.includes('party')) && 
             (skillName.includes('event') || skillName.includes('catering') || skillName.includes('party'))) {
      score = 60;
    }
    // Generic matches (low score)
    else {
      score = 30;
    }

    // Bonus for higher experience years
    if (skill.experienceYears && skill.experienceYears > 0) {
      score += Math.min(skill.experienceYears * 2, 20); // Max 20 bonus points
    }

    // Bonus for higher hourly rate (indicates seniority)
    if (skill.agreedRate && parseFloat(skill.agreedRate) > 15) {
      score += 10;
    }

    if (score > bestScore) {
      bestScore = score;
      bestSkill = skill;
    }
  }

  return { skill: bestSkill, relevanceScore: bestScore };
}

export async function findMatchingWorkers(
  gigId: string
): Promise<MatchmakingResult> {
  try {
    // Get the gig details
    const gig = await db.query.GigsTable.findFirst({
      where: eq(GigsTable.id, gigId),
      with: {
        buyer: {
          columns: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!gig) {
      return { success: false, error: "Gig not found" };
    }

    // Get all active workers with their profiles and skills (excluding the gig creator)
    const workers = await db.query.UsersTable.findMany({
      where: and(
        eq(UsersTable.isGigWorker, true),
        eq(UsersTable.isBanned, false),
        eq(UsersTable.isDisabled, false),
        sql`${UsersTable.id} != ${gig.buyerUserId}` // Exclude the gig creator
      ),
      with: {
        gigWorkerProfile: {
          with: {
            skills: true,
          },
        },
      },
    });

    // Get availability for all workers
    const workerIds = workers.map(w => w.id);
    let availabilityData: any[] = [];
    
    if (workerIds.length > 0) {
      try {
        // Use raw SQL with proper array formatting for PostgreSQL and UUID casting
        availabilityData = await db.query.WorkerAvailabilityTable.findMany({
          where: sql`${WorkerAvailabilityTable.userId} = ANY(${sql.raw(`ARRAY[${workerIds.map(id => `'${id}'::uuid`).join(',')}]`)})`,
        });
      } catch (error) {
        console.error('Error fetching worker availability:', error);
        // Continue without availability data if there's an error
        availabilityData = [];
      }
    }

    console.log(`Found ${workers.length} active workers to analyze`);

    if (workers.length === 0) {
      return { 
        success: true, 
        matches: [], 
        totalWorkersAnalyzed: 0,
        error: "No active workers found" 
      };
    }

    // Prepare gig context for AI analysis
    const gigContext = {
      title: gig.titleInternal,
      description: gig.fullDescription,
      location: gig.exactLocation,
      startTime: gig.startTime,
      endTime: gig.endTime,
      hourlyRate: gig.agreedRate,
      additionalRequirements: gig.notesForWorker,
    };

    // Extract gig location coordinates - try address_json first, then exact_location
    let gigCoords = null;
    if (gig.addressJson && typeof gig.addressJson === 'object') {
      const addressData = gig.addressJson as any;
      if (addressData.lat && addressData.lng) {
        gigCoords = { lat: parseFloat(addressData.lat), lng: parseFloat(addressData.lng) };
        console.log(`Gig coordinates from address_json: ${gigCoords.lat}, ${gigCoords.lng}`);
      }
    }
    
    // Fallback to extracting from exact_location text
    if (!gigCoords) {
      gigCoords = extractCoordinates(gig.exactLocation || '');
      if (gigCoords) {
        console.log(`Gig coordinates from exact_location: ${gigCoords.lat}, ${gigCoords.lng}`);
      } else {
        console.log(`No gig coordinates found in address_json or exact_location`);
      }
    }
    
    // Helper function to check if worker is available during gig time
    const isWorkerAvailable = (worker: any, gigStartTime: string, gigEndTime: string) => {
      const workerAvailability = availabilityData.filter((avail: any) => avail.userId === worker.id);
      
      if (workerAvailability.length === 0) {
        return true; // No availability data means assume available (more lenient)
      }
      
      // Check if any availability window covers the gig time
      return workerAvailability.some((avail: any) => {
        const availStart = avail.startTimeStr;
        const availEnd = avail.endTimeStr;
        
        // Simple time comparison (you might want to enhance this with proper date/time parsing)
        // For now, we'll assume if they have availability data, they're available
        // This could be enhanced to check specific days and times
        return availStart && availEnd;
      });
    };

    // Helper function to check if worker has any skills (AI will determine relevance)
    const hasRelevantSkills = (worker: any, gigTitle: string, gigDescription: string) => {
      const workerSkills = worker.gigWorkerProfile?.skills || [];
      // Let AI determine if skills are relevant - just check if worker has any skills
      return workerSkills.length > 0;
    };



    // Filter workers with basic criteria - let AI handle the intelligence
    const filteredWorkers = workers.filter((worker: any) => {
      // Check if worker has any skills (AI will determine relevance)
      const hasSkills = hasRelevantSkills(worker, gig.titleInternal || '', gig.fullDescription || '');
      
      // Check availability
      const isAvailable = isWorkerAvailable(worker, gig.startTime?.toString() || '', gig.endTime?.toString() || '');
      
      // LOCATION IS MANDATORY - workers must be within 30km to be considered
      let withinRange = false; // Default to false - must have valid coordinates
      
      if (gigCoords) {
        let workerCoords = null;
        
        // Try to get coordinates from latitude/longitude fields first
        if (worker.gigWorkerProfile?.latitude && worker.gigWorkerProfile?.longitude) {
          const workerLat = parseFloat(worker.gigWorkerProfile.latitude.toString());
          const workerLng = parseFloat(worker.gigWorkerProfile.longitude.toString());
          
          if (!isNaN(workerLat) && !isNaN(workerLng)) {
            workerCoords = { lat: workerLat, lng: workerLng };
          }
        }
        
        // Fallback to parsing location string
        if (!workerCoords && worker.gigWorkerProfile?.location) {
          const parsed = extractCoordinates(worker.gigWorkerProfile.location);
          if (parsed) {
            workerCoords = { lat: parsed.lat, lng: parsed.lng };
          }
        }
        
        if (workerCoords) {
          const distance = calculateDistance(
            gigCoords.lat, 
            gigCoords.lng, 
            workerCoords.lat, 
            workerCoords.lng
          );
          withinRange = distance <= 30; // 30km radius is MANDATORY
          
          console.log(`Worker ${worker.fullName}: Distance ${distance.toFixed(2)}km, Within range: ${withinRange}, Has skills: ${hasSkills}, Available: ${isAvailable}`);
        } else {
          console.log(`Worker ${worker.fullName}: No valid worker coordinates, REJECTED - no coordinates`);
        }
      } else {
        console.log(`Worker ${worker.fullName}: No gig coordinates, REJECTED - cannot calculate distance`);
      }
      
      // HARD FILTER: Must be within 30km to be considered at all
      if (!withinRange) {
        console.log(`Worker ${worker.fullName}: REJECTED - outside 30km range`);
        return false;
      }
      
      // If within range, check other criteria for logging purposes
      console.log(`Worker ${worker.fullName}: ACCEPTED - within 30km range (skills: ${hasSkills}, available: ${isAvailable})`);
      
      // All workers within 30km are considered - AI will determine final relevance
      return true;
    });

    console.log(`Filtered ${filteredWorkers.length} workers from ${workers.length} total (MANDATORY: within 30km range)`);

    // Prepare worker data for AI analysis
    const workerData = filteredWorkers.map((worker: any) => {
      const workerAvailability = availabilityData.filter((avail: any) => avail.userId === worker.id);
      return {
        workerId: worker.id,
        workerName: worker.fullName,
        bio: worker.gigWorkerProfile?.fullBio || undefined,
        location: worker.gigWorkerProfile?.location || undefined,
        skills: worker.gigWorkerProfile?.skills?.map((skill: any) => ({
          name: skill.name,
          experienceYears: skill.experienceYears,
          agreedRate: skill.agreedRate,
        })) || [],
        availability: workerAvailability.map((avail: any) => ({
          days: avail.days,
          startTime: avail.startTimeStr,
          endTime: avail.endTimeStr,
        })),
      };
    });

    // Use AI to analyze and score matches via API route
    const aiMatches = await analyzeWorkerMatches(gigContext, workerData);

    // Convert AI results to WorkerMatch format
    const matches: WorkerMatch[] = aiMatches.map(match => {
      const worker = filteredWorkers.find((w: any) => w.id === match.workerId);
      
      // Find the most relevant skill for this specific gig
      const { skill: mostRelevantSkill, relevanceScore } = findMostRelevantSkill(
        worker?.gigWorkerProfile?.skills || [],
        gig.titleInternal || '',
        gig.fullDescription || ''
      );
      
      const primarySkill = mostRelevantSkill?.name || 'Professional';
      const hourlyRate = mostRelevantSkill?.agreedRate || 0;
      const experienceYears = mostRelevantSkill?.experienceYears || 0;

      console.log(`Worker ${worker?.fullName}: Selected skill "${primarySkill}" (relevance score: ${relevanceScore}) for gig "${gig.titleInternal}"`);

      return {
        workerId: match.workerId,
        workerName: match.workerName,
        primarySkill,
        bio: worker?.gigWorkerProfile?.fullBio || undefined,
        location: worker?.gigWorkerProfile?.location || undefined,
        hourlyRate: Number(hourlyRate),
        experienceYears: Number(experienceYears),
        matchScore: match.matchScore,
        matchReasons: match.matchReasons,
        availability: match.availability,
        skills: match.skills,
      };
    });

    // Sort by match score (highest first)
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Return top 5 matches
    const topMatches = matches.slice(0, 5);

    return {
      success: true,
      matches: topMatches,
      totalWorkersAnalyzed: filteredWorkers.length,
    };

  } catch (error) {
    console.error("Error in AI matchmaking:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

async function analyzeWorkerMatches(
  gigContext: any,
  workerData: any[]
): Promise<{
  workerId: string;
  workerName: string;
  matchScore: number;
  matchReasons: string[];
  availability: any[];
  skills: any[];
}[]> {
  try {
    // Always use AI for matching - no fallback needed
    if (workerData.length === 0) {
      return [];
    }

    // Call the AI matchmaking API route
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gigContext,
        workerData,
      }),
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const result = await response.json() as { ok: boolean; matches: any[] };

    if (result.ok && result.matches) {
      return result.matches;
    } else {
      console.error('AI matchmaking API failed:', result);
      // Fallback to intelligent matching without AI
      return createIntelligentFallbackMatches(gigContext, workerData);
    }

  } catch (error) {
    console.error('Error in AI worker analysis:', error);
    // Fallback to intelligent matching without AI
    return createIntelligentFallbackMatches(gigContext, workerData);
  }
}

// Intelligent fallback matching when AI is unavailable
function createIntelligentFallbackMatches(gigContext: any, workerData: any[]): {
  workerId: string;
  workerName: string;
  matchScore: number;
  matchReasons: string[];
  availability: any[];
  skills: any[];
}[] {
  const gigTitle = (gigContext.title || '').toLowerCase();
  const gigDescription = (gigContext.description || '').toLowerCase();
  const gigText = `${gigTitle} ${gigDescription}`;
  const gigRate = gigContext.hourlyRate || 0;

  return workerData.map(worker => {
    // Find the most relevant skill for this specific gig
    const { skill: mostRelevantSkill, relevanceScore } = findMostRelevantSkill(
      worker.skills || [],
      gigContext.title || '',
      gigContext.description || ''
    );
    
    const primarySkill = mostRelevantSkill?.name || '';
    const experience = parseFloat(mostRelevantSkill?.experienceYears || '0');
    const rate = parseFloat(mostRelevantSkill?.agreedRate || '0');
    const bio = (worker.bio || '').toLowerCase();
    
    let matchScore = 50; // Base score
    const reasons = [];

    // Use the relevance score from our skill matching function
    if (mostRelevantSkill) {
      matchScore += Math.min(relevanceScore * 0.3, 30); // Scale relevance score to 0-30 points
      reasons.push(`Relevant ${primarySkill} experience (${relevanceScore}% match)`);
    }

    // Bio relevance scoring
    if (bio) {
      if (gigText.includes('baker') && (bio.includes('baker') || bio.includes('cake') || bio.includes('pastry'))) {
        matchScore += 15;
        reasons.push('Bio mentions relevant experience');
      } else if (gigText.includes('chef') && (bio.includes('chef') || bio.includes('cook'))) {
        matchScore += 15;
        reasons.push('Bio mentions relevant experience');
      } else if (gigText.includes('server') && (bio.includes('server') || bio.includes('waiter') || bio.includes('bartender'))) {
        matchScore += 15;
        reasons.push('Bio mentions relevant experience');
      } else if (gigText.includes('bartender') && (bio.includes('bartender') || bio.includes('mixologist'))) {
        matchScore += 15;
        reasons.push('Bio mentions relevant experience');
      }
    }

    // Experience scoring
    if (experience > 0) {
      if (experience >= 5) {
        matchScore += 15;
        reasons.push(`${experience} years of experience`);
      } else if (experience >= 2) {
        matchScore += 10;
        reasons.push(`${experience} years of experience`);
      } else {
        matchScore += 5;
        reasons.push(`${experience} years of experience`);
      }
    }

    // Rate compatibility scoring
    if (rate > 0 && gigRate > 0) {
      const rateDiff = Math.abs(rate - gigRate);
      const ratePercent = (rateDiff / gigRate) * 100;
      
      if (ratePercent <= 20) {
        matchScore += 10;
        reasons.push(`Rate matches budget (£${rate}/hour)`);
      } else if (ratePercent <= 50) {
        matchScore += 5;
        reasons.push(`Rate within range (£${rate}/hour)`);
      } else if (rate < gigRate) {
        matchScore += 3;
        reasons.push(`Competitive rate (£${rate}/hour)`);
      }
    }

    // Location scoring (if available)
    if (worker.location && worker.location !== 'Colombia' && worker.location !== 'Ethiopia') {
      matchScore += 5;
      reasons.push(`Located in ${worker.location}`);
    }

    // Cap the score at 100
    matchScore = Math.min(matchScore, 100);

    // If no specific reasons, add generic ones
    if (reasons.length === 0) {
      reasons.push('Available for work', 'Professional service provider');
    }

    return {
      workerId: worker.workerId,
      workerName: worker.workerName,
      matchScore: Math.round(matchScore),
      matchReasons: reasons.slice(0, 3), // Limit to 3 reasons
      availability: worker.availability,
      skills: worker.skills,
    };
  });
}
