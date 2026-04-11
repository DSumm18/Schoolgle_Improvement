"use client";

import { useState, useEffect } from 'react';
import { DndContext, type DragEndEvent, pointerWithin } from '@dnd-kit/core';
import { ConnectorShelf } from './ConnectorShelf';
import { CanvasBoard } from './CanvasBoard';
import { SettingsPanel } from './SettingsPanel';
import { ResultPanel } from './ResultPanel';
import { useCanvasState } from './hooks/useCanvasState';
import { TEMPLATES, getTemplate, canRunTemplate } from './lib/templates';
import type { Connector } from '@/lib/data-connectors/types';
import { supabase } from '@/lib/supabase';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

const GROVE_HOUSE_URN = 148201;

interface GenerationResult {
  documentId: string;
  title: string;
  narrative: string;
  sourceConnectors: string[];
  missingConnectors: { id: string; name: string; reason: string }[];
  llmModel: string;
  llmTokensUsed: number;
  guardianCategoriesDetected: string[];
}

export function Canvas() {
  const [allConnectors, setAllConnectors] = useState<Connector[]>([]);
  const [loadingConnectors, setLoadingConnectors] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState('attendance-story');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvas = useCanvasState();
  const template = getTemplate(selectedTemplateId) ?? TEMPLATES[0];
  const { ok: canGenerate, missing } = canRunTemplate(template, canvas.placedConnectorIds);

  // Load connectors from registry
  useEffect(() => {
    async function load() {
      const headers = await getAuthHeaders();
      try {
        const res = await fetch('/api/connectors/registry', { headers });
        if (res.ok) {
          const data = await res.json();
          setAllConnectors(data.data?.connectors ?? []);
        }
      } finally {
        setLoadingConnectors(false);
      }
    }
    load();
  }, []);

  // Pre-populate canvas with required connectors for the default template
  useEffect(() => {
    if (allConnectors.length === 0 || canvas.nodes.length > 0) return;
    const template = getTemplate(selectedTemplateId);
    if (!template) return;
    const required = template.requiredConnectorIds
      .map((id) => allConnectors.find((c) => c.id === id))
      .filter((c): c is Connector => c !== undefined);
    required.forEach((c) => canvas.addConnector(c));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allConnectors]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || over.id !== 'canvas-board') return;
    const connector = active.data.current?.connector as Connector | undefined;
    if (!connector) return;
    canvas.addConnector(connector);
  }

  async function handleGenerate() {
    if (!canGenerate || template.id !== 'attendance-story') return;
    setGenerating(true);
    setError(null);
    setResult(null);

    const headers = await getAuthHeaders();
    try {
      const res = await fetch('/api/documents/attendance-story', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ urn: GROVE_HOUSE_URN }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data.data);
        setResultOpen(true);
      } else {
        const body = await res.json();
        setError(body.error ?? 'Generation failed');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setGenerating(false);
    }
  }

  if (loadingConnectors) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)] text-sm text-muted-foreground">
        Loading connectors from registry...
      </div>
    );
  }

  return (
    <DndContext collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
      <div className="flex h-[calc(100vh-120px)] rounded-2xl border border-border overflow-hidden bg-card">
        {/* Left: connector shelf */}
        <div className="w-64 flex-shrink-0">
          <ConnectorShelf connectors={allConnectors} placedIds={canvas.placedConnectorIds} />
        </div>

        {/* Centre: canvas */}
        <div className="flex-1 flex flex-col">
          <CanvasBoard
            nodes={canvas.nodes}
            edges={canvas.edges}
            template={template}
            canGenerate={canGenerate}
            missing={missing}
            generating={generating}
            onRemoveNode={canvas.removeNode}
            onMoveNode={canvas.moveNode}
            onGenerate={handleGenerate}
          />
          {error && (
            <div className="border-t border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400">
              Error: {error}
            </div>
          )}
        </div>

        {/* Right: settings */}
        <div className="w-72 flex-shrink-0">
          <SettingsPanel
            selectedTemplateId={selectedTemplateId}
            onTemplateChange={setSelectedTemplateId}
            placedCount={canvas.nodes.length}
          />
        </div>
      </div>

      <ResultPanel open={resultOpen} onClose={() => setResultOpen(false)} result={result} />
    </DndContext>
  );
}
