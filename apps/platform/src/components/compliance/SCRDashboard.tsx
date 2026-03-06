"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Download,
  CheckCircle2,
  XCircle,
  Users,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SCRDashboardProps {
  organizationId: string;
}

interface SCRCheck {
  dbs: boolean;
  identity: boolean;
  qualifications: boolean;
  right_to_work: boolean;
  prohibition: boolean;
  section_128: boolean;
  overseas: boolean;
  references: boolean;
  medical: boolean;
}

interface SCREntry {
  id: string;
  staff_name: string;
  role: string;
  start_date: string;
  checks: SCRCheck;
  notes?: string;
}

const CHECK_COLUMNS: { key: keyof SCRCheck; label: string }[] = [
  { key: "dbs", label: "DBS" },
  { key: "identity", label: "Identity" },
  { key: "qualifications", label: "Qualifications" },
  { key: "right_to_work", label: "Right to Work" },
  { key: "prohibition", label: "Prohibition" },
  { key: "section_128", label: "Section 128" },
  { key: "overseas", label: "Overseas" },
  { key: "references", label: "References" },
  { key: "medical", label: "Medical" },
];

export default function SCRDashboard({ organizationId }: SCRDashboardProps) {
  const [entries, setEntries] = useState<SCREntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    staff_name: "",
    role: "",
    start_date: "",
  });

  useEffect(() => {
    fetchEntries();
  }, [organizationId]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/compliance/scr?organizationId=${organizationId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error("Failed to fetch SCR entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(
      (e) =>
        e.staff_name.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q),
    );
  }, [entries, searchQuery]);

  const completionStats = useMemo(() => {
    if (entries.length === 0) return { complete: 0, total: 0, rate: 0 };
    const total = entries.length * CHECK_COLUMNS.length;
    const complete = entries.reduce((sum, entry) => {
      return sum + CHECK_COLUMNS.filter((col) => entry.checks[col.key]).length;
    }, 0);
    return { complete, total, rate: Math.round((complete / total) * 100) };
  }, [entries]);

  const handleAddEntry = async () => {
    if (!newEntry.staff_name.trim()) return;
    try {
      const response = await fetch(
        `/api/compliance/scr?organizationId=${organizationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newEntry),
        },
      );
      if (response.ok) {
        setShowAddForm(false);
        setNewEntry({ staff_name: "", role: "", start_date: "" });
        fetchEntries();
      }
    } catch (error) {
      console.error("Failed to add SCR entry:", error);
    }
  };

  const handleExport = () => {
    // Placeholder for export functionality
    alert("Export functionality coming soon");
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
            <ShieldCheck className="w-6 h-6 text-purple-600" />
            Single Central Record
          </h2>
          <p className="text-slate-500 mt-1">Statutory staff checks register</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Staff
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{entries.length}</p>
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Staff on Record
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
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completionStats.rate}%</p>
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Checks Complete
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
                <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {completionStats.total - completionStats.complete}
                  </p>
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Outstanding Checks
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Add Staff Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg">Add Staff Member</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="staff_name">Full Name</Label>
                  <Input
                    id="staff_name"
                    placeholder="e.g. Jane Smith"
                    value={newEntry.staff_name}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, staff_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    placeholder="e.g. Class Teacher"
                    value={newEntry.role}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, role: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newEntry.start_date}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, start_date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleAddEntry}
                >
                  Add to SCR
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by name or role..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* SCR Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 dark:bg-slate-900">
                  <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300 sticky left-0 bg-slate-50 dark:bg-slate-900 min-w-[180px]">
                    Staff Name
                  </th>
                  <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300 min-w-[120px]">
                    Role
                  </th>
                  <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300 min-w-[100px]">
                    Start Date
                  </th>
                  {CHECK_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className="text-center p-3 font-semibold text-slate-700 dark:text-slate-300 min-w-[80px]"
                    >
                      <span className="text-xs">{col.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3 + CHECK_COLUMNS.length}
                      className="p-8 text-center text-slate-500"
                    >
                      {searchQuery
                        ? "No staff matching your search"
                        : "No staff records yet. Click 'Add Staff' to begin."}
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry, idx) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="border-b hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="p-3 font-medium text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-950">
                        {entry.staff_name}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {entry.role}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {entry.start_date ? formatDate(entry.start_date) : "-"}
                      </td>
                      {CHECK_COLUMNS.map((col) => (
                        <td key={col.key} className="p-3 text-center">
                          {entry.checks[col.key] ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-400 mx-auto" />
                          )}
                        </td>
                      ))}
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Footer info */}
      {entries.length > 0 && (
        <p className="text-xs text-slate-400 text-right">
          Showing {filteredEntries.length} of {entries.length} staff records
        </p>
      )}
    </div>
  );
}
