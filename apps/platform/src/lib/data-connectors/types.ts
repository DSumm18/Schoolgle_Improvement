export type ConnectorLayer = 1 | 2 | 3 | 4;
export type DataController = 'us' | 'school';
export type ConnectorStatus = 'active' | 'setup-needed' | 'planned';
export type SetupType = 'auto' | 'oauth' | 'upload' | 'api' | 'byo' | 'planned';

export type JoinKey =
  | 'urn'
  | 'laestab'
  | 'postcode'
  | 'pupil_hash'
  | 'staff_id'
  | 'date'
  | 'year_group'
  | 'cohort'
  | 'location_code';

export type ColumnType =
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'urn'
  | 'postcode'
  | 'pupil_hash'
  | 'staff_id'
  | 'year_group'
  | 'cohort'
  | 'location_code';

export interface ConnectorColumn {
  name: string;
  type: ColumnType;
  is_join_key?: boolean;
  is_pii?: boolean;
}

export interface ConnectorFieldSchema {
  columns: ConnectorColumn[];
}

export interface ConnectorDataSource {
  type: 'supabase-table' | 'external-api' | 'oauth-fetch' | 'byo-upload';
  reference: string;
}

export interface Connector {
  id: string;
  layer: ConnectorLayer;
  category: string;
  name: string;
  description: string;
  icon: string;
  colour: string;
  dataController: DataController;
  setupType: SetupType;
  status: ConnectorStatus;
  joinKeys: JoinKey[];
  schema?: ConnectorFieldSchema;
  consumers: string[];
  setupGuideUrl?: string;
  dataSource?: ConnectorDataSource;
  rowCount?: number;
  lastSyncAt?: string;
  createdByOrg?: string;
}

export interface ConnectorStatusSummary {
  total: number;
  active: number;
  setupNeeded: number;
  planned: number;
  byLayer: Record<ConnectorLayer, number>;
}
