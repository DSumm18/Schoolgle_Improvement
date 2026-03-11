import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import type {
  ConditionElement,
  ConditionGrade,
  ElementCategory,
} from "@/lib/condition-survey";

// ── Demo data ──────────────────────────────────────────────────

const DEMO_ELEMENTS: ConditionElement[] = [
  // Main Hall
  {
    id: "cs-001",
    locationId: "loc-main-hall",
    locationName: "Main Hall",
    category: "floors",
    element: "Hardwood parquet flooring",
    grade: "B",
    description:
      "Some lifting at edges near entrance. Resealing needed within 3 years.",
    estimatedCost: 4500,
    priority: "desirable",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2027-01-15",
  },
  {
    id: "cs-002",
    locationId: "loc-main-hall",
    locationName: "Main Hall",
    category: "ceilings",
    element: "Suspended ceiling tiles",
    grade: "A",
    description: "Good condition. Recently replaced (2024).",
    priority: "cosmetic",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2028-01-15",
  },
  {
    id: "cs-003",
    locationId: "loc-main-hall",
    locationName: "Main Hall",
    category: "electrical",
    element: "LED lighting panels",
    grade: "A",
    description: "Replaced in 2024. All functioning correctly.",
    priority: "cosmetic",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2029-01-15",
  },
  // Kitchen
  {
    id: "cs-004",
    locationId: "loc-kitchen",
    locationName: "Kitchen",
    category: "mechanical",
    element: "Commercial extraction system",
    grade: "C",
    description:
      "Ductwork showing significant grease build-up. Fan motor vibrating. Full clean and motor replacement needed.",
    estimatedCost: 8500,
    priority: "essential",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2026-07-15",
  },
  {
    id: "cs-005",
    locationId: "loc-kitchen",
    locationName: "Kitchen",
    category: "floors",
    element: "Non-slip vinyl flooring",
    grade: "C",
    description:
      "Delamination around cooking island and near dishwasher. Trip hazard developing. Full replacement recommended.",
    estimatedCost: 12000,
    priority: "essential",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2026-07-15",
  },
  {
    id: "cs-006",
    locationId: "loc-kitchen",
    locationName: "Kitchen",
    category: "fire_safety",
    element: "Fire suppression system (Ansul)",
    grade: "B",
    description:
      "System operational. Last serviced Oct 2025. Nozzle alignment to be checked.",
    estimatedCost: 1200,
    priority: "essential",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2026-10-15",
  },
  // Plant Room
  {
    id: "cs-007",
    locationId: "loc-plant-room",
    locationName: "Plant Room",
    category: "mechanical",
    element: "Gas boiler (Potterton Commercial 110)",
    grade: "D",
    description:
      "Original 2003 install. Repeated flame failure. CO readings elevated (42ppm at flue). Replacement critical — risk to H&S.",
    estimatedCost: 35000,
    priority: "urgent",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2026-04-15",
  },
  {
    id: "cs-008",
    locationId: "loc-plant-room",
    locationName: "Plant Room",
    category: "mechanical",
    element: "Hot water calorifier",
    grade: "B",
    description: "Minor limescale. Descale recommended within 12 months.",
    estimatedCost: 2500,
    priority: "desirable",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2027-01-15",
  },
  {
    id: "cs-009",
    locationId: "loc-plant-room",
    locationName: "Plant Room",
    category: "electrical",
    element: "Main distribution board",
    grade: "C",
    description:
      "Board dates from 2005. Several MCBs show thermal discolouration. Full EICR recommended.",
    estimatedCost: 18000,
    priority: "essential",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2026-07-15",
  },
  // Classroom Block A
  {
    id: "cs-010",
    locationId: "loc-block-a",
    locationName: "Classroom Block A",
    category: "windows_doors",
    element: "Single-glazed aluminium windows (12 units)",
    grade: "D",
    description:
      "Severe condensation, failed seals, draughts. Frames corroding. Full replacement with double-glazed units required.",
    estimatedCost: 48000,
    priority: "urgent",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2026-04-15",
  },
  {
    id: "cs-011",
    locationId: "loc-block-a",
    locationName: "Classroom Block A",
    category: "internal_finishes",
    element: "Wall plaster and decoration",
    grade: "B",
    description:
      "Some damp patches near windows (linked to window failure). Redecoration planned.",
    estimatedCost: 3500,
    priority: "desirable",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2027-01-15",
  },
  {
    id: "cs-012",
    locationId: "loc-block-a",
    locationName: "Classroom Block A",
    category: "floors",
    element: "Carpet tiles",
    grade: "B",
    description:
      "Worn in doorways and high-traffic areas. Serviceable for 2-3 more years.",
    estimatedCost: 6000,
    priority: "desirable",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2028-01-15",
  },
  // Classroom Block B
  {
    id: "cs-013",
    locationId: "loc-block-b",
    locationName: "Classroom Block B",
    category: "windows_doors",
    element: "Double-glazed uPVC windows (8 units)",
    grade: "A",
    description: "Installed 2022. Excellent condition.",
    priority: "cosmetic",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2029-01-15",
  },
  {
    id: "cs-014",
    locationId: "loc-block-b",
    locationName: "Classroom Block B",
    category: "electrical",
    element: "Lighting and power circuits",
    grade: "A",
    description: "Rewired 2022. EICR satisfactory to 2027.",
    priority: "cosmetic",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2027-06-15",
  },
  {
    id: "cs-015",
    locationId: "loc-block-b",
    locationName: "Classroom Block B",
    category: "structure",
    element: "Load-bearing walls",
    grade: "A",
    description: "Solid construction, no cracking or movement detected.",
    priority: "cosmetic",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2031-01-15",
  },
  // Roof
  {
    id: "cs-016",
    locationId: "loc-roof-main",
    locationName: "Main Building Roof",
    category: "roof",
    element: "Flat roof membrane (Block A)",
    grade: "C",
    description:
      "Multiple patches visible. Ponding in 3 areas. Membrane life-expired. Full overlay or strip-and-recover needed.",
    estimatedCost: 45000,
    priority: "essential",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2026-07-15",
  },
  {
    id: "cs-017",
    locationId: "loc-roof-main",
    locationName: "Main Building Roof",
    category: "roof",
    element: "Pitched roof tiles (Main Hall)",
    grade: "A",
    description:
      "Recently retiled (2023). Good condition, all flashings sound.",
    priority: "cosmetic",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2028-01-15",
  },
  {
    id: "cs-018",
    locationId: "loc-roof-main",
    locationName: "Main Building Roof",
    category: "roof",
    element: "Gutters and downpipes",
    grade: "B",
    description:
      "Cast iron, some corrosion on joints. Functional but will need replacing in 5 years.",
    estimatedCost: 8000,
    priority: "desirable",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2027-01-15",
  },
  // Toilets
  {
    id: "cs-019",
    locationId: "loc-toilets",
    locationName: "Pupil Toilets (Block A)",
    category: "mechanical",
    element: "Sanitary ware and cisterns",
    grade: "C",
    description:
      "3 of 8 cisterns leaking. 2 basins cracked. Refurbishment of entire toilet block recommended.",
    estimatedCost: 22000,
    priority: "essential",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2026-07-15",
  },
  {
    id: "cs-020",
    locationId: "loc-toilets",
    locationName: "Pupil Toilets (Block A)",
    category: "internal_finishes",
    element: "Wall tiles and partitions",
    grade: "C",
    description:
      "Grout failing, several tiles cracked. IPS panels damaged. Full refurb needed with sanitary ware.",
    estimatedCost: 8000,
    priority: "essential",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2026-07-15",
  },
  // External
  {
    id: "cs-021",
    locationId: "loc-external",
    locationName: "External Areas",
    category: "external_areas",
    element: "Playground tarmac surface",
    grade: "C",
    description:
      "Large cracking and pot-holes near Year 3 entrance. Trip hazard. Resurfacing needed.",
    estimatedCost: 25000,
    priority: "essential",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2026-07-15",
  },
  {
    id: "cs-022",
    locationId: "loc-external",
    locationName: "External Areas",
    category: "external_walls",
    element: "Boundary fencing (chain-link)",
    grade: "B",
    description:
      "Sagging in 2 sections along east boundary. Posts sound. Retensioning needed.",
    estimatedCost: 3000,
    priority: "desirable",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2027-01-15",
  },
  {
    id: "cs-023",
    locationId: "loc-external",
    locationName: "External Areas",
    category: "external_areas",
    element: "Car park surface and markings",
    grade: "B",
    description:
      "Surface adequate. Line markings faded. Refresh markings recommended.",
    estimatedCost: 1500,
    priority: "cosmetic",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2027-06-15",
  },
  // Reception / Office
  {
    id: "cs-024",
    locationId: "loc-reception",
    locationName: "Reception / Office",
    category: "fire_safety",
    element: "Fire alarm panel and detectors",
    grade: "A",
    description:
      "Replaced 2024. L2 system with addressable detectors. Fully compliant.",
    priority: "cosmetic",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2027-01-15",
  },
  {
    id: "cs-025",
    locationId: "loc-reception",
    locationName: "Reception / Office",
    category: "accessibility",
    element: "Main entrance ramp and door",
    grade: "A",
    description:
      "DDA-compliant ramp (1:12 gradient). Automatic door opener fitted. Good condition.",
    priority: "cosmetic",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2028-01-15",
  },
  {
    id: "cs-026",
    locationId: "loc-reception",
    locationName: "Reception / Office",
    category: "internal_finishes",
    element: "Carpet and decoration",
    grade: "A",
    description: "Refurbished 2025. Professional appearance maintained.",
    priority: "cosmetic",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2028-01-15",
  },
  // SEND Resource Room
  {
    id: "cs-027",
    locationId: "loc-send-room",
    locationName: "SEND Resource Room",
    category: "accessibility",
    element: "Accessible toilet and changing area",
    grade: "B",
    description:
      "Functional but grab rails showing wear. Hoist serviced and operational.",
    estimatedCost: 2000,
    priority: "desirable",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2027-01-15",
  },
  {
    id: "cs-028",
    locationId: "loc-send-room",
    locationName: "SEND Resource Room",
    category: "internal_finishes",
    element: "Acoustic treatment panels",
    grade: "A",
    description: "Installed 2024 for sensory needs. Excellent condition.",
    priority: "cosmetic",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2029-01-15",
  },
  // Nursery
  {
    id: "cs-029",
    locationId: "loc-nursery",
    locationName: "Nursery / EYFS",
    category: "external_areas",
    element: "Outdoor play surface (rubber crumb)",
    grade: "D",
    description:
      "Surface worn through to concrete in 2 areas. Critical fall height not met. Immediate closure or repair required.",
    estimatedCost: 15000,
    priority: "urgent",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2026-04-15",
  },
  {
    id: "cs-030",
    locationId: "loc-nursery",
    locationName: "Nursery / EYFS",
    category: "structure",
    element: "Timber frame canopy",
    grade: "B",
    description: "Some weathering. Preservative treatment due this summer.",
    estimatedCost: 1800,
    priority: "desirable",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2027-01-15",
  },
  {
    id: "cs-031",
    locationId: "loc-nursery",
    locationName: "Nursery / EYFS",
    category: "windows_doors",
    element: "External doors and finger guards",
    grade: "A",
    description: "Replaced 2025 with slow-close anti-finger-trap doors.",
    priority: "cosmetic",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2028-01-15",
  },
  // Staff Room
  {
    id: "cs-032",
    locationId: "loc-staff-room",
    locationName: "Staff Room",
    category: "electrical",
    element: "Socket outlets and wiring",
    grade: "B",
    description:
      "Overloaded sockets observed. Additional double sockets recommended.",
    estimatedCost: 800,
    priority: "desirable",
    surveyedBy: "J. Mitchell (Surveyor)",
    surveyedAt: "2026-01-15",
    nextSurveyDue: "2027-01-15",
  },
];

// ── GET handler ────────────────────────────────────────────────

export const GET = protectedRoute(async () => {
  return apiSuccess({
    elements: DEMO_ELEMENTS,
    meta: {
      surveyDate: "2026-01-15",
      surveyedBy: "J. Mitchell (Surveyor)",
      schoolName: "Aurora Primary School",
      nextFullSurvey: "2027-01-15",
    },
  });
});

// ── POST handler ───────────────────────────────────────────────

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();

  const {
    locationId,
    locationName,
    category,
    element,
    grade,
    description,
    estimatedCost,
    priority,
    surveyedBy,
  } = body;

  // Basic validation
  if (
    !locationId ||
    !category ||
    !element ||
    !grade ||
    !description ||
    !priority
  ) {
    return apiError(
      "Missing required fields: locationId, category, element, grade, description, priority",
      400,
    );
  }

  const validGrades: ConditionGrade[] = ["A", "B", "C", "D"];
  if (!validGrades.includes(grade)) {
    return apiError("Invalid grade. Must be A, B, C, or D.", 400);
  }

  const validCategories: ElementCategory[] = [
    "structure",
    "roof",
    "external_walls",
    "windows_doors",
    "internal_finishes",
    "floors",
    "ceilings",
    "mechanical",
    "electrical",
    "fire_safety",
    "accessibility",
    "external_areas",
  ];
  if (!validCategories.includes(category)) {
    return apiError(
      `Invalid category. Must be one of: ${validCategories.join(", ")}`,
      400,
    );
  }

  const newElement: ConditionElement = {
    id: `cs-${Date.now()}`,
    locationId,
    locationName: locationName || locationId,
    category,
    element,
    grade,
    description,
    estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
    priority,
    surveyedBy: surveyedBy || "Unknown",
    surveyedAt: new Date().toISOString().split("T")[0],
  };

  // In production this would persist to Supabase. For now, return the created element.
  return apiSuccess({ element: newElement, success: true }, 201);
});
