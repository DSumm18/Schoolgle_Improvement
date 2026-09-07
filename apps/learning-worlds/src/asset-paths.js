// Vite replaces these at build time. Node-only state tests retain local defaults.
export const ASSET_BASE = import.meta.env?.BASE_URL || '/';
export const HOSTED_PLAYTEST = import.meta.env?.VITE_HOSTED_PLAYTEST === 'true';
