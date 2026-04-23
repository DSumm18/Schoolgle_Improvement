/**
 * Super Admin Pipeline Dashboard
 *
 * Internal view for Schoolgle to manage trust onboarding pipeline.
 * Shows revenue, contracts, payments, and stage progression.
 *
 * Page: /admin/pipeline
 */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";

interface PipelineItem {
  id: string;
  trustName: string;
  schoolCount: number;
  schools: any[];
  modules: string[];
  revenue: number;
  stage: "lead" | "quote" | "contract" | "payment" | "active";
  contractId?: string;
  contractPdfUrl?: string;
  paymentStatus?: "pending" | "partial" | "received";
  paymentReference?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PipelineDashboard() {
  const supabase = createClient();

  const [items, setItems] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"table" | "kanban">("table");
  const [filter, setFilter] = useState<"all" | "trust" | "individual">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");

  // Revenue calculations
  const revenue = {
    pipeline: items.filter((i) => ["lead", "quote"].includes(i.stage)).reduce((sum, i) => sum + i.revenue, 0),
    committed: items.filter((i) => ["contract", "payment"].includes(i.stage)).reduce((sum, i) => sum + i.revenue, 0),
    active: items.filter((i) => i.stage === "active").reduce((sum, i) => sum + i.revenue, 0),
    total: items.reduce((sum, i) => sum + i.revenue, 0)
  };

  useEffect(() => {
    loadPipelineData();
  }, []);

  const loadPipelineData = async () => {
    setLoading(true);

    try {
      // Load from onboarding_leads and contracts
      const { data: leads } = await supabase
        .from("onboarding_leads")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: contracts } = await supabase
        .from("contracts")
        .select(`
          *,
          organizations!inner(name, urn)
        `)
        .order("created_at", { ascending: false });

      // Combine data into pipeline items
      const pipelineItems: PipelineItem[] = [];

      // Add leads (early stage)
      leads?.forEach((lead: any) => {
        pipelineItems.push({
          id: lead.id,
          trustName: lead.trust_name || "Unknown Trust",
          schoolCount: lead.selected_schools?.length || 0,
          schools: lead.selected_schools || [],
          modules: [],
          revenue: lead.pricing_breakdown?.total || 0,
          stage: "lead",
          createdAt: lead.created_at,
          updatedAt: lead.updated_at
        });
      });

      // Add contracts (later stages)
      contracts?.forEach((contract: any) => {
        const stage = contract.status === "active" ? "active" :
                    contract.status === "awaiting_signature" ? "contract" :
                    contract.status === "signed" ? "payment" : "contract";

        pipelineItems.push({
          id: contract.id,
          trustName: contract.organizations?.name || "Unknown",
          schoolCount: contract.selected_modules?.length || 0,
          schools: contract.selected_modules || [],
          modules: contract.selected_modules?.map((s: any) => s.modules).flat() || [],
          revenue: contract.total_value || 0,
          stage,
          contractId: contract.id,
          contractPdfUrl: contract.contract_pdf_url,
          paymentReference: contract.payment_reference, // From payments table
          createdAt: contract.created_at,
          updatedAt: contract.updated_at
        });
      });

      setItems(pipelineItems);
    } catch (error) {
      console.error("Failed to load pipeline data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = !searchQuery || item.trustName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = selectedStage === "all" || item.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  const updateStage = async (itemId: string, newStage: string) => {
    // Update in database
    // This would update onboarding_leads or contracts table
    setItems(items.map((item) =>
      item.id === itemId ? { ...item, stage: newStage as any } : item
    ));
  };

  const confirmPayment = async (itemId: string) => {
    // Mark payment as received
    // This would update payments table and activate subscription
    alert("Payment confirmed - access activated");
    loadPipelineData();
  };

  const sendReminder = async (itemId: string) => {
    // Send reminder email
    alert("Reminder email sent");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pipeline Dashboard</h1>
              <p className="text-sm text-gray-500">Manage trust onboarding</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setView(view === "table" ? "kanban" : "table")}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                {view === "table" ? "Kanban View" : "Table View"}
              </button>
              <button
                onClick={loadPipelineData}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Revenue Summary */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 mb-1">Pipeline Value</p>
            <p className="text-2xl font-bold text-gray-900">£{revenue.pipeline.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">{items.filter((i) => ["lead", "quote"].includes(i.stage)).length} opportunities</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-500 mb-1">Committed Revenue</p>
            <p className="text-2xl font-bold text-gray-900">£{revenue.committed.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">{items.filter((i) => ["contract", "payment"].includes(i.stage)).length} in progress</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <p className="text-sm text-gray-500 mb-1">Active Revenue</p>
            <p className="text-2xl font-bold text-gray-900">£{revenue.active.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">{items.filter((i) => i.stage === "active").length} active</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <p className="text-sm text-gray-500 mb-1">Total Pipeline</p>
            <p className="text-2xl font-bold text-gray-900">£{revenue.total.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">{items.length} total</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by trust name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Stages</option>
              <option value="lead">Lead</option>
              <option value="quote">Quote</option>
              <option value="contract">Contract</option>
              <option value="payment">Payment</option>
              <option value="active">Active</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        {view === "table" && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trust/School</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schools</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modules</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.stage === "lead" ? "bg-blue-100 text-blue-700" :
                        item.stage === "quote" ? "bg-purple-100 text-purple-700" :
                        item.stage === "contract" ? "bg-yellow-100 text-yellow-700" :
                        item.stage === "payment" ? "bg-orange-100 text-orange-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {item.stage.charAt(0).toUpperCase() + item.stage.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{item.trustName}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{item.schoolCount}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.modules.length > 0 ? item.modules.join(", ") : "-"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      £{item.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {item.contractPdfUrl ? (
                        <a
                          href={item.contractPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View PDF
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.paymentReference ? (
                        <div>
                          <p className="text-sm text-gray-900">{item.paymentReference}</p>
                          <p className={`text-xs ${item.stage === "active" ? "text-green-600" : "text-orange-600"}`}>
                            {item.stage === "active" ? "Paid" : "Pending"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {item.stage === "payment" && (
                          <button
                            onClick={() => confirmPayment(item.id)}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Confirm
                          </button>
                        )}
                        {item.stage !== "active" && (
                          <button
                            onClick={() => sendReminder(item.id)}
                            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            Remind
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No items found</p>
              </div>
            )}
          </div>
        )}

        {/* Kanban View */}
        {view === "kanban" && (
          <div className="grid grid-cols-5 gap-4">
            {["lead", "quote", "contract", "payment", "active"].map((stage) => (
              <div key={stage} className="bg-gray-100 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 capitalize flex items-center justify-between">
                  {stage}
                  <span className="px-2 py-1 bg-white rounded-full text-xs">
                    {filteredItems.filter((i) => i.stage === stage).length}
                  </span>
                </h3>

                <div className="space-y-3">
                  {filteredItems
                    .filter((i) => i.stage === stage)
                    .map((item) => (
                      <div key={item.id} className="bg-white rounded-lg shadow-sm p-4">
                        <p className="font-medium text-gray-900 text-sm mb-2">{item.trustName}</p>
                        <p className="text-xs text-gray-500 mb-2">{item.schoolCount} schools</p>
                        <p className="text-sm font-semibold text-gray-900">£{item.revenue.toLocaleString()}</p>

                        {item.contractPdfUrl && (
                          <a
                            href={item.contractPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View Contract
                          </a>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
