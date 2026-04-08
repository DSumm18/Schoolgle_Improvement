"use client";

import { useState, useMemo } from "react";
import {
  Zap,
  Eye,
  Search,
  BarChart3,
  Bot,
  MonitorCheck,
  FileOutput,
  BrainCircuit,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
} from "lucide-react";
import {
  SKILLS_REGISTRY,
  DEPARTMENTS,
  getSkillsByDepartment,
  getSkillStats,
  type SkillDefinition,
  type SkillStatus,
  type SkillType,
} from "@/lib/mission-control/skills-registry";

function SkillTypeIcon({ type }: { type: SkillType }) {
  switch (type) {
    case "advisor":
      return <BrainCircuit className="h-3.5 w-3.5" />;
    case "worker":
      return <Bot className="h-3.5 w-3.5" />;
    case "monitor":
      return <MonitorCheck className="h-3.5 w-3.5" />;
    case "analyst":
      return <BarChart3 className="h-3.5 w-3.5" />;
    case "generator":
      return <FileOutput className="h-3.5 w-3.5" />;
  }
}

function StatusIndicator({ status }: { status: SkillStatus }) {
  switch (status) {
    case "active":
      return (
        <span className="flex items-center gap-1 text-xs text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Active
        </span>
      );
    case "not_yet_built":
      return (
        <span className="flex items-center gap-1 text-xs text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
          Not Built
        </span>
      );
    case "inactive":
      return (
        <span className="flex items-center gap-1 text-xs text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Inactive
        </span>
      );
    case "deprecated":
      return (
        <span className="flex items-center gap-1 text-xs text-red-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          Deprecated
        </span>
      );
  }
}

function ApprovalModeBadge({ mode }: { mode: string }) {
  const styles: Record<string, string> = {
    auto: "bg-emerald-900/20 text-emerald-500 border-emerald-900",
    human_review: "bg-amber-900/20 text-amber-500 border-amber-900",
    human_approval: "bg-red-900/20 text-red-500 border-red-900",
  };
  const labels: Record<string, string> = {
    auto: "Auto",
    human_review: "Review",
    human_approval: "Approval",
  };
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${styles[mode] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
    >
      {labels[mode] || mode}
    </span>
  );
}

export default function SkillRegistryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SkillStatus | "all">("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  const stats = useMemo(() => getSkillStats(), []);
  const grouped = useMemo(() => getSkillsByDepartment(), []);

  const filteredSkills = useMemo(() => {
    return SKILLS_REGISTRY.filter((skill) => {
      if (statusFilter !== "all" && skill.status !== statusFilter) return false;
      if (departmentFilter !== "all" && skill.department !== departmentFilter)
        return false;
      if (
        search &&
        !skill.name.toLowerCase().includes(search.toLowerCase()) &&
        !skill.description.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [search, statusFilter, departmentFilter]);

  const filteredGrouped = useMemo(() => {
    const result: Record<string, SkillDefinition[]> = {};
    for (const skill of filteredSkills) {
      if (!result[skill.department]) result[skill.department] = [];
      result[skill.department].push(skill);
    }
    return result;
  }, [filteredSkills]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Skill Registry</h1>
        <p className="text-sm text-zinc-500">
          {stats.total} skills across {DEPARTMENTS.length} departments
        </p>
      </div>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
          <p className="text-xs text-zinc-500">Active</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-zinc-500">{stats.notBuilt}</p>
          <p className="text-xs text-zinc-500">Not Built</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-violet-400">{stats.total}</p>
          <p className="text-xs text-zinc-500">Total Skills</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-violet-400">
            {Math.round((stats.active / stats.total) * 100)}%
          </p>
          <p className="text-xs text-zinc-500">Built</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skills..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 focus:border-violet-700 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SkillStatus | "all")}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-violet-700 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="not_yet_built">Not Built</option>
          <option value="inactive">Inactive</option>
          <option value="deprecated">Deprecated</option>
        </select>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-violet-700 focus:outline-none"
        >
          <option value="all">All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.planet !== "N/A" ? `${d.planet} — ` : ""}
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Skills by Department */}
      <div className="space-y-6">
        {Object.entries(filteredGrouped).map(([deptId, skills]) => {
          const dept = DEPARTMENTS.find((d) => d.id === deptId);
          if (!dept) return null;
          return (
            <div
              key={deptId}
              className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden"
            >
              {/* Department Header */}
              <div
                className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3"
                style={{ borderLeftWidth: 3, borderLeftColor: dept.color }}
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-white"
                  style={{ backgroundColor: dept.color }}
                >
                  {dept.planet !== "N/A" ? dept.planet[0] : "MC"}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-zinc-200">
                    {dept.name}
                  </h3>
                  {dept.planet !== "N/A" && (
                    <p className="text-xs text-zinc-500">{dept.planet}</p>
                  )}
                </div>
                <span className="text-xs text-zinc-500">
                  {skills.filter((s) => s.status === "active").length}/
                  {skills.length} active
                </span>
              </div>

              {/* Skills Table */}
              <div className="divide-y divide-zinc-800/50">
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center gap-4 px-4 py-2.5 hover:bg-zinc-800/30"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-zinc-800 text-zinc-400">
                      <SkillTypeIcon type={skill.type} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-zinc-300">
                          {skill.name}
                        </p>
                        <ApprovalModeBadge mode={skill.approvalMode} />
                      </div>
                      <p className="truncate text-xs text-zinc-500">
                        {skill.description}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <StatusIndicator status={skill.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filteredSkills.length === 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-12 text-center">
          <Filter className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
          <p className="text-sm text-zinc-400">
            No skills match your filters
          </p>
        </div>
      )}
    </div>
  );
}
