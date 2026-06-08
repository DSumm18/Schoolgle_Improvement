"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import type { ThresholdAlert } from "@/lib/deal-finder/services/threshold-intelligence";

export function ThresholdDashboard({ organizationId }: { organizationId: string | undefined }) {
  const { session } = useAuth();
  const [alerts, setAlerts] = useState<ThresholdAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchThresholds() {
      if (!organizationId) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/tools/deal-finder/thresholds?organizationId=${organizationId}`, {
          headers: {
            "Authorization": session?.access_token ? `Bearer ${session.access_token}` : ""
          }
        });
        const json = await res.json();
        if (json.data && json.data.alerts) {
          setAlerts(json.data.alerts);
        }
      } catch (err) {
        console.error("Failed to load threshold data", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchThresholds();
  }, [organizationId, session?.access_token]);

  if (isLoading) {
    return <div className="h-24 animate-pulse bg-white/70 border border-slate-100 rounded-xl mb-8" />;
  }

  if (alerts.length === 0) return null;

  const redAlerts = alerts.filter(a => a.alert_level === "red");
  const amberAlerts = alerts.filter(a => a.alert_level === "amber");

  if (redAlerts.length === 0 && amberAlerts.length === 0) {
    return (
      <div className="mb-8 p-4 rounded-xl border border-emerald-200 bg-emerald-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-medium text-emerald-800">All supplier spend within compliant thresholds.</h3>
        </div>
      </div>
    );
  }

  const highestAlert = redAlerts.length > 0 ? redAlerts[0] : amberAlerts[0];
  const isRed = highestAlert.alert_level === "red";

  return (
    <div className={`mb-8 p-5 rounded-xl border ${isRed ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isRed ? "bg-red-500/20" : "bg-amber-500/20"}`}>
          {isRed ? <ShieldAlert className="w-5 h-5 text-red-500" /> : <AlertTriangle className="w-5 h-5 text-amber-500" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`font-semibold text-sm ${isRed ? "text-red-800" : "text-amber-900"}`}>
              {isRed ? "Compliance Breach Risk" : "Threshold Warning"}
            </h3>
            <span className="text-xs font-medium text-slate-500 font-mono">
              £{highestAlert.current_spend.toLocaleString()} / £{highestAlert.next_threshold.threshold_gbp.toLocaleString()}
            </span>
          </div>
          
          <p className="text-slate-700 text-sm mb-3">
            {highestAlert.message}
          </p>

          <div className="w-full bg-white rounded-full h-2 mb-1.5 overflow-hidden">
            <div 
              className={`h-2 rounded-full ${isRed ? "bg-red-500" : "bg-amber-500"}`} 
              style={{ width: `${Math.min(highestAlert.proximity_pct, 100)}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{highestAlert.supplier_name} Total Spend</span>
            <span>{highestAlert.proximity_pct.toFixed(1)}% of {highestAlert.next_threshold.name} Limit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
