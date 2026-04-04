/**
 * Known education suppliers for UK schools.
 * Seeded from the DealFind database.
 */
export interface Supplier {
  id: string;
  name: string;
  website: string;
  verified: boolean;
  dfe_approved?: boolean;
}

export const SUPPLIERS: Supplier[] = [
  {
    id: "findel",
    name: "Findel Education",
    website: "findel-education.co.uk",
    verified: true,
    dfe_approved: true,
  },
  {
    id: "tts",
    name: "TTS Group",
    website: "tts-group.co.uk",
    verified: true,
    dfe_approved: true,
  },
  {
    id: "consortium",
    name: "The Consortium",
    website: "theconsortium.com",
    verified: true,
  },
  {
    id: "viking",
    name: "Viking Direct",
    website: "viking-direct.co.uk",
    verified: true,
  },
  {
    id: "staples",
    name: "Staples",
    website: "staples.co.uk",
    verified: true,
  },
  {
    id: "ryman",
    name: "Ryman",
    website: "ryman.co.uk",
    verified: true,
  },
  {
    id: "computacenter",
    name: "Computacenter",
    website: "computacenter.com",
    verified: true,
  },
  {
    id: "xma",
    name: "XMA",
    website: "xma.co.uk",
    verified: true,
  },
  {
    id: "espo",
    name: "ESPO",
    website: "espo.org",
    verified: true,
    dfe_approved: true,
  },
  {
    id: "ypo",
    name: "YPO",
    website: "ypo.co.uk",
    verified: true,
    dfe_approved: true,
  },
  {
    id: "amazon",
    name: "Amazon",
    website: "amazon.co.uk",
    verified: true,
  },
  {
    id: "cultpens",
    name: "Cult Pens",
    website: "cultpens.com",
    verified: true,
  },
  {
    id: "gompels",
    name: "Gompels",
    website: "gompels.co.uk",
    verified: true,
  },
];
