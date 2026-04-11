import type { DataSource } from './types';

export const DATA_SOURCES: DataSource[] = [
  {
    id: 'ks2-results',
    name: 'KS2 Results',
    table: 'ks2_results',
    description: 'Key Stage 2 attainment, progress measures, and scaled scores',
    colour: '#ef4444',
    logo: '/logos/connectors/dfe.png',
    urnColumn: 'urn',
    timeColumn: 'time_period',
  },
  {
    id: 'attendance',
    name: 'Attendance',
    table: 'attendance',
    description: 'Overall, authorised, and unauthorised absence rates with persistent absence',
    colour: '#8b5cf6',
    logo: '/logos/connectors/dfe.png',
    urnColumn: 'urn',
    timeColumn: 'time_period',
  },
  {
    id: 'workforce',
    name: 'Workforce',
    table: 'workforce',
    description: 'FTE teachers, TAs, support staff, vacancies, and pay data',
    colour: '#f59e0b',
    logo: '/logos/connectors/dfe.png',
    urnColumn: 'urn',
    timeColumn: 'time_period',
  },
  {
    id: 'exclusions',
    name: 'Exclusions',
    table: 'exclusions',
    description: 'Suspensions and permanent exclusions by term and reason',
    colour: '#06b6d4',
    logo: '/logos/connectors/dfe.png',
    urnColumn: 'urn',
    timeColumn: 'time_period',
  },
  {
    id: 'ks4-results',
    name: 'KS4 Results',
    table: 'ks4_results',
    description: 'Attainment 8, Progress 8, EBacc, and basics measures',
    colour: '#3b82f6',
    logo: '/logos/connectors/dfe.png',
    urnColumn: 'urn',
    timeColumn: 'time_period',
  },
  {
    id: 'census',
    name: 'Census',
    table: 'census',
    description: 'Pupil demographics — roll, FSM, EAL, SEN, ethnicity, mobility',
    colour: '#10b981',
    logo: '/logos/connectors/dfe.png',
    urnColumn: 'urn',
    timeColumn: 'time_period',
  },
];

export function getSourceByTable(table: string): DataSource | undefined {
  return DATA_SOURCES.find(s => s.table === table);
}

export function getSourceById(id: string): DataSource | undefined {
  return DATA_SOURCES.find(s => s.id === id);
}
