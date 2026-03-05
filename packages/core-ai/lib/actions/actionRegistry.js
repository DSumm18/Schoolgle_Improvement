"use strict";
// /packages/core-ai/actions/actionRegistry.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllActionNames = exports.getActionsByCategory = exports.getActionByName = exports.comprehensiveActionRegistry = exports.actionRegistry = void 0;
const bookAppointment_1 = require("./bookAppointment");
const sendEmail_1 = require("./sendEmail");
const translateMessage_1 = require("./translateMessage");
const comprehensiveActionRegistry_1 = require("./comprehensiveActionRegistry");
Object.defineProperty(exports, "comprehensiveActionRegistry", { enumerable: true, get: function () { return comprehensiveActionRegistry_1.comprehensiveActionRegistry; } });
Object.defineProperty(exports, "getActionByName", { enumerable: true, get: function () { return comprehensiveActionRegistry_1.getActionByName; } });
Object.defineProperty(exports, "getActionsByCategory", { enumerable: true, get: function () { return comprehensiveActionRegistry_1.getActionsByCategory; } });
Object.defineProperty(exports, "getAllActionNames", { enumerable: true, get: function () { return comprehensiveActionRegistry_1.getAllActionNames; } });
/**
 * A central registry of all available "skills" or "actions" that an agent can perform.
 * This pattern makes the system modular and extensible. To add a new action,
 * simply create the action file and register it here.
 */
// Simple registry for basic actions
exports.actionRegistry = {
    bookAppointment: bookAppointment_1.bookAppointment,
    sendEmail: sendEmail_1.sendEmail,
    translateMessage: translateMessage_1.translateMessage,
};
