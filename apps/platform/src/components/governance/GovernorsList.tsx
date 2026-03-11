"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Calendar,
  User,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GovernorModal from "./GovernorModal";
import {
  Governor,
  GovernorStatus,
  GovernorType,
  GovernorRole,
  CommitteeName,
} from "@/lib/governance";

interface GovernorsListProps {
  organizationId: string;
  onRefresh?: () => void;
}

export default function GovernorsList({
  organizationId,
  onRefresh,
}: GovernorsListProps) {
  const [governors, setGovernors] = useState<Governor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<GovernorStatus | "all">(
    "all",
  );
  const [filterType, setFilterType] = useState<GovernorType | "all">("all");
  const [selectedGovernor, setSelectedGovernor] = useState<Governor | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchGovernors();
  }, [organizationId]);

  const fetchGovernors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ organizationId });
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterType !== "all") params.append("governor_type", filterType);

      const response = await fetch(`/api/governance/governors?${params}`);
      if (response.ok) {
        const data = await response.json();
        setGovernors(data.governors || []);
      }
    } catch (error) {
      console.error("Failed to fetch governors:", error);
      toast.error("Failed to load governors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGovernors();
  }, [filterStatus, filterType]);

  const filteredGovernors = useMemo(() => {
    return governors.filter((governor) => {
      const matchesSearch =
        !searchQuery ||
        governor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        governor.email?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [governors, searchQuery]);

  const handleEdit = (governor: Governor) => {
    setSelectedGovernor(governor);
    setModalOpen(true);
  };

  const handleDelete = async (governorId: string) => {
    if (!confirm("Are you sure you want to remove this governor?")) return;

    try {
      const response = await fetch(
        `/api/governance/governors/${governorId}?organizationId=${organizationId}`,
        { method: "DELETE" },
      );
      if (response.ok) {
        fetchGovernors();
        onRefresh?.();
      }
    } catch (error) {
      console.error("Failed to delete governor:", error);
      toast.error("Failed to delete governor");
    }
  };

  const getStatusBadge = (status: GovernorStatus) => {
    const styles: Record<GovernorStatus, string> = {
      active: "bg-emerald-100 text-emerald-700 border-emerald-200",
      resigned: "bg-slate-100 text-slate-600 border-slate-200",
      terminated: "bg-rose-100 text-rose-700 border-rose-200",
      inactive: "bg-amber-100 text-amber-700 border-amber-200",
    };
    return (
      <Badge
        className={`text-[10px] font-bold uppercase px-2 py-0.5 ${styles[status]}`}
      >
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getRoleBadge = (role: GovernorRole) => {
    if (!role) return null;
    const styles: Record<string, string> = {
      chair: "bg-violet-100 text-violet-700 border-violet-200",
      vice_chair: "bg-blue-100 text-blue-700 border-blue-200",
      committee_chair: "bg-indigo-100 text-indigo-700 border-indigo-200",
    };
    return (
      <Badge
        className={`text-[10px] font-bold uppercase px-2 py-0.5 ${styles[role] || ""}`}
      >
        {role.replace("_", " ")}
      </Badge>
    );
  };

  const getTypeBadge = (type: GovernorType) => {
    const colors: Record<GovernorType, string> = {
      parent: "bg-pink-50 text-pink-700 border-pink-200",
      staff: "bg-sky-50 text-sky-700 border-sky-200",
      local_authority: "bg-purple-50 text-purple-700 border-purple-200",
      co_opted: "bg-teal-50 text-teal-700 border-teal-200",
      foundation: "bg-amber-50 text-amber-700 border-amber-200",
      partnership: "bg-rose-50 text-rose-700 border-rose-200",
      associate: "bg-gray-50 text-gray-700 border-gray-200",
    };
    return (
      <Badge
        variant="outline"
        className={`text-[10px] font-normal uppercase ${colors[type]}`}
      >
        {type.replace("_", " ")}
      </Badge>
    );
  };

  const calculateAttendance = (governor: Governor) => {
    if (governor.meetings_total === 0) return "-";
    const percentage = Math.round(
      (governor.meetings_attended / governor.meetings_total) * 100,
    );
    const color =
      percentage >= 80
        ? "text-emerald-600"
        : percentage >= 60
          ? "text-amber-600"
          : "text-rose-600";
    return (
      <span className={`font-bold ${color}`}>
        {percentage}%
        <span className="text-slate-400 font-normal">
          {" "}
          ({governor.meetings_attended}/{governor.meetings_total})
        </span>
      </span>
    );
  };

  const getTermStatus = (governor: Governor) => {
    if (!governor.end_date)
      return <span className="text-slate-400">No end date</span>;

    const now = new Date();
    const endDate = new Date(governor.end_date);
    const daysUntil = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntil < 0) {
      return <span className="text-rose-600 font-bold">Expired</span>;
    }
    if (daysUntil < 90) {
      return (
        <span className="text-amber-600 font-bold">
          Expires{" "}
          {endDate.toLocaleDateString("en-GB", {
            month: "short",
            day: "numeric",
          })}
        </span>
      );
    }
    return (
      <span className="text-slate-600">
        Until{" "}
        {endDate.toLocaleDateString("en-GB", {
          month: "short",
          year: "2-digit",
        })}
      </span>
    );
  };

  const committeeBadges = (committees: CommitteeName[]) => {
    if (!committees || committees.length === 0)
      return <span className="text-slate-400 text-sm">None</span>;

    return (
      <div className="flex flex-wrap gap-1">
        {committees.slice(0, 2).map((committee) => (
          <Badge
            key={committee}
            variant="outline"
            className="text-[9px] font-normal"
          >
            {committee}
          </Badge>
        ))}
        {committees.length > 2 && (
          <Badge variant="outline" className="text-[9px]">
            +{committees.length - 2}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search governors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <Select
                value={filterStatus}
                onValueChange={(value) => setFilterStatus(value as any)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="resigned">Resigned</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterType}
                onValueChange={(value) => setFilterType(value as any)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="local_authority">LA</SelectItem>
                  <SelectItem value="co_opted">Co-opted</SelectItem>
                  <SelectItem value="foundation">Foundation</SelectItem>
                  <SelectItem value="associate">Associate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => {
                setSelectedGovernor(null);
                setModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Governor
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Governor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Committees</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredGovernors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <User className="w-12 h-12 text-slate-300" />
                      <p className="text-slate-500 font-semibold">
                        No governors found
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          setFilterStatus("all");
                          setFilterType("all");
                        }}
                      >
                        Clear filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredGovernors.map((governor, idx) => (
                  <motion.tr
                    key={governor.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="group hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                          {governor.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              {governor.full_name}
                            </span>
                            {getRoleBadge(governor.role)}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            {governor.email && (
                              <a
                                href={`mailto:${governor.email}`}
                                className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600"
                              >
                                <Mail className="w-3 h-3" />
                                {governor.email}
                              </a>
                            )}
                            {governor.phone && (
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Phone className="w-3 h-3" />
                                {governor.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(governor.governor_type)}
                    </TableCell>
                    <TableCell>
                      {governor.role ? (
                        <span className="text-sm font-medium capitalize">
                          {governor.role.replace("_", " ")}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">Governor</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {committeeBadges(governor.committee_assignment)}
                    </TableCell>
                    <TableCell>{getTermStatus(governor)}</TableCell>
                    <TableCell>{calculateAttendance(governor)}</TableCell>
                    <TableCell>{getStatusBadge(governor.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(governor)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(governor.id)}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal */}
      <GovernorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={() => {
          setModalOpen(false);
          fetchGovernors();
          onRefresh?.();
        }}
        organizationId={organizationId}
        initialData={selectedGovernor}
      />
    </div>
  );
}
