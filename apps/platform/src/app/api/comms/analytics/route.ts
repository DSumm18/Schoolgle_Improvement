import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// GET /api/comms/analytics — dashboard stats and recent activity
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  const range = req.nextUrl.searchParams.get("range") || "7d";

  const daysBack = range === "30d" ? 30 : range === "14d" ? 14 : 7;
  const since = new Date(Date.now() - daysBack * 86400000).toISOString();

  const [
    analyticsRes,
    noticesRes,
    broadcastsRes,
    devicesRes,
    scheduledRes,
  ] = await Promise.all([
    // Recent analytics events
    supabase
      .from("comms_analytics")
      .select("*")
      .eq("organization_id", orgId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200),

    // Notice counts
    supabase
      .from("school_notices")
      .select("id, notice_type, priority, audience, view_count, acknowledgement_count, created_at")
      .eq("organization_id", orgId)
      .gte("created_at", since)
      .order("created_at", { ascending: false }),

    // Broadcast history
    supabase
      .from("emergency_broadcasts")
      .select("id, alert_type, severity, status, is_drill, affected_zones, created_at, resolved_at")
      .eq("organization_id", orgId)
      .gte("created_at", since)
      .order("created_at", { ascending: false }),

    // Device status
    supabase
      .from("emergency_display_devices")
      .select("id, device_type, is_online, last_heartbeat")
      .eq("organization_id", orgId),

    // Scheduled notices
    supabase
      .from("scheduled_notices")
      .select("id, status, scheduled_for")
      .eq("organization_id", orgId)
      .eq("status", "pending")
      .order("scheduled_for", { ascending: true })
      .limit(10),
  ]);

  const notices = noticesRes.data || [];
  const broadcasts = broadcastsRes.data || [];
  const devices = devicesRes.data || [];
  const scheduled = scheduledRes.data || [];
  const analytics = analyticsRes.data || [];

  // Compute stats
  const totalNotices = notices.length;
  const totalViews = notices.reduce((sum: number, n: any) => sum + (n.view_count || 0), 0);
  const totalAcks = notices.reduce((sum: number, n: any) => sum + (n.acknowledgement_count || 0), 0);
  const urgentNotices = notices.filter((n: any) => n.priority === "urgent").length;
  const onlineDevices = devices.filter((d: any) => d.is_online).length;
  const totalDevices = devices.length;
  const totalBroadcasts = broadcasts.length;
  const drills = broadcasts.filter((b: any) => b.is_drill);
  const realAlerts = broadcasts.filter((b: any) => !b.is_drill);

  // Notice type breakdown
  const typeBreakdown: Record<string, number> = {};
  notices.forEach((n: any) => {
    typeBreakdown[n.notice_type] = (typeBreakdown[n.notice_type] || 0) + 1;
  });

  // Audience breakdown
  const audienceBreakdown: Record<string, number> = {};
  notices.forEach((n: any) => {
    audienceBreakdown[n.audience] = (audienceBreakdown[n.audience] || 0) + 1;
  });

  // Daily activity (notices per day)
  const dailyActivity: Record<string, number> = {};
  notices.forEach((n: any) => {
    const day = new Date(n.created_at).toISOString().split("T")[0];
    dailyActivity[day] = (dailyActivity[day] || 0) + 1;
  });

  // Channel breakdown from analytics
  const channelBreakdown: Record<string, number> = {};
  analytics.forEach((a: any) => {
    if (a.channel) {
      channelBreakdown[a.channel] = (channelBreakdown[a.channel] || 0) + 1;
    }
  });

  // Average evacuation time from drill broadcasts
  const resolvedBroadcasts = broadcasts.filter((b: any) => b.resolved_at && b.created_at);
  const avgResponseTime = resolvedBroadcasts.length > 0
    ? Math.round(
        resolvedBroadcasts.reduce((sum: number, b: any) => {
          return sum + (new Date(b.resolved_at).getTime() - new Date(b.created_at).getTime()) / 1000;
        }, 0) / resolvedBroadcasts.length
      )
    : null;

  return apiSuccess({
    period: range,
    summary: {
      totalNotices,
      totalViews,
      totalAcknowledgements: totalAcks,
      urgentNotices,
      onlineDevices,
      totalDevices,
      totalBroadcasts,
      drillCount: drills.length,
      realAlertCount: realAlerts.length,
      scheduledPending: scheduled.length,
      avgResponseTimeSeconds: avgResponseTime,
    },
    typeBreakdown,
    audienceBreakdown,
    dailyActivity,
    channelBreakdown,
    recentActivity: analytics.slice(0, 20),
    upcomingScheduled: scheduled,
  });
});

// POST /api/comms/analytics — log an analytics event
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const body = await req.json();

  const { error } = await supabase.from("comms_analytics").insert({
    organization_id: auth.organizationId,
    event_type: body.event_type,
    event_data: body.event_data || {},
    actor_id: auth.userId,
    actor_name: body.actor_name,
    channel: body.channel,
  });

  if (error) return apiError(error.message, 500);
  return apiSuccess({ logged: true });
});
