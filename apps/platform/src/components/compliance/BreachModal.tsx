"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BreachModalProps {
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const SEVERITY_OPTIONS = [
  {
    value: "low",
    label: "Low",
    description: "Minor issue, no personal data at risk",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Some personal data may be affected",
  },
  {
    value: "high",
    label: "High",
    description: "Significant data exposed, individuals at risk",
  },
  {
    value: "critical",
    label: "Critical",
    description: "Large-scale breach, ICO must be notified",
  },
];

export default function BreachModal({
  organizationId,
  isOpen,
  onClose,
  onSave,
}: BreachModalProps) {
  const [formData, setFormData] = useState({
    date_discovered: new Date().toISOString().split("T")[0],
    date_occurred: "",
    description: "",
    data_affected: "",
    individuals_affected: "",
    severity: "low",
    ico_notified: false,
    ico_notification_date: "",
    individuals_notified: false,
    root_cause: "",
    actions_taken: "",
    preventive_measures: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/compliance/gdpr/breach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          ...formData,
          individuals_affected: formData.individuals_affected
            ? parseInt(formData.individuals_affected)
            : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to log breach");
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: "border-slate-200 bg-slate-50",
      medium: "border-amber-200 bg-amber-50",
      high: "border-orange-200 bg-orange-50",
      critical: "border-rose-200 bg-rose-50",
    };
    return colors[severity] || colors.low;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            Log Data Breach
          </DialogTitle>
          <DialogDescription>
            Record details of a data breach. High and critical breaches must be
            reported to the ICO within 72 hours.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 rounded-lg">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_discovered">Date Discovered *</Label>
              <Input
                id="date_discovered"
                type="date"
                value={formData.date_discovered}
                onChange={(e) =>
                  setFormData({ ...formData, date_discovered: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_occurred">Date Occurred</Label>
              <Input
                id="date_occurred"
                type="date"
                value={formData.date_occurred}
                onChange={(e) =>
                  setFormData({ ...formData, date_occurred: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity">Severity *</Label>
            <div className="grid grid-cols-2 gap-2">
              {SEVERITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, severity: opt.value })
                  }
                  className={`p-3 rounded-lg border text-left transition-all ${
                    formData.severity === opt.value
                      ? `${getSeverityColor(opt.value)} ring-2 ring-purple-400`
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-[10px] text-slate-500">
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description of Breach *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
              placeholder="What happened? How was it discovered?"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_affected">Data Affected</Label>
              <Input
                id="data_affected"
                value={formData.data_affected}
                onChange={(e) =>
                  setFormData({ ...formData, data_affected: e.target.value })
                }
                placeholder="e.g. Pupil names, addresses"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="individuals_affected">
                Number of Individuals
              </Label>
              <Input
                id="individuals_affected"
                type="number"
                value={formData.individuals_affected}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    individuals_affected: e.target.value,
                  })
                }
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="flex items-center gap-3">
              <Checkbox
                id="ico_notified"
                checked={formData.ico_notified}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, ico_notified: checked === true })
                }
              />
              <Label htmlFor="ico_notified" className="text-sm cursor-pointer">
                ICO has been notified
              </Label>
            </div>

            {formData.ico_notified && (
              <div className="space-y-2 pl-7">
                <Label htmlFor="ico_notification_date">Notification Date</Label>
                <Input
                  id="ico_notification_date"
                  type="date"
                  value={formData.ico_notification_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ico_notification_date: e.target.value,
                    })
                  }
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              <Checkbox
                id="individuals_notified"
                checked={formData.individuals_notified}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    individuals_notified: checked === true,
                  })
                }
              />
              <Label
                htmlFor="individuals_notified"
                className="text-sm cursor-pointer"
              >
                Affected individuals have been notified
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="root_cause">Root Cause</Label>
            <Textarea
              id="root_cause"
              value={formData.root_cause}
              onChange={(e) =>
                setFormData({ ...formData, root_cause: e.target.value })
              }
              placeholder="What was the underlying cause?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="actions_taken">Actions Taken</Label>
            <Textarea
              id="actions_taken"
              value={formData.actions_taken}
              onChange={(e) =>
                setFormData({ ...formData, actions_taken: e.target.value })
              }
              placeholder="What steps were taken to contain the breach?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preventive_measures">Preventive Measures</Label>
            <Textarea
              id="preventive_measures"
              value={formData.preventive_measures}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  preventive_measures: e.target.value,
                })
              }
              placeholder="What will prevent this from happening again?"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saving ? "Saving..." : "Log Breach"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
