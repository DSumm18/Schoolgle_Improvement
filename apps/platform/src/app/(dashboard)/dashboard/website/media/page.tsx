"use client";

import { useState } from "react";
import {
  Image as ImageIcon,
  ArrowLeft,
  Upload,
  Search,
  Grid,
  List,
} from "lucide-react";
import Link from "next/link";

export default function WebsiteMediaPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
            <ImageIcon className="w-5 h-5 text-fuchsia-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Media Library</h1>
            <p className="text-sm text-gray-500">
              Upload and manage images, documents, and files
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-fuchsia-100 text-fuchsia-600" : "hover:bg-gray-100 text-gray-500"}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-fuchsia-100 text-fuchsia-600" : "hover:bg-gray-100 text-gray-500"}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Upload area */}
      <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center hover:border-fuchsia-400 transition-colors cursor-pointer">
        <div className="w-16 h-16 rounded-2xl bg-fuchsia-50 flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-fuchsia-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Upload Media</h3>
        <p className="text-gray-500 mb-2">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-xs text-gray-400">
          Supports: JPG, PNG, GIF, SVG, PDF, DOCX (max 10MB)
        </p>
      </div>

      {/* Empty state */}
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
          <ImageIcon className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-gray-600">
          No Media Files Yet
        </h3>
        <p className="text-gray-400">
          Upload images and documents to use across your website pages.
        </p>
      </div>
    </div>
  );
}
