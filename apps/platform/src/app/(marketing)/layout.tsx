"use client";

import "./marketing.css";
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
    <div className="sg-site min-h-screen bg-background transition-colors duration-700 font-sans antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-background focus:p-4"
      >
        Skip to content
      </a>
      <Navbar />
      <div className="flex flex-col min-h-screen">
        <div id="main-content" tabIndex={-1} className="flex-1">
          {children}
        </div>
        <Footer />
      </div>
      <CookieBanner />
    </div>
  );
}
