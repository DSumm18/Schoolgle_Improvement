import type { Connector } from '@/lib/data-connectors/types';

export interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  requiredConnectorIds: string[];
  optionalConnectorIds: string[];
  status: 'ready' | 'coming-soon';
  outputFormat: 'document' | 'dashboard' | 'chart' | 'map';
}

export const TEMPLATES: ReportTemplate[] = [
  {
    id: 'attendance-story',
    title: 'Attendance Story for Governors',
    description: 'Plain-English narrative with trends, context, and suggested actions. Real data via real LLM call.',
    requiredConnectorIds: ['dfe-attendance'],
    optionalConnectorIds: ['dfe-census', 'contextual-factors', 'live-attendance'],
    status: 'ready',
    outputFormat: 'document',
  },
  {
    id: 'sef-section',
    title: 'SEF Section Draft',
    description: 'Draft an Ofsted SEF section from connected evidence and data.',
    requiredConnectorIds: ['google-drive', 'dfe-ks2-results'],
    optionalConnectorIds: ['dfe-census', 'contextual-factors'],
    status: 'coming-soon',
    outputFormat: 'document',
  },
  {
    id: 'finance-governor-report',
    title: 'Finance Governor Report',
    description: 'Monthly finance summary from a BYO finance sheet.',
    requiredConnectorIds: ['byo-finance'],
    optionalConnectorIds: [],
    status: 'coming-soon',
    outputFormat: 'document',
  },
  {
    id: 'ofsted-answer',
    title: 'Ofsted Question Answer',
    description: 'Answer any question an Ofsted inspector might ask.',
    requiredConnectorIds: ['google-drive'],
    optionalConnectorIds: ['dfe-attendance', 'dfe-ks2-results'],
    status: 'coming-soon',
    outputFormat: 'document',
  },
];

export function getTemplate(id: string): ReportTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function canRunTemplate(
  template: ReportTemplate,
  placedConnectorIds: string[],
): { ok: boolean; missing: string[] } {
  const missing = template.requiredConnectorIds.filter((id) => !placedConnectorIds.includes(id));
  return { ok: missing.length === 0, missing };
}

export function findConnectorsForTemplate(
  template: ReportTemplate,
  allConnectors: Connector[],
): Connector[] {
  const wanted = [...template.requiredConnectorIds, ...template.optionalConnectorIds];
  return allConnectors.filter((c) => wanted.includes(c.id));
}
