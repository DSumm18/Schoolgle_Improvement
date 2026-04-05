/**
 * Lesson Studio — Connector System
 *
 * Import this module to register all built-in connectors and
 * access the registry.
 */

// Registry (also registers the "manual" connector)
export {
  registerConnector,
  getConnector,
  listConnectors,
} from "./connector-registry";

// Types
export type {
  LessonInput,
  LessonActivity,
  LessonResource,
  LessonConnector,
  ConnectorFetchOptions,
  ConnectorSearchResult,
} from "./connector-registry";

// Oak connector (registers on import)
export { oakConnector, searchLessons, fetchLesson } from "./oak-connector";

// PDF scheme connector (registers on import)
export { pdfSchemeConnector, parsePdfScheme } from "./pdf-scheme-connector";
