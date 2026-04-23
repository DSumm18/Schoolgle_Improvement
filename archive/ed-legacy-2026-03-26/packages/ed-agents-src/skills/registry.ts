import { CommunicationChannel } from '../communication/types';

export interface SkillDefinition {
    id: string;
    name: string;
    description: string;
    category: 'Estates' | 'Safety' | 'HR' | 'Leadership' | 'Public Ed';
    defaultChannel: CommunicationChannel;
    isAutomated: boolean;
}

export const BATCH_1_SKILLS: SkillDefinition[] = [
    {
        id: 'estates_contractor_chase',
        name: 'Contractor Auto-Chase',
        description: 'Automatically follow up with contractors on stale tickets (>48h).',
        category: 'Estates',
        defaultChannel: 'sms',
        isAutomated: true,
    },
    {
        id: 'estates_dbs_expiry',
        name: 'DBS Expiry Alert',
        description: 'Alert admins when a contractor''s DBS or accreditation is about to expire.',
        category: 'Estates',
        defaultChannel: 'email',
        isAutomated: true,
    },
    {
        id: 'estates_compliance_reminder',
        name: 'Compliance Check Reminder',
        description: 'Proactive reminders for upcoming statutory compliance checks.',
        category: 'Estates',
        defaultChannel: 'email',
        isAutomated: true,
    },
    {
        id: 'estates_maintenance_reminder',
        name: 'Maintenance Reminder',
        description: 'Proactive reminders for scheduled maintenance tasks.',
        category: 'Estates',
        defaultChannel: 'email',
        isAutomated: true,
    }
];

export const BATCH_2_SKILLS: SkillDefinition[] = [
    {
        id: 'hr_staff_absence',
        name: 'Staff Absence Report',
        description: 'Process inbound absence reports from staff via SMS.',
        category: 'HR',
        defaultChannel: 'sms',
        isAutomated: false,
    },
    {
        id: 'hr_arrival_verify',
        name: 'Arrival Verification',
        description: 'Verify staff arrival on site via SMS.',
        category: 'HR',
        defaultChannel: 'sms',
        isAutomated: false,
    },
    {
        id: 'safety_gate_access',
        name: 'Gate Access Control',
        description: 'Remotely control school gates via Ed.',
        category: 'Safety',
        defaultChannel: 'sms',
        isAutomated: false,
    }
];

export const BATCH_3_SKILLS: SkillDefinition[] = [
    {
        id: 'safety_emergency_lockdown',
        name: 'Emergency Lockdown',
        description: 'Trigger a school-wide lockdown alert via Voice and SMS. REQUIRES APPROVAL.',
        category: 'Safety',
        defaultChannel: 'voice',
        isAutomated: false,
    },
    {
        id: 'safety_critical_incident',
        name: 'Critical Incident Report',
        description: 'Report and log a critical incident (medical, fire, intruder) for leadership audit.',
        category: 'Safety',
        defaultChannel: 'email',
        isAutomated: false,
    }
];

export const ALL_SKILLS = [...BATCH_1_SKILLS, ...BATCH_2_SKILLS, ...BATCH_3_SKILLS];
