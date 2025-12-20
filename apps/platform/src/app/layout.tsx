import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../../../../packages/ed-widget/src/styles/main.css";
import { SupabaseAuthProvider } from "@/context/SupabaseAuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Schoolgle Improvement",
  description: "Always-On Inspection Readiness",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <SupabaseAuthProvider>{children}</SupabaseAuthProvider>
      </body>
    </html>
  );
}
