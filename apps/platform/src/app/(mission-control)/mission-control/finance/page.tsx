"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  PoundSterling,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Mail,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  FileText
} from "lucide-react";

interface InvoiceData {
  id: string;
  invoice_number: string;
  status: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  organization_id: string;
  organization_name: string;
}

export default function MissionControlFinance() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [metrics, setMetrics] = useState({ overdueCount: 0, unpaidTotal: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  async function fetchFinanceData() {
    setLoading(true);
    try {
      const res = await fetch("/api/mission-control/finance");
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (e) {
      console.error("Failed to fetch finance data:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-900/30 text-emerald-400 text-xs font-medium"><CheckCircle2 className="w-3 h-3"/> Paid</span>;
      case "sent":
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-900/30 text-blue-400 text-xs font-medium"><Mail className="w-3 h-3"/> Sent</span>;
      case "overdue":
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-900/30 text-red-400 text-xs font-medium"><AlertCircle className="w-3 h-3"/> Overdue</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs font-medium"><FileText className="w-3 h-3"/> Draft</span>;
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.organization_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <CreditCard className="w-6 h-6" />
            Finance & Billing Hub
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage Invoices, Contracts, and BACS Reconciliation
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchFinanceData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-sm text-white font-medium transition-colors shadow">
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Total Outstanding</h3>
          <p className="text-3xl font-bold text-zinc-100">
            £{metrics.unpaidTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Overdue Invoices</h3>
          <p className={`text-3xl font-bold flex items-baseline gap-2 ${metrics.overdueCount > 0 ? "text-red-400" : "text-zinc-100"}`}>
            {metrics.overdueCount}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Last Bank Sync</h3>
          <p className="text-xl font-bold text-zinc-100 mt-2 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" /> Today, 09:00 AM
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search by invoice # or school..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-6 py-3 font-medium">Invoice No.</th>
                <th className="px-6 py-3 font-medium">Client</th>
                <th className="px-6 py-3 font-medium">Issue Date</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-200">{inv.invoice_number}</td>
                  <td className="px-6 py-4">{inv.organization_name}</td>
                  <td className="px-6 py-4 text-zinc-400">{new Date(inv.issue_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-medium text-zinc-200">£{Number(inv.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 text-zinc-400 hover:text-white rounded transition mr-2">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-zinc-400 hover:text-white rounded transition">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-zinc-500">
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
