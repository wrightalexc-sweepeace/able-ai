import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AbleAI",
  description: "Connecting gig workers and buyers",
  viewport: 'width=device-width, initial-scale=1',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
