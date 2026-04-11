import type { Connector } from '../types';

export const LIVE_MIS_CONNECTORS: Connector[] = [
  {
    id: 'live-attendance',
    layer: 2,
    category: 'live-mis',
    name: 'Live Attendance',
    description: 'Current attendance data from school MIS — uploaded CSV or scheduled report.',
    icon: '📊',
    colour: '#10b981',
    dataController: 'school',
    setupType: 'upload',
    status: 'setup-needed',
    joinKeys: ['urn', 'date', 'pupil_hash'],
    consumers: ['ofsted-readiness/attendance-behaviour', 'school-intelligence'],
    dataSource: { type: 'supabase-table', reference: 'attendance_summaries' },
  },
  {
    id: 'live-assessments',
    layer: 2,
    category: 'live-mis',
    name: 'Live Assessments',
    description: 'Current pupil assessment data — pseudonymised at source.',
    icon: '📝',
    colour: '#10b981',
    dataController: 'school',
    setupType: 'upload',
    status: 'setup-needed',
    joinKeys: ['urn', 'pupil_hash', 'year_group'],
    consumers: ['school-intelligence', 'ofsted-readiness/achievement', 'send-hub'],
    dataSource: { type: 'supabase-table', reference: 'pupil_assessments_pseudo' },
  },
];
