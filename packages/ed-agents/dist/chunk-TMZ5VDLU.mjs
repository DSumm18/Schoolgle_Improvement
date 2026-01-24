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

export {
  queryKnowledgeBase,
  getKnowledgeEntry,
  searchByTopic,
  getEntriesDueForReview,
  addKnowledgeEntry,
  updateKnowledgeEntry,
  isKnowledgeStale
};
//# sourceMappingURL=chunk-TMZ5VDLU.mjs.map