"use client";

import React from "react";
import Hero from "@/components/website/Hero";
import LatestResearch from "@/components/website/LatestResearch";
import TaskStrip from "@/components/website/TaskStrip";
import MeetEd from "@/components/website/MeetEd";
import SystemsBridge from "@/components/website/SystemsBridge";
import ProblemStatement from "@/components/website/ProblemStatement";
import WhatSchoolgleDoes from "@/components/website/WhatSchoolgleDoes";
import ProductsSection from "@/components/website/ProductsSection";
import PreviewModules from "@/components/website/PreviewModules";
import TrustSection from "@/components/website/TrustSection";
import EarlyAccessForm from "@/components/website/EarlyAccessForm";

export default function HomePage() {
  return (
    <>
      <Hero />
      <LatestResearch />
      <TaskStrip />
      <MeetEd />
      <SystemsBridge />
      <ProblemStatement />
      <WhatSchoolgleDoes />
      <ProductsSection />
      <PreviewModules />
      <TrustSection />
      <EarlyAccessForm />
    </>
  );
}
