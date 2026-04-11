import type { SupabaseClient } from '@supabase/supabase-js';
import type { Connector, ConnectorFieldSchema, JoinKey } from '../types';
import { detectJoinKeys } from './column-mapper';

export interface ByoConnectorRecord {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  source_type: string;
  column_schema: ConnectorFieldSchema;
  join_keys: string[];
  row_count: number;
  last_sync_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ByoRowInsert {
  connector_id: string;
  organization_id: string;
  row_data: Record<string, string>;
  join_values: Record<string, string>;
}

export function extractJoinValues(
  schema: ConnectorFieldSchema,
  row: Record<string, string>,
): Record<string, string> {
  const joinValues: Record<string, string> = {};
  for (const col of schema.columns) {
    if (col.is_join_key) {
      const value = row[col.name];
      if (value !== undefined && value !== null && value !== '') {
        joinValues[col.type] = value;
      }
    }
  }
  return joinValues;
}

export function buildInsertRows(
  rows: Record<string, string>[],
  schema: ConnectorFieldSchema,
  connectorId: string,
  organizationId: string,
): ByoRowInsert[] {
  return rows.map(row => ({
    connector_id: connectorId,
    organization_id: organizationId,
    row_data: row,
    join_values: extractJoinValues(schema, row),
  }));
}

export async function createByoConnector(
  supabase: SupabaseClient,
  params: {
    organizationId: string;
    name: string;
    description?: string;
    sourceType: string;
    schema: ConnectorFieldSchema;
    rows: Record<string, string>[];
    createdBy?: string;
  },
): Promise<{ connector: ByoConnectorRecord; rowsInserted: number }> {
  const joinKeys = detectJoinKeys(params.schema);

  const { data: connector, error: connectorError } = await supabase
    .from('byo_connectors')
    .insert({
      organization_id: params.organizationId,
      name: params.name,
      description: params.description ?? null,
      source_type: params.sourceType,
      column_schema: params.schema,
      join_keys: joinKeys,
      row_count: params.rows.length,
      last_sync_at: new Date().toISOString(),
      created_by: params.createdBy ?? null,
    })
    .select()
    .single();

  if (connectorError || !connector) {
    throw new Error(`Failed to create BYO connector: ${connectorError?.message}`);
  }

  if (params.rows.length > 0) {
    const rowInserts = buildInsertRows(params.rows, params.schema, connector.id, params.organizationId);
    const { error: rowsError } = await supabase
      .from('byo_connector_rows')
      .insert(rowInserts);
    if (rowsError) {
      await supabase.from('byo_connectors').delete().eq('id', connector.id);
      throw new Error(`Failed to insert rows: ${rowsError.message}`);
    }
  }

  return { connector: connector as ByoConnectorRecord, rowsInserted: params.rows.length };
}

export async function getByoConnectors(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<ByoConnectorRecord[]> {
  const { data, error } = await supabase
    .from('byo_connectors')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as ByoConnectorRecord[]) ?? [];
}

export async function getByoConnectorRows(
  supabase: SupabaseClient,
  connectorId: string,
  limit = 100,
  offset = 0,
): Promise<{ rows: Record<string, string>[]; total: number }> {
  const { data, count, error } = await supabase
    .from('byo_connector_rows')
    .select('row_data', { count: 'exact' })
    .eq('connector_id', connectorId)
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return {
    rows: ((data ?? []) as { row_data: Record<string, string> }[]).map(r => r.row_data),
    total: count ?? 0,
  };
}

export async function deleteByoConnector(
  supabase: SupabaseClient,
  connectorId: string,
): Promise<void> {
  const { error } = await supabase.from('byo_connectors').delete().eq('id', connectorId);
  if (error) throw new Error(error.message);
}

export function connectorRecordToConnector(record: ByoConnectorRecord): Connector {
  return {
    id: `byo:${record.id}`,
    layer: 3,
    category: 'byo-csv',
    name: record.name,
    description: record.description ?? 'Bring-your-own connector uploaded by school',
    icon: '📑',
    colour: '#a78bfa',
    dataController: 'school',
    setupType: 'byo',
    status: 'active',
    joinKeys: record.join_keys as JoinKey[],
    schema: record.column_schema,
    consumers: [],
    dataSource: { type: 'byo-upload', reference: record.id },
    rowCount: record.row_count,
    lastSyncAt: record.last_sync_at ?? undefined,
    createdByOrg: record.organization_id,
  };
}
