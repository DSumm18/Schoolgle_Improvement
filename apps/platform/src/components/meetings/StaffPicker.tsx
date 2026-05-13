"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, User, Plus, X } from "lucide-react";

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  email: string | null;
  job_title: string | null;
  role_category: string | null;
}

interface SelectedStaff {
  id: string;
  name: string;
  role: string;
  email?: string;
}

interface StaffPickerProps {
  organizationId: string;
  onSelect: (staff: SelectedStaff) => void;
  placeholder?: string;
  excludeIds?: string[];
}

export function StaffPicker({
  organizationId,
  onSelect,
  placeholder = "Search staff...",
  excludeIds = [],
}: StaffPickerProps) {
  const [query, setQuery] = useState("");
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [externalMode, setExternalMode] = useState(false);
  const [externalName, setExternalName] = useState("");
  const [externalRole, setExternalRole] = useState("");
  const [externalEmail, setExternalEmail] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!organizationId) return;

    fetch(`/api/staff?organizationId=${organizationId}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.data) {
          setStaff(res.data);
        }
      })
      .catch((err) => console.error("Failed to fetch staff:", err))
      .finally(() => setLoading(false));
  }, [organizationId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = staff.filter((s) => {
    if (excludeIds.includes(s.id)) return false;
    const searchText = query.toLowerCase();
    const name = s.display_name || `${s.first_name} ${s.last_name}`;
    return (
      name.toLowerCase().includes(searchText) ||
      (s.job_title && s.job_title.toLowerCase().includes(searchText)) ||
      (s.role_category && s.role_category.toLowerCase().includes(searchText)) ||
      (s.email && s.email.toLowerCase().includes(searchText))
    );
  });

  const handleSelect = useCallback(
    (s: StaffMember) => {
      const name = s.display_name || `${s.first_name} ${s.last_name}`;
      onSelect({
        id: s.id,
        name,
        role: s.job_title || s.role_category || "",
        email: s.email || undefined,
      });
      setQuery("");
      setOpen(false);
    },
    [onSelect],
  );

  const handleExternalSubmit = useCallback(() => {
    if (!externalName.trim()) return;
    onSelect({
      id: `external-${Date.now()}`,
      name: externalName.trim(),
      role: externalRole.trim(),
      email: externalEmail.trim() || undefined,
    });
    setExternalName("");
    setExternalRole("");
    setExternalEmail("");
    setExternalMode(false);
    setOpen(false);
  }, [externalName, externalRole, externalEmail, onSelect]);

  if (externalMode) {
    return (
      <div
        ref={containerRef}
        className="rounded-2xl border border-blue-100 bg-white p-3 shadow-lg shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Add external attendee
          </span>
          <button
            type="button"
            onClick={() => setExternalMode(false)}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2">
          <input
            type="text"
            value={externalName}
            onChange={(e) => setExternalName(e.target.value)}
            placeholder="Full name *"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder-slate-500"
            autoFocus
          />
          <input
            type="text"
            value={externalRole}
            onChange={(e) => setExternalRole(e.target.value)}
            placeholder="Role / Job title"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder-slate-500"
          />
          <input
            type="email"
            value={externalEmail}
            onChange={(e) => setExternalEmail(e.target.value)}
            placeholder="Email (optional)"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder-slate-500"
          />
          <button
            type="button"
            onClick={handleExternalSubmit}
            disabled={!externalName.trim()}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add attendee
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500 dark:text-blue-300" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder-slate-500"
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30">
          {loading && (
            <div className="px-3 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
              Loading staff...
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
              No staff found
            </div>
          )}

          {!loading &&
            filtered.map((s) => {
              const name = s.display_name || `${s.first_name} ${s.last_name}`;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelect(s)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-blue-50 dark:hover:bg-slate-800"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {name}
                    </div>
                    <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {[s.job_title, s.role_category]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                </button>
              );
            })}

          <button
            type="button"
            onClick={() => {
              setExternalMode(true);
              setQuery("");
            }}
            className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-left text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:text-blue-300 dark:hover:bg-slate-800 dark:hover:text-blue-200"
          >
            <Plus className="h-4 w-4" />
            Add external attendee
          </button>
        </div>
      )}
    </div>
  );
}
