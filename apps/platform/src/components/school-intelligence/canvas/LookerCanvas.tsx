"use client";

import { useState, useEffect, useCallback } from 'react';
import { Plus, BarChart3, Table2, FileText, Hash, Trash2, Database, ChevronDown, ChevronRight } from 'lucide-react';
import { getAllConnectors } from '@/lib/data-connectors/registry';
import { FIELD_MANIFEST, formatSampleValue, type ConnectorField } from './lib/field-manifest';
import type { Connector } from '@/lib/data-connectors/types';

// ─── Types ──────────────────────────────────────────────────────────

type WidgetType = 'scorecard' | 'table' | 'narrative';

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  connectorId: string | null;
  fields: ConnectorField[];
  data: Record<string, unknown> | null;
  loading: boolean;
}

// ─── Data fetching ──────────────────────────────────────────────────

const URN = 148201;

async function fetchFieldValues(table: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`/api/data-connectors/sample-values?table=${table}&urn=${URN}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.row ?? null;
  } catch {
    return null;
  }
}

// ─── Widget ID generator ────────────────────────────────────────────

let widgetCounter = 0;
function newWidgetId(): string {
  return `w-${++widgetCounter}-${Date.now()}`;
}

// ─── Main Component ─────────────────────────────────────────────────

export function LookerCanvas() {
  const connectors = getAllConnectors().filter(c => c.status === 'active');
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  const selectedWidget = widgets.find(w => w.id === selectedId) ?? null;

  // ─── Add widget ───────────────────────────────────────────────────

  function addWidget(type: WidgetType) {
    const titles: Record<WidgetType, string> = {
      scorecard: 'New Scorecard',
      table: 'New Table',
      narrative: 'New Narrative',
    };
    const w: Widget = {
      id: newWidgetId(),
      type,
      title: titles[type],
      connectorId: null,
      fields: [],
      data: null,
      loading: false,
    };
    setWidgets(prev => [...prev, w]);
    setSelectedId(w.id);
  }

  function removeWidget(id: string) {
    setWidgets(prev => prev.filter(w => w.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  // ─── Configure widget ─────────────────────────────────────────────

  const setWidgetConnector = useCallback(async (widgetId: string, connectorId: string) => {
    const group = FIELD_MANIFEST.find(g => g.connectorId === connectorId);
    if (!group) return;

    setWidgets(prev => prev.map(w =>
      w.id === widgetId
        ? { ...w, connectorId, fields: [], data: null, loading: true }
        : w,
    ));

    const data = await fetchFieldValues(group.table);

    setWidgets(prev => prev.map(w =>
      w.id === widgetId ? { ...w, data, loading: false } : w,
    ));
  }, []);

  function toggleField(widgetId: string, field: ConnectorField) {
    setWidgets(prev => prev.map(w => {
      if (w.id !== widgetId) return w;
      const has = w.fields.some(f => f.id === field.id);
      const fields = has
        ? w.fields.filter(f => f.id !== field.id)
        : [...w.fields, field];
      const title = fields.length > 0
        ? fields.map(f => f.label).join(', ')
        : w.type === 'scorecard' ? 'New Scorecard' : w.type === 'table' ? 'New Table' : 'New Narrative';
      return { ...w, fields, title };
    }));
  }

  function updateWidgetTitle(widgetId: string, title: string) {
    setWidgets(prev => prev.map(w =>
      w.id === widgetId ? { ...w, title } : w,
    ));
  }

  // ─── Toggle data source expansion ─────────────────────────────────

  function toggleSource(connectorId: string) {
    setExpandedSources(prev => {
      const next = new Set(prev);
      if (next.has(connectorId)) next.delete(connectorId);
      else next.add(connectorId);
      return next;
    });
  }

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-140px)] rounded-xl border border-border overflow-hidden bg-background">

      {/* ═══ LEFT: Data Sources ═══ */}
      <div className="w-60 flex-shrink-0 border-r border-border bg-card/50 flex flex-col">
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-purple-500" />
            <h2 className="text-[11px] font-bold text-foreground uppercase tracking-wider">Data Sources</h2>
          </div>
          <p className="text-[9px] text-muted-foreground mt-0.5">Click a source to see its fields</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {connectors.map(c => {
            const group = FIELD_MANIFEST.find(g => g.connectorId === c.id);
            const expanded = expandedSources.has(c.id);
            return (
              <div key={c.id} className="mb-1">
                <button
                  onClick={() => toggleSource(c.id)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-purple-500/5 text-left"
                >
                  {expanded
                    ? <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    : <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  }
                  <span className="text-base">{c.icon}</span>
                  <span className="text-[11px] font-semibold text-foreground truncate">{c.name}</span>
                </button>
                {expanded && group && (
                  <div className="ml-5 pl-2 border-l border-border/50 space-y-0.5 mb-2">
                    {group.fields.map(field => (
                      <div
                        key={field.id}
                        className="flex items-center gap-1.5 p-1.5 rounded text-[10px] text-muted-foreground hover:bg-purple-500/10 hover:text-foreground cursor-default"
                        title={field.description}
                      >
                        <Hash className="w-2.5 h-2.5 flex-shrink-0 text-purple-400" />
                        <span className="truncate">{field.label}</span>
                      </div>
                    ))}
                  </div>
                )}
                {expanded && !group && (
                  <div className="ml-7 p-1.5 text-[9px] text-muted-foreground italic">
                    No field manifest yet
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ CENTRE: Report Page ═══ */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-2 border-b border-border bg-card/30">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-2">Add:</span>
          <button
            onClick={() => addWidget('scorecard')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border bg-card text-[10px] font-semibold hover:bg-purple-500/10 hover:border-purple-500/40 transition-colors"
          >
            <Hash className="w-3 h-3" /> Scorecard
          </button>
          <button
            onClick={() => addWidget('table')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border bg-card text-[10px] font-semibold hover:bg-purple-500/10 hover:border-purple-500/40 transition-colors"
          >
            <Table2 className="w-3 h-3" /> Table
          </button>
          <button
            onClick={() => addWidget('narrative')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border bg-card text-[10px] font-semibold hover:bg-purple-500/10 hover:border-purple-500/40 transition-colors"
          >
            <FileText className="w-3 h-3" /> AI Narrative
          </button>
        </div>

        {/* Report canvas — white page */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-100 dark:bg-zinc-900/50">
          <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-950 rounded-xl shadow-lg border border-border min-h-[500px] p-6">

            {widgets.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Plus className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-semibold text-muted-foreground">Your report is empty</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1 max-w-xs">
                  Click "Add Scorecard", "Add Table", or "Add AI Narrative" in the toolbar above to start building.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {widgets.map(w => (
                <div
                  key={w.id}
                  onClick={() => setSelectedId(w.id)}
                  className={`rounded-xl border-2 p-4 cursor-pointer transition-colors ${
                    selectedId === w.id
                      ? 'border-purple-500 bg-purple-500/5'
                      : 'border-transparent hover:border-border'
                  }`}
                >
                  {/* Widget header */}
                  <div className="flex items-center gap-2 mb-2">
                    {w.type === 'scorecard' && <Hash className="w-4 h-4 text-purple-500" />}
                    {w.type === 'table' && <Table2 className="w-4 h-4 text-blue-500" />}
                    {w.type === 'narrative' && <FileText className="w-4 h-4 text-amber-500" />}
                    <span className="text-xs font-bold text-foreground">{w.title}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeWidget(w.id); }}
                      className="ml-auto p-1 rounded hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Widget content */}
                  {!w.connectorId && (
                    <div className="text-[11px] text-muted-foreground italic p-3 border border-dashed border-border rounded-lg text-center">
                      Select this widget, then choose a data source and fields in the panel on the right →
                    </div>
                  )}

                  {w.connectorId && w.loading && (
                    <div className="text-[11px] text-muted-foreground italic p-3 text-center">
                      Loading data...
                    </div>
                  )}

                  {w.connectorId && !w.loading && w.fields.length === 0 && (
                    <div className="text-[11px] text-muted-foreground italic p-3 border border-dashed border-border rounded-lg text-center">
                      Data source connected. Pick fields in the right panel →
                    </div>
                  )}

                  {/* Scorecard render */}
                  {w.type === 'scorecard' && w.data && w.fields.length > 0 && (
                    <div className="flex gap-6 flex-wrap">
                      {w.fields.map(f => {
                        const raw = w.data?.[f.id];
                        const val = formatSampleValue(raw, f.format);
                        return (
                          <div key={f.id} className="text-center">
                            <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">
                              {val}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
                              {f.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Table render */}
                  {w.type === 'table' && w.data && w.fields.length > 0 && (
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr>
                          {w.fields.map(f => (
                            <th key={f.id} className="text-left py-1.5 px-2 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              {f.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {w.fields.map(f => (
                            <td key={f.id} className="py-1.5 px-2 border-b border-border/50 font-mono text-foreground">
                              {formatSampleValue(w.data?.[f.id], f.format)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  )}

                  {/* Narrative render */}
                  {w.type === 'narrative' && w.data && w.fields.length > 0 && (
                    <div className="text-xs text-muted-foreground italic p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                      AI narrative would be generated here from: {w.fields.map(f => f.label).join(', ')}.
                      <br />Click "Generate" in the right panel to call Gemini.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT: Widget Config ═══ */}
      <div className="w-72 flex-shrink-0 border-l border-border bg-card/50 flex flex-col">
        <div className="p-3 border-b border-border">
          <h2 className="text-[11px] font-bold text-foreground uppercase tracking-wider">
            {selectedWidget ? 'Widget Settings' : 'Select a Widget'}
          </h2>
        </div>

        {!selectedWidget && (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-[11px] text-muted-foreground text-center">
              Add a widget from the toolbar, then click it to configure.
            </p>
          </div>
        )}

        {selectedWidget && (
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Title */}
            <div>
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Title
              </label>
              <input
                type="text"
                value={selectedWidget.title}
                onChange={(e) => updateWidgetTitle(selectedWidget.id, e.target.value)}
                className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-xs"
              />
            </div>

            {/* Data Source picker */}
            <div>
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Data Source
              </label>
              <select
                value={selectedWidget.connectorId ?? ''}
                onChange={(e) => {
                  if (e.target.value) setWidgetConnector(selectedWidget.id, e.target.value);
                }}
                className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-xs"
              >
                <option value="">— Pick a data source —</option>
                {connectors.map(c => {
                  const group = FIELD_MANIFEST.find(g => g.connectorId === c.id);
                  if (!group) return null;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Field picker */}
            {selectedWidget.connectorId && (
              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Fields
                </label>
                {(() => {
                  const group = FIELD_MANIFEST.find(g => g.connectorId === selectedWidget.connectorId);
                  if (!group) return <p className="text-[10px] text-muted-foreground">No fields available</p>;
                  return (
                    <div className="space-y-1">
                      {group.fields.map(field => {
                        const selected = selectedWidget.fields.some(f => f.id === field.id);
                        const val = selectedWidget.data ? formatSampleValue(selectedWidget.data[field.id], field.format) : '—';
                        return (
                          <button
                            key={field.id}
                            onClick={() => toggleField(selectedWidget.id, field)}
                            className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-colors ${
                              selected
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-border bg-card hover:border-purple-500/40'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center text-[8px] flex-shrink-0 ${
                              selected ? 'bg-purple-500 border-purple-500 text-white' : 'border-border'
                            }`}>
                              {selected && '✓'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-semibold text-foreground">{field.label}</div>
                              <div className="text-[9px] text-muted-foreground truncate">{field.description}</div>
                            </div>
                            <div className="text-[10px] font-mono text-purple-400 flex-shrink-0">
                              {val}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
