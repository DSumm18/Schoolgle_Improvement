"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  MessageSquareWarning,
  ArrowRight,
  Calendar,
  User,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ComplaintsTrackerProps {
  organizationId: string;
}

interface Complaint {
  id: string;
  reference: string;
  complainant_name: string;
  complainant_relationship: string;
  nature_of_complaint: string;
  category: string;
  date_received: string;
  current_stage: "stage_1" | "stage_2" | "stage_3" | "resolved";
  notes?: string;
}

const STAGES: {
  key: Complaint["current_stage"];
  label: string;
  color: string;
  bgColor: string;
}[] = [
  {
    key: "stage_1",
    label: "Stage 1 - Informal",
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200 dark:bg-amber-900/20",
  },
  {
    key: "stage_2",
    label: "Stage 2 - Formal",
    color: "text-orange-700",
    bgColor: "bg-orange-50 border-orange-200 dark:bg-orange-900/20",
  },
  {
    key: "stage_3",
    label: "Stage 3 - Panel",
    color: "text-rose-700",
    bgColor: "bg-rose-50 border-rose-200 dark:bg-rose-900/20",
  },
  {
    key: "resolved",
    label: "Resolved",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20",
  },
];

const CATEGORIES = [
  "Teaching & Learning",
  "Behaviour & Discipline",
  "Bullying",
  "Special Educational Needs",
  "Staff Conduct",
  "School Policies",
  "Communication",
  "Health & Safety",
  "Admissions",
  "Other",
];

const RELATIONSHIPS = [
  "Parent",
  "Carer",
  "Guardian",
  "Student",
  "Staff Member",
  "Governor",
  "Community Member",
  "Other",
];

export default function ComplaintsTracker({
  organizationId,
}: ComplaintsTrackerProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    complainant_name: "",
    complainant_relationship: "",
    nature_of_complaint: "",
    category: "",
  });

  useEffect(() => {
    fetchComplaints();
  }, [organizationId]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/compliance/complaints?organizationId=${organizationId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setComplaints(data.complaints || []);
      }
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupedComplaints = useMemo(() => {
    const groups: Record<Complaint["current_stage"], Complaint[]> = {
      stage_1: [],
      stage_2: [],
      stage_3: [],
      resolved: [],
    };
    complaints.forEach((c) => {
      if (groups[c.current_stage]) {
        groups[c.current_stage].push(c);
      }
    });
    return groups;
  }, [complaints]);

  const handleCreateComplaint = async () => {
    if (
      !newComplaint.complainant_name.trim() ||
      !newComplaint.nature_of_complaint.trim()
    )
      return;
    try {
      const response = await fetch(
        `/api/compliance/complaints?organizationId=${organizationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newComplaint),
        },
      );
      if (response.ok) {
        setModalOpen(false);
        setNewComplaint({
          complainant_name: "",
          complainant_relationship: "",
          nature_of_complaint: "",
          category: "",
        });
        fetchComplaints();
      }
    } catch (error) {
      console.error("Failed to create complaint:", error);
    }
  };

  const handleProgressStage = async (complaint: Complaint) => {
    const stageOrder: Complaint["current_stage"][] = [
      "stage_1",
      "stage_2",
      "stage_3",
      "resolved",
    ];
    const currentIdx = stageOrder.indexOf(complaint.current_stage);
    if (currentIdx >= stageOrder.length - 1) return;

    const nextStage = stageOrder[currentIdx + 1];
    try {
      await fetch(
        `/api/compliance/complaints/${complaint.id}?organizationId=${organizationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ current_stage: nextStage }),
        },
      );
      fetchComplaints();
    } catch (error) {
      console.error("Failed to update complaint stage:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStageBadge = (stage: Complaint["current_stage"]) => {
    const stageInfo = STAGES.find((s) => s.key === stage);
    if (!stageInfo) return null;
    const colors: Record<string, string> = {
      stage_1: "bg-amber-100 text-amber-700",
      stage_2: "bg-orange-100 text-orange-700",
      stage_3: "bg-rose-100 text-rose-700",
      resolved: "bg-emerald-100 text-emerald-700",
    };
    return (
      <Badge className={`text-[10px] font-bold uppercase ${colors[stage]}`}>
        {stageInfo.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquareWarning className="w-6 h-6 text-purple-600" />
            Complaints Tracker
          </h2>
          <p className="text-slate-500 mt-1">
            3-stage complaints procedure management
          </p>
        </div>
        <Button
          size="sm"
          className="bg-purple-600 hover:bg-purple-700"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Complaint
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STAGES.map((stage) => (
          <motion.div
            key={stage.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">
                  {groupedComplaints[stage.key].length}
                </p>
                <p className={`text-xs font-semibold ${stage.color}`}>
                  {stage.label}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Stage Columns */}
      <div className="space-y-6">
        {STAGES.map((stage) => (
          <div key={stage.key}>
            <h3
              className={`text-sm font-bold uppercase tracking-wider mb-3 ${stage.color}`}
            >
              {stage.label} ({groupedComplaints[stage.key].length})
            </h3>
            {groupedComplaints[stage.key].length === 0 ? (
              <Card className={`border ${stage.bgColor}`}>
                <CardContent className="p-4 text-center text-slate-400 text-sm">
                  No complaints at this stage
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {groupedComplaints[stage.key].map((complaint, idx) => (
                  <motion.div
                    key={complaint.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Card className="hover:border-purple-300 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono"
                              >
                                {complaint.reference}
                              </Badge>
                              {getStageBadge(complaint.current_stage)}
                              {complaint.category && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  <Tag className="w-3 h-3 mr-1" />
                                  {complaint.category}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {complaint.complainant_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(complaint.date_received)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 line-clamp-2">
                              {complaint.nature_of_complaint}
                            </p>
                          </div>
                          {complaint.current_stage !== "resolved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="shrink-0"
                              onClick={() => handleProgressStage(complaint)}
                            >
                              <ArrowRight className="w-4 h-4 mr-1" />
                              Progress
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* New Complaint Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Complaint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="complainant_name">Complainant Name</Label>
              <Input
                id="complainant_name"
                placeholder="Full name"
                value={newComplaint.complainant_name}
                onChange={(e) =>
                  setNewComplaint({
                    ...newComplaint,
                    complainant_name: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship to School</Label>
              <Select
                value={newComplaint.complainant_relationship}
                onValueChange={(val) =>
                  setNewComplaint({
                    ...newComplaint,
                    complainant_relationship: val,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newComplaint.category}
                onValueChange={(val) =>
                  setNewComplaint({ ...newComplaint, category: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nature">Nature of Complaint</Label>
              <Textarea
                id="nature"
                placeholder="Describe the complaint in detail..."
                rows={4}
                value={newComplaint.nature_of_complaint}
                onChange={(e) =>
                  setNewComplaint({
                    ...newComplaint,
                    nature_of_complaint: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handleCreateComplaint}
              >
                Create Complaint
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
