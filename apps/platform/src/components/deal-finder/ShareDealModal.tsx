"use client";

import { useState } from "react";
import { X, Upload, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";

interface ShareDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string | undefined;
}

export function ShareDealModal({ isOpen, onClose, organizationId }: ShareDealModalProps) {
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    supplier_name: "",
    source_url: "",
    price: "",
    pack_qty: "1",
    purchase_date: new Date().toISOString().split("T")[0],
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = organizationId
        ? `/api/tools/deal-finder/community?organizationId=${organizationId}`
        : "/api/tools/deal-finder/community";

      const res = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": session?.access_token ? `Bearer ${session.access_token}` : ""
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          pack_qty: parseInt(formData.pack_qty, 10),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit deal");
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setFormData({
          title: "",
          supplier_name: "",
          source_url: "",
          price: "",
          pack_qty: "1",
          purchase_date: new Date().toISOString().split("T")[0],
        });
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white border border-emerald-100 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-emerald-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <Upload className="w-4 h-4 text-emerald-700" />
            </div>
            <h2 className="text-xl font-semibold text-slate-950">Share a Deal</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share deal"
            className="text-slate-400 hover:text-slate-950 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-950 mb-2">Deal Shared!</h3>
            <p className="text-slate-600">
              Thank you for contributing to the Schoolgle community. Your price has been added to the comparison engine.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. YPO A4 Copier Paper 80gsm"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-950 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Supplier Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. YPO"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-950 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Purchase Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-950 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Supplier Product URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.source_url}
                onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-950 focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Total Price Paid (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-950 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Quantity / Pack Size
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.pack_qty}
                  onChange={(e) => setFormData({ ...formData, pack_qty: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-950 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg font-medium text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg font-medium bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Saving..." : "Share Deal"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
