/**
 * Skills Module Index
 *
 * Exports all skill definitions, schemas, and handlers for the AI assistant.
 */

// Function schemas for AI calling
export * from './school-skills-registry';

// Implementation handlers
export * from './skill-handlers';

// Re-exports for convenience
export {
    // Staff functions
    createStaffMember,
    updateStaffMember,
    listStaff,
    deactivateStaffMember,
    // Action functions
    createAction,
    updateAction,
    listActions,
    getActionStats,
    // EEF helper
    suggestEEFStrategy,
    // Estates Evolution functions
    extractEstatesDocument,
    analyzeSpatialImpact,
    createHelpdeskTicket,
    updateHelpdeskTicket,
} from './skill-handlers';

// Type exports
export type {
    CreateStaffParams,
    UpdateStaffParams,
    ListStaffParams,
    CreateActionParams,
    UpdateActionParams,
    ListActionsParams,
    ExtractEstatesDocumentParams,
    AnalyzeSpatialImpactParams,
    CreateHelpdeskTicketParams,
    UpdateHelpdeskTicketParams,
} from './skill-handlers';

// Category helpers
export {
    STAFF_FUNCTIONS,
    ACTIONS_FUNCTIONS,
    getSkillForFunction,
} from './school-skills-registry';

// All available functions
export { getAllSchoolFunctionNames, getFunctionSchema } from './school-skills-registry';
