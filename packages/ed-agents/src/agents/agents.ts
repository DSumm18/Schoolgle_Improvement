/**
 * Agent Registry
 * Central registry of all specialist agents with their prompts and metadata
 */

import type {
  AgentDefinition,
  Domain,
  SpecialistId,
} from '../types';

// Import all specialist prompts
import {
  ESTATES_SPECIALIST_PROMPT,
  ESTATES_SPECIALIST_ID,
  ESTATES_DOMAIN,
  ESTATES_KEYWORDS,
  ESTATES_QUALIFICATIONS,
} from './prompts/estates-specialist';

import {
  HR_SPECIALIST_PROMPT,
  HR_SPECIALIST_ID,
  HR_DOMAIN,
  HR_KEYWORDS,
  HR_QUALIFICATIONS,
} from './prompts/hr-specialist';

import {
  SEND_SPECIALIST_PROMPT,
  SEND_SPECIALIST_ID,
  SEND_DOMAIN,
  SEND_KEYWORDS,
  SEND_QUALIFICATIONS,
} from './prompts/send-specialist';

import {
  DATA_SPECIALIST_PROMPT,
  DATA_SPECIALIST_ID,
  DATA_DOMAIN,
  DATA_KEYWORDS,
  DATA_QUALIFICATIONS,
} from './prompts/data-specialist';

import {
  CURRICULUM_SPECIALIST_PROMPT,
  CURRICULUM_SPECIALIST_ID,
  CURRICULUM_DOMAIN,
  CURRICULUM_KEYWORDS,
  CURRICULUM_QUALIFICATIONS,
} from './prompts/curriculum-specialist';

import {
  IT_TECH_SPECIALIST_PROMPT,
  IT_TECH_SPECIALIST_ID,
  IT_TECH_DOMAIN,
  IT_TECH_KEYWORDS,
  IT_TECH_QUALIFICATIONS,
} from './prompts/it-tech-specialist';

import {
  PROCUREMENT_SPECIALIST_PROMPT,
  PROCUREMENT_SPECIALIST_ID,
  PROCUREMENT_DOMAIN,
  PROCUREMENT_KEYWORDS,
  PROCUREMENT_QUALIFICATIONS,
} from './prompts/procurement-specialist';

import {
  GOVERNANCE_SPECIALIST_PROMPT,
  GOVERNANCE_SPECIALIST_ID,
  GOVERNANCE_DOMAIN,
  GOVERNANCE_KEYWORDS,
  GOVERNANCE_QUALIFICATIONS,
} from './prompts/governance-specialist';

import {
  COMMUNICATIONS_SPECIALIST_PROMPT,
  COMMUNICATIONS_SPECIALIST_ID,
  COMMUNICATIONS_DOMAIN,
  COMMUNICATIONS_KEYWORDS,
  COMMUNICATIONS_QUALIFICATIONS,
} from './prompts/communications-specialist';

/**
 * Ed's base prompt when no specialist is needed
 */
export const ED_GENERAL_PROMPT = `You are Ed, the friendly and helpful AI assistant for Schoolgle.

## Your Role
You help school staff with their day-to-day questions and tasks. You are:
- Warm and supportive
- Practical and actionable
- Clear and concise
- Happy to help with any work-related question

## What You Do
- Answer general questions about school operations
- Route complex questions to the right specialist
- Help users understand how to use Schoolgle
- Provide general guidance and support

## What You Don't Do
- Give specific compliance advice (route to Estates Specialist)
- Give specific HR advice (route to HR Specialist)
- Give specific SEND advice (route to SEND Specialist)
- Answer general chat questions (gently redirect to work tasks)

## Response Style
- Friendly and approachable
- Use plain English
- Keep it brief but complete
- Ask clarifying questions if needed

## If You're Not Sure
- Say so clearly
- Route to the appropriate specialist
- Help the user ask the right question

Current date: ${new Date().toISOString().split('T')[0]}

You're here to help. What work task can you assist with today?`;

/**
 * Registry of all specialist agents
 */
export const AGENTS: Record<SpecialistId, AgentDefinition> = {
  'estates-specialist': {
    id: ESTATES_SPECIALIST_ID,
    name: 'Estates Compliance Specialist',
    domain: ESTATES_DOMAIN,
    qualifications: ESTATES_QUALIFICATIONS,
    capabilities: [
      'RIDDOR reporting',
      'Fire safety guidance',
      'Asbestos management',
      'Legionella and water safety',
      'Electrical safety',
      'Risk assessments',
      'Premises maintenance',
      'Contractor management',
    ],
    systemPrompt: ESTATES_SPECIALIST_PROMPT,
  },

  'hr-specialist': {
    id: HR_SPECIALIST_ID,
    name: 'HR Specialist',
    domain: HR_DOMAIN,
    qualifications: HR_QUALIFICATIONS,
    capabilities: [
      'Sickness and absence management',
      'Maternity and paternity guidance',
      'Employment contracts',
      'HR policies and procedures',
      'Disciplinary and grievance',
      'Performance management',
      'Staff wellbeing',
      'Equality and diversity',
    ],
    systemPrompt: HR_SPECIALIST_PROMPT,
  },

  'send-specialist': {
    id: SEND_SPECIALIST_ID,
    name: 'SEND Specialist',
    domain: SEND_DOMAIN,
    qualifications: SEND_QUALIFICATIONS,
    capabilities: [
      'EHCP guidance',
      'SEN support and graduated approach',
      'Annual reviews',
      'SEND Code of Practice',
      'Specific learning difficulties',
      'Autism guidance',
      'Inclusive practice',
      'SEND funding',
    ],
    systemPrompt: SEND_SPECIALIST_PROMPT,
  },

  'data-specialist': {
    id: DATA_SPECIALIST_ID,
    name: 'Data Specialist',
    domain: DATA_DOMAIN,
    qualifications: DATA_QUALIFICATIONS,
    capabilities: [
      'School census returns',
      'CLLA (Collect) guidance',
      'Attendance data',
      'Performance data',
      'Data protection and GDPR',
      'Pupil registration',
      'Exclusions data',
      'Workforce census',
    ],
    systemPrompt: DATA_SPECIALIST_PROMPT,
  },

  'curriculum-specialist': {
    id: CURRICULUM_SPECIALIST_ID,
    name: 'Curriculum Specialist',
    domain: CURRICULUM_DOMAIN,
    qualifications: CURRICULUM_QUALIFICATIONS,
    capabilities: [
      'Curriculum design',
      'Assessment and feedback',
      'Ofsted preparation',
      'Deep Dives',
      'Quality of Education',
      'Curriculum mapping',
      'Pedagogy guidance',
      'Key stage transitions',
    ],
    systemPrompt: CURRICULUM_SPECIALIST_PROMPT,
  },

  'it-tech-specialist': {
    id: IT_TECH_SPECIALIST_ID,
    name: 'IT Technical Support Specialist',
    domain: IT_TECH_DOMAIN,
    qualifications: IT_TECH_QUALIFICATIONS,
    capabilities: [
      'Hardware troubleshooting',
      'Network and connectivity',
      'Google Workspace admin',
      'Microsoft 365 admin',
      'SIMS/Arbor technical support',
      'Classroom technology',
      'Chromebook management',
      'Cybersecurity awareness',
    ],
    systemPrompt: IT_TECH_SPECIALIST_PROMPT,
  },

  'procurement-specialist': {
    id: PROCUREMENT_SPECIALIST_ID,
    name: 'Procurement Specialist',
    domain: PROCUREMENT_DOMAIN,
    qualifications: PROCUREMENT_QUALIFICATIONS,
    capabilities: [
      'Sourcing suppliers',
      'Framework agreements',
      'Procurement policy compliance',
      'Tendering processes',
      'Value for money assessment',
      'Contract management',
      'Specification writing',
    ],
    systemPrompt: PROCUREMENT_SPECIALIST_PROMPT,
  },

  'governance-specialist': {
    id: GOVERNANCE_SPECIALIST_ID,
    name: 'Governance Specialist',
    domain: GOVERNANCE_DOMAIN,
    qualifications: GOVERNANCE_QUALIFICATIONS,
    capabilities: [
      'Governing body responsibilities',
      'Academy trust governance',
      'Board committees',
      'Governor/trustee recruitment',
      'Ofsted and governance',
      'Finance oversight',
      'Strategic planning',
    ],
    systemPrompt: GOVERNANCE_SPECIALIST_PROMPT,
  },

  'communications-specialist': {
    id: COMMUNICATIONS_SPECIALIST_ID,
    name: 'Communications Specialist',
    domain: COMMUNICATIONS_DOMAIN,
    qualifications: COMMUNICATIONS_QUALIFICATIONS,
    capabilities: [
      'Parent communications',
      'Staff communications',
      'Media relations',
      'Social media management',
      'Crisis communication',
      'Newsletters and bulletins',
      'Press releases',
    ],
    systemPrompt: COMMUNICATIONS_SPECIALIST_PROMPT,
  },

  'ed-general': {
    id: 'ed-general',
    name: 'Ed',
    domain: 'general',
    qualifications: [],
    capabilities: [
      'General school questions',
      'Routing to specialists',
      'Schoolgle platform guidance',
      'General support',
    ],
    systemPrompt: ED_GENERAL_PROMPT,
  },
};

/**
 * Keywords for each domain for intent classification
 */
export const DOMAIN_KEYWORDS: Record<Domain, string[]> = {
  estates: ESTATES_KEYWORDS,
  hr: HR_KEYWORDS,
  send: SEND_KEYWORDS,
  data: DATA_KEYWORDS,
  curriculum: CURRICULUM_KEYWORDS,
  'it-tech': IT_TECH_KEYWORDS,
  procurement: PROCUREMENT_KEYWORDS,
  governance: GOVERNANCE_KEYWORDS,
  communications: COMMUNICATIONS_KEYWORDS,
  general: [],
};

/**
 * Get agent definition by ID
 */
export function getAgent(id: SpecialistId): AgentDefinition | undefined {
  return AGENTS[id];
}

/**
 * Get agent by domain
 */
export function getAgentByDomain(domain: Domain): AgentDefinition {
  const entry = Object.entries(AGENTS).find(
    ([_, agent]) => agent.domain === domain
  );
  return entry?.[1] || AGENTS['ed-general'];
}

/**
 * Get all specialist IDs
 */
export function getSpecialistIds(): SpecialistId[] {
  return Object.keys(AGENTS).filter(id => id !== 'ed-general') as SpecialistId[];
}

/**
 * Get all agent IDs including Ed general
 */
export function getAllAgentIds(): SpecialistId[] {
  return Object.keys(AGENTS) as SpecialistId[];
}
