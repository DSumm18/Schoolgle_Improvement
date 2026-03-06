"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Building2,
  Briefcase,
  Shield,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Governor,
  GovernorForm,
  GovernorType,
  GovernorRole,
  GovernorStatus,
  CommitteeName,
} from "@/lib/governance";

interface GovernorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  organizationId: string;
  initialData?: Governor | null;
}

const SKILL_OPTIONS = [
  "Finance",
  "HR",
  "Legal",
  "Education",
  "Safeguarding",
  "Health & Safety",
  "SEND",
  "Estates/Facilities",
  "IT/Digital",
  "Marketing",
  "Governance",
  "Data Protection",
];

const COMMITTEE_OPTIONS: CommitteeName[] = [
  "finance",
  "staffing",
  "curriculum",
  "premises",
  "safeguarding",
  "ethics",
  "admissions",
];

export default function GovernorModal({
  isOpen,
  onClose,
  onSave,
  organizationId,
  initialData,
}: GovernorModalProps) {
  const [formData, setFormData] = useState<GovernorForm>({
    full_name: "",
    email: "",
    phone: "",
    governor_type: "parent",
    role: null,
    committee_assignment: [],
    start_date: "",
    end_date: "",
    appointment_date: "",
    appointing_body: "",
    skills: [],
    declarations_of_interest: {},
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData({
        full_name: initialData.full_name,
        email: initialData.email || "",
        phone: initialData.phone || "",
        governor_type: initialData.governor_type,
        role: initialData.role,
        committee_assignment: initialData.committee_assignment || [],
        start_date: initialData.start_date || "",
        end_date: initialData.end_date || "",
        appointment_date: initialData.appointment_date || "",
        appointing_body: initialData.appointing_body || "",
        skills: initialData.skills || [],
        declarations_of_interest: initialData.declarations_of_interest || {},
      });
    } else {
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        governor_type: "parent",
        role: null,
        committee_assignment: [],
        start_date: "",
        end_date: "",
        appointment_date: "",
        appointing_body: "",
        skills: [],
        declarations_of_interest: {},
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = isEditing
        ? `/api/governance/governors/${initialData!.id}`
        : "/api/governance/governors";

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          governor: formData,
          ...(isEditing && { id: initialData!.id }),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save governor");
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save governor");
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills?.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...(prev.skills || []), skill],
    }));
  };

  const toggleCommittee = (committee: CommitteeName) => {
    setFormData((prev) => ({
      ...prev,
      committee_assignment: prev.committee_assignment?.includes(committee)
        ? prev.committee_assignment.filter((c) => c !== committee)
        : [...(prev.committee_assignment || []), committee],
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? "Edit Governor" : "Add New Governor"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update governor details and assignments."
              : "Add a new governor to the governing board."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 rounded-lg">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {/* Profile Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  required
                  placeholder="Jane Smith"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="jane.smith@school.co.uk"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="07700 900000"
                />
              </div>
            </div>
          </div>

          {/* Governor Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Governor Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="governor_type">Governor Type *</Label>
                <Select
                  value={formData.governor_type}
                  onValueChange={(value: GovernorType) =>
                    setFormData({ ...formData, governor_type: value })
                  }
                >
                  <SelectTrigger id="governor_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="local_authority">
                      Local Authority
                    </SelectItem>
                    <SelectItem value="co_opted">Co-opted</SelectItem>
                    <SelectItem value="foundation">Foundation</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="associate">Associate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role || "none"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      role: value === "none" ? null : (value as GovernorRole),
                    })
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Governor</SelectItem>
                    <SelectItem value="chair">Chair</SelectItem>
                    <SelectItem value="vice_chair">Vice Chair</SelectItem>
                    <SelectItem value="committee_chair">
                      Committee Chair
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={initialData?.status || "active"}
                  onValueChange={(value: GovernorStatus) => {
                    // Status is part of Governor, not GovernorForm
                    // We'll need to handle this differently
                  }}
                  disabled
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Committees */}
            <div className="space-y-2">
              <Label>Committee Assignments</Label>
              <div className="flex flex-wrap gap-2">
                {COMMITTEE_OPTIONS.map((committee) => (
                  <button
                    key={committee}
                    type="button"
                    onClick={() => toggleCommittee(committee)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      formData.committee_assignment?.includes(committee)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {committee.charAt(0).toUpperCase() + committee.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Term Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Term Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appointment_date">Appointment Date</Label>
                <Input
                  id="appointment_date"
                  type="date"
                  value={formData.appointment_date || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      appointment_date: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Term Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">Term End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointing_body">Appointing Body</Label>
              <Input
                id="appointing_body"
                value={formData.appointing_body || ""}
                onChange={(e) =>
                  setFormData({ ...formData, appointing_body: e.target.value })
                }
                placeholder="e.g., Governing Body, Local Authority"
              />
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Skills & Expertise
            </h3>

            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    formData.skills?.includes(skill)
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Add Governor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
