// types.ts - SIAMS Dashboard Types (matching Estates structure)

/**
 * Represents a question within a SIAMS strand.
 */
export interface SIAMSQuestion {
  id: string;
  strandId: string;
  text: string;
  guidance: string;
  order: number;
}

/**
 * Represents a SIAMS inspection strand.
 */
export interface SIAMSStrand {
  id: string;
  number: number;
  title: string;
  description: string;
  order: number;
  questions: SIAMSQuestion[];
}

/**
 * Represents a single assessment or activity within a SIAMS category.
 */
export interface Assessment {
  name: string;
  score: number;
  evidence?: string; // Column D: Written justification
  evidenceFiles?: string; // Column E: Link to Google Drive folder
  aiAssessment?: string; // Column F: AI-generated assessment
}

/**
 * Represents a SIAMS category (strand) containing multiple assessments.
 */
export interface SiamsCategory {
  categoryName: string;
  average: number;
  assessments: Assessment[];
}

/**
 * Represents all the SIAMS performance data for a single school.
 */
export interface SchoolData {
  id: string; // Using school name as the unique ID
  name: string;
  overallScore: number;
  categories: SiamsCategory[];
  logoUrl: string | null;
}