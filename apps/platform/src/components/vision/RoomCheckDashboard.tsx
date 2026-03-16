"use client";

/**
 * Room Check Dashboard
 *
 * Shows AM/PM check status for every room. Green/red/amber at a glance.
 * The head teacher's morning view.
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Camera,
  ChevronRight,
  Shield,
  RefreshCw,
} from "lucide-react";

interface RoomCheckStatus {
  required: boolean;
  status: "done" | "issues" | "missed" | "pending" | "not_required";
  check: {
    id: string;
    checked_by: string;
    checked_at: string;
    ai_summary: string;
    issues_found: number;
    compliance_score: number;
  } | null;
}

interface RoomStatus {
  assetId: string;
  roomName?: string;
  building?: string;
  floor?: string;
  schedule: {
    am_check_required: boolean;
    pm_check_required: boolean;
    am_deadline: string;
    pm_deadline: string;
  };
  am: RoomCheckStatus;
  pm: RoomCheckStatus;
}

interface Summary {
  total: number;
  am: { done: number; missed: number; pending: number };
  pm: { done: number; missed: number; pending: number };
  issueCount: number;
}

interface RoomCheckDashboardProps {
  organizationId: string;
  roomNames?: Record<string, string>;
  onScanRoom?: (assetId: string) => void;
}

const STATUS_CONFIG = {
  done: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    label: "Done",
  },
  issues: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "Issues",
  },
  missed: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    label: "Missed",
  },
  pending: {
    icon: Clock,
    color: "text-gray-400",
    bg: "bg-gray-50",
    border: "border-gray-200",
    label: "Pending",
  },
  not_required: {
    icon: Clock,
    color: "text-gray-300",
    bg: "bg-gray-50/50",
    border: "border-gray-100",
    label: "--",
  },
};

function StatusBadge({ status }: { status: string }) {
  const config =
    STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <Badge
      variant="outline"
      className={`${config.bg} ${config.border} ${config.color} gap-1`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export function RoomCheckDashboard({
  organizationId,
  roomNames,
  onScanRoom,
}: RoomCheckDashboardProps) {
  const [rooms, setRooms] = useState<RoomStatus[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [date] = useState(new Date().toISOString().split("T")[0]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/room-checks?organizationId=${organizationId}&date=${date}`,
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      // Attach room names if provided
      const enrichedRooms = (data.rooms ?? []).map((r: RoomStatus) => ({
        ...r,
        roomName: roomNames?.[r.assetId] ?? `Room ${r.assetId.slice(0, 6)}`,
      }));

      setRooms(enrichedRooms);
      setSummary(data.summary);
    } catch (err) {
      console.error("Failed to load room checks:", err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, date, roomNames]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const amProgress = summary
    ? (summary.am.done / Math.max(summary.total, 1)) * 100
    : 0;
  const pmProgress = summary
    ? (summary.pm.done / Math.max(summary.total, 1)) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                AM Opening Checks
              </span>
              <Badge
                variant={amProgress === 100 ? "default" : "outline"}
                className={amProgress === 100 ? "bg-green-600" : ""}
              >
                {summary?.am.done ?? 0} / {summary?.total ?? 0}
              </Badge>
            </div>
            <Progress value={amProgress} className="h-2" />
            {(summary?.am.missed ?? 0) > 0 && (
              <p className="text-xs text-red-600 mt-1 font-medium">
                {summary!.am.missed} missed
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                PM Closing Checks
              </span>
              <Badge
                variant={pmProgress === 100 ? "default" : "outline"}
                className={pmProgress === 100 ? "bg-green-600" : ""}
              >
                {summary?.pm.done ?? 0} / {summary?.total ?? 0}
              </Badge>
            </div>
            <Progress value={pmProgress} className="h-2" />
            {(summary?.pm.missed ?? 0) > 0 && (
              <p className="text-xs text-red-600 mt-1 font-medium">
                {summary!.pm.missed} missed
              </p>
            )}
          </CardContent>
        </Card>

        <Card
          className={`border-2 ${(summary?.issueCount ?? 0) > 0 ? "border-amber-300 bg-amber-50/30" : "border-green-300 bg-green-50/30"}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Issues Today
              </span>
              <Shield
                className={`h-5 w-5 ${(summary?.issueCount ?? 0) > 0 ? "text-amber-600" : "text-green-600"}`}
              />
            </div>
            <p
              className={`text-2xl font-bold ${(summary?.issueCount ?? 0) > 0 ? "text-amber-700" : "text-green-700"}`}
            >
              {summary?.issueCount ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">
              {(summary?.issueCount ?? 0) === 0
                ? "All clear"
                : "Actions created"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Refresh button */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={fetchData} className="gap-1">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Room list */}
      {rooms.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No rooms configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add rooms to the check schedule to start tracking AM/PM
              compliance.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rooms.map((room) => (
            <Card
              key={room.assetId}
              className={`border transition-all hover:shadow-sm ${
                room.am.status === "missed" || room.pm.status === "missed"
                  ? "border-red-200 bg-red-50/30"
                  : room.am.status === "issues" || room.pm.status === "issues"
                    ? "border-amber-200 bg-amber-50/30"
                    : room.am.status === "done" &&
                        (room.pm.status === "done" ||
                          room.pm.status === "pending")
                      ? "border-green-200 bg-green-50/30"
                      : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{room.roomName}</h4>
                    {(room.building || room.floor) && (
                      <p className="text-xs text-muted-foreground">
                        {[room.building, room.floor]
                          .filter(Boolean)
                          .join(" / ")}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                        AM
                      </p>
                      <StatusBadge status={room.am.status} />
                      {room.am.check && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(
                            room.am.check.checked_at,
                          ).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>

                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                        PM
                      </p>
                      <StatusBadge status={room.pm.status} />
                      {room.pm.check && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(
                            room.pm.check.checked_at,
                          ).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>

                    {onScanRoom && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onScanRoom(room.assetId)}
                        className="ml-2"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    )}

                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                {/* AI summary if check done today */}
                {(room.am.check?.ai_summary || room.pm.check?.ai_summary) && (
                  <p className="text-xs text-muted-foreground mt-2 pl-1 border-l-2 border-muted">
                    {room.am.check?.ai_summary || room.pm.check?.ai_summary}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
