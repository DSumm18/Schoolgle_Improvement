"use client";

import {
  FileText,
  Send,
  Download,
  Check,
  Clock,
  AlertCircle,
  X,
  Eye,
  Edit3,
} from "lucide-react";
import type {
  GeneratedDocument,
  DeliveryLogEntry,
} from "@/lib/document-engine/types";

interface DocumentTimelineProps {
  document: GeneratedDocument;
  deliveryLogs?: DeliveryLogEntry[];
}

interface TimelineEvent {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  dotColor: string;
  label: string;
  detail?: string;
  timestamp: string;
  actor?: string;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DocumentTimeline({
  document: doc,
  deliveryLogs = [],
}: DocumentTimelineProps) {
  const events: TimelineEvent[] = [];

  // Created
  events.push({
    id: "created",
    icon: Edit3,
    color: "text-slate-400",
    dotColor: "bg-slate-400",
    label: "Document created",
    detail: `From template: ${doc.category.replace(/_/g, " ")}`,
    timestamp: doc.created_at,
    actor: doc.created_by,
  });

  // Approved
  if (doc.approved_at) {
    events.push({
      id: "approved",
      icon: Check,
      color: "text-blue-400",
      dotColor: "bg-blue-400",
      label: "Approved",
      actor: doc.approved_by || undefined,
      timestamp: doc.approved_at,
    });
  }

  // Finalised
  if (
    doc.status === "finalised" ||
    doc.status === "sent" ||
    doc.status === "delivered" ||
    doc.status === "acknowledged"
  ) {
    events.push({
      id: "finalised",
      icon: Eye,
      color: "text-indigo-400",
      dotColor: "bg-indigo-400",
      label: "Finalised",
      timestamp: doc.approved_at || doc.updated_at,
    });
  }

  // Sent
  if (doc.sent_at) {
    events.push({
      id: "sent",
      icon: Send,
      color: "text-sky-400",
      dotColor: "bg-sky-400",
      label: `Sent via ${doc.delivery_method}`,
      detail: doc.recipient_email
        ? `To: ${doc.recipient_name || doc.recipient_email}`
        : doc.recipient_name
          ? `To: ${doc.recipient_name}`
          : undefined,
      timestamp: doc.sent_at,
    });
  }

  // Rejected
  if (doc.status === "rejected") {
    events.push({
      id: "rejected",
      icon: X,
      color: "text-red-400",
      dotColor: "bg-red-400",
      label: "Rejected",
      timestamp: doc.updated_at,
    });
  }

  // Delivery log events
  deliveryLogs.forEach((log) => {
    if (log.status === "delivered" && log.delivered_at) {
      events.push({
        id: `delivered-${log.id}`,
        icon: Download,
        color: "text-emerald-400",
        dotColor: "bg-emerald-400",
        label: "Delivered",
        detail: log.recipient_email ? `To: ${log.recipient_email}` : undefined,
        timestamp: log.delivered_at,
      });
    }
    if (log.status === "failed") {
      events.push({
        id: `failed-${log.id}`,
        icon: AlertCircle,
        color: "text-red-400",
        dotColor: "bg-red-400",
        label: "Delivery failed",
        detail: log.error_message || undefined,
        timestamp: log.created_at,
      });
    }
    if (log.status === "bounced") {
      events.push({
        id: `bounced-${log.id}`,
        icon: AlertCircle,
        color: "text-amber-400",
        dotColor: "bg-amber-400",
        label: "Bounced",
        detail: log.error_message || undefined,
        timestamp: log.created_at,
      });
    }
  });

  // Acknowledged
  if (doc.status === "acknowledged") {
    events.push({
      id: "acknowledged",
      icon: Check,
      color: "text-green-400",
      dotColor: "bg-green-400",
      label: "Acknowledged by recipient",
      timestamp: doc.updated_at,
    });
  }

  // Sort by timestamp
  events.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-500">
        <Clock size={24} className="mb-2 opacity-50" />
        <p className="text-sm">No timeline events yet</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      {events.map((event, index) => {
        const Icon = event.icon;
        const isLast = index === events.length - 1;

        return (
          <div key={event.id} className="relative flex gap-4 pb-6">
            {/* Connecting Line */}
            {!isLast && (
              <div className="absolute left-[11px] top-7 h-full w-px bg-slate-700" />
            )}

            {/* Dot */}
            <div className="relative z-10 flex-shrink-0">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-800 ${event.dotColor}`}
              >
                <Icon size={12} className="text-slate-900" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 -mt-0.5">
              <p className={`text-sm font-medium ${event.color}`}>
                {event.label}
              </p>
              {event.detail && (
                <p className="mt-0.5 text-xs text-slate-500">{event.detail}</p>
              )}
              <p className="mt-1 text-[11px] text-slate-600">
                {formatTimestamp(event.timestamp)}
                {event.actor && (
                  <span className="ml-2 text-slate-500">by {event.actor}</span>
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
