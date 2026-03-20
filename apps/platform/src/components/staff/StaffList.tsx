"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  UserPlus,
  Download,
  Upload,
  Edit,
  Trash2,
  UserX,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StaffMember, StaffRoleCategory } from "@/lib/staff-directory";
import { DataSourceBadge } from "@/components/ui/DataSourceBadge";

interface StaffListProps {
  staff: StaffMember[];
  organizationId: string;
  onAddStaff: () => void;
  onEditStaff: (staff: StaffMember) => void;
  onDeleteStaff: (staffId: string) => void;
  onImport: () => void;
  onExport: () => void;
}

const ROLE_LABELS: Record<StaffRoleCategory, string> = {
  headteacher: "Headteacher",
  deputy_headteacher: "Deputy Headteacher",
  assistant_headteacher: "Assistant Headteacher",
  subject_lead: "Subject Lead",
  phase_lead: "Phase Lead",
  class_teacher: "Class Teacher",
  sendco: "SENDCO",
  business_manager: "Business Manager",
  site_manager: "Site Manager",
  governor: "Governor",
  teaching_assistant: "Teaching Assistant",
  support_staff: "Support Staff",
  other: "Other",
};

const ROLE_COLORS: Record<StaffRoleCategory, string> = {
  headteacher: "bg-purple-100 text-purple-700 border-purple-200",
  deputy_headteacher: "bg-purple-100 text-purple-700 border-purple-200",
  assistant_headteacher: "bg-purple-100 text-purple-700 border-purple-200",
  subject_lead: "bg-blue-100 text-blue-700 border-blue-200",
  phase_lead: "bg-blue-100 text-blue-700 border-blue-200",
  class_teacher: "bg-emerald-100 text-emerald-700 border-emerald-200",
  sendco: "bg-amber-100 text-amber-700 border-amber-200",
  business_manager: "bg-slate-100 text-slate-700 border-slate-200",
  site_manager: "bg-slate-100 text-slate-700 border-slate-200",
  governor: "bg-indigo-100 text-indigo-700 border-indigo-200",
  teaching_assistant: "bg-teal-100 text-teal-700 border-teal-200",
  support_staff: "bg-gray-100 text-gray-700 border-gray-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};

const MODULE_LABELS: Record<string, string> = {
  ofsted_readiness: "Ofsted Readiness",
  siams_readiness: "SIAMS Readiness",
  teaching_learning: "Teaching & Learning",
  estates_compliance: "Estates Compliance",
  hr: "HR",
  finance: "Finance",
  governance: "Governance",
  safeguarding: "Safeguarding",
  send: "SEND",
};

export default function StaffList({
  staff,
  organizationId,
  onAddStaff,
  onEditStaff,
  onDeleteStaff,
  onImport,
  onExport,
}: StaffListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Filter staff
  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.job_title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || s.role_category === roleFilter;
    const matchesActive =
      activeFilter === "all" ||
      (activeFilter === "active" && s.is_active) ||
      (activeFilter === "inactive" && !s.is_active);

    return matchesSearch && matchesRole && matchesActive;
  });

  // Stats
  const activeCount = staff.filter((s) => s.is_active).length;
  const superUserCount = staff.filter((s) => s.is_super_user).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Staff Directory</h2>
          <p className="text-sm text-slate-500">
            {activeCount} active staff · {superUserCount} super users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            title="Download current staff as CSV - edit offline and re-upload"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onImport}
            title="Import from CSV - add, update, or remove staff in bulk"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onAddStaff}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Staff
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, or job title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-full md:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff Grid */}
      {filteredStaff.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UserX className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-2">
              No staff found
            </h3>
            <p className="text-slate-500 mb-4">
              {staff.length === 0
                ? "Get started by adding staff members or importing from CSV."
                : "Try adjusting your search or filters."}
            </p>
            {staff.length === 0 && (
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={onImport}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </Button>
                <Button onClick={onAddStaff}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Staff Member
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((s, idx) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card
                className={`hover:shadow-md transition-shadow ${
                  !s.is_active ? "opacity-60 bg-slate-50" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        {s.first_name[0]}
                        {s.last_name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {s.display_name}
                        </p>
                        {s.employee_id && (
                          <p className="text-xs text-slate-500">
                            ID: {s.employee_id}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEditStaff(s)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-rose-600"
                          onClick={() => onDeleteStaff(s.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">{s.job_title}</p>

                    <Badge
                      variant="outline"
                      className={`text-xs ${ROLE_COLORS[s.role_category]}`}
                    >
                      {ROLE_LABELS[s.role_category]}
                    </Badge>

                    <div className="flex items-center gap-2 flex-wrap">
                      {s.is_super_user && (
                        <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                          <Shield className="w-3 h-3 mr-1" />
                          Super User
                        </Badge>
                      )}
                      {!s.is_active && (
                        <Badge className="text-xs bg-slate-100 text-slate-500 border-slate-200">
                          Inactive
                        </Badge>
                      )}
                    </div>

                    <div className="pt-2 space-y-1">
                      {s.email && (
                        <a
                          href={`mailto:${s.email}`}
                          className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600"
                        >
                          <Mail className="w-3 h-3" />
                          {s.email}
                        </a>
                      )}
                      {s.phone && (
                        <a
                          href={`tel:${s.phone}`}
                          className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600"
                        >
                          <Phone className="w-3 h-3" />
                          {s.phone}
                        </a>
                      )}
                    </div>

                    {s.import_source && (
                      <div className="pt-1">
                        <DataSourceBadge
                          source={s.import_source}
                          importedAt={s.imported_at}
                          compact
                        />
                      </div>
                    )}

                    {s.accessible_modules &&
                      s.accessible_modules.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">
                            Module Access:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {s.accessible_modules.slice(0, 3).map((mod) => (
                              <Badge
                                key={mod}
                                variant="outline"
                                className="text-[10px] h-5 px-1.5 bg-blue-50 text-blue-600 border-blue-100"
                              >
                                {MODULE_LABELS[mod] || mod}
                              </Badge>
                            ))}
                            {s.accessible_modules.length > 3 && (
                              <Badge
                                variant="outline"
                                className="text-[10px] h-5 px-1.5"
                              >
                                +{s.accessible_modules.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
