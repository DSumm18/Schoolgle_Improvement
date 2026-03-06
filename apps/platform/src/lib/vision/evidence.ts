/**
 * Vision AI -- Evidence Integrity
 *
 * Tamper-proof evidence chain for litigation defence.
 * SHA-256 hashing, GPS capture, device fingerprinting.
 */

import type { EvidenceRecord } from "./types";

/**
 * Compute SHA-256 hash of media data for tamper detection.
 * Works in both Node.js (API routes) and browser (client-side).
 */
export async function computeMediaHash(mediaBase64: string): Promise<string> {
  const data = new TextEncoder().encode(mediaBase64);

  if (typeof globalThis.crypto?.subtle !== "undefined") {
    // Web Crypto API (browser + modern Node.js)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Fallback: Node.js crypto
  const { createHash } = await import("crypto");
  return createHash("sha256").update(mediaBase64).digest("hex");
}

/**
 * Build an evidence record from capture metadata.
 */
export function buildEvidenceRecord(
  mediaBase64: string,
  mediaHash: string,
  metadata: {
    deviceGps?: { lat: number; lng: number };
    deviceId?: string;
    capturedAt: string;
  },
): EvidenceRecord {
  return {
    mediaHash,
    deviceGps: metadata.deviceGps,
    deviceId: metadata.deviceId,
    captureTimestamp: metadata.capturedAt,
    serverReceivedAt: new Date().toISOString(),
    locked: false,
  };
}

/**
 * Verify that stored media hasn't been tampered with.
 */
export async function verifyMediaIntegrity(
  mediaBase64: string,
  expectedHash: string,
): Promise<boolean> {
  const actualHash = await computeMediaHash(mediaBase64);
  return actualHash === expectedHash;
}
