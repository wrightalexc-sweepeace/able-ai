import useFCM from "@/lib/firebase/fcm/useFCM";
import { ProtectedRoute } from "@/utils/ProtectedRoute";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useFCM()
  return (
    <div>
      <ProtectedRoute>
      {children}
      </ProtectedRoute>
    </div>
  );
}
