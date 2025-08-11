"use server";

import { db } from "@/lib/drizzle/db";
import { GigsTable, UsersTable, gigStatusEnum, moderationStatusEnum } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";

type CreateSampleGigsInput = {
  userId: string; // Firebase UID of buyer
  count?: number; // number of gigs to create
};

type CreateSampleGigsResult = {
  status: number;
  createdGigIds?: string[];
  error?: string;
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function buildRandomGigTimes(): { start: Date; end: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = 7; // August (0-based)
  const day = randomInt(10, 20); // 10-20 inclusive
  const startHour = randomInt(9, 18); // 09:00 to 18:00 start
  const durationHours = randomInt(2, 6); // 2-6 hours

  const start = new Date(year, month, day, startHour, 0, 0, 0);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  return { start, end };
}

const TITLES = [
  "Bartender",
  "Event Server",
  "Barback",
  "Mixologist",
  "Host/Hostess",
  "Caterer",
];

const DESCRIPTIONS = [
  "Support a lively private event. Dress code: smart black.",
  "Corporate mixer evening. Focus on high quality service.",
  "Local wedding reception. Friendly and punctual service required.",
  "Pop-up bar night. Help with setup and breakdown.",
  "Restaurant shift cover. Fast-paced team environment.",
];

const LOCATIONS = [
  { lat: 51.5237, lng: -0.1585, address: "221B Baker Street, London" }, // Baker Street
  { lat: 51.4736, lng: -0.0694, address: "The Green Tavern, Peckham, SE15" }, // Peckham
  { lat: 51.5154, lng: -0.0921, address: "Tech Park, EC1A 1BB, London" }, // City of London
  { lat: 51.5014, lng: -0.1249, address: "Riverside Hall, SW1A, London" }, // Westminster
  { lat: 51.5136, lng: -0.1366, address: "Old Town Square, W1D, London" }, // Soho
];

export async function createSampleGigs(
  input: CreateSampleGigsInput
): Promise<CreateSampleGigsResult> {
  try {
    const { userId, count = 5 } = input;
    if (!userId) return { status: 400, error: "Missing userId" };

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
      columns: { id: true },
    });
    if (!user) return { status: 404, error: "User not found" };

    const createdIds: string[] = [];

    for (let i = 0; i < count; i++) {
      const title = pickOne(TITLES);
      const fullDescription = pickOne(DESCRIPTIONS);
      const locationData = pickOne(LOCATIONS);
      const { start, end } = buildRandomGigTimes();
      const agreedRate = randomInt(12, 25);

      const [inserted] = await db
        .insert(GigsTable)
        .values({
          buyerUserId: user.id,
          titleInternal: title,
          fullDescription,
          exactLocation: null, // No longer using string address
          addressJson: {
            lat: locationData.lat,
            lng: locationData.lng,
            address: locationData.address,
            city: "London",
            country: "UK"
          },
          startTime: start,
          endTime: end,
          agreedRate,
          statusInternal: gigStatusEnum.enumValues[0],
          moderationStatus: moderationStatusEnum.enumValues[0],
        })
        .returning({ id: GigsTable.id });

      if (inserted?.id) createdIds.push(inserted.id);
    }

    return { status: 200, createdGigIds: createdIds };
  } catch (error: any) {
    console.error("Error creating sample gigs:", error);
    return { status: 500, error: error?.message || "Unknown error" };
  }
}


