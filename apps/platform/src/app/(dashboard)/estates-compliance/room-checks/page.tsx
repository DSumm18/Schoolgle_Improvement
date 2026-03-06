"use client";

/**
 * Room Checks Page
 *
 * AM/PM room check dashboard with scan capability.
 * Head teacher's morning view -- green/red/amber at a glance.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import { RoomCheckDashboard } from "@/components/vision/RoomCheckDashboard";
import { RoomScanCapture } from "@/components/vision/RoomScanCapture";

export default function RoomChecksPage() {
  const { user, organization, loading: authLoading } = useAuth();
  const organizationId = organization?.id;

  const [roomNames, setRoomNames] = useState<Record<string, string>>({});
  const [scanningRoom, setScanningRoom] = useState<string | null>(null);
  const [checkType, setCheckType] = useState<"am_open" | "pm_close" | "ad_hoc">(
    "ad_hoc",
  );

  // Determine AM or PM based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setCheckType("am_open");
    } else {
      setCheckType("pm_close");
    }
  }, []);

  // Fetch room names from estates locations
  useEffect(() => {
    if (!organizationId) return;

    const fetchRoomNames = async () => {
      const { data } = await supabase
        .from("estates_locations")
        .select("id, name")
        .eq("organization_id", organizationId);

      if (data) {
        const names: Record<string, string> = {};
        data.forEach((loc: any) => {
          names[loc.id] = loc.name;
        });
        setRoomNames(names);
      }
    };

    fetchRoomNames();
  }, [organizationId]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!organizationId || !user) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Please sign in to view room checks.
      </div>
    );
  }

  // If scanning a room, show the capture component
  if (scanningRoom) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setScanningRoom(null)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Button>
        <RoomScanCapture
          organizationId={organizationId}
          assetId={scanningRoom}
          roomName={
            roomNames[scanningRoom] || `Room ${scanningRoom.slice(0, 6)}`
          }
          checkType={checkType}
          userId={user.id}
          onComplete={() => setScanningRoom(null)}
          onCancel={() => setScanningRoom(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/estates-compliance">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Estates
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Room Checks</h1>
            <p className="text-sm text-muted-foreground">
              {checkType === "am_open" ? "AM Opening" : "PM Closing"} checks for{" "}
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/estates-compliance/room-checks/schedule">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" /> Schedule
            </Button>
          </Link>
        </div>
      </div>

      {/* Dashboard */}
      <RoomCheckDashboard
        organizationId={organizationId}
        roomNames={roomNames}
        onScanRoom={(assetId) => setScanningRoom(assetId)}
      />
    </div>
  );
}
