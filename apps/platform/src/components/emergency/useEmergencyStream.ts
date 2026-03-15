"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface EmergencyBroadcast {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  custom_instructions?: string;
  affected_zone_ids: string[];
  affected_zone_names: string[];
  is_whole_school: boolean;
  show_floor_plan: boolean;
  play_audio: boolean;
  audio_type: string;
  screen_color: string;
  flash_screen: boolean;
  status: string;
  triggered_by_name: string;
  triggered_at: string;
  is_drill: boolean;
  emergency_zone_instructions?: ZoneInstruction[];
}

export interface ZoneInstruction {
  id: string;
  zone_id: string;
  proximity: "affected" | "adjacent" | "distant";
  instruction: string;
  secondary_instruction?: string;
  assembly_point?: string;
  evacuation_route?: string;
}

interface StreamEvent {
  broadcast: EmergencyBroadcast;
  zoneInstruction?: ZoneInstruction;
  isExisting?: boolean;
}

interface UseEmergencyStreamOptions {
  orgId: string | null;
  zoneId?: string | null;
  deviceId?: string | null;
  enabled?: boolean;
}

export function useEmergencyStream({
  orgId,
  zoneId,
  deviceId,
  enabled = true,
}: UseEmergencyStreamOptions) {
  const [activeBroadcast, setActiveBroadcast] = useState<EmergencyBroadcast | null>(null);
  const [zoneInstruction, setZoneInstruction] = useState<ZoneInstruction | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [allClear, setAllClear] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!orgId || !enabled) return;

    const params = new URLSearchParams({ org: orgId });
    if (zoneId) params.set("zone", zoneId);
    if (deviceId) params.set("device", deviceId);

    const es = new EventSource(`/api/emergency/stream?${params}`);
    eventSourceRef.current = es;

    es.addEventListener("connected", () => {
      setIsConnected(true);
      setAllClear(false);
    });

    es.addEventListener("alert", (event) => {
      const data: StreamEvent = JSON.parse(event.data);
      setActiveBroadcast(data.broadcast);
      setZoneInstruction(data.zoneInstruction || null);
      setAllClear(false);
    });

    es.addEventListener("update", (event) => {
      const data: StreamEvent = JSON.parse(event.data);
      setActiveBroadcast(data.broadcast);
      if (data.zoneInstruction) {
        setZoneInstruction(data.zoneInstruction);
      }
    });

    es.addEventListener("all_clear", () => {
      setAllClear(true);
      // Keep broadcast visible for 30 seconds with ALL CLEAR overlay
      setTimeout(() => {
        setActiveBroadcast(null);
        setZoneInstruction(null);
        setAllClear(false);
      }, 30000);
    });

    es.addEventListener("heartbeat", () => {
      // Connection alive
    });

    es.onerror = () => {
      setIsConnected(false);
      es.close();
      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };
  }, [orgId, zoneId, deviceId, enabled]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const dismiss = useCallback(() => {
    setActiveBroadcast(null);
    setZoneInstruction(null);
    setAllClear(false);
  }, []);

  return {
    activeBroadcast,
    zoneInstruction,
    isConnected,
    allClear,
    dismiss,
  };
}
