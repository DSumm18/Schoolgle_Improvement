/**
 * Capability Profiles
 * Lightweight system hints for MIS-specific behaviors
 * Applied at executeActions() time only
 */

import type { CapabilityProfile } from './types';

/**
 * Detect system from URL/hostname
 */
export function detectSystem(url: string): string | null {
  const hostname = new URL(url).hostname.toLowerCase();
  
  if (hostname.includes('arbor') || hostname.includes('arbor-education')) {
    return 'arbor';
  }
  if (hostname.includes('bromcom')) {
    return 'bromcom';
  }
  if (hostname.includes('sims') || hostname.includes('capita')) {
    return 'sims';
  }
  if (hostname.includes('scholarpack')) {
    return 'scholarpack';
  }
  
  return null;
}

/**
 * Get capability profile for a system
 */
export function getCapabilityProfile(system: string | null): CapabilityProfile | null {
  if (!system) return null;
  
  const profiles: Record<string, CapabilityProfile> = {
    arbor: {
      name: 'Arbor',
      postBlurDelay: 300, // Arbor validates on blur with slight delay
      typeaheadPollInterval: 100,
      typeaheadMaxWait: 2500,
      maxRetries: 2,
      waitForValidation: true, // Arbor shows validation messages
      postFillDelay: 150,
    },
    bromcom: {
      name: 'Bromcom',
      postBlurDelay: 250,
      typeaheadPollInterval: 100,
      typeaheadMaxWait: 2500,
      maxRetries: 2,
      waitForValidation: false,
      postFillDelay: 200,
    },
    sims: {
      name: 'SIMS',
      postBlurDelay: 400, // SIMS has slower validation
      typeaheadPollInterval: 150,
      typeaheadMaxWait: 3000,
      maxRetries: 3,
      waitForValidation: true,
      postFillDelay: 250,
    },
    scholarpack: {
      name: 'ScholarPack',
      postBlurDelay: 250,
      typeaheadPollInterval: 100,
      typeaheadMaxWait: 2500,
      maxRetries: 2,
      waitForValidation: false,
      postFillDelay: 150,
    },
  };
  
  return profiles[system] || null;
}

/**
 * Get default profile (fallback)
 */
export function getDefaultProfile(): CapabilityProfile {
  return {
    name: 'Default',
    postBlurDelay: 250,
    typeaheadPollInterval: 100,
    typeaheadMaxWait: 2500,
    maxRetries: 2,
    waitForValidation: false,
    postFillDelay: 200,
  };
}

