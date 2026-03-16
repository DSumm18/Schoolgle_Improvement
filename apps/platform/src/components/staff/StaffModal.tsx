"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog-simple";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type {
  StaffMember,
  StaffRoleCategory,
  StaffModuleAccess,
} from "@/lib/staff-directory";

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (staff: Partial<StaffMember>) => Promise<void>;
  staff?: StaffMember;
  mode: "create" | "edit";
  organizationId: string;
}

const SALUTATIONS = ["Mr", "Mrs", "Ms", "Dr", "Prof", "Miss"];

const ROLE_CATEGORIES: { value: StaffRoleCategory; label: string }[] = [
  { value: "headteacher", label: "Headteacher" },
  { value: "deputy_headteacher", label: "Deputy Headteacher" },
  { value: "assistant_headteacher", label: "Assistant Headteacher" },
  { value: "subject_lead", label: "Subject Lead" },
  { value: "phase_lead", label: "Phase Lead" },
  { value: "class_teacher", label: "Class Teacher" },
  { value: "sendco", label: "SENDCO" },
  { value: "business_manager", label: "Business Manager" },
  { value: "site_manager", label: "Site Manager" },
  { value: "governor", label: "Governor" },
  { value: "teaching_assistant", label: "Teaching Assistant" },
  { value: "support_staff", label: "Support Staff" },
  { value: "other", label: "Other" },
];

const MODULE_OPTIONS: { value: StaffModuleAccess; label: string }[] = [
  { value: "ofsted_readiness", label: "Ofsted Readiness" },
  { value: "siams_readiness", label: "SIAMS Readiness" },
  { value: "teaching_learning", label: "Teaching & Learning" },
  { value: "estates_compliance", label: "Estates Compliance" },
  { value: "hr", label: "HR" },
  { value: "finance", label: "Finance" },
  { value: "governance", label: "Governance" },
  { value: "safeguarding", label: "Safeguarding" },
  { value: "send", label: "SEND" },
];

const MODULE_COLORS: Record<StaffModuleAccess, string> = {
  ofsted_readiness: "bg-blue-100 text-blue-700 border-blue-200",
  siams_readiness: "bg-purple-100 text-purple-700 border-purple-200",
  teaching_learning: "bg-emerald-100 text-emerald-700 border-emerald-200",
  estates_compliance: "bg-amber-100 text-amber-700 border-amber-200",
  hr: "bg-rose-100 text-rose-700 border-rose-200",
  finance: "bg-teal-100 text-teal-700 border-teal-200",
  governance: "bg-indigo-100 text-indigo-700 border-indigo-200",
  safeguarding: "bg-red-100 text-red-700 border-red-200",
  send: "bg-violet-100 text-violet-700 border-violet-200",
};

export default function StaffModal({
  isOpen,
  onClose,
  onSave,
  staff,
  mode,
  organizationId,
}: StaffModalProps) {
  const [saving, setSaving] = useState(false);

  // Use a key-derived approach to initialize form data
  // This ensures the form is always correctly initialized without useEffect
  const getInitialFormData = () => {
    if (staff && mode === "edit") {
      return {
        salutation: staff.salutation || "",
        first_name: staff.first_name || "",
        last_name: staff.last_name || "",
        email: staff.email || "",
        phone: staff.phone || "",
        employee_id: staff.employee_id || "",
        job_title: staff.job_title || "",
        role_category: (staff.role_category ||
          "class_teacher") as StaffRoleCategory,
        is_super_user: staff.is_super_user || false,
        is_active: staff.is_active !== undefined ? staff.is_active : true,
        accessible_modules: (staff.accessible_modules ||
          []) as StaffModuleAccess[],
      };
    }
    return {
      salutation: "" as string | null,
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      employee_id: "",
      job_title: "",
      role_category: "class_teacher" as StaffRoleCategory,
      is_super_user: false,
      is_active: true,
      accessible_modules: [] as StaffModuleAccess[],
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.job_title) {
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...formData,
        organization_id: organizationId,
        salutation: (formData.salutation || null) as any,
      } as any);
      onClose();
    } catch (error) {
      console.error("Error saving staff:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleModule = (module: StaffModuleAccess) => {
    setFormData((prev) => ({
      ...prev,
      accessible_modules: prev.accessible_modules.includes(module)
        ? prev.accessible_modules.filter((m) => m !== module)
        : [...prev.accessible_modules, module],
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Staff Member" : "Edit Staff Member"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new staff member to the directory."
              : "Update staff member details and permissions."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Salutation */}
            <div>
              <Label htmlFor="salutation">Salutation</Label>
              <Select
                value={formData.salutation || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    salutation: value === "none" ? null : value,
                  })
                }
              >
                <SelectTrigger id="salutation">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {SALUTATIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employee ID */}
            <div>
              <Label htmlFor="employee_id">Employee ID</Label>
              <Input
                id="employee_id"
                value={formData.employee_id}
                onChange={(e) =>
                  setFormData({ ...formData, employee_id: e.target.value })
                }
                placeholder="STF001"
              />
            </div>

            {/* First Name */}
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="staff@school.co.uk"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="01234 567890"
              />
            </div>

            {/* Job Title */}
            <div className="md:col-span-2">
              <Label htmlFor="job_title">Job Title *</Label>
              <Input
                id="job_title"
                value={formData.job_title}
                onChange={(e) =>
                  setFormData({ ...formData, job_title: e.target.value })
                }
                placeholder="e.g., Year 6 Teacher"
                required
              />
            </div>

            {/* Role Category */}
            <div className="md:col-span-2">
              <Label htmlFor="role_category">Role Category *</Label>
              <Select
                value={formData.role_category}
                onValueChange={(value: StaffRoleCategory) =>
                  setFormData({ ...formData, role_category: value })
                }
              >
                <SelectTrigger id="role_category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_CATEGORIES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Module Access */}
            <div className="md:col-span-2 space-y-2">
              <Label>Module Access</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {MODULE_OPTIONS.map((module) => (
                  <div
                    key={module.value}
                    className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-slate-50 cursor-pointer"
                    onClick={() => toggleModule(module.value)}
                  >
                    <Checkbox
                      id={`module-${module.value}`}
                      checked={formData.accessible_modules.includes(
                        module.value,
                      )}
                      onCheckedChange={() => toggleModule(module.value)}
                    />
                    <label
                      htmlFor={`module-${module.value}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {module.label}
                    </label>
                  </div>
                ))}
              </div>
              {formData.accessible_modules.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {formData.accessible_modules.map((mod) => (
                    <Badge
                      key={mod}
                      className={`${MODULE_COLORS[mod]} cursor-pointer`}
                      onClick={() => toggleModule(mod)}
                    >
                      {MODULE_OPTIONS.find((m) => m.value === mod)?.label} x
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Super User */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 p-3 border rounded-lg bg-amber-50 border-amber-200">
                <Checkbox
                  id="is_super_user"
                  checked={formData.is_super_user}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_super_user: !!checked })
                  }
                />
                <label
                  htmlFor="is_super_user"
                  className="text-sm cursor-pointer flex-1"
                >
                  <span className="font-semibold text-amber-900">
                    Super User
                  </span>
                  <span className="text-amber-700 block">
                    Has elevated permissions across all modules
                  </span>
                </label>
              </div>
            </div>

            {/* Active Status */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: !!checked })
                  }
                />
                <label htmlFor="is_active" className="text-sm cursor-pointer">
                  Active staff member
                </label>
              </div>
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
              <Save className="w-4 h-4 mr-2" />
              {saving
                ? "Saving..."
                : mode === "create"
                  ? "Add Staff"
                  : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
