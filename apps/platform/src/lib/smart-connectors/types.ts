export interface DataSource {
  id: string;
  name: string;
  table: string;
  description: string;
  colour: string;
  logo: string;
  urnColumn: string;
  timeColumn: string;
  rowCount?: number;
  yearRange?: string;
  schoolDataExists?: boolean;
}

export interface SchoolProfile {
  urn: number;
  name: string;
  laCode: string;
  laName: string;
  postcode: string;
  easting: number;
  northing: number;
  typeName: string;
  phaseName: string;
  statusName: string;
  schoolCapacity: number;
  numberOfPupils: number;
  percentageFsm: number;
  trustName: string | null;
  headFirstName: string | null;
  headLastName: string | null;
}

export interface ProximityResult {
  school: SchoolProfile;
  distanceMiles: number;
}

export interface SimilarSchoolMatch {
  school: SchoolProfile;
  matchScore: number;
  matchReasons: string[];
  ks2RwmExpected?: number;
  attendancePct?: number;
  fsmPct?: number;
}

export interface ReconciliationCheck {
  field: string;
  sourceA: { name: string; value: number | string; source: string };
  sourceB: { name: string; value: number | string; source: string };
  status: 'match' | 'discrepancy' | 'missing';
  difference?: number;
  explanation?: string;
}

export interface ReconciliationResult {
  urn: number;
  schoolName: string;
  checks: ReconciliationCheck[];
  overallStatus: 'verified' | 'warnings' | 'errors';
  verifiedCount: number;
  warningCount: number;
  errorCount: number;
  timestamp: string;
}

export interface ComparisonDataset {
  school: { urn: number; name: string; value: number };
  national: { average: number; schoolCount: number };
  la: { average: number; schoolCount: number; laName: string };
  similar: { average: number; schoolCount: number } | null;
  difference: { vsNational: number; vsLa: number; vsSimilar: number | null };
}

export interface SourceAttribution {
  sourceId: string;
  table: string;
  colour: string;
  verified: boolean;
}

export interface InsightData {
  id: string;
  category: 'strength' | 'watch' | 'inspector_flag' | 'positive' | 'data_quality';
  headline: string;
  stat: string;
  detail: string;
  sources: SourceAttribution[];
  verified: boolean;
}

export interface SourceConnectionStatus {
  source: DataSource;
  connected: boolean;
  rowCount: number;
  yearRange: string | null;
  latestTimePeriod: string | null;
}
