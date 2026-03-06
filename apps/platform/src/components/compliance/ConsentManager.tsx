"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  ClipboardCheck,
  Search,
  Calendar,
  CheckCircle2,
  XCircle,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConsentManagerProps {
  organizationId: string;
}

interface ConsentRecord {
  id: string;
  pupil_name: string;
  parent_name: string;
  consent_type: string;
  granted: boolean;
  date: string;
  academic_year: string;
  notes?: string;
}

const CONSENT_TYPES = [
  "photo",
  "trip",
  "medical",
  "online_platforms",
  "biometric",
  "research",
  "social_media",
  "marketing",
];

const CONSENT_TYPE_LABELS: Record<string, string> = {
  photo: "Photography",
  trip: "School Trips",
  medical: "Medical Treatment",
  online_platforms: "Online Platforms",
  biometric: "Biometric Data",
  research: "Research Participation",
  social_media: "Social Media",
  marketing: "Marketing Communications",
};

const ACADEMIC_YEARS = ["2025/26", "2024/25", "2023/24"];

export default function ConsentManager({
  organizationId,
}: ConsentManagerProps) {
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("2025/26");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({
    pupil_name: "",
    parent_name: "",
    consent_type: "",
    granted: true,
  });

  useEffect(() => {
    fetchRecords();
  }, [organizationId]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/compliance/consent?organizationId=${organizationId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
      }
    } catch (error) {
      console.error("Failed to fetch consent records:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    let result = records;
    if (filterType !== "all") {
      result = result.filter((r) => r.consent_type === filterType);
    }
    if (filterYear) {
      result = result.filter((r) => r.academic_year === filterYear);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.pupil_name.toLowerCase().includes(q) ||
          r.parent_name.toLowerCase().includes(q),
      );
    }
    return result;
  }, [records, filterType, filterYear, searchQuery]);

  const consentSummary = useMemo(() => {
    const yearRecords = records.filter((r) => r.academic_year === filterYear);
    const summary: Record<string, { granted: number; total: number }> = {};
    CONSENT_TYPES.forEach((type) => {
      const typeRecords = yearRecords.filter((r) => r.consent_type === type);
      summary[type] = {
        total: typeRecords.length,
        granted: typeRecords.filter((r) => r.granted).length,
      };
    });
    return summary;
  }, [records, filterYear]);

  const handleCreateRecord = async () => {
    if (!newRecord.pupil_name.trim() || !newRecord.consent_type) return;
    try {
      const response = await fetch(
        `/api/compliance/consent?organizationId=${organizationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...newRecord,
            academic_year: filterYear,
          }),
        },
      );
      if (response.ok) {
        setModalOpen(false);
        setNewRecord({
          pupil_name: "",
          parent_name: "",
          consent_type: "",
          granted: true,
        });
        fetchRecords();
      }
    } catch (error) {
      console.error("Failed to create consent record:", error);
    }
  };

  const handleWithdrawConsent = async (recordId: string) => {
    try {
      await fetch(
        `/api/compliance/consent/${recordId}?organizationId=${organizationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ granted: false }),
        },
      );
      fetchRecords();
    } catch (error) {
      console.error("Failed to withdraw consent:", error);
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
            <ClipboardCheck className="w-6 h-6 text-purple-600" />
            Consent Manager
          </h2>
          <p className="text-slate-500 mt-1">
            Track and manage parental consent records
          </p>
        </div>
        <Button
          size="sm"
          className="bg-purple-600 hover:bg-purple-700"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Record Consent
        </Button>
      </div>

      {/* Academic Year & Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Academic Year" />
          </SelectTrigger>
          <SelectContent>
            {ACADEMIC_YEARS.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {CONSENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {CONSENT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by pupil or parent name..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CONSENT_TYPES.filter((type) => consentSummary[type].total > 0).map(
          (type, idx) => {
            const data = consentSummary[type];
            const rate =
              data.total > 0
                ? Math.round((data.granted / data.total) * 100)
                : 0;
            return (
              <motion.div
                key={type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card
                  className={`cursor-pointer hover:border-purple-300 transition-all ${
                    filterType === type
                      ? "border-purple-400 ring-1 ring-purple-200"
                      : ""
                  }`}
                  onClick={() =>
                    setFilterType(filterType === type ? "all" : type)
                  }
                >
                  <CardContent className="p-3">
                    <p className="text-xs font-bold uppercase text-slate-500 truncate">
                      {CONSENT_TYPE_LABELS[type]}
                    </p>
                    <div className="flex items-end justify-between mt-1">
                      <p className="text-xl font-bold">{rate}%</p>
                      <p className="text-xs text-slate-400">
                        {data.granted}/{data.total}
                      </p>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          },
        )}
      </div>

      {/* Records Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 dark:bg-slate-900">
                  <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">
                    Pupil Name
                  </th>
                  <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">
                    Parent/Carer
                  </th>
                  <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">
                    Consent Type
                  </th>
                  <th className="text-center p-3 font-semibold text-slate-700 dark:text-slate-300">
                    Granted
                  </th>
                  <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">
                    Date
                  </th>
                  <th className="text-right p-3 font-semibold text-slate-700 dark:text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No consent records found
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record, idx) => (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="border-b hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="p-3 font-medium text-slate-900 dark:text-white">
                        {record.pupil_name}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {record.parent_name}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px]">
                          {CONSENT_TYPE_LABELS[record.consent_type] ||
                            record.consent_type}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        {record.granted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-400 mx-auto" />
                        )}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 text-xs">
                        {formatDate(record.date)}
                      </td>
                      <td className="p-3 text-right">
                        {record.granted && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => handleWithdrawConsent(record.id)}
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Withdraw
                          </Button>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredRecords.length > 0 && (
        <p className="text-xs text-slate-400 text-right">
          Showing {filteredRecords.length} of {records.length} records
        </p>
      )}

      {/* Record Consent Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Consent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="pupil_name">Pupil Name</Label>
              <Input
                id="pupil_name"
                placeholder="Full name"
                value={newRecord.pupil_name}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, pupil_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent_name">Parent/Carer Name</Label>
              <Input
                id="parent_name"
                placeholder="Full name"
                value={newRecord.parent_name}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, parent_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Consent Type</Label>
              <Select
                value={newRecord.consent_type}
                onValueChange={(val) =>
                  setNewRecord({ ...newRecord, consent_type: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CONSENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {CONSENT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Consent Given</Label>
              <Select
                value={newRecord.granted ? "yes" : "no"}
                onValueChange={(val) =>
                  setNewRecord({ ...newRecord, granted: val === "yes" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes - Consent Given</SelectItem>
                  <SelectItem value="no">No - Consent Refused</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handleCreateRecord}
              >
                Save Record
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
