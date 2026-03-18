"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  ArrowLeft,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  Globe,
  GripVertical,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/SupabaseAuthContext";
import { PageEditor } from "@/components/website-builder";
import type { WebsitePage, ContentBlock } from "@/lib/website-builder/content-types";

export default function WebsitePagesPage() {
  const { organizationId } = useAuth();
  const [pages, setPages] = useState<WebsitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<WebsitePage | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadPages = useCallback(async () => {
    try {
      const res = await fetch("/api/website/pages");
      if (res.ok) {
        const data = await res.json();
        setPages(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load pages:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const handleSave = async (blocks: ContentBlock[]) => {
    if (!editing) return;
    setIsSaving(true);
    try {
      if (editing.id === "new") {
        const res = await fetch("/api/website/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "New Page",
            slug: `page-${Date.now()}`,
            contentBlocks: blocks,
            status: "draft",
          }),
        });
        if (res.ok) {
          setEditing(null);
          loadPages();
        }
      } else {
        const res = await fetch(`/api/website/pages?id=${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentBlocks: blocks }),
        });
        if (res.ok) {
          setEditing(null);
          loadPages();
        }
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this page?")) return;
    try {
      await fetch(`/api/website/pages?id=${id}`, { method: "DELETE" });
      loadPages();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (editing) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1600px] mx-auto">
        <PageEditor
          page={editing}
          onSave={handleSave}
          onBack={() => setEditing(null)}
          isSaving={isSaving}
        />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/website"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-fuchsia-50 flex items-center justify-center">
            <FileText className="w-5 h-5 text-fuchsia-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Pages</h1>
            <p className="text-sm text-gray-500">
              Manage your school website pages
            </p>
          </div>
        </div>
        <button
          onClick={() =>
            setEditing({
              id: "new",
              websiteId: "",
              title: "New Page",
              slug: "",
              contentBlocks: [],
              status: "draft",
              sortOrder: pages.length,
              showInNav: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          }
          className="px-4 py-2.5 bg-fuchsia-600 text-white rounded-xl hover:bg-fuchsia-700 flex items-center gap-2 font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Page
        </button>
      </div>

      {/* Pages list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-fuchsia-500" />
        </div>
      ) : pages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-fuchsia-50 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-fuchsia-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Pages Yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first page to get started.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {pages.map((page) => (
            <div
              key={page.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-gray-300" />
                <div>
                  <div className="font-medium">{page.title}</div>
                  <div className="text-sm text-gray-500">/{page.slug}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    page.status === "published"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {page.status}
                </span>
                <span className="text-xs text-gray-400">
                  {page.contentBlocks?.length || 0} blocks
                </span>
                <button
                  onClick={() => setEditing(page)}
                  className="p-1.5 rounded-lg hover:bg-fuchsia-50 text-gray-500 hover:text-fuchsia-600 transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(page.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
