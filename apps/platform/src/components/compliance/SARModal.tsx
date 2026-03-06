"use client";

import { useState, useEffect } from "react";
import { UserSearch } from "lucide-react";
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

interface SARModalProps {
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function SARModal({
  organizationId,
  isOpen,
  onClose,
  onSave,
}: SARModalProps) {
  const [formData, setFormData] = useState({
    requester_name: "",
    requester_relationship: "",
    date_received: new Date().toISOString().split("T")[0],
    identity_verified: false,
    identity_verified_date: "",
    deadline_date: "",
    extension_applied: false,
    extension_reason: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-calculate deadline (30 calendar days from date_received)
  useEffect(() => {
    if (formData.date_received) {
      const received = new Date(formData.date_received);
      received.setDate(received.getDate() + 30);
      setFormData((prev) => ({
        ...prev,
        deadline_date: received.toISOString().split("T")[0],
      }));
    }
  }, [formData.date_received]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/compliance/gdpr/sar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create SAR");
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <UserSearch className="w-5 h-5 text-purple-600" />
            New Subject Access Request
          </DialogTitle>
          <DialogDescription>
            Record a new SAR. The deadline is automatically set to 30 calendar
            days from receipt.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 rounded-lg">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="requester_name">Requester Name *</Label>
            <Input
              id="requester_name"
              value={formData.requester_name}
              onChange={(e) =>
                setFormData({ ...formData, requester_name: e.target.value })
              }
              required
              placeholder="Full name of the person making the request"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requester_relationship">
              Relationship to School
            </Label>
            <Input
              id="requester_relationship"
              value={formData.requester_relationship}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  requester_relationship: e.target.value,
                })
              }
              placeholder="e.g. Parent, Former pupil, Staff member"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_received">Date Received *</Label>
              <Input
                id="date_received"
                type="date"
                value={formData.date_received}
                onChange={(e) =>
                  setFormData({ ...formData, date_received: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline_date">Deadline</Label>
              <Input
                id="deadline_date"
                type="date"
                value={formData.deadline_date}
                disabled
                className="bg-slate-50"
              />
              <p className="text-[10px] text-slate-400">
                Auto-calculated: 30 days from receipt
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <Checkbox
              id="identity_verified"
              checked={formData.identity_verified}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  identity_verified: checked === true,
                })
              }
            />
            <Label
              htmlFor="identity_verified"
              className="text-sm cursor-pointer"
            >
              Identity has been verified
            </Label>
          </div>

          {formData.identity_verified && (
            <div className="space-y-2">
              <Label htmlFor="identity_verified_date">Date Verified</Label>
              <Input
                id="identity_verified_date"
                type="date"
                value={formData.identity_verified_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    identity_verified_date: e.target.value,
                  })
                }
              />
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <Checkbox
              id="extension_applied"
              checked={formData.extension_applied}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  extension_applied: checked === true,
                })
              }
            />
            <Label
              htmlFor="extension_applied"
              className="text-sm cursor-pointer"
            >
              Extension applied (complex request)
            </Label>
          </div>

          {formData.extension_applied && (
            <div className="space-y-2">
              <Label htmlFor="extension_reason">Reason for Extension</Label>
              <Textarea
                id="extension_reason"
                value={formData.extension_reason}
                onChange={(e) =>
                  setFormData({ ...formData, extension_reason: e.target.value })
                }
                placeholder="Explain why an extension is needed..."
                rows={2}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Any additional details about this request..."
              rows={3}
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
              {saving ? "Saving..." : "Create SAR"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
