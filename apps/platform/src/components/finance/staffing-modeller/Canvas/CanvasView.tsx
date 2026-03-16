"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useStaffing } from "@/store/staffingStore";
import { TIER_ORDER } from "../tier-config";
import { DEFAULT_TIER } from "../utils";
import { TierSection } from "./TierSection";
import { ReleasedPanel } from "./ReleasedPanel";
import { RoleLibrary } from "./RoleLibrary";
import type { Tier, ScenarioPost, StaffPost } from "@/types/staffing";
import { useCallback } from "react";

export function CanvasView() {
  const { state, derived, releasePost, restorePost, addPost } = useStaffing();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
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

      if (targetType === "released-zone") {
        if (sourceType === "active") {
          releasePost(activeData.scenarioPostId as string);
        }
        return;
      }

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
          const newPost: ScenarioPost & { staff_post: StaffPost } = {
            id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            scenario_id: state.activeScenarioId ?? "",
            staff_post_id: `lib-${lib.id}`,
            status: "added",
            override_salary: null,
            override_fte: null,
            position_order: state.scenarioPosts.length,
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
      }
    },
    [state.activeScenarioId, state.scenarioPosts.length, releasePost, restorePost, addPost],
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-[190px_1fr_180px] max-h-[430px] border border-slate-200/60 dark:border-slate-700/50 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
        <ReleasedPanel releasedPosts={derived.releasedPosts} onRestore={restorePost} />

        <div className="overflow-y-auto bg-white dark:bg-slate-900">
          {TIER_ORDER.map((tier) => (
            <TierSection
              key={tier}
              tier={tier}
              posts={derived.postsByTier.get(tier) ?? []}
              payRate={5.5}
              onRelease={releasePost}
            />
          ))}
        </div>

        <RoleLibrary />
      </div>
    </DndContext>
  );
}
