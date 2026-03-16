/**
 * Emergency Broadcast SSE Stream
 *
 * GET /api/emergency/stream?org=<orgId>&zone=<zoneId>&device=<deviceId>&token=<token>
 *
 * Server-Sent Events endpoint that pushes real-time emergency alerts
 * to all connected devices. Each device registers with its zone so
 * it receives zone-specific instructions.
 *
 * Events sent:
 *   - alert: New emergency broadcast
 *   - update: Broadcast updated (message change, escalation)
 *   - all_clear: Emergency resolved
 *   - heartbeat: Keep-alive every 15 seconds
 */

import { NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-server";

// In-memory registry of active SSE connections per org
// In production, this would use Redis pub/sub or Supabase Realtime
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

// Global broadcast function - called by broadcast API to push to all connections
export function pushToOrg(orgId: string, event: string, data: any) {
  const orgConnections = connections.get(orgId);
  if (!orgConnections) return;

  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const deadControllers: ReadableStreamDefaultController[] = [];

  orgConnections.forEach((controller) => {
    try {
      controller.enqueue(new TextEncoder().encode(message));
    } catch {
      deadControllers.push(controller);
    }
  });

  // Clean up dead connections
  deadControllers.forEach((c) => orgConnections.delete(c));
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const orgId = url.searchParams.get("org");
  const zoneId = url.searchParams.get("zone");
  const deviceId = url.searchParams.get("device");

  if (!orgId) {
    return new Response("Missing org parameter", { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Update device online status
  if (deviceId) {
    await supabase
      .from("emergency_display_devices")
      .update({ is_online: true, last_seen_at: new Date().toISOString() })
      .eq("id", deviceId);
  }

  let controllerRef: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;

      // Register this connection
      if (!connections.has(orgId)) {
        connections.set(orgId, new Set());
      }
      connections.get(orgId)!.add(controller);

      // Send initial connection event
      const connectMsg = `event: connected\ndata: ${JSON.stringify({
        status: "connected",
        orgId,
        zoneId,
        deviceId,
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(connectMsg));

      // Check for any active broadcasts and send immediately
      (async () => {
        const { data: activeBroadcasts } = await supabase
          .from("emergency_broadcasts")
          .select("*, emergency_zone_instructions(*)")
          .eq("organization_id", orgId)
          .in("status", ["active", "escalated"])
          .order("triggered_at", { ascending: false });

        if (activeBroadcasts && activeBroadcasts.length > 0) {
          for (const broadcast of activeBroadcasts) {
            // Find zone-specific instruction for this device's zone
            let zoneInstruction = null;
            if (zoneId && broadcast.emergency_zone_instructions) {
              zoneInstruction = broadcast.emergency_zone_instructions.find(
                (zi: any) => zi.zone_id === zoneId
              );
            }

            const alertMsg = `event: alert\ndata: ${JSON.stringify({
              broadcast,
              zoneInstruction,
              isExisting: true,
            })}\n\n`;

            try {
              controller.enqueue(new TextEncoder().encode(alertMsg));
            } catch {
              // Connection already closed
            }
          }
        }
      })();

      // Heartbeat every 15 seconds
      const heartbeat = setInterval(() => {
        try {
          const hb = `event: heartbeat\ndata: ${JSON.stringify({
            timestamp: new Date().toISOString(),
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(hb));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        connections.get(orgId)?.delete(controller);

        // Mark device offline
        if (deviceId) {
          supabase
            .from("emergency_display_devices")
            .update({ is_online: false, last_seen_at: new Date().toISOString() })
            .eq("id", deviceId)
            .then(() => {});
        }
      });
    },
    cancel() {
      if (controllerRef) {
        connections.get(orgId)?.delete(controllerRef);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
