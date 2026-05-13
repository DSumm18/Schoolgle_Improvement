"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  UserSearch,
  ShieldAlert,
  FileSearch,
  Plus,
  Calendar,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DPIAWizard from "./DPIAWizard";
import SARModal from "./SARModal";
import BreachModal from "./BreachModal";

interface GDPRDashboardProps {
  organizationId: string;
}

interface GDPRCounts {
  dpias: number;
  sars: number;
  breaches: number;
  open_sars: number;
  open_breaches: number;
}

interface GDPRItem {
  id: string;
  title: string;
  status: string;
  date: string;
  severity?: string;
  deadline?: string;
}

export default function GDPRDashboard({ organizationId }: GDPRDashboardProps) {
  const [activeTab, setActiveTab] = useState("dpias");
  const [dpias, setDpias] = useState<GDPRItem[]>([]);
  const [sars, setSars] = useState<GDPRItem[]>([]);
  const [breaches, setBreaches] = useState<GDPRItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dpiaWizardOpen, setDpiaWizardOpen] = useState(false);
  const [sarModalOpen, setSarModalOpen] = useState(false);
  const [breachModalOpen, setBreachModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [organizationId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dpiasRes, sarsRes, breachesRes] = await Promise.all([
        fetch(`/api/compliance/gdpr/dpia?organizationId=${organizationId}`),
        fetch(`/api/compliance/gdpr/sar?organizationId=${organizationId}`),
        fetch(`/api/compliance/gdpr/breach?organizationId=${organizationId}`),
      ]);

      if (dpiasRes.ok) {
        const data = await dpiasRes.json();
        setDpias(data.dpias || []);
      }
      if (sarsRes.ok) {
        const data = await sarsRes.json();
        setSars(data.sars || []);
      }
      if (breachesRes.ok) {
        const data = await breachesRes.json();
        setBreaches(data.breaches || []);
      }
    } catch (error) {
      console.error("Failed to fetch GDPR data:", error);
    } finally {
      setLoading(false);
    }
  };

  const counts: GDPRCounts = {
    dpias: dpias.length,
    sars: sars.length,
    breaches: breaches.length,
    open_sars: sars.filter((s) => s.status === "open").length,
    open_breaches: breaches.filter((b) => b.status === "open").length,
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getSeverityBadge = (severity?: string) => {
    if (!severity) return null;
    const colors: Record<string, string> = {
      low: "bg-slate-100 text-slate-700",
      medium: "bg-amber-100 text-amber-700",
      high: "bg-orange-100 text-orange-700",
      critical: "bg-rose-100 text-rose-700",
    };
    return (
      <Badge
        className={`text-[10px] font-bold uppercase ${colors[severity] || colors.low}`}
      >
        {severity}
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
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:border-purple-300 transition-all"
          onClick={() => setActiveTab("dpias")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{counts.dpias}</p>
                <p className="text-[10px] font-bold uppercase text-slate-500">
                  DPIAs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-purple-300 transition-all"
          onClick={() => setActiveTab("sars")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <UserSearch className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{counts.sars}</p>
                <p className="text-[10px] font-bold uppercase text-slate-500">
                  Subject Access Requests
                  {counts.open_sars > 0 && (
                    <span className="text-amber-600 ml-1">
                      ({counts.open_sars} open)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-purple-300 transition-all"
          onClick={() => setActiveTab("breaches")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{counts.breaches}</p>
                <p className="text-[10px] font-bold uppercase text-slate-500">
                  Breaches
                  {counts.open_breaches > 0 && (
                    <span className="text-rose-600 ml-1">
                      ({counts.open_breaches} open)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Link href="/dashboard/compliance/foi" className="block">
          <Card className="h-full cursor-pointer hover:border-purple-300 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-300">
                  <FileSearch className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold">FOI</p>
                  <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    Information Requests
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Log FOI requests, statutory deadlines and response status.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <TabsTrigger
              value="dpias"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
            >
              DPIAs
            </TabsTrigger>
            <TabsTrigger
              value="sars"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
            >
              Subject Access Requests
            </TabsTrigger>
            <TabsTrigger
              value="breaches"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
            >
              Breaches
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {activeTab === "dpias" && (
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setDpiaWizardOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                New DPIA
              </Button>
            )}
            {activeTab === "sars" && (
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setSarModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                New SAR
              </Button>
            )}
            {activeTab === "breaches" && (
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setBreachModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                New Breach
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="dpias" className="mt-4">
          <ItemList
            items={dpias}
            emptyIcon={Shield}
            emptyLabel="No DPIAs recorded"
            formatDate={formatDate}
            getSeverityBadge={getSeverityBadge}
          />
        </TabsContent>

        <TabsContent value="sars" className="mt-4">
          <ItemList
            items={sars}
            emptyIcon={UserSearch}
            emptyLabel="No subject access requests"
            formatDate={formatDate}
            getSeverityBadge={getSeverityBadge}
            showDeadline
          />
        </TabsContent>

        <TabsContent value="breaches" className="mt-4">
          <ItemList
            items={breaches}
            emptyIcon={ShieldAlert}
            emptyLabel="No breaches recorded"
            formatDate={formatDate}
            getSeverityBadge={getSeverityBadge}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <DPIAWizard
        organizationId={organizationId}
        isOpen={dpiaWizardOpen}
        onClose={() => setDpiaWizardOpen(false)}
        onSave={() => {
          setDpiaWizardOpen(false);
          fetchData();
        }}
      />

      <SARModal
        organizationId={organizationId}
        isOpen={sarModalOpen}
        onClose={() => setSarModalOpen(false)}
        onSave={() => {
          setSarModalOpen(false);
          fetchData();
        }}
      />

      <BreachModal
        organizationId={organizationId}
        isOpen={breachModalOpen}
        onClose={() => setBreachModalOpen(false)}
        onSave={() => {
          setBreachModalOpen(false);
          fetchData();
        }}
      />
    </div>
  );
}

function ItemList({
  items,
  emptyIcon: EmptyIcon,
  emptyLabel,
  formatDate,
  getSeverityBadge,
  showDeadline,
}: {
  items: GDPRItem[];
  emptyIcon: any;
  emptyLabel: string;
  formatDate: (d: string) => string;
  getSeverityBadge: (s?: string) => React.ReactNode;
  showDeadline?: boolean;
}) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <EmptyIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold">{emptyLabel}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const isDeadlineNear =
          showDeadline &&
          item.deadline &&
          (() => {
            const days = Math.ceil(
              (new Date(item.deadline).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24),
            );
            return days >= 0 && days <= 7;
          })();

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
          >
            <Card
              className={`hover:border-purple-300 transition-all cursor-pointer ${
                isDeadlineNear ? "border-amber-300" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.date)}
                      </span>
                      {showDeadline && item.deadline && (
                        <span
                          className={`flex items-center gap-1 text-xs ${
                            isDeadlineNear
                              ? "text-amber-600 font-semibold"
                              : "text-slate-500"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          Due: {formatDate(item.deadline)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(item.severity)}
                    <Badge variant="outline" className="text-[10px]">
                      {item.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
