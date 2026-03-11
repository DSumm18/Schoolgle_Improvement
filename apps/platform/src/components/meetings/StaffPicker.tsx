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
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [externalMode, setExternalMode] = useState(false);
  const [externalName, setExternalName] = useState("");
  const [externalRole, setExternalRole] = useState("");
  const [externalEmail, setExternalEmail] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!organizationId) return;

    setLoading(true);
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
        className="rounded-lg border border-slate-700 bg-slate-800 p-3"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">
            Add external attendee
          </span>
          <button
            type="button"
            onClick={() => setExternalMode(false)}
            className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
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
            className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <input
            type="text"
            value={externalRole}
            onChange={(e) => setExternalRole(e.target.value)}
            placeholder="Role / Job title"
            className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="email"
            value={externalEmail}
            onChange={(e) => setExternalEmail(e.target.value)}
            placeholder="Email (optional)"
            className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleExternalSubmit}
            disabled={!externalName.trim()}
            className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
          className="w-full rounded-md border border-slate-600 bg-slate-800 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
          {loading && (
            <div className="px-3 py-4 text-center text-sm text-slate-400">
              Loading staff...
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-slate-400">
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
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-700"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-slate-300">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-100">
                      {name}
                    </div>
                    <div className="truncate text-xs text-slate-400">
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
            className="flex w-full items-center gap-2 border-t border-slate-700 px-3 py-2 text-left text-sm text-blue-400 hover:bg-slate-700 hover:text-blue-300"
          >
            <Plus className="h-4 w-4" />
            Add external attendee
          </button>
        </div>
      )}
    </div>
  );
}
