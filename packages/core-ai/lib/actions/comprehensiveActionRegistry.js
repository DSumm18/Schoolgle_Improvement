"use strict";
// Comprehensive Action Registry for Schoolgle Platform
// This combines the simple action registry with the full ED skills registry
Object.defineProperty(exports, "__esModule", { value: true });
exports.comprehensiveActionRegistry = void 0;
exports.getActionByName = getActionByName;
exports.getActionsByCategory = getActionsByCategory;
exports.getAllActionNames = getAllActionNames;
const bookAppointment_1 = require("./bookAppointment");
const sendEmail_1 = require("./sendEmail");
const translateMessage_1 = require("./translateMessage");
// Basic actions from the simple registry
const basicActions = {
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
        handler: bookAppointment_1.bookAppointment,
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
        handler: sendEmail_1.sendEmail,
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
        handler: translateMessage_1.translateMessage,
        category: 'communication'
    }
};
// Placeholder for ED's comprehensive skills
// These would be imported from the actual ED skills registry
const edSkills = {
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
exports.comprehensiveActionRegistry = {
    ...basicActions,
    ...edSkills
};
// Helper functions
function getActionByName(name) {
    return exports.comprehensiveActionRegistry[name];
}
function getActionsByCategory(category) {
    return Object.values(exports.comprehensiveActionRegistry).filter(action => action.category === category);
}
function getAllActionNames() {
    return Object.keys(exports.comprehensiveActionRegistry);
}
