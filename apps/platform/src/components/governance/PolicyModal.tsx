"use client";

import { useState, useEffect } from "react";
import { FileText, Calendar } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  GovernancePolicyReviewWithOwner,
  GovernancePolicyReviewForm,
  PolicyCategory,
} from "@/lib/governance";

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  organizationId: string;
  initialData?: GovernancePolicyReviewWithOwner | null;
  governors?: any[];
}

export default function PolicyModal({
  isOpen,
  onClose,
  onSave,
  organizationId,
  initialData,
}: PolicyModalProps) {
  const [formData, setFormData] = useState<GovernancePolicyReviewForm>({
    policy_name: "",
    policy_category: "statutory",
    document_id: "",
    last_review_date: "",
    next_review_date: "",
    review_frequency_months: 36,
    policy_owner_id: "",
    review_committee: "",
    is_statutory: true,
    statutory_reference: "",
  });

  const [governors, setGovernors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      // Fetch governors when modal opens
      fetchGovernors();

      if (initialData) {
        setFormData({
          policy_name: initialData.policy_name,
          policy_category: initialData.policy_category,
          document_id: initialData.document_id || "",
          last_review_date: initialData.last_review_date || "",
          next_review_date: initialData.next_review_date,
          review_frequency_months: initialData.review_frequency_months,
          policy_owner_id: initialData.policy_owner_id || "",
          review_committee: initialData.review_committee || "",
          is_statutory: initialData.is_statutory,
          statutory_reference: initialData.statutory_reference || "",
        });
      } else {
        // Default to 36 months from now
        const defaultDate = new Date();
        defaultDate.setMonth(defaultDate.getMonth() + 36);

        setFormData({
          policy_name: "",
          policy_category: "statutory",
          document_id: "",
          last_review_date: "",
          next_review_date: defaultDate.toISOString().split("T")[0],
          review_frequency_months: 36,
          policy_owner_id: "",
          review_committee: "",
          is_statutory: true,
          statutory_reference: "",
        });
      }
      setError(null);
    }
  }, [initialData, isOpen, organizationId]);

  const fetchGovernors = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/governance/governors?organizationId=${organizationId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setGovernors(data.governors || []);
      }
    } catch (err) {
      console.error("Failed to fetch governors:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/governance/policies", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          ...(isEditing
            ? {
                updates: [
                  {
                    id: initialData!.id,
                    changes: formData,
                  },
                ],
              }
            : {
                policies: [formData],
              }),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save policy");
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save policy");
    } finally {
      setSaving(false);
    }
  };

  const updateNextReviewDate = () => {
    if (formData.last_review_date) {
      const lastReview = new Date(formData.last_review_date);
      const nextReview = new Date(lastReview);
      nextReview.setMonth(
        nextReview.getMonth() + (formData.review_frequency_months || 36),
      );
      setFormData({
        ...formData,
        next_review_date: nextReview.toISOString().split("T")[0],
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {isEditing ? "Edit Policy" : "Add Policy"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update policy review details."
              : "Add a new policy to the review schedule."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 rounded-lg">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="policy_name">Policy Name *</Label>
            <Input
              id="policy_name"
              value={formData.policy_name}
              onChange={(e) =>
                setFormData({ ...formData, policy_name: e.target.value })
              }
              required
              placeholder="e.g., Safeguarding Policy"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="policy_category">Category *</Label>
              <Select
                value={formData.policy_category}
                onValueChange={(value: PolicyCategory) =>
                  setFormData({ ...formData, policy_category: value })
                }
              >
                <SelectTrigger id="policy_category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="statutory">Statutory</SelectItem>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review_frequency_months">Review Frequency</Label>
              <Select
                value={(formData.review_frequency_months || 36).toString()}
                onValueChange={(value) => {
                  const months = parseInt(value);
                  setFormData({ ...formData, review_frequency_months: months });
                  updateNextReviewDate();
                }}
              >
                <SelectTrigger id="review_frequency_months">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">Annually</SelectItem>
                  <SelectItem value="24">Every 2 years</SelectItem>
                  <SelectItem value="36">Every 3 years</SelectItem>
                  <SelectItem value="48">Every 4 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="last_review_date">Last Review Date</Label>
              <Input
                id="last_review_date"
                type="date"
                value={formData.last_review_date || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    last_review_date: e.target.value,
                  });
                  updateNextReviewDate();
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_review_date">Next Review Date *</Label>
              <Input
                id="next_review_date"
                type="date"
                value={formData.next_review_date}
                onChange={(e) =>
                  setFormData({ ...formData, next_review_date: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="policy_owner_id">Policy Owner</Label>
            <Select
              value={formData.policy_owner_id || ""}
              onValueChange={(value) =>
                setFormData({ ...formData, policy_owner_id: value })
              }
              disabled={loading}
            >
              <SelectTrigger id="policy_owner_id">
                <SelectValue
                  placeholder={
                    loading ? "Loading governors..." : "Select owner"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {governors.map((governor) => (
                  <SelectItem key={governor.id} value={governor.id}>
                    {governor.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review_committee">Review Committee</Label>
            <Input
              id="review_committee"
              value={formData.review_committee || ""}
              onChange={(e) =>
                setFormData({ ...formData, review_committee: e.target.value })
              }
              placeholder="e.g., Finance Committee"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="is_statutory"
              checked={formData.is_statutory}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_statutory: !!checked })
              }
            />
            <label htmlFor="is_statutory" className="text-sm cursor-pointer">
              This is a statutory policy
            </label>
          </div>

          {formData.is_statutory && (
            <div className="space-y-2">
              <Label htmlFor="statutory_reference">Statutory Reference</Label>
              <Input
                id="statutory_reference"
                value={formData.statutory_reference || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    statutory_reference: e.target.value,
                  })
                }
                placeholder="e.g., Education Act 2002, Section 175"
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Policy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
