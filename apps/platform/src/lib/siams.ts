// SIAMS Framework exports
export {
  SIAMS_FRAMEWORK,
  SIAMS_RATINGS,
  SIAMS_EVIDENCE_KEYWORDS,
  calculateStrandReadiness,
  calculateOverallSiamsReadiness,
} from "./siams-framework";

export type {
  SiamsInspectionQuestion,
  SiamsStrand,
  SiamsActionItem,
} from "./siams-framework";

// Re-export ALL types and constants from siams/types.ts for API routes
export type {
  SiamsAssessment,
  SiamsAssessmentForm,
  SiamsEvidenceItem,
  SiamsEvidenceMatch,
  SiamsReadinessSnapshot,
  SiamsGapDetail,
  SiamsAssessmentWithQuestion,
  SiamsStrandSummary,
  SiamsGapsAnalysis,
  SiamsOverallReadiness,
  GetSiamsAssessmentsRequest,
  GetSiamsAssessmentsResponse,
  UpsertSiamsAssessmentRequest,
  UpsertSiamsAssessmentResponse,
  GetSiamsEvidenceRequest,
  GetSiamsEvidenceResponse,
  GetSiamsReadinessRequest,
  GetSiamsReadinessResponse,
  MatchSiamsDocumentRequest,
  MatchSiamsDocumentResponse,
  SchoolChurchStatus,
  SchoolChurchStatusForm,
  ChurchDenomination,
  SiamsQuestionId,
  SiamsRatingWithNotAssessed,
  ConfidenceLevel,
  SchoolChurchStatusRequest,
  SchoolChurchStatusResponse,
  DfeSchoolLookupRequest,
  DfeSchoolLookupResponse,
  DfeSchoolData,
} from "./siams/types";

export { SIAMS_STRANDS, SIAMS_QUESTIONS } from "./siams/types";

// Re-export types with common names (legacy, for backward compatibility)
export type SiamsStrandId =
  | "vision"
  | "wisdom"
  | "character"
  | "community"
  | "dignity"
  | "worship"
  | "re";
export type SiamsRating =
  | "excellent"
  | "good"
  | "requires_improvement"
  | "ineffective"
  | "not_assessed";

export interface SiamsQuestion {
  id: string;
  question: string;
  guidance: string;
  evidenceRequired: string[];
  strand_id: SiamsStrandId;
}

// Strand metadata for UI display
export const STRAND_INFO: Record<
  SiamsStrandId,
  { name: string; description: string; color: string; icon: string }
> = {
  vision: {
    name: "Vision",
    description: "How well is the Christian vision established?",
    color: "blue",
    icon: "👁️",
  },
  wisdom: {
    name: "Wisdom",
    description: "How wise is the curriculum?",
    color: "purple",
    icon: "🦉",
  },
  character: {
    name: "Character Development",
    description: "How well is character developed?",
    color: "emerald",
    icon: "💪",
  },
  community: {
    name: "Community",
    description: "How strong is the community?",
    color: "amber",
    icon: "🤝",
  },
  dignity: {
    name: "Dignity & Respect",
    description: "How is dignity upheld?",
    color: "rose",
    icon: "❤️",
  },
  worship: {
    name: "Worship",
    description: "How central is worship?",
    color: "violet",
    icon: "🙏",
  },
  re: {
    name: "Religious Education",
    description: "How effective is RE?",
    color: "teal",
    icon: "📖",
  },
};

// Define STRAND_QUESTIONS directly as a record
// This avoids any runtime issues with module resolution
export const STRAND_QUESTIONS: Record<SiamsStrandId, SiamsQuestion[]> = {
  vision: [
    {
      id: "vision-1",
      question:
        "How clearly is the school's Christian vision articulated and understood by all?",
      guidance:
        "The vision should be theologically rooted, distinctive, and clearly expressed.",
      evidenceRequired: ["Vision statement", "School website"],
      strand_id: "vision",
    },
    {
      id: "vision-2",
      question:
        "How effectively does the vision shape the strategic direction of the school?",
      guidance:
        "School improvement plans should explicitly link to the Christian vision.",
      evidenceRequired: ["School Development Plan", "Strategic priorities"],
      strand_id: "vision",
    },
    {
      id: "vision-3",
      question:
        "How well do leaders at all levels model and promote the vision?",
      guidance:
        "Leaders should be able to articulate how their decisions connect to the vision.",
      evidenceRequired: ["Leadership interviews", "Decision-making processes"],
      strand_id: "vision",
    },
    {
      id: "vision-4",
      question:
        "How effectively does governance support and challenge the school's Christian foundation?",
      guidance:
        "Foundation governors should understand their distinctive role.",
      evidenceRequired: [
        "Governor meeting minutes",
        "Governor training records",
      ],
      strand_id: "vision",
    },
  ],
  wisdom: [
    {
      id: "wisdom-1",
      question:
        "How does the curriculum reflect the school's Christian vision?",
      guidance:
        "Curriculum design should explicitly connect to Christian values.",
      evidenceRequired: ["Curriculum overview", "Subject policies"],
      strand_id: "wisdom",
    },
    {
      id: "wisdom-2",
      question:
        "How well does the curriculum enable pupils to develop spiritually?",
      guidance:
        "Spiritual development should be planned across the curriculum.",
      evidenceRequired: ["SMSC mapping", "Lesson observations"],
      strand_id: "wisdom",
    },
    {
      id: "wisdom-3",
      question:
        "How effectively does the curriculum prepare pupils for life in modern Britain?",
      guidance: "British Values and respect for diversity should be embedded.",
      evidenceRequired: ["British Values mapping", "PSHE curriculum"],
      strand_id: "wisdom",
    },
    {
      id: "wisdom-4",
      question:
        "How well do all pupils achieve academically, especially the vulnerable?",
      guidance:
        "Outcomes for all groups should demonstrate that all are enabled to flourish.",
      evidenceRequired: ["Attainment data", "Progress data"],
      strand_id: "wisdom",
    },
  ],
  character: [
    {
      id: "character-1",
      question: "How well does the school develop pupils' character?",
      guidance:
        "Character education should be explicit and linked to Christian values.",
      evidenceRequired: ["Character education programme", "Behaviour policy"],
      strand_id: "character",
    },
    {
      id: "character-2",
      question:
        "How effectively does the school instil hope and aspiration in all pupils?",
      guidance: "Pupils should believe they can achieve and make a difference.",
      evidenceRequired: ["Pupil voice", "Destination data"],
      strand_id: "character",
    },
    {
      id: "character-3",
      question:
        "How well do pupils engage in social action and courageous advocacy?",
      guidance:
        "Pupils should be active in making a difference locally and globally.",
      evidenceRequired: ["Charity work", "Community projects"],
      strand_id: "character",
    },
    {
      id: "character-4",
      question:
        "How well do pupils understand ethical concepts and make ethical choices?",
      guidance: "Pupils should be able to discuss ethical dilemmas.",
      evidenceRequired: ["RE lessons", "PSHE", "Pupil discussions"],
      strand_id: "character",
    },
  ],
  community: [
    {
      id: "community-1",
      question:
        "How well do relationships across the school community reflect the Christian vision?",
      guidance:
        "Relationships should be characterised by forgiveness and respect.",
      evidenceRequired: ["Behaviour policy", "Restorative approaches"],
      strand_id: "community",
    },
    {
      id: "community-2",
      question:
        "How effectively does the school support mental health and wellbeing?",
      guidance:
        "Wellbeing should be prioritised for all members of the school community.",
      evidenceRequired: ["Wellbeing policy", "Support systems"],
      strand_id: "community",
    },
    {
      id: "community-3",
      question:
        "How strong are partnerships with parents, church, and community?",
      guidance:
        "Church school partnership should be active and mutually beneficial.",
      evidenceRequired: ["Church links", "Parent engagement"],
      strand_id: "community",
    },
    {
      id: "community-4",
      question: "How inclusive is the school community?",
      guidance:
        "All should feel welcomed, valued, and able to participate fully.",
      evidenceRequired: ["Inclusion policy", "SEND provision"],
      strand_id: "community",
    },
  ],
  dignity: [
    {
      id: "dignity-1",
      question: "How well does the school ensure all are treated with dignity?",
      guidance: "Every person should be valued as made in the image of God.",
      evidenceRequired: ["Equality policy", "Anti-bullying policy"],
      strand_id: "dignity",
    },
    {
      id: "dignity-2",
      question:
        "How effectively does the school tackle prejudice and discrimination?",
      guidance:
        "There should be clear processes and zero tolerance for discrimination.",
      evidenceRequired: ["Discrimination incidents", "Response procedures"],
      strand_id: "dignity",
    },
    {
      id: "dignity-3",
      question:
        "How well do pupils understand and respect difference and diversity?",
      guidance:
        "Pupils should celebrate diversity as reflecting God's creation.",
      evidenceRequired: ["Curriculum coverage", "Pupil voice"],
      strand_id: "dignity",
    },
    {
      id: "dignity-4",
      question:
        "How well are protected characteristics respected and understood?",
      guidance: "Age-appropriate teaching about all protected characteristics.",
      evidenceRequired: ["RSE curriculum", "PSHE coverage"],
      strand_id: "dignity",
    },
  ],
  worship: [
    {
      id: "worship-1",
      question: "How central is collective worship to the life of the school?",
      guidance: "Worship should be the heartbeat of the school community.",
      evidenceRequired: ["Worship timetable", "Worship policy"],
      strand_id: "worship",
    },
    {
      id: "worship-2",
      question:
        "How well does worship reflect the school's Christian vision and Anglican/Methodist tradition?",
      guidance:
        "Worship should be distinctively Christian and reflect denominational tradition.",
      evidenceRequired: ["Worship themes", "Use of liturgy"],
      strand_id: "worship",
    },
    {
      id: "worship-3",
      question: "How inclusive and invitational is collective worship?",
      guidance:
        "All should be able to participate while respecting individual beliefs.",
      evidenceRequired: ["Withdrawal procedures", "Inclusive language"],
      strand_id: "worship",
    },
    {
      id: "worship-4",
      question: "How well do pupils engage with and respond to worship?",
      guidance: "Pupils should be actively engaged, not passive observers.",
      evidenceRequired: ["Pupil-led worship", "Prayer spaces"],
      strand_id: "worship",
    },
    {
      id: "worship-5",
      question:
        "How effectively does worship contribute to spiritual development?",
      guidance:
        "Worship should provide opportunities for stillness and reflection.",
      evidenceRequired: ["Reflection opportunities", "Impact evidence"],
      strand_id: "worship",
    },
  ],
  re: [
    {
      id: "re-1",
      question:
        "How well does RE reflect the Church of England Statement of Entitlement?",
      guidance:
        "RE should be academically rigorous and have significant Christian content.",
      evidenceRequired: ["RE policy", "Curriculum overview"],
      strand_id: "re",
    },
    {
      id: "re-2",
      question: "How high quality is RE teaching?",
      guidance: "RE should be taught by confident, well-trained staff.",
      evidenceRequired: ["Lesson observations", "Pupil work"],
      strand_id: "re",
    },
    {
      id: "re-3",
      question: "How well do pupils achieve in RE?",
      guidance: "Outcomes in RE should be at least in line with core subjects.",
      evidenceRequired: ["RE assessment data", "Progress tracking"],
      strand_id: "re",
    },
    {
      id: "re-4",
      question: "How well does RE prepare pupils to live in diverse society?",
      guidance: "Pupils should learn about Christianity and other worldviews.",
      evidenceRequired: ["Curriculum coverage", "World religion content"],
      strand_id: "re",
    },
    {
      id: "re-5",
      question:
        "How effectively does RE enable pupils to engage with big questions?",
      guidance: "RE should provoke curiosity and enable theological thinking.",
      evidenceRequired: ["Discussion evidence", "Written work"],
      strand_id: "re",
    },
  ],
};
