import RehireContainer from "./RehireContainer";

// Mock fetch function (can be moved to a shared file later)
const fetchRehireData = async (buyerUserId: string, gigId: string) => {
  await new Promise((resolve) => setTimeout(resolve, 700));
  if (gigId === "pastGig123") {
    return {
      originalGig: {
        workerName: "Jerimiah Jones",
        role: "Bartender",
        originalDate: "last Tuesday",
        originalLocation: "Central Station",
      },
      workerForRehire: {
        workerId: "jerimiah-jones-id",
        name: "Jerimiah Jones",
        avatarUrl: "/images/avatar-jerimiah.jpg",
        role: "Bartender",
        ableGigs: 15,
        experienceYears: "3+",
        reviewKeywords: ["lively", "professional", "hardworking"],
        proposedHourlyRate: 15,
        proposedHours: 4,
        platformFeePercent: 6.5,
        paymentProviderFeeFixed: 0.2,
        paymentProviderFeePercent: 1.5,
      },
    };
  }
  return null;
};

interface RehirePageProps {
  params: Promise<{ userId: string; gigId: string }>;
}

export default async function RehirePage({ params }: RehirePageProps) {
  const { userId, gigId } = await params;
  // Fetch mock data server-side
  const data = await fetchRehireData(userId, gigId);
  return <RehireContainer initialData={data} userId={userId} />;
}
