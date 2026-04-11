"use client";

/**
 * New Helpdesk Ticket
 *
 * Create a new estates helpdesk ticket. Includes an asset picker with
 * live warranty status check — if the selected asset is under warranty,
 * the user is advised to contact the original supplier first instead
 * of booking a different contractor.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Send, Wrench } from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import { AssetPicker } from "@/components/estates-compliance/AssetPicker";
import { toast } from "sonner";

type Priority = "low" | "medium" | "high" | "critical";

const CATEGORIES = [
  { value: "mechanical", label: "Mechanical / Heating" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing / Water" },
  { value: "fire_safety", label: "Fire Safety" },
  { value: "security", label: "Security / CCTV" },
  { value: "it_equipment", label: "IT Equipment" },
  { value: "furniture", label: "Furniture" },
  { value: "grounds", label: "Grounds / Playground" },
  { value: "kitchen", label: "Kitchen" },
  { value: "general", label: "General" },
];

const PRIORITY_OPTIONS: Array<{
  value: Priority;
  label: string;
  description: string;
  color: string;
}> = [
  {
    value: "critical",
    label: "Critical",
    description: "Immediate safety risk or total loss of service",
    color: "border-red-700 bg-red-950/40 text-red-200",
  },
  {
    value: "high",
    label: "High",
    description: "Affecting the school day, needs attention today",
    color: "border-orange-700 bg-orange-950/40 text-orange-200",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Needs resolving this week",
    color: "border-amber-700 bg-amber-950/40 text-amber-200",
  },
  {
    value: "low",
    label: "Low",
    description: "Routine job, no urgency",
    color: "border-blue-700 bg-blue-950/40 text-blue-200",
  },
];

interface SelectedAsset {
  id: string;
  code: string | null;
  name: string;
}

interface WarrantyInfo {
  warranty_status: "active" | "expiring_soon" | "expired" | "none";
  warranty_provider: string | null;
  supplier_contact: {
    contractor_id: string;
    company_name: string;
    email: string | null;
  } | null;
}

export default function NewTicketPage() {
  const { organizationId } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState("general");
  const [location, setLocation] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<SelectedAsset | null>(null);
  const [warranty, setWarranty] = useState<WarrantyInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!organizationId) {
      toast.error("Not signed in");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error("No auth token");

      const res = await fetch("/api/estates/helpdesk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizationId,
          title: title.trim(),
          description: description.trim() || title.trim(),
          priority,
          category,
          location: location.trim() || undefined,
          asset_id: selectedAsset?.id || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const body = await res.json();
      const ticket = body?.data || body;
      toast.success(`Ticket ${ticket.ticket_number || ""} created`);
      router.push(`/estates-compliance/helpdesk/${ticket.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create ticket";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div>
        <Link
          href="/estates-compliance/helpdesk"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Helpdesk
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <Wrench className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">New Helpdesk Ticket</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Report a maintenance issue, request a repair, or log a new problem.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Asset picker (drives warranty check) */}
        <div className="rounded-lg border border-border bg-card p-5">
          {organizationId && (
            <AssetPicker
              organizationId={organizationId}
              onSelect={(asset, warrantyInfo) => {
                if (asset) {
                  setSelectedAsset({ id: asset.id, code: asset.code, name: asset.name });
                } else {
                  setSelectedAsset(null);
                }
                setWarranty(warrantyInfo);
              }}
            />
          )}
        </div>

        {/* Title */}
        <div className="rounded-lg border border-border bg-card p-5">
          <label className="block text-sm font-medium text-foreground">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              selectedAsset
                ? `e.g. ${selectedAsset.name} not working`
                : "Brief description of the issue"
            }
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          />
        </div>

        {/* Description */}
        <div className="rounded-lg border border-border bg-card p-5">
          <label className="block text-sm font-medium text-foreground">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="What happened? What have you tried? Any error messages? The more detail, the faster it gets fixed."
            className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Priority */}
        <div className="rounded-lg border border-border bg-card p-5">
          <label className="mb-3 block text-sm font-medium text-foreground">Priority</label>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                className={`rounded-lg border p-3 text-left transition ${
                  priority === opt.value
                    ? `${opt.color} ring-2 ring-primary/50 ring-offset-2 ring-offset-background`
                    : "border-border bg-muted text-muted-foreground hover:border-border/80 hover:bg-accent"
                }`}
              >
                <div className="text-sm font-semibold">{opt.label}</div>
                <div className="mt-1 text-xs opacity-80">{opt.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Category + location */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Location <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Plant Room, Year 3 Classroom"
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Warning if asset under warranty */}
        {warranty && warranty.warranty_status === "active" && (
          <div className="rounded-lg border-2 border-green-600 bg-green-50 p-4 text-sm text-green-900 dark:border-green-700 dark:bg-green-950/40 dark:text-green-200">
            <strong>Reminder:</strong> this asset is covered by{" "}
            {warranty.warranty_provider || "the supplier"}. Raising this ticket
            is fine for tracking, but the <strong>supplier should fix it for free</strong>.
            Contact them first.
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/estates-compliance/helpdesk"
            className="rounded-lg border border-border bg-muted px-4 py-2 text-sm text-foreground hover:bg-accent"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Save className="h-4 w-4 animate-pulse" />
                Creating...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Create Ticket
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
