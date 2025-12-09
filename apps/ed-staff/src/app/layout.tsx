import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ed for Staff - AI Assistant for School Teams",
  description: "AI-powered assistant helping school staff with MIS systems, admin tasks, and day-to-day operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
