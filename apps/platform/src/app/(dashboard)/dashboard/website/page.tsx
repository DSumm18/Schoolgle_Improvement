"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { WebsiteBuilderDashboard, SetupWizard, PageEditor } from "@/components/website-builder";
import type { WebsitePage } from "@/lib/website-builder/content-types";
import type { HeroMaskId, PaletteOption } from "@/lib/website-builder/types";

type View = "dashboard" | "setup" | "edit-page";

export default function WebsiteBuilderPage() {
  const router = useRouter();
  const { organization, organizationId } = useAuth();
  const [view, setView] = useState<View>("dashboard");
  const [editingPage, setEditingPage] = useState<WebsitePage | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const schoolName = organization?.name || "My School";

  // Handle setup wizard completion
  const handleSetupComplete = async (config: {
    logoUrl: string | null;
    palette: PaletteOption["palette"];
    presetId: string;
    fontPairingId: string;
    heroMaskId: HeroMaskId;
    heroImageUrl: string | null;
    motto: string;
  }) => {
    try {
      const res = await fetch("/api/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName,
          schoolPhase: "primary",
          logoUrl: config.logoUrl,
          palette: config.palette,
          presetId: config.presetId,
          fontPairingId: config.fontPairingId,
          heroMaskId: config.heroMaskId,
          heroImageUrl: config.heroImageUrl,
          motto: config.motto,
        }),
      });

      if (res.ok) {
        setView("dashboard");
        // Reload the page to show the dashboard
        window.location.reload();
      }
    } catch (err) {
      console.error("Setup failed:", err);
    }
  };

  // Handle page save
  const handlePageSave = async (blocks: import("@/lib/website-builder/content-types").ContentBlock[]) => {
    if (!editingPage) return;
    setIsSaving(true);

    try {
      if (editingPage.id === "new") {
        // Create new page
        const res = await fetch("/api/website/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "New Page",
            slug: `page-${Date.now()}`,
            contentBlocks: blocks,
            status: "draft",
          }),
        });
        if (res.ok) {
          setView("dashboard");
          setEditingPage(null);
        }
      } else {
        // Update existing
        const res = await fetch(`/api/website/pages?id=${editingPage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentBlocks: blocks }),
        });
        if (res.ok) {
          setView("dashboard");
          setEditingPage(null);
        }
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* Module header */}
      {view === "dashboard" && (
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-fuchsia-50 flex items-center justify-center">
            <Globe className="w-5 h-5 text-fuchsia-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">School Website</h1>
            <p className="text-sm text-gray-500">Design, build, and publish your school website</p>
          </div>
        </div>
      )}

      {view === "dashboard" && (
        <WebsiteBuilderDashboard
          organizationId={organizationId || ""}
          onStartSetup={() => setView("setup")}
          onEditPage={(page) => {
            setEditingPage(page);
            setView("edit-page");
          }}
          onEditDesign={() => router.push("/dashboard/website/design")}
          onManageNews={() => router.push("/dashboard/website/news")}
          onViewCompliance={() => router.push("/dashboard/website/compliance")}
        />
      )}

      {view === "setup" && (
        <SetupWizard
          schoolName={schoolName}
          schoolPhase="primary"
          onComplete={handleSetupComplete}
          onCancel={() => setView("dashboard")}
        />
      )}

      {view === "edit-page" && editingPage && (
        <PageEditor
          page={editingPage}
          onSave={handlePageSave}
          onBack={() => {
            setView("dashboard");
            setEditingPage(null);
          }}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
