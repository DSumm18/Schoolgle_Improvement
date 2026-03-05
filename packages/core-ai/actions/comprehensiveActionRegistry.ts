// Comprehensive Action Registry for Schoolgle Platform
// This combines the simple action registry with the full ED skills registry

import { bookAppointment, type AppointmentDetails } from './bookAppointment';
import { sendEmail, type EmailDetails } from './sendEmail';
import { translateMessage, type TranslationDetails } from './translateMessage';

// Import ED's comprehensive skills (these would need to be moved to core package)
// For now, we'll create a placeholder structure

export interface ActionHandler {
  (params: any): Promise<any>;
}

export interface ActionDefinition {
  name: string;
  description: string;
  parameters: any;
  handler: ActionHandler;
  category: 'communication' | 'scheduling' | 'finance' | 'compliance' | 'general';
}

// Basic actions from the simple registry
const basicActions: Record<string, ActionDefinition> = {
  bookAppointment: {
    name: 'bookAppointment',
    description: 'Book an appointment or meeting',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Appointment title' },
        date: { type: 'string', description: 'Appointment date' },
        time: { type: 'string', description: 'Appointment time' },
        duration: { type: 'number', description: 'Duration in minutes' },
        attendees: { type: 'array', items: { type: 'string' } }
      },
      required: ['title', 'date', 'time']
    },
    handler: bookAppointment,
    category: 'scheduling'
  },
  sendEmail: {
    name: 'sendEmail',
    description: 'Send an email message',
    parameters: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email' },
        subject: { type: 'string', description: 'Email subject' },
        body: { type: 'string', description: 'Email body' },
        attachments: { type: 'array', items: { type: 'string' } }
      },
      required: ['to', 'subject', 'body']
    },
    handler: sendEmail,
    category: 'communication'
  },
  translateMessage: {
    name: 'translateMessage',
    description: 'Translate text to another language',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to translate' },
        targetLanguage: { type: 'string', description: 'Target language code' },
        sourceLanguage: { type: 'string', description: 'Source language code (optional)' }
      },
      required: ['text', 'targetLanguage']
    },
    handler: translateMessage,
    category: 'communication'
  }
};

// Placeholder for ED's comprehensive skills
// These would be imported from the actual ED skills registry
const edSkills: Record<string, ActionDefinition> = {
  // Finance skills
  analyzeBudget: {
    name: 'analyze_budget',
    description: 'Analyze budget files and generate variance reports with AI insights',
    parameters: {
      type: 'object',
      properties: {
        budget_data: { type: 'string', description: 'Budget data in CSV format or file path' },
        analysis_type: { type: 'string', enum: ['variance', 'trend', 'forecast', 'scenario'] },
        academic_year: { type: 'string', description: 'Academic year for the budget' },
        focus_areas: { type: 'array', items: { type: 'string' } }
      },
      required: ['budget_data', 'analysis_type']
    },
    handler: async (params) => {
      // Placeholder - would call actual ED finance handler
      return { message: 'Budget analysis completed', data: params };
    },
    category: 'finance'
  },
  checkPayroll: {
    name: 'check_payroll',
    description: 'Validate payroll data against budget and detect anomalies',
    parameters: {
      type: 'object',
      properties: {
        payroll_data: { type: 'string', description: 'Payroll data in CSV format' },
        budget_reference: { type: 'string', description: 'Budget data to compare against' },
        validation_rules: { type: 'array', items: { type: 'string' } }
      },
      required: ['payroll_data', 'budget_reference']
    },
    handler: async (params) => {
      // Placeholder - would call actual ED finance handler
      return { message: 'Payroll validation completed', data: params };
    },
    category: 'finance'
  },
  // Compliance skills
  checkCompliance: {
    name: 'check_compliance',
    description: 'Check school compliance against DFE standards and regulations',
    parameters: {
      type: 'object',
      properties: {
        compliance_area: { type: 'string', enum: ['safeguarding', 'curriculum', 'finance', 'premises'] },
        school_data: { type: 'string', description: 'School data to check' },
        standards_version: { type: 'string', description: 'Standards version to check against' }
      },
      required: ['compliance_area', 'school_data']
    },
    handler: async (params) => {
      // Placeholder - would call actual ED compliance handler
      return { message: 'Compliance check completed', data: params };
    },
    category: 'compliance'
  }
};

// Combined registry
export const comprehensiveActionRegistry = {
  ...basicActions,
  ...edSkills
};

// Helper functions
export function getActionByName(name: string): ActionDefinition | undefined {
  return comprehensiveActionRegistry[name];
}

export function getActionsByCategory(category: string): ActionDefinition[] {
  return Object.values(comprehensiveActionRegistry).filter(action => action.category === category);
}

export function getAllActionNames(): string[] {
  return Object.keys(comprehensiveActionRegistry);
}

// Export types
export type { AppointmentDetails, EmailDetails, TranslationDetails };
