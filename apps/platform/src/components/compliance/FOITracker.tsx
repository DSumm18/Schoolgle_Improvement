"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  FileSearch,
  Calendar,
  Clock,
  AlertTriangle,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FOITrackerProps {
  organizationId: string;
}

interface FOIRequest {
  id: string;
  reference: string;
  requester_name: string;
  requester_email?: string;
  subject: string;
  description: string;
  date_received: string;
  deadline: string;
  status: "received" | "in_progress" | "responded" | "refused";
  response_date?: string;
  refusal_reason?: string;
  notes?: string;
}

const STATUS_CONFIG: Record<
  FOIRequest["status"],
  { label: string; color: string }
> = {
  received: { label: "Received", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In Progress", color: "bg-amber-100 text-amber-700" },
  responded: { label: "Responded", color: "bg-emerald-100 text-emerald-700" },
  refused: { label: "Refused", color: "bg-rose-100 text-rose-700" },
};

export default function FOITracker({ organizationId }: FOITrackerProps) {
  const [requests, setRequests] = useState<FOIRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    requester_name: "",
    requester_email: "",
    subject: "",
    description: "",
  });

  useEffect(() => {
    fetchRequests();
  }, [organizationId]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/compliance/foi?organizationId=${organizationId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Failed to fetch FOI requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const getDeadlineColor = (days: number) => {
    if (days < 0) return "text-rose-600 bg-rose-50 border-rose-200";
    if (days <= 5) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-slate-600 bg-slate-50 border-slate-200";
  };

  const getDeadlineBadgeColor = (days: number) => {
    if (days < 0) return "bg-rose-100 text-rose-700";
    if (days <= 5) return "bg-amber-100 text-amber-700";
    return "bg-slate-100 text-slate-700";
  };

  const summaryStats = useMemo(() => {
    const active = requests.filter(
      (r) => r.status === "received" || r.status === "in_progress",
    );
    const overdue = active.filter(
      (r) => getDaysRemaining(r.deadline) < 0,
    ).length;
    const nearDeadline = active.filter((r) => {
      const days = getDaysRemaining(r.deadline);
      return days >= 0 && days <= 5;
    }).length;
    return {
      total: requests.length,
      active: active.length,
      overdue,
      nearDeadline,
      responded: requests.filter((r) => r.status === "responded").length,
      refused: requests.filter((r) => r.status === "refused").length,
    };
  }, [requests]);

  const handleCreateRequest = async () => {
    if (!newRequest.requester_name.trim() || !newRequest.subject.trim()) return;
    try {
      const response = await fetch(
        `/api/compliance/foi?organizationId=${organizationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newRequest),
        },
      );
      if (response.ok) {
        setModalOpen(false);
        setNewRequest({
          requester_name: "",
          requester_email: "",
          subject: "",
          description: "",
        });
        fetchRequests();
      }
    } catch (error) {
      console.error("Failed to create FOI request:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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
            <FileSearch className="w-6 h-6 text-purple-600" />
            FOI Request Tracker
          </h2>
          <p className="text-slate-500 mt-1">
            Freedom of Information request management
          </p>
        </div>
        <Button
          size="sm"
          className="bg-purple-600 hover:bg-purple-700"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                  <FileSearch className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{summaryStats.active}</p>
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Active Requests
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{summaryStats.overdue}</p>
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Overdue
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {summaryStats.nearDeadline}
                  </p>
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Due Soon (&lt;5 days)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{summaryStats.responded}</p>
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Responded
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Request Cards */}
      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileSearch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">
              No FOI requests recorded
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request, idx) => {
            const daysRemaining = getDaysRemaining(request.deadline);
            const isActive =
              request.status === "received" || request.status === "in_progress";
            const deadlineColor = isActive
              ? getDeadlineColor(daysRemaining)
              : "";

            return (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card
                  className={`hover:border-purple-300 transition-all ${
                    isActive && daysRemaining < 0
                      ? "border-rose-300"
                      : isActive && daysRemaining <= 5
                        ? "border-amber-300"
                        : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono"
                          >
                            {request.reference}
                          </Badge>
                          <Badge
                            className={`text-[10px] font-bold uppercase ${STATUS_CONFIG[request.status].color}`}
                          >
                            {STATUS_CONFIG[request.status].label}
                          </Badge>
                        </div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-white mt-1">
                          {request.subject}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {request.requester_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Received: {formatDate(request.date_received)}
                          </span>
                        </div>
                        {request.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                            {request.description}
                          </p>
                        )}
                      </div>

                      {/* Deadline Countdown */}
                      {isActive && (
                        <div
                          className={`shrink-0 rounded-lg border p-3 text-center min-w-[90px] ${deadlineColor}`}
                        >
                          <p className="text-2xl font-bold">
                            {daysRemaining < 0
                              ? Math.abs(daysRemaining)
                              : daysRemaining}
                          </p>
                          <p className="text-[10px] font-bold uppercase">
                            {daysRemaining < 0
                              ? "days overdue"
                              : daysRemaining === 1
                                ? "day left"
                                : "days left"}
                          </p>
                        </div>
                      )}

                      {!isActive && request.response_date && (
                        <div className="shrink-0 text-xs text-slate-400 text-right">
                          <p>Responded</p>
                          <p>{formatDate(request.response_date)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* New Request Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New FOI Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requester_name">Requester Name</Label>
                <Input
                  id="requester_name"
                  placeholder="Full name"
                  value={newRequest.requester_name}
                  onChange={(e) =>
                    setNewRequest({
                      ...newRequest,
                      requester_name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requester_email">Email (optional)</Label>
                <Input
                  id="requester_email"
                  type="email"
                  placeholder="email@example.com"
                  value={newRequest.requester_email}
                  onChange={(e) =>
                    setNewRequest({
                      ...newRequest,
                      requester_email: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief subject of the request"
                value={newRequest.subject}
                onChange={(e) =>
                  setNewRequest({ ...newRequest, subject: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="foi_description">Description</Label>
              <Textarea
                id="foi_description"
                placeholder="Full details of the information requested..."
                rows={4}
                value={newRequest.description}
                onChange={(e) =>
                  setNewRequest({
                    ...newRequest,
                    description: e.target.value,
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
                onClick={handleCreateRequest}
              >
                Log Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
