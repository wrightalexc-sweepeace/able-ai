import { ProtectedRoute } from "@/utils/ProtectedRoute";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <ProtectedRoute>
      {children}
      </ProtectedRoute>
    </div>
  );
}
