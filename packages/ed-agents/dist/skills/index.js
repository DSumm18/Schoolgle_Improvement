"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/skills/index.ts
var skills_exports = {};
__export(skills_exports, {
  SKILLS: () => SKILLS
});
module.exports = __toCommonJS(skills_exports);
var SKILLS = {
  WRITE_SOP: "write-sop",
  WRITE_EMAIL: "write-email",
  WRITE_LETTER: "write-letter",
  CREATE_CHECKLIST: "create-checklist",
  GAP_ANALYSIS: "gap-analysis",
  RISK_ASSESSMENT: "risk-assessment",
  SIMPLIFY_EXPLANATION: "simplify-explanation",
  ESCALATION_MESSAGE: "escalation-message",
  PROCESS_MAP: "process-map"
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SKILLS
});
//# sourceMappingURL=index.js.map