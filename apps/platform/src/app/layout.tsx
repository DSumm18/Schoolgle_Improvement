// Force dynamic rendering for all pages to avoid useSearchParams() build errors
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import "../../../../packages/ed-widget/src/styles/main.css";
import { SupabaseAuthProvider } from "@/context/SupabaseAuthContext";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import OfflineIndicator from "@/components/common/OfflineIndicator";
import { Toaster } from "@/components/ui/sonner";
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Schoolgle - Ofsted Inspection Preparation for UK Schools",
  description:
    "Prepare for Ofsted and SIAMS inspections with Schoolgle. AI-powered evidence mapping, SEF generation, and action planning for UK primary schools and trusts.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Schoolgle - Ofsted Inspection Preparation",
    description: "Always-on inspection readiness for UK schools.",
    url: "https://schoolgle.co.uk",
    siteName: "Schoolgle",
    locale: "en_GB",
    type: "website",
  },
};

import { ThemeProvider } from "@/providers/ThemeProvider";
import AntigravityBackground from "@/components/effects/AntigravityBackground";
import SmoothScroll from "@/components/effects/SmoothScroll";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body
        className="antialiased min-h-screen relative bg-background text-foreground"
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ErrorBoundary name="RootLayout">
            <SupabaseAuthProvider>
              <SmoothScroll>
                <div className="relative z-0">{children}</div>
              </SmoothScroll>
              <OfflineIndicator />
            </SupabaseAuthProvider>
          </ErrorBoundary>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
