"use client";

import { useEffect, useState } from "react";
import { useEmergencyStream } from "./useEmergencyStream";
import { EmergencyTakeover } from "./EmergencyTakeover";

/**
 * EmergencyListener
 *
 * Drop this component into the main dashboard layout.
 * It silently connects to the SSE stream and takes over
 * the entire screen if an emergency broadcast is active.
 *
 * Works on:
 * - Dashboard (staff see it on any page)
 * - Display mode (classroom boards in fullscreen)
 * - Mobile (responsive takeover)
 */
interface EmergencyListenerProps {
  organizationId: string;
  zoneId?: string;
  deviceId?: string;
  schoolName?: string;
  schoolLogo?: string;
  isDisplayMode?: boolean;
}

export function EmergencyListener({
  organizationId,
  zoneId,
  deviceId,
  schoolName,
  schoolLogo,
  isDisplayMode = false,
}: EmergencyListenerProps) {
  const [minimized, setMinimized] = useState(false);

  const { activeBroadcast, zoneInstruction, isConnected, allClear, dismiss } =
    useEmergencyStream({
      orgId: organizationId,
      zoneId,
      deviceId,
      enabled: true,
    });

  // Reset minimized when a new broadcast arrives
  useEffect(() => {
    if (activeBroadcast) {
      setMinimized(false);
    }
  }, [activeBroadcast?.id]);

  // No active broadcast — render nothing
  if (!activeBroadcast && !allClear) {
    return null;
  }

  // Minimized banner (only on dashboard, not display mode)
  if (minimized && !isDisplayMode && activeBroadcast) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed top-0 left-0 right-0 z-[99998] bg-red-600 text-white py-2 px-4 text-center font-bold animate-pulse"
      >
        EMERGENCY ACTIVE: {activeBroadcast.title} — Click to view
      </button>
    );
  }

  if (!activeBroadcast) return null;

  return (
    <EmergencyTakeover
      broadcast={activeBroadcast}
      zoneInstruction={zoneInstruction}
      allClear={allClear}
      schoolName={schoolName}
      schoolLogo={schoolLogo}
      isDisplayMode={isDisplayMode}
      onDismiss={isDisplayMode ? undefined : () => setMinimized(true)}
      onAcknowledge={async (data) => {
        try {
          await fetch(`/api/emergency/broadcast/${activeBroadcast.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "acknowledge",
              zone_id: zoneId,
              device_id: deviceId,
              ...data,
            }),
          });
        } catch {
          // Acknowledgement failed — non-critical
        }
      }}
    />
  );
}
