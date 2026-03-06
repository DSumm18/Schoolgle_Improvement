"use client";

import React from "react";
import { Mail, Sparkles } from "lucide-react";
import {
  ModulePageHeader,
  ModuleFeatureBanner,
} from "@/components/ui/module-page-header";

export default function ParentCommsPage() {
  return (
    <div className="p-6 md:p-8 space-y-8 min-h-screen max-w-[1600px] mx-auto">
      <ModulePageHeader
        moduleId="teaching-learning"
        icon={Mail}
        label="Teaching & Learning"
        title="Parent Comms"
        description="Effortless communication with home. Draft newsletters, reports, and individual updates in seconds with AI assistance."
        badge="Coming Soon"
      />

      <ModuleFeatureBanner
        moduleId="teaching-learning"
        icon={Sparkles}
        title="Streamlined Parent Communication"
        description="Draft professional newsletters, progress reports, and individual parent updates with AI support. Multi-language translation included for diverse school communities."
      />
    </div>
  );
}
