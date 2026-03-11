"use client";

import React from "react";
import Navbar from "@/components/website/Navbar";
import Footer from "@/components/website/Footer";
import CookieBanner from "@/components/cookie-consent/CookieBanner";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background transition-colors duration-700 font-sans antialiased">
      <Navbar />
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
      <CookieBanner />
    </div>
  );
}
