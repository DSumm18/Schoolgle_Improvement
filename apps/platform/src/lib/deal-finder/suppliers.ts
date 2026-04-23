// Directory of 50+ UK Suppliers for the Deal Finder seed.
// Categorized by their best ingestion routes.

export interface SupplierDefinition {
  name: string;
  domain: string;
  category: "giant" | "psbo" | "specialist" | "it" | "sports" | "facilities" | "books";
  is_education_supplier: boolean;
  is_preferred: boolean;
  ingestion_type: "api" | "scrape";
  api_provider?: "awin" | "amazon" | "custom";
}

export const DEAL_FINDER_SUPPLIERS: SupplierDefinition[] = [
  // THE GLOBAL GIANTS & GENERAL RETAIL
  { name: "Amazon Business UK", domain: "amazon.co.uk", category: "giant", is_education_supplier: false, is_preferred: false, ingestion_type: "api", api_provider: "amazon" },
  { name: "Staples Advantage UK", domain: "staplesadvantage.co.uk", category: "giant", is_education_supplier: false, is_preferred: false, ingestion_type: "scrape" },
  { name: "Staples UK", domain: "staples.co.uk", category: "giant", is_education_supplier: false, is_preferred: false, ingestion_type: "scrape" },
  { name: "Viking Direct", domain: "viking-direct.co.uk", category: "giant", is_education_supplier: false, is_preferred: false, ingestion_type: "api", api_provider: "awin" },
  { name: "Ryman Business", domain: "ryman.co.uk", category: "giant", is_education_supplier: false, is_preferred: false, ingestion_type: "scrape" },
  { name: "WHSmith", domain: "whsmith.co.uk", category: "giant", is_education_supplier: false, is_preferred: false, ingestion_type: "scrape" },
  { name: "Costco UK", domain: "costco.co.uk", category: "giant", is_education_supplier: false, is_preferred: false, ingestion_type: "scrape" },
  { name: "Lyreco UK", domain: "lyreco.com", category: "giant", is_education_supplier: false, is_preferred: false, ingestion_type: "scrape" },
  { name: "Banner UK", domain: "banneruk.com", category: "giant", is_education_supplier: true, is_preferred: true, ingestion_type: "scrape" },

  // MAJOR PUBLIC SECTOR BUYING ORGANISATIONS (PSBOs)
  { name: "YPO", domain: "ypo.co.uk", category: "psbo", is_education_supplier: true, is_preferred: true, ingestion_type: "scrape" },
  { name: "ESPO", domain: "espo.org", category: "psbo", is_education_supplier: true, is_preferred: true, ingestion_type: "scrape" },
  { name: "KCS Education", domain: "kcs.co.uk", category: "psbo", is_education_supplier: true, is_preferred: true, ingestion_type: "scrape" },
  { name: "CPC", domain: "thecpc.ac.uk", category: "psbo", is_education_supplier: true, is_preferred: true, ingestion_type: "scrape" },
  { name: "Crown Commercial Service", domain: "crowncommercial.gov.uk", category: "psbo", is_education_supplier: true, is_preferred: false, ingestion_type: "scrape" },

  // EDUCATIONAL RESOURCE SPECIALISTS
  { name: "TTS Group", domain: "tts-group.co.uk", category: "specialist", is_education_supplier: true, is_preferred: true, ingestion_type: "scrape" },
  { name: "Hope Education", domain: "hope-education.co.uk", category: "specialist", is_education_supplier: true, is_preferred: true, ingestion_type: "scrape" },
  { name: "Consortium Education", domain: "consortiumeducation.com", category: "specialist", is_education_supplier: true, is_preferred: true, ingestion_type: "scrape" },
  { name: "GLS Educational Supplies", domain: "glsed.co.uk", category: "specialist", is_education_supplier: true, is_preferred: true, ingestion_type: "scrape" },
  { name: "Findel Education", domain: "findel-education.co.uk", category: "specialist", is_education_supplier: true, is_preferred: true, ingestion_type: "scrape" },
  { name: "Edusentials", domain: "edusentials.co.uk", category: "specialist", is_education_supplier: true, is_preferred: false, ingestion_type: "scrape" },
  { name: "Morleys", domain: "morleys.co.uk", category: "specialist", is_education_supplier: true, is_preferred: false, ingestion_type: "scrape" },
  { name: "Spaceist", domain: "spaceist.co.uk", category: "specialist", is_education_supplier: true, is_preferred: false, ingestion_type: "scrape" },
  { name: "Spaceright Europe", domain: "spacerighteurope.com", category: "specialist", is_education_supplier: true, is_preferred: false, ingestion_type: "scrape" },
  { name: "Edu-quip", domain: "edu-quip.co.uk", category: "specialist", is_education_supplier: true, is_preferred: false, ingestion_type: "scrape" },

  // IT, ELECTRONICS & HARDWARE
  { name: "RM Education", domain: "rm.com", category: "it", is_education_supplier: true, is_preferred: true, ingestion_type: "scrape" },
  { name: "Stone Group", domain: "stonegroup.co.uk", category: "it", is_education_supplier: true, is_preferred: true, ingestion_type: "scrape" },
  { name: "Currys PC World Business", domain: "currys.co.uk", category: "it", is_education_supplier: false, is_preferred: false, ingestion_type: "api", api_provider: "awin" },
  { name: "Argos", domain: "argos.co.uk", category: "it", is_education_supplier: false, is_preferred: false, ingestion_type: "scrape" },
  { name: "Overclockers UK", domain: "overclockers.co.uk", category: "it", is_education_supplier: false, is_preferred: false, ingestion_type: "scrape" },
  { name: "Scan", domain: "scan.co.uk", category: "it", is_education_supplier: false, is_preferred: false, ingestion_type: "scrape" },
  { name: "Ebuyer", domain: "ebuyer.com", category: "it", is_education_supplier: false, is_preferred: false, ingestion_type: "scrape" },
  { name: "Misco", domain: "misco.co.uk", category: "it", is_education_supplier: false, is_preferred: false, ingestion_type: "scrape" },
  { name: "Insight UK", domain: "insight.com", category: "it", is_education_supplier: false, is_preferred: false, ingestion_type: "scrape" },
  { name: "Softcat", domain: "softcat.com", category: "it", is_education_supplier: false, is_preferred: false, ingestion_type: "scrape" },
  { name: "CCL Computers", domain: "cclonline.com", category: "it", is_education_supplier: false, is_preferred: false, ingestion_type: "scrape" },

  // PE, SPORTS & PLAYGROUND
  { name: "Davies Sports", domain: "daviessports.co.uk", category: "sports", is_education_supplier: true, is_preferred: true, ingestion_type: "scrape" },
  { name: "Net World Sports", domain: "networldsports.co.uk", category: "sports", is_education_supplier: true, is_preferred: false, ingestion_type: "scrape" },
  { name: "Newitts", domain: "newitts.com", category: "sports", is_education_supplier: true, is_preferred: false, ingestion_type: "scrape" },
  { name: "Continental Sports", domain: "continentalsports.co.uk", category: "sports", is_education_supplier: true, is_preferred: true, ingestion_type: "scrape" },
  { name: "Universal Services", domain: "universalservicesuk.co.uk", category: "sports", is_education_supplier: true, is_preferred: false, ingestion_type: "scrape" },
  { name: "Sportsafe", domain: "sportsafeuk.com", category: "sports", is_education_supplier: true, is_preferred: false, ingestion_type: "scrape" },
  { name: "Maudesport", domain: "maudesport.co.uk", category: "sports", is_education_supplier: true, is_preferred: false, ingestion_type: "scrape" },

  // JANITORIAL, FACILITIES & STEM
  { name: "Cromwell", domain: "cromwell.co.uk", category: "facilities", is_education_supplier: false, is_preferred: false, ingestion_type: "scrape" },
  { name: "Screwfix", domain: "screwfix.com", category: "facilities", is_education_supplier: false, is_preferred: false, ingestion_type: "scrape" },
  { name: "Toolstation", domain: "toolstation.com", category: "facilities", is_education_supplier: false, is_preferred: false, ingestion_type: "scrape" },
  { name: "Nisbets", domain: "nisbets.co.uk", category: "facilities", is_education_supplier: false, is_preferred: false, ingestion_type: "scrape" },
  { name: "Bunzl CSS", domain: "bunzlchs.com", category: "facilities", is_education_supplier: false, is_preferred: false, ingestion_type: "scrape" },
  { name: "Timstar", domain: "timstar.co.uk", category: "facilities", is_education_supplier: true, is_preferred: true, ingestion_type: "scrape" },
  { name: "Philip Harris", domain: "philipharris.co.uk", category: "facilities", is_education_supplier: true, is_preferred: true, ingestion_type: "scrape" },
  { name: "Breckland Scientific", domain: "brecklandscientific.co.uk", category: "facilities", is_education_supplier: true, is_preferred: false, ingestion_type: "scrape" },
  { name: "Dryad Education", domain: "dryadeducation.co.uk", category: "facilities", is_education_supplier: true, is_preferred: true, ingestion_type: "scrape" },
  { name: "Baker Ross", domain: "bakerross.co.uk", category: "facilities", is_education_supplier: true, is_preferred: false, ingestion_type: "scrape" },

  // BOOKS, LIBRARY & PUBLISHING
  { name: "Peters", domain: "peters.co.uk", category: "books", is_education_supplier: true, is_preferred: true, ingestion_type: "scrape" },
  { name: "Browns Books", domain: "brownsbfs.co.uk", category: "books", is_education_supplier: true, is_preferred: true, ingestion_type: "scrape" },
  { name: "Heath Educational Books", domain: "heathbooks.co.uk", category: "books", is_education_supplier: true, is_preferred: true, ingestion_type: "scrape" },
  { name: "CGP Books", domain: "cgpbooks.co.uk", category: "books", is_education_supplier: true, is_preferred: true, ingestion_type: "scrape" },
  { name: "Scholastic UK", domain: "shop.scholastic.co.uk", category: "books", is_education_supplier: true, is_preferred: false, ingestion_type: "scrape" },
  { name: "Waterstones Educational", domain: "waterstones.com", category: "books", is_education_supplier: false, is_preferred: false, ingestion_type: "api", api_provider: "awin" },
];
