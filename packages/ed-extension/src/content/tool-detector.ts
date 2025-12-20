// School Tool Detection
// Identifies which school software the user is currently viewing

import type { ToolMatch, ToolCategory } from '@/shared/types';

/**
 * Tool fingerprint for detection
 */
interface ToolFingerprint {
  id: string;
  name: string;
  category: ToolCategory;
  urlPatterns: RegExp[];
  domSelectors?: string[];
  titlePatterns?: RegExp[];
}

/**
 * Known school tools and their fingerprints
 */
const TOOL_FINGERPRINTS: ToolFingerprint[] = [
  // MIS Systems
  {
    id: 'sims',
    name: 'SIMS',
    category: 'MIS',
    urlPatterns: [/sims\.co\.uk/i, /capita-sims/i, /ess-sims/i],
    titlePatterns: [/sims/i],
  },
  {
    id: 'arbor',
    name: 'Arbor',
    category: 'MIS',
    urlPatterns: [/arbor-education\.com/i, /arbor\.sc/i],
    titlePatterns: [/arbor/i],
  },
  {
    id: 'bromcom',
    name: 'Bromcom',
    category: 'MIS',
    urlPatterns: [/bromcom\.com/i, /bromcom\.cloud/i],
    titlePatterns: [/bromcom/i],
  },
  {
    id: 'scholarpack',
    name: 'ScholarPack',
    category: 'MIS',
    urlPatterns: [/scholarpack\.com/i],
    titlePatterns: [/scholarpack/i],
  },
  
  // Finance
  {
    id: 'every-budget',
    name: 'Every Budget Builder',
    category: 'Finance',
    urlPatterns: [/every\.education/i, /everybudget/i],
    titlePatterns: [/every.*budget/i],
  },
  {
    id: 'ps-financials',
    name: 'PS Financials',
    category: 'Finance',
    urlPatterns: [/psfinancials\.com/i, /ps-financials/i],
    titlePatterns: [/ps.*financials/i],
  },
  {
    id: 'access-finance',
    name: 'Access Finance',
    category: 'Finance',
    urlPatterns: [/theaccessgroup\.com.*finance/i],
    titlePatterns: [/access.*finance/i],
  },
  
  // Safeguarding
  {
    id: 'cpoms',
    name: 'CPOMS',
    category: 'Safeguarding',
    urlPatterns: [/cpoms\.co\.uk/i],
    titlePatterns: [/cpoms/i],
  },
  {
    id: 'myconcern',
    name: 'MyConcern',
    category: 'Safeguarding',
    urlPatterns: [/myconcern\.education/i, /myconcern\.co\.uk/i],
    titlePatterns: [/myconcern/i],
  },
  {
    id: 'safeguard-my-school',
    name: 'Safeguard My School',
    category: 'Safeguarding',
    urlPatterns: [/safeguardmyschool\.com/i],
    titlePatterns: [/safeguard.*my.*school/i],
  },
  
  // HR
  {
    id: 'the-key-hr',
    name: 'The Key HR',
    category: 'HR',
    urlPatterns: [/thekeysupport\.com/i, /schoolleaders\.thekeysupport/i],
    titlePatterns: [/the key/i],
  },
  {
    id: 'every-hr',
    name: 'Every HR',
    category: 'HR',
    urlPatterns: [/every\.education.*hr/i],
    titlePatterns: [/every.*hr/i],
  },
  {
    id: 'access-people-hr',
    name: 'Access People HR',
    category: 'HR',
    urlPatterns: [/theaccessgroup\.com.*people/i],
    titlePatterns: [/access.*people/i],
  },
  
  // Parent Communication
  {
    id: 'parentpay',
    name: 'ParentPay',
    category: 'Parents',
    urlPatterns: [/parentpay\.com/i],
    titlePatterns: [/parentpay/i],
  },
  {
    id: 'parentmail',
    name: 'ParentMail',
    category: 'Parents',
    urlPatterns: [/parentmail\.co\.uk/i],
    titlePatterns: [/parentmail/i],
  },
  {
    id: 'schoolcomms',
    name: 'SchoolComms',
    category: 'Parents',
    urlPatterns: [/schoolcomms\.com/i],
    titlePatterns: [/schoolcomms/i],
  },
  {
    id: 'weduc',
    name: 'Weduc',
    category: 'Parents',
    urlPatterns: [/weduc\.co\.uk/i],
    titlePatterns: [/weduc/i],
  },
  
  // Teaching & Learning
  {
    id: 'google-classroom',
    name: 'Google Classroom',
    category: 'Teaching',
    urlPatterns: [/classroom\.google\.com/i],
    titlePatterns: [/google classroom/i],
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    category: 'Teaching',
    urlPatterns: [/docs\.google\.com/i, /drive\.google\.com/i, /sheets\.google\.com/i],
    titlePatterns: [/google docs/i, /google sheets/i, /google drive/i],
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    category: 'Teaching',
    urlPatterns: [/teams\.microsoft\.com/i],
    titlePatterns: [/microsoft teams/i],
  },
  {
    id: 'canva',
    name: 'Canva',
    category: 'Teaching',
    urlPatterns: [/canva\.com/i],
    titlePatterns: [/canva/i],
  },
  {
    id: 'twinkl',
    name: 'Twinkl',
    category: 'Teaching',
    urlPatterns: [/twinkl\.co\.uk/i, /twinkl\.com/i],
    titlePatterns: [/twinkl/i],
  },
  
  // Data & Analytics
  {
    id: 'asp',
    name: 'Analyse School Performance',
    category: 'Data',
    urlPatterns: [/analyse-school-performance/i, /asp\.education\.gov\.uk/i],
    titlePatterns: [/analyse school performance/i],
  },
  {
    id: 'fft',
    name: 'FFT Education',
    category: 'Data',
    urlPatterns: [/fft\.org\.uk/i, /fftaspire/i],
    titlePatterns: [/fft/i],
  },
  {
    id: 'sisra',
    name: 'SISRA Analytics',
    category: 'Data',
    urlPatterns: [/sisra\.com/i],
    titlePatterns: [/sisra/i],
  },
  
  // Admin & Compliance
  {
    id: 'schoolbus',
    name: 'SchoolBus',
    category: 'Admin',
    urlPatterns: [/schoolbus\.co\.uk/i],
    titlePatterns: [/schoolbus/i],
  },
  {
    id: 'smartsurvey',
    name: 'SmartSurvey',
    category: 'Admin',
    urlPatterns: [/smartsurvey\.co\.uk/i],
    titlePatterns: [/smartsurvey/i],
  },
  {
    id: 'hse-risk',
    name: 'HSE Risk Assessment',
    category: 'Admin',
    urlPatterns: [/hse\.gov\.uk/i],
    titlePatterns: [/risk assessment/i, /health and safety/i],
  },
  
  // SEND
  {
    id: 'provision-map',
    name: 'Provision Map',
    category: 'Admin',
    urlPatterns: [/provisionmap\.co\.uk/i],
    titlePatterns: [/provision map/i],
  },
  {
    id: 'edukey',
    name: 'Edukey',
    category: 'Admin',
    urlPatterns: [/edukey\.co\.uk/i],
    titlePatterns: [/edukey/i],
  },
];

/**
 * Detect which tool is currently being viewed
 */
export function detectTool(location: Location, doc: Document): ToolMatch | null {
  const url = location.href;
  const title = doc.title;
  
  for (const fingerprint of TOOL_FINGERPRINTS) {
    // Check URL patterns (highest confidence)
    for (const pattern of fingerprint.urlPatterns) {
      if (pattern.test(url)) {
        return {
          id: fingerprint.id,
          name: fingerprint.name,
          category: fingerprint.category,
          confidence: 0.95,
          matchedOn: 'url',
        };
      }
    }
    
    // Check title patterns (medium confidence)
    if (fingerprint.titlePatterns) {
      for (const pattern of fingerprint.titlePatterns) {
        if (pattern.test(title)) {
          return {
            id: fingerprint.id,
            name: fingerprint.name,
            category: fingerprint.category,
            confidence: 0.7,
            matchedOn: 'title',
          };
        }
      }
    }
    
    // Check DOM selectors (medium confidence)
    if (fingerprint.domSelectors) {
      for (const selector of fingerprint.domSelectors) {
        if (doc.querySelector(selector)) {
          return {
            id: fingerprint.id,
            name: fingerprint.name,
            category: fingerprint.category,
            confidence: 0.8,
            matchedOn: 'dom',
          };
        }
      }
    }
  }
  
  return null;
}

/**
 * Get all registered tools
 */
export function getAllTools(): ToolFingerprint[] {
  return TOOL_FINGERPRINTS;
}

/**
 * Get tool by ID
 */
export function getToolById(id: string): ToolFingerprint | undefined {
  return TOOL_FINGERPRINTS.find(t => t.id === id);
}

