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

// src/knowledge-base/index.ts
var knowledge_base_exports = {};
__export(knowledge_base_exports, {
  addKnowledgeEntry: () => addKnowledgeEntry,
  getEntriesDueForReview: () => getEntriesDueForReview,
  getKnowledgeEntry: () => getKnowledgeEntry,
  isKnowledgeStale: () => isKnowledgeStale,
  queryKnowledgeBase: () => queryKnowledgeBase,
  searchByTopic: () => searchByTopic,
  updateKnowledgeEntry: () => updateKnowledgeEntry
});
module.exports = __toCommonJS(knowledge_base_exports);

// src/knowledge-base/query.ts
async function queryKnowledgeBase(question, domain, options = {}) {
  return null;
}
async function getKnowledgeEntry(id) {
  return null;
}
async function searchByTopic(topic, domain, options = {}) {
  return [];
}
async function getEntriesDueForReview(domain) {
  return [];
}
async function addKnowledgeEntry(entry) {
  return {};
}
async function updateKnowledgeEntry(id, updates, incrementVersion = true) {
  return null;
}
function isKnowledgeStale(entry) {
  if (!entry.nextReviewDue) {
    const daysSinceVerified = Date.now() - entry.lastVerified.getTime();
    const daysToReview = entry.confidence === "HIGH" ? 90 : 30;
    return daysSinceVerified > daysToReview * 24 * 60 * 60 * 1e3;
  }
  return entry.nextReviewDue < /* @__PURE__ */ new Date();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addKnowledgeEntry,
  getEntriesDueForReview,
  getKnowledgeEntry,
  isKnowledgeStale,
  queryKnowledgeBase,
  searchByTopic,
  updateKnowledgeEntry
});
//# sourceMappingURL=index.js.map