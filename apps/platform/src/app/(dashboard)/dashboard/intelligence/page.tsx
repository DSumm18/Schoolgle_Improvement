"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { motion } from "framer-motion";
import {
  BarChart3,
  Database,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Cloud,
  RefreshCw,
  Eye,
  Users,
  GraduationCap,
  Scan,
  AlertCircle,
} from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetchers";

/**
 * Schoolgle Intelligence Module
 *
 * DOMAIN-BASED CONNECTORS:
 * - Pupil Data Connector (census + assessments + demographics)
 * - Staff Data Connector (workforce census + HR exports)
 *
 * Each connector auto-detects ALL relevant files and generates dashboards dynamically.
 * Works for ANY school with DfE-standard files.
 */

interface DataConnector {
  domain: "PUPIL_DATA" | "STAFF_DATA";
  connected: boolean;
  provider?: "google_drive" | "onedrive";
  folderName?: string;
  filesDetected: number;
  dataAvailable: {
    demographics?: boolean;
    assessments?: {
      eyfsp?: boolean;
      phonics?: boolean;
      ks1?: boolean;
      ks2?: boolean;
    };
    sen?: boolean;
    attendance?: boolean;
    staffList?: boolean;
    qualifications?: boolean;
    training?: boolean;
  };
  sourceOfTruth?: {
    demographics?: string;
    assessments?: {
      eyfsp?: string;
      phonics?: string;
      ks1?: string;
      ks2?: string;
    };
    sen?: string;
    attendance?: string;
  };
}

interface IntelligenceState {
  connectors: DataConnector[];
  schoolName?: string;
  totalPupils?: number;
  lastRefreshed?: string;
}

export default function IntelligencePage() {
  const { organizationId } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "connectors">("overview");
  const [isScanning, setIsScanning] = useState(false);

  const { data: state, isLoading, mutate } = useSWR<IntelligenceState>(
    organizationId ? `/api/intelligence/summary?organizationId=${organizationId}` : null,
    fetcher,
    { refreshInterval: 30000 } // Refresh every 30s
  );

  const connectors = state?.connectors || [];
  const pupilConnector = connectors.find(c => c.domain === "PUPIL_DATA");
  const staffConnector = connectors.find(c => c.domain === "STAFF_DATA");

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch("/api/intelligence/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Scan failed");
      } else {
        await mutate(); // Refresh data
        alert("Scan complete!");
      }
    } catch (error) {
      alert("Scan failed: " + error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3 mb-2">
              <BarChart3 className="w-8 h-8 text-primary" />
              Assessment Intelligence
            </h1>
            <p className="text-muted-foreground">
              Connect your census and assessment files to automatically generate school improvement insights
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              <Scan className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
              {isScanning ? "Scanning..." : "Scan Files"}
            </button>
            <button
              onClick={() => mutate()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === "overview"
              ? "bg-card shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eye className="w-4 h-4 inline mr-2" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab("connectors")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === "connectors"
              ? "bg-card shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Database className="w-4 h-4 inline mr-2" />
          Data Connectors
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab
          state={state}
          isLoading={isLoading}
          pupilConnector={pupilConnector}
          onScan={handleScan}
          isScanning={isScanning}
        />
      )}
      {activeTab === "connectors" && (
        <ConnectorsTab
          connectors={connectors}
          isLoading={isLoading}
          onRefresh={() => mutate()}
        />
      )}
    </div>
  );
}

function OverviewTab({
  state,
  isLoading,
  pupilConnector,
  onScan,
  isScanning,
}: {
  state?: IntelligenceState;
  isLoading: boolean;
  pupilConnector?: DataConnector;
  onScan: () => void;
  isScanning: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  const hasData = pupilConnector?.connected && pupilConnector.filesDetected > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {!hasData ? (
        /* Getting Started */
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Connect Your School Data</h2>
          <p className="text-muted-foreground mb-6">
            Follow these steps to generate your assessment intelligence dashboard:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <StepCard
              step={1}
              title="Download Census Reports"
              description="From your MIS (Arbor, SIMS, Bromcom), export your school census XML files"
              icon={<FileText className="w-5 h-5" />}
            />
            <StepCard
              step={2}
              title="Upload to Google Drive"
              description="Create a 'School Data' folder and upload your census and assessment files"
              icon={<Cloud className="w-5 h-5" />}
            />
            <StepCard
              step={3}
              title="Connect Schoolgle"
              description="Go to Settings → Data Connections and link your Google Drive"
              icon={<Database className="w-5 h-5" />}
            />
            <StepCard
              step={4}
              title="Scan & Generate"
              description="Click 'Scan Files' to auto-detect your data and generate the dashboard"
              icon={<Scan className="w-5 h-5" />}
            />
          </div>

          <div className="bg-card/50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              What files do I need?
            </h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• <strong>Required:</strong> One school census XML (most recent term)</p>
              <p>• <strong>Recommended:</strong> Assessment files (EYFSP, Phonics, KS1, KS2) - any you have</p>
              <p>• All files must be in DfE standard format (your MIS exports these automatically)</p>
            </div>
          </div>

          <button
            onClick={onScan}
            disabled={isScanning}
            className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isScanning ? "Scanning..." : "Scan for Data Files"}
          </button>
        </div>
      ) : (
        /* Dashboard Preview */
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Pupils on Roll"
              value={state?.totalPupils?.toLocaleString() || "—"}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Files Connected"
              value={pupilConnector?.filesDetected || 0}
              icon={FileText}
              color="green"
            />
            <StatCard
              title="Data Sources"
              value="Auto-detected"
              icon={Database}
              color="purple"
            />
            <StatCard
              title="Last Updated"
              value={state?.lastRefreshed ? new Date(state.lastRefreshed).toLocaleDateString() : "—"}
              icon={Clock}
              color="orange"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionCard
              title="Pupil Intelligence Dashboard"
              description="Assessment trends, cohort analysis, Ofsted defence, pupil-level tracking"
              icon={BarChart3}
              href="/dashboard/intelligence/pupils"
            />
            <ActionCard
              title="Staff Intelligence Dashboard"
              description="Workforce analysis, qualifications, training compliance, absence tracking"
              icon={Users}
              href="/dashboard/intelligence/staff"
            />
          </div>
        </>
      )}
    </motion.div>
  );
}

function ConnectorsTab({
  connectors,
  isLoading,
  onRefresh,
}: {
  connectors: DataConnector[];
  isLoading: boolean;
  onRefresh: () => void;
}) {
  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-40 bg-muted rounded-2xl" />
      ))}
    </div>;
  }

  return (
    <div className="space-y-6">
      {connectors.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold mb-2">No Data Connectors Found</h3>
          <p className="text-muted-foreground mb-4">
            Connect your Google Drive or OneDrive to get started
          </p>
          <a
            href="/dashboard/settings/data-connections"
            className="inline-block bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Connect Cloud Storage
          </a>
        </div>
      ) : (
        connectors.map((connector) => (
          <ConnectorCard key={connector.domain} connector={connector} />
        ))
      )}
    </div>
  );
}

function ConnectorCard({ connector }: { connector: DataConnector }) {
  const isPupilData = connector.domain === "PUPIL_DATA";
  const Icon = isPupilData ? GraduationCap : Users;

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 rounded-xl bg-primary/10 text-primary">
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-1">
            {isPupilData ? "Pupil Data Connector" : "Staff Data Connector"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {connector.provider === "google_drive" ? "Google Drive" : "OneDrive"} connected
            {connector.folderName && ` → ${connector.folderName}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connector.connected ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">Active</span>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">No files found</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isPupilData ? (
          <>
            <DataItem
              label="Demographics"
              available={connector.dataAvailable.demographics}
              source={connector.sourceOfTruth?.demographics}
            />
            <DataItem
              label="EYFSP"
              available={connector.dataAvailable.assessments?.eyfsp}
              source={connector.sourceOfTruth?.assessments?.eyfsp}
            />
            <DataItem
              label="Phonics"
              available={connector.dataAvailable.assessments?.phonics}
              source={connector.sourceOfTruth?.assessments?.phonics}
            />
            <DataItem
              label="KS1"
              available={connector.dataAvailable.assessments?.ks1}
              source={connector.sourceOfTruth?.assessments?.ks1}
            />
            <DataItem
              label="KS2"
              available={connector.dataAvailable.assessments?.ks2}
              source={connector.sourceOfTruth?.assessments?.ks2}
            />
            <DataItem
              label="SEN Data"
              available={connector.dataAvailable.sen}
              source={connector.sourceOfTruth?.sen}
            />
            <DataItem
              label="Attendance"
              available={connector.dataAvailable.attendance}
              source={connector.sourceOfTruth?.attendance}
            />
          </>
        ) : (
          <>
            <DataItem
              label="Staff List"
              available={connector.dataAvailable.staffList}
            />
            <DataItem
              label="Qualifications"
              available={connector.dataAvailable.qualifications}
            />
            <DataItem
              label="Training"
              available={connector.dataAvailable.training}
            />
            <DataItem
              label="Absences"
              available={connector.dataAvailable?.absences as boolean | undefined}
            />
          </>
        )}
      </div>

      {connector.filesDetected > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            📄 {connector.filesDetected} file{connector.filesDetected !== 1 ? "s" : ""} detected
          </p>
        </div>
      )}
    </div>
  );
}

function DataItem({
  label,
  available,
  source,
}: {
  label: string;
  available?: boolean;
  source?: string;
}) {
  return (
    <div className="text-sm">
      <div className="font-medium mb-1">{label}</div>
      {available ? (
        <div className="text-green-600 dark:text-green-400 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          <span className="truncate" title={source}>
            {source ? `${source.slice(0, 20)}...` : "Connected"}
          </span>
        </div>
      ) : (
        <div className="text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Not connected</span>
        </div>
      )}
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  icon,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
        {step}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold mb-1 flex items-center gap-2">
          {icon}
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: "blue" | "purple" | "green" | "orange";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400",
    green: "bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400",
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="text-2xl font-black">{value}</div>
      </div>
      <div className="text-sm text-muted-foreground">{title}</div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  icon: Icon,
  href,
}: {
  title: string;
  description: string;
  icon: any;
  href: string;
}) {
  return (
    <a
      href={href}
      className="block bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-primary/10 text-primary">
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground mt-4" />
      </div>
    </a>
  );
}
