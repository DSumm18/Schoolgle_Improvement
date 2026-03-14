"use client";

import { useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useStaffing } from "@/store/staffingStore";
import { TIER_ORDER } from "../tier-config";
import { TierSection } from "./TierSection";
import { ReleasedPanel } from "./ReleasedPanel";
import { RoleLibrary } from "./RoleLibrary";
import type { Tier, ScenarioPost, StaffPost } from "@/types/staffing";

export function CanvasView() {
  const { state, releasePost, restorePost, addPost, dispatch } = useStaffing();
  const { scenarioPosts } = state;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const releasedPosts = scenarioPosts.filter((sp) => sp.status === "released");
  const activePosts = scenarioPosts.filter((sp) => sp.status !== "released");

  const handleRelease = useCallback(
    (scenarioPostId: string) => releasePost(scenarioPostId),
    [releasePost],
  );

  const handleRestore = useCallback(
    (scenarioPostId: string) => restorePost(scenarioPostId),
    [restorePost],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeData = active.data.current as Record<string, unknown> | undefined;
      const overData = over.data.current as Record<string, unknown> | undefined;
      if (!activeData) return;

      const sourceType = activeData.type as string;
      const targetType = overData?.type as string | undefined;

      // Drop onto released zone
      if (targetType === "released-zone") {
        if (sourceType === "active") {
          releasePost(activeData.scenarioPostId as string);
        }
        return;
      }

      // Drop onto a tier
      if (targetType === "tier") {
        const targetTier = overData?.tier as Tier;

        if (sourceType === "library") {
          const lib = activeData.libraryItem as {
            id: string;
            role: string;
            tier: Tier;
            salary: number;
            oc: number;
          };
          // Create a new scenario post from library
          const newPost: ScenarioPost & { staff_post: StaffPost } = {
            id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            scenario_id: state.activeScenarioId ?? "",
            staff_post_id: `lib-${lib.id}`,
            status: "added",
            override_salary: null,
            override_fte: null,
            position_order: scenarioPosts.length,
            staff_post: {
              id: `lib-${lib.id}-${Date.now()}`,
              organization_id: "",
              name: null,
              role: lib.role,
              tier: targetTier,
              salary: lib.salary,
              fte: 1.0,
              on_cost_rate: lib.oc,
              dfe_code: null,
              pay_framework: null,
              contract_type: null,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          };
          addPost(newPost);
        } else if (sourceType === "released") {
          restorePost(activeData.scenarioPostId as string);
        }
        // active cards can be reordered between tiers in future
      }
    },
    [state.activeScenarioId, scenarioPosts.length, releasePost, restorePost, addPost],
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-[190px_1fr_180px] max-h-[430px] border border-slate-200/60 dark:border-slate-700/50 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
        {/* Left: Released posts */}
        <ReleasedPanel releasedPosts={releasedPosts} onRestore={handleRestore} />

        {/* Center: Tier sections */}
        <div className="overflow-y-auto bg-white dark:bg-slate-900">
          {TIER_ORDER.map((tier) => {
            const tierPosts = activePosts.filter(
              (sp) => (sp.staff_post.tier ?? "support") === tier,
            );
            return (
              <TierSection
                key={tier}
                tier={tier}
                posts={tierPosts}
                payRate={5.5} // TODO: wire to pay assumptions
                onRelease={handleRelease}
              />
            );
          })}
        </div>

        {/* Right: Role library */}
        <RoleLibrary />
      </div>
    </DndContext>
  );
}
