/**
 * Seasonal Spending Profiles for UK Schools
 *
 * Schools don't spend 1/12th of their budget each month. Spending is driven by
 * term dates, weather, academic calendar, and grant timing. This module provides
 * monthly weighting ratios per CFR category so budget monitoring can compare
 * actual vs a realistic profile rather than flat-line.
 *
 * Month numbering: 1=January, 12=December (calendar months).
 * Financial year months are converted using the budget cycle (LA=April start, Academy=September start).
 *
 * Sources:
 * - DfE CFR Framework 2025-26 expenditure definitions & technical specification
 * - DfE FBIT (Financial Benchmarking and Insights Tool) — launched Autumn 2024, relative RAG ratings
 * - DfE ICFP guidance, workbook benchmarks, and Staff Deployment Analysis manual
 * - DfE SRM Self-Assessment Checklist 2025-26 (top-10 planning checks)
 * - DfE School Workforce Census 2024 (PTR 20.8 primary, 16.7 secondary)
 * - DfE Teacher Sickness Absence 2023/24 (65.7% took absence, avg 8.3 days)
 * - DfE/YouGov Supply Teacher Usage Research Report 2024 (£682M national spend)
 * - ISBL ICFP Threshold Data (staffing cost targets, contact ratios)
 * - Vesma UK Standard Heating Degree Days (base 15.5°C, total 2,463/year)
 * - CIBSE TM46 energy benchmarks for schools
 * - STRB 2025 pay award (4%), NI 15% from April 2025
 * - TPS employer rate 28.68% (inc 0.08% admin levy), LGPS 18-22%
 * - Energy Sparks school energy efficiency report 2023/24
 * - NEU: Support Staff Term-Time Working (TTO pay annualised over 12 months)
 * - AQA/Pearson exam fee schedules 2025-26 (GCSE ~£48-50/subject)
 * - STA: SATs are free for state-funded primary schools
 * - ESFA: Academy GAG paid in 12 equal monthly instalments
 * - Standard English LA term dates 2025-26 (190 pupil days)
 */

// =====================================================
// TYPES
// =====================================================

export interface SeasonalProfile {
  /** Human-readable name */
  name: string;
  /** Which CFR codes use this profile */
  cfr_codes: string[];
  /** Monthly weights (calendar month 1-12). Sum should ≈ 12.0 (i.e. average = 1.0) */
  weights: Record<number, number>;
  /** Why this profile exists */
  rationale: string;
}

export interface MonthlyBudgetProfile {
  month: number; // Calendar month 1-12
  month_name: string;
  fy_month: number; // 1-12 within financial year
  planned: number; // Profiled budget for this month
  planned_cumulative: number;
}

// =====================================================
// SCHOOL OCCUPANCY MODEL (2025-26 standard English LA term dates)
// =====================================================
// Schools are CLOSED during holidays — heating, lighting, and most
// energy use drops to base load (security, servers, frost protection).
// This table captures the fraction of each month the school is occupied.
//
// 190 pupil days + 5 INSET = 195 staff days out of ~260 working days.
// Months are calendar months. "occupancy" = fraction of working days
// that the school is open and heated/lit.

/** School occupancy fraction per calendar month (0.0–1.0) */
const SCHOOL_OCCUPANCY: Record<number, number> = {
  1: 0.9, // Jan: term starts ~5th, ~20 of 22 working days
  2: 0.75, // Feb: half-term ~16-20th → ~15 of 20 working days
  3: 0.95, // Mar: full month (Easter late 2026) → ~21 of 22
  4: 0.55, // Apr: Easter hols ~30 Mar–10 Apr → ~13 of 22 working days
  5: 0.82, // May: half-term ~25-29th + bank holiday → ~17 of 21
  6: 1.0, // Jun: full month, no breaks → ~21 of 21
  7: 0.7, // Jul: term ends ~21st → ~16 of 23 working days
  8: 0.0, // Aug: summer holiday — CLOSED entirely
  9: 0.91, // Sep: term starts ~3rd (1 INSET) → ~20 of 22
  10: 0.82, // Oct: half-term ~27-31st → ~18 of 22
  11: 1.0, // Nov: full month, no breaks → ~20 of 20
  12: 0.65, // Dec: Christmas break from ~19th → ~15 of 22 working days
};

/**
 * Vesma UK Standard Heating Degree Days (base 15.5°C).
 * Source: vesma.com/ddd/std-year.htm — UK 20-year average.
 * Total: 2,463 degree days/year.
 */
const HEATING_DEGREE_DAYS: Record<number, number> = {
  1: 395,
  2: 342,
  3: 297,
  4: 233,
  5: 151,
  6: 77,
  7: 42,
  8: 45,
  9: 83,
  10: 177,
  11: 275,
  12: 346,
};

// =====================================================
// SEASONAL PROFILES
// =====================================================

/**
 * Teaching & support staff: even monthly salary, slight variations for:
 * - August: reduced (some term-time-only staff not paid)
 * - September: slightly higher (new starters, pay awards kick in)
 * - April: pay award backdating sometimes creates a spike
 */
const STAFF_SALARY: SeasonalProfile = {
  name: "Staff Salary",
  cfr_codes: ["E01", "E03", "E04", "E05"],
  weights: {
    1: 1.0, // Standard
    2: 1.0, // Standard
    3: 1.0, // Standard
    4: 1.02, // New NI/pension rates kick in (NI rose to 15% Apr 2025)
    5: 1.0, // Standard
    6: 1.0, // Standard
    7: 1.0, // Standard
    8: 0.9, // Term-time-only staff off payroll (TAs ~35% of support)
    9: 1.08, // New starters, increments, pay award applied
    10: 1.0, // Standard (post pay award rate)
    11: 1.0, // Standard
    12: 1.0, // Standard
  },
  rationale:
    "Monthly salaries mostly even. Aug dips (term-time-only staff). Sep higher from new starters + pay award. Apr higher from NI/pension rate changes.",
};

/**
 * Supply teaching: ZERO when school is closed (can't cover classes that aren't running).
 * Driven by: occupancy × illness factor.
 *
 * Illness seasonality (ONS flu surveillance / school absence data):
 * - Nov-Jan: peak flu/cold season (1.4-1.6× average)
 * - Feb-Mar: secondary peak (winter bugs, spring term fatigue)
 * - Jun: low illness (1.0×)
 * - Sep: low (new academic year energy)
 *
 * During holidays = zero supply cost. Half-terms reduce proportionally.
 */
const ILLNESS_SEASONALITY: Record<number, number> = {
  1: 1.5, // Peak flu season
  2: 1.4, // Winter bugs + half-term fatigue
  3: 1.2, // Spring term fatigue
  4: 1.0, // Post-Easter
  5: 0.9, // Warming up, less illness
  6: 0.8, // Summer term, lowest illness
  7: 0.7, // End of year, low absence
  8: 0.0, // Holiday
  9: 0.9, // Fresh start, low absence
  10: 1.0, // Autumn bugs starting
  11: 1.3, // Flu season beginning
  12: 1.6, // Peak flu + norovirus
};

function calculateSupplyWeights(): Record<number, number> {
  const weights: Record<number, number> = {};
  let total = 0;
  for (let m = 1; m <= 12; m++) {
    weights[m] = SCHOOL_OCCUPANCY[m] * ILLNESS_SEASONALITY[m];
    total += weights[m];
  }
  for (let m = 1; m <= 12; m++) {
    weights[m] =
      total > 0 ? Math.round((weights[m] / total) * 12 * 100) / 100 : 1;
  }
  return weights;
}

const SUPPLY_TEACHING: SeasonalProfile = {
  name: "Supply Teaching",
  cfr_codes: ["E02", "E26"],
  weights: calculateSupplyWeights(),
  rationale:
    "Occupancy × illness seasonality. Zero in holidays (no classes to cover). Dec peak (flu + short month = high daily rate). Feb dip from half-term. Aug = 0.",
};

/**
 * Catering staff: 100% term-time-only contracts.
 * Pay is directly proportional to school days in the month.
 * Zero in August. Holiday weeks = zero pay.
 * Some schools spread TTO pay over 12 months for staff budgeting,
 * but the cost to the school accrues in term time.
 */
function calculateTermTimeOnlyWeights(): Record<number, number> {
  const weights: Record<number, number> = {};
  let total = 0;
  for (let m = 1; m <= 12; m++) {
    weights[m] = SCHOOL_OCCUPANCY[m];
    total += weights[m];
  }
  for (let m = 1; m <= 12; m++) {
    weights[m] =
      total > 0 ? Math.round((weights[m] / total) * 12 * 100) / 100 : 1;
  }
  return weights;
}

/**
 * IMPORTANT: TTO staff are paid in 12 EQUAL monthly instalments despite only
 * working 38 weeks (NEU guidance, DfE research 2024). Holiday pay is built into
 * the annualised salary. So the PAYROLL COST to the school is flat 1/12.
 *
 * The occupancy model (calculateTermTimeOnlyWeights) is used for SUPPLIES and
 * VARIABLE COSTS that genuinely stop during holidays (food, materials).
 * Staff salaries are flat because the school pays monthly year-round.
 */
const CATERING_STAFF: SeasonalProfile = {
  name: "Catering Staff",
  cfr_codes: ["E06"],
  weights: {
    1: 1.0,
    2: 1.0,
    3: 1.0,
    4: 1.0,
    5: 1.0,
    6: 1.0,
    7: 1.0,
    8: 1.0,
    9: 1.0,
    10: 1.0,
    11: 1.0,
    12: 1.0,
  },
  rationale:
    "TTO contracts but paid in 12 equal monthly instalments (holiday pay annualised). Payroll cost is flat 1/12.",
};

/**
 * Other staff costs (midday supervisors, welfare, escorts):
 * Same as catering — TTO contracts but annualised pay = flat 1/12.
 * Some casual/zero-hours staff exist but most are on regular TTO contracts.
 */
const OTHER_STAFF: SeasonalProfile = {
  name: "Other Staff",
  cfr_codes: ["E07"],
  weights: {
    1: 1.0,
    2: 1.0,
    3: 1.0,
    4: 1.0,
    5: 1.0,
    6: 1.0,
    7: 1.0,
    8: 1.0,
    9: 1.0,
    10: 1.0,
    11: 1.0,
    12: 1.0,
  },
  rationale:
    "TTO midday supervisors/escorts paid in 12 equal monthly instalments. Payroll cost is flat.",
};

/**
 * Indirect employee expenses (NI, pension, maternity cover):
 * Since ALL staff (including TTO) are paid in 12 equal monthly instalments,
 * the NI/pension contributions are also flat monthly.
 * Only real variation: April spike when new NI/pension rates kick in,
 * and September spike from new starters/pay increments.
 */
const INDIRECT_EMPLOYEE: SeasonalProfile = {
  name: "Indirect Employee Expenses",
  cfr_codes: ["E08"],
  weights: {
    1: 1.0,
    2: 1.0,
    3: 1.0,
    4: 1.1, // New NI/pension rates kick in (NI rose to 15% Apr 2025)
    5: 1.0,
    6: 1.0,
    7: 1.0,
    8: 0.9, // Some TTO casual staff not on payroll
    9: 1.05, // New starters, pay increments
    10: 1.0,
    11: 1.0,
    12: 0.95, // Slightly lower (some staff leave before Christmas)
  },
  rationale:
    "Mostly flat (salaries are annualised). April spike from NI/pension rate changes. Sep from new starters. Aug slightly lower (some casual TTO staff).",
};

/**
 * Staff development: peaks in September (INSET days) and January.
 * Low in summer. Courses often booked for autumn/spring terms.
 */
/**
 * Staff development: driven by INSET day calendar + conference season.
 * - Sep: 2 INSET days typically (biggest CPD spend)
 * - Jan: 1 INSET day (new year training)
 * - Jul: 1 INSET sometimes + end-of-year courses
 * - Aug: some residential/summer courses but mostly zero
 * - Conference season: Oct-Nov (autumn conferences), Mar (spring exams prep)
 * Weighted by occupancy × training demand factor.
 */
const CPD_DEMAND: Record<number, number> = {
  1: 1.4, // January INSET + new year CPD
  2: 1.1, // Standard
  3: 1.3, // Spring conference season, assessment prep
  4: 0.8, // Post-Easter
  5: 0.9, // Standard
  6: 1.0, // End of year reviews
  7: 0.8, // Some end-of-year courses
  8: 0.4, // Residential/summer courses (small minority of staff)
  9: 2.0, // INSET days — biggest CPD month
  10: 1.3, // Autumn conference season
  11: 1.2, // Conferences continue
  12: 0.8, // Winding down for Christmas
};

function calculateCPDWeights(): Record<number, number> {
  const weights: Record<number, number> = {};
  let total = 0;
  for (let m = 1; m <= 12; m++) {
    // CPD mostly requires school to be open (staff attending), but some holiday courses
    const occFactor = Math.max(SCHOOL_OCCUPANCY[m], 0.15); // Minimum 15% for holiday courses
    weights[m] = occFactor * CPD_DEMAND[m];
    total += weights[m];
  }
  for (let m = 1; m <= 12; m++) {
    weights[m] =
      total > 0 ? Math.round((weights[m] / total) * 12 * 100) / 100 : 1;
  }
  return weights;
}

const STAFF_DEVELOPMENT: SeasonalProfile = {
  name: "Staff Development",
  cfr_codes: ["E09"],
  weights: calculateCPDWeights(),
  rationale:
    "Sep=INSET days (biggest CPD month). Oct-Nov=conference season. Jan=INSET. Holiday courses possible but small. Aug lowest.",
};

/**
 * Insurance: typically annual premium paid in one or two lump sums.
 * Most schools pay in April (LA year) or September (academic year).
 */
const INSURANCE: SeasonalProfile = {
  name: "Insurance",
  cfr_codes: ["E10", "E11", "E23"],
  weights: {
    // Annual premiums: 50% paid April (FY renewal), 50% September (academic year renewal)
    // Based on research: most schools renew in April or September
    1: 0.0,
    2: 0.0,
    3: 0.0,
    4: 6.0, // 50% of annual premium paid here
    5: 0.0,
    6: 0.0,
    7: 0.0,
    8: 0.0,
    9: 6.0, // 50% of annual premium paid here (some policies)
    10: 0.0,
    11: 0.0,
    12: 0.0,
  },
  rationale:
    "Annual lump sum premiums. 50/50 split: April (LA FY) and September (academic year). RPA for academies may be flat monthly via GAG deduction.",
};

/**
 * Building maintenance: peaks in summer holidays when work can be done
 * without disrupting school. Secondary peak in half-terms.
 */
const BUILDING_MAINTENANCE: SeasonalProfile = {
  name: "Building Maintenance",
  cfr_codes: ["E12"],
  weights: {
    1: 0.84, // Winter reactive (frozen pipes etc.) → 7%
    2: 0.84, // Half term works, winter reactive → 7%
    3: 0.84, // End of year prep → 7%
    4: 0.6, // Easter break small works → 5%
    5: 0.6, // Half term minor works → 5%
    6: 0.72, // Pre-summer planning, quotes → 6%
    7: 1.44, // Summer works begin (term ends ~21st) → 12%
    8: 3.0, // Major summer maintenance push → 25%
    9: 0.96, // Snagging, completion of summer works → 8%
    10: 0.72, // Half term minor works → 6%
    11: 0.72, // Reactive winter repairs begin → 6%
    12: 0.72, // Reactive repairs, heating issues → 6%
  },
  rationale:
    "Major works in summer holidays: Aug=25% of annual spend. Jul=12%. Winter reactive repairs. Based on DfE SRM patterns.",
};

/**
 * Grounds maintenance: three components:
 * 1. GRASS CUTTING (~50%): fortnightly Mar-Oct (growing season), nothing Nov-Feb
 * 2. TREE/HEDGE (~25%): dormant pruning (Nov-Feb), summer clearance, school-aware scheduling
 * 3. GENERAL (~25%): leaf clearing (Oct-Nov), path/fence repairs (summer holidays), ad hoc
 *
 * Grounds contractors work year-round but peak in growing season.
 * Summer holidays = major works (no children on site for safety).
 */
const GROWING_SEASON: Record<number, number> = {
  1: 0.0,
  2: 0.0,
  3: 0.6,
  4: 1.2,
  5: 1.5,
  6: 1.5,
  7: 1.4,
  8: 1.2,
  9: 1.0,
  10: 0.5,
  11: 0.0,
  12: 0.0,
};
const TREE_HEDGE: Record<number, number> = {
  1: 1.5,
  2: 1.5,
  3: 0.5,
  4: 0.3,
  5: 0.3,
  6: 0.5,
  7: 0.8,
  8: 1.2,
  9: 0.8,
  10: 0.5,
  11: 1.5,
  12: 1.6,
};
const GROUNDS_GENERAL: Record<number, number> = {
  1: 0.3,
  2: 0.3,
  3: 0.6,
  4: 0.8,
  5: 0.8,
  6: 0.9,
  7: 1.2,
  8: 2.0,
  9: 0.8,
  10: 1.5,
  11: 1.5,
  12: 0.3,
};

function calculateGroundsWeights(): Record<number, number> {
  const weights: Record<number, number> = {};
  let total = 0;
  for (let m = 1; m <= 12; m++) {
    weights[m] =
      GROWING_SEASON[m] * 0.5 +
      TREE_HEDGE[m] * 0.25 +
      GROUNDS_GENERAL[m] * 0.25;
    total += weights[m];
  }
  for (let m = 1; m <= 12; m++) {
    weights[m] =
      total > 0 ? Math.round((weights[m] / total) * 12 * 100) / 100 : 1;
  }
  return weights;
}

const GROUNDS_MAINTENANCE: SeasonalProfile = {
  name: "Grounds Maintenance",
  cfr_codes: ["E13"],
  weights: calculateGroundsWeights(),
  rationale:
    "50% grass (growing season Mar-Oct), 25% tree/hedge (dormant pruning winter), 25% general (leaf clearing Oct-Nov, summer holiday works).",
};

/**
 * Cleaning: fairly even but peaks slightly at start of terms
 * and during deep-clean periods (summer, Christmas).
 */
/**
 * Cleaning: two components:
 * 1. DAILY CLEANING (~70%): proportional to occupancy (less when closed)
 * 2. DEEP CLEAN (~30%): happens IN holidays — Aug summer deep clean is biggest
 *
 * So unlike most costs, holidays still have cleaning spend — just different type.
 */
function calculateCleaningWeights(): Record<number, number> {
  const DAILY_SHARE = 0.7;
  const DEEP_SHARE = 0.3;

  // Deep clean intensity: summer=major, Christmas=moderate, Easter/half-terms=light
  const deepCleanFactor: Record<number, number> = {
    1: 0.0, // No deep clean
    2: 0.3, // Light half-term clean
    3: 0.0, // No break (Easter late)
    4: 0.5, // Easter deep clean
    5: 0.3, // Half-term light clean
    6: 0.0, // No break
    7: 0.5, // Start of summer deep clean
    8: 3.0, // MAJOR summer deep clean (biggest of the year)
    9: 0.0, // Done
    10: 0.3, // Half-term light clean
    11: 0.0, // No break
    12: 1.0, // Christmas deep clean
  };

  const weights: Record<number, number> = {};
  let total = 0;
  for (let m = 1; m <= 12; m++) {
    weights[m] =
      SCHOOL_OCCUPANCY[m] * DAILY_SHARE + deepCleanFactor[m] * DEEP_SHARE;
    total += weights[m];
  }
  for (let m = 1; m <= 12; m++) {
    weights[m] =
      total > 0 ? Math.round((weights[m] / total) * 12 * 100) / 100 : 1;
  }
  return weights;
}

const CLEANING: SeasonalProfile = {
  name: "Cleaning",
  cfr_codes: ["E14"],
  weights: calculateCleaningWeights(),
  rationale:
    "70% daily (occupancy-proportional) + 30% deep clean (holiday periods). Aug has major summer deep clean. Christmas moderate. Half-terms light.",
};

/**
 * Water: fairly even with slight summer reduction (less usage).
 */
/**
 * Water: 60% usage-based (proportional to occupancy — toilets, sinks, kitchens)
 * + 40% standing charge / sewerage (flat).
 * Holiday weeks = usage drops significantly but standing charge continues.
 */
function calculateWaterWeights(): Record<number, number> {
  const USAGE_SHARE = 0.6;
  const STANDING_SHARE = 0.4;
  const weights: Record<number, number> = {};
  let total = 0;
  for (let m = 1; m <= 12; m++) {
    weights[m] = SCHOOL_OCCUPANCY[m] * USAGE_SHARE + 1.0 * STANDING_SHARE;
    total += weights[m];
  }
  for (let m = 1; m <= 12; m++) {
    weights[m] =
      total > 0 ? Math.round((weights[m] / total) * 12 * 100) / 100 : 1;
  }
  return weights;
}

const WATER: SeasonalProfile = {
  name: "Water & Sewerage",
  cfr_codes: ["E15"],
  weights: calculateWaterWeights(),
  rationale:
    "60% usage (occupancy-proportional: toilets, sinks, kitchen) + 40% standing charge. Aug drops but doesn't zero out.",
};

/**
 * Gas: highly seasonal. Winter-heavy, summer near-zero.
 * Based on CIBSE TM46 heating degree days for UK schools.
 * Peak: December-February. Heating typically off May-September.
 */
/**
 * Gas weights are CALCULATED from:
 *   demand = (degree_days × occupancy) + (degree_days × frost_protection_factor × (1 - occupancy))
 *
 * When school is CLOSED, boilers still run at frost protection (~10% of full demand)
 * to prevent pipe freezing. Standing charge adds ~5% flat base across all months.
 *
 * This means:
 * - Feb half-term: demand drops ~18% (not zero — frost protection still runs)
 * - Christmas: 2 weeks closed in coldest month, but frost protection = significant
 * - August: no heating demand at all (warm enough), just standing charge
 */
const FROST_PROTECTION_FACTOR = 0.1; // 10% of full heating when closed (frost stat)
const GAS_STANDING_CHARGE_SHARE = 0.05; // 5% of annual cost is flat standing charge

// Calculate gas weights from first principles
function calculateGasWeights(): Record<number, number> {
  const weights: Record<number, number> = {};
  let totalDemand = 0;

  // Pass 1: calculate raw demand per month
  for (let m = 1; m <= 12; m++) {
    const dd = HEATING_DEGREE_DAYS[m];
    const occ = SCHOOL_OCCUPANCY[m];
    // When open: full heating. When closed: frost protection only.
    const demand = dd * occ + dd * FROST_PROTECTION_FACTOR * (1 - occ);
    weights[m] = demand;
    totalDemand += demand;
  }

  // Pass 2: normalise to sum=12, then blend in standing charge (flat)
  const variableShare = 1 - GAS_STANDING_CHARGE_SHARE;
  for (let m = 1; m <= 12; m++) {
    const variableWeight =
      totalDemand > 0 ? (weights[m] / totalDemand) * 12 : 1;
    weights[m] =
      variableWeight * variableShare +
      (1.0 * GAS_STANDING_CHARGE_SHARE * 12) / 12;
    // Round to 2dp for readability
    weights[m] = Math.round(weights[m] * 100) / 100;
  }

  return weights;
}

const GAS: SeasonalProfile = {
  name: "Gas (Heating)",
  cfr_codes: [], // Handled via sub-category detection
  weights: calculateGasWeights(),
  rationale:
    "Vesma degree days × school occupancy + frost protection (10% when closed) + 5% standing charge. Half-terms, Christmas, Easter all reduce demand but don't eliminate it (frost stat runs). Aug ≈ standing charge only.",
};

/**
 * Electricity: less seasonal than gas but still varies.
 * Higher in winter (shorter days = more lighting) and autumn term
 * (ICT labs, science labs running).
 */
/**
 * Electricity has three components:
 * 1. BASE LOAD (~30%): servers, security, fridges, emergency lighting — runs 24/7/365
 * 2. OCCUPANCY-DRIVEN (~50%): ICT labs, catering equipment, heating pumps, general
 * 3. DAYLIGHT-DRIVEN (~20%): lighting inversely proportional to daylight hours
 *
 * During holidays the occupancy-driven load drops to near zero but base load continues.
 * In winter, shorter days mean more lighting per occupied hour.
 */
const ELEC_BASE_LOAD_SHARE = 0.3;
const ELEC_OCCUPANCY_SHARE = 0.5;
const ELEC_DAYLIGHT_SHARE = 0.2;

/** Average daylight hours per month (London, approximate) */
const DAYLIGHT_HOURS: Record<number, number> = {
  1: 8.0,
  2: 9.5,
  3: 11.5,
  4: 13.5,
  5: 15.5,
  6: 16.5,
  7: 16.0,
  8: 14.5,
  9: 12.5,
  10: 10.5,
  11: 8.5,
  12: 7.5,
};

function calculateElectricityWeights(): Record<number, number> {
  const weights: Record<number, number> = {};
  let totalDemand = 0;

  const maxDaylight = Math.max(...Object.values(DAYLIGHT_HOURS));
  for (let m = 1; m <= 12; m++) {
    const occ = SCHOOL_OCCUPANCY[m];
    const lightingNeed =
      ((maxDaylight - DAYLIGHT_HOURS[m]) / maxDaylight) * occ;
    const demand =
      1.0 * ELEC_BASE_LOAD_SHARE +
      occ * ELEC_OCCUPANCY_SHARE +
      lightingNeed * ELEC_DAYLIGHT_SHARE;
    weights[m] = demand;
    totalDemand += demand;
  }

  for (let m = 1; m <= 12; m++) {
    weights[m] = totalDemand > 0 ? (weights[m] / totalDemand) * 12 : 1;
    weights[m] = Math.round(weights[m] * 100) / 100;
  }
  return weights;
}

const ELECTRICITY: SeasonalProfile = {
  name: "Electricity",
  cfr_codes: [], // Handled via sub-category detection
  weights: calculateElectricityWeights(),
  rationale:
    "30% base load (24/7), 50% occupancy-driven, 20% daylight-driven. Half-terms/Christmas/Easter reduce occupancy load. Aug = base load only (~4%). Winter peak from shorter days + full occupancy.",
};

/**
 * Combined energy profile (when gas/electricity not split).
 * Calculated as 55% gas + 45% electricity for a typical primary school.
 */
function calculateCombinedEnergyWeights(): Record<number, number> {
  const gasW = calculateGasWeights();
  const elecW = calculateElectricityWeights();
  const weights: Record<number, number> = {};
  for (let m = 1; m <= 12; m++) {
    weights[m] = Math.round((gasW[m] * 0.55 + elecW[m] * 0.45) * 100) / 100;
  }
  return weights;
}

const ENERGY_COMBINED: SeasonalProfile = {
  name: "Energy (Combined)",
  cfr_codes: ["E16"],
  weights: calculateCombinedEnergyWeights(),
  rationale:
    "55% gas + 45% electricity. Both incorporate school occupancy model (holidays reduce demand). Gas uses degree days + frost protection. Electricity uses base load + daylight hours.",
};

/**
 * Rates: often paid as a lump sum in April or spread evenly
 * by the LA over 10 months (not August/September in some LAs).
 */
const RATES: SeasonalProfile = {
  name: "Rates",
  cfr_codes: ["E17"],
  weights: {
    1: 1.0,
    2: 1.0,
    3: 1.0,
    4: 1.0,
    5: 1.0,
    6: 1.0,
    7: 1.0,
    8: 1.0,
    9: 1.0,
    10: 1.0,
    11: 1.0,
    12: 1.0,
  },
  rationale: "Typically spread evenly by LA. Some LAs do 10-month billing.",
};

/**
 * Learning resources: peaks at start of academic year (September)
 * and January (spring term resources).
 */
const LEARNING_RESOURCES: SeasonalProfile = {
  name: "Learning Resources",
  cfr_codes: ["E19"],
  weights: {
    // Big spike Sep (new academic year), secondary Jan (spring), March (year-end spend)
    1: 1.2, // Spring term resources → 10%
    2: 0.84, // Standard → 7%
    3: 1.68, // Year-end budget spend → 14%
    4: 0.6, // New FY, cautious → 5%
    5: 0.6, // Standard → 5%
    6: 0.96, // Ordering for next academic year → 8%
    7: 1.2, // End of year orders, prep for Sept → 10%
    8: 0.36, // Deliveries received, minimal ordering → 3%
    9: 2.16, // MAJOR spike — new academic year setup → 18%
    10: 0.96, // Standard → 8%
    11: 0.84, // Standard → 7%
    12: 0.6, // Budget conserving → 5%
  },
  rationale:
    "Sep=18% (new year setup), Mar=14% (year-end spend), Jul=10% (prep). Aug=3% (deliveries only).",
};

/**
 * ICT: peaks at start of academic year and replacement cycles.
 * Software licences often renewed in September or April.
 */
const ICT: SeasonalProfile = {
  name: "ICT",
  cfr_codes: ["E20", "E20A", "E20B", "E20C", "E20D", "E20E", "E20F", "E20G"],
  weights: {
    // Licence renewals cluster Apr + Sep. Hardware refresh summer. Year-end capital in Mar.
    1: 0.72, // Standard → 6%
    2: 0.72, // Standard → 6%
    3: 1.32, // Year-end capital spend → 11%
    4: 1.44, // New FY, licence renewals → 12%
    5: 0.96, // Hardware procurement → 8%
    6: 0.96, // Pre-summer orders → 8%
    7: 1.2, // Summer refresh begins → 10%
    8: 1.44, // Summer installation/deployment → 12%
    9: 1.2, // Academic year licences → 10%
    10: 0.72, // Standard → 6%
    11: 0.72, // Standard → 6%
    12: 0.6, // Low spend → 5%
  },
  rationale:
    "Apr=12% (licence renewals), Aug=12% (summer deployment), Sep=10% (academic licences). Mar=11% (year-end capital).",
};

/**
 * Administrative supplies: relatively even with slight peaks
 * at start of each term and year-end ordering.
 */
/**
 * Admin supplies: mostly term-time driven (stationery, printing, postage)
 * but office still operates in holidays (admissions, planning).
 * Spikes at start of academic year (Sep) and financial year (Apr).
 */
const ADMIN_DEMAND: Record<number, number> = {
  1: 1.1, // Spring term start
  2: 0.9, // Standard
  3: 1.3, // Year-end activity + new year ordering
  4: 1.1, // New FY admin
  5: 0.9, // Standard
  6: 0.9, // Standard
  7: 0.8, // Winding down
  8: 0.4, // Office open but minimal (admissions, setup)
  9: 1.4, // Academic year start — biggest admin month
  10: 1.0, // Standard
  11: 1.0, // Standard
  12: 0.9, // Christmas wind-down
};

function calculateAdminWeights(): Record<number, number> {
  const weights: Record<number, number> = {};
  let total = 0;
  for (let m = 1; m <= 12; m++) {
    // Office is open ~50% even in holidays (admissions, planning)
    const occFactor = Math.max(SCHOOL_OCCUPANCY[m], 0.4);
    weights[m] = occFactor * ADMIN_DEMAND[m];
    total += weights[m];
  }
  for (let m = 1; m <= 12; m++) {
    weights[m] =
      total > 0 ? Math.round((weights[m] / total) * 12 * 100) / 100 : 1;
  }
  return weights;
}

const ADMIN_SUPPLIES: SeasonalProfile = {
  name: "Administrative Supplies",
  cfr_codes: ["E22"],
  weights: calculateAdminWeights(),
  rationale:
    "Sep=peak (academic year start). Mar=year-end. Office operates in holidays at ~40% capacity (admissions). Aug reduced but not zero.",
};

/**
 * Catering supplies: term-time only. Zero in August.
 */
/**
 * Catering supplies: uses same occupancy model as catering staff.
 * Food is only needed when pupils are in school. Zero in August.
 */
const CATERING_SUPPLIES: SeasonalProfile = {
  name: "Catering Supplies",
  cfr_codes: ["E25"],
  weights: calculateTermTimeOnlyWeights(),
  rationale:
    "Proportional to school occupancy. Food needed only when pupils are in school. Aug=0.",
};

/**
 * Bought-in professional services: relatively even but peaks
 * in autumn term (new year setup) and spring (assessment support).
 */
const PROFESSIONAL_SERVICES: SeasonalProfile = {
  name: "Professional Services",
  cfr_codes: ["E27", "E28a", "E28b"],
  weights: {
    // SLA renewals cluster at FY start. Audit in autumn. Legal/HR unpredictable.
    1: 0.96, // Standard → 8%
    2: 0.96, // Standard → 8%
    3: 1.32, // Year-end, pre-renewal activity → 11%
    4: 1.8, // SLA renewals, new FY contracts → 15%
    5: 0.84, // Standard → 7%
    6: 0.84, // Standard → 7%
    7: 0.72, // Standard → 6%
    8: 0.36, // Holiday period, minimal → 3%
    9: 1.44, // Academic year SLAs, audit prep → 12%
    10: 1.08, // External audit period → 9%
    11: 0.96, // Audit completion → 8%
    12: 0.72, // Standard → 6%
  },
  rationale:
    "Apr=15% (SLA renewals), Sep=12% (academic SLAs + audit). Mar=11% (pre-renewal). Aug=3% (holiday minimal).",
};

/**
 * Special facilities / educational visits: term-time only,
 * peaks in summer term (trips) and autumn (swimming).
 */
/**
 * Educational visits: strictly term-time only × trip demand factor.
 * Summer term is peak trip season (weather, end-of-year residentials).
 * Autumn term has swimming lessons. Winter has museum/indoor visits.
 * Zero in holidays — can't take pupils on trips when school is closed.
 */
const TRIP_DEMAND: Record<number, number> = {
  1: 0.7, // Winter — indoor visits only
  2: 0.6, // Cold, half-term
  3: 0.8, // Spring visits starting
  4: 0.9, // Post-Easter trips begin
  5: 1.4, // Summer term — peak trip season
  6: 1.8, // Peak — end of year residentials, outdoor trips
  7: 1.5, // Last trips before summer
  8: 0.0, // CLOSED
  9: 1.0, // Swimming lessons start, autumn walks
  10: 1.1, // Autumn field trips
  11: 0.8, // Getting cold
  12: 0.4, // Christmas activities (pantos count as E24)
};

function calculateVisitsWeights(): Record<number, number> {
  const weights: Record<number, number> = {};
  let total = 0;
  for (let m = 1; m <= 12; m++) {
    weights[m] = SCHOOL_OCCUPANCY[m] * TRIP_DEMAND[m];
    total += weights[m];
  }
  for (let m = 1; m <= 12; m++) {
    weights[m] =
      total > 0 ? Math.round((weights[m] / total) * 12 * 100) / 100 : 1;
  }
  return weights;
}

const SPECIAL_FACILITIES: SeasonalProfile = {
  name: "Educational Visits & Special Facilities",
  cfr_codes: ["E24"],
  weights: calculateVisitsWeights(),
  rationale:
    "Occupancy × trip demand. Jun peak (residentials, outdoor trips). Aug=0 (closed). Winter = indoor visits. Swimming in autumn.",
};

/**
 * Other occupation costs: rent, security, waste — relatively flat.
 */
const OTHER_OCCUPATION: SeasonalProfile = {
  name: "Other Occupation Costs",
  cfr_codes: ["E18"],
  weights: {
    1: 1.0,
    2: 1.0,
    3: 1.0,
    4: 1.0,
    5: 1.0,
    6: 1.0,
    7: 1.0,
    8: 1.0,
    9: 1.0,
    10: 1.0,
    11: 1.0,
    12: 1.0,
  },
  rationale: "Contractual costs — mostly flat monthly.",
};

/**
 * Exam fees (E21):
 *
 * CRITICAL: SATs, phonics screening, and multiplication check are FREE for
 * state-funded primary schools — STA administers and funds centrally.
 * So for PRIMARY schools, E21 is typically ZERO or near-zero.
 *
 * SECONDARY: GCSE ~£48-50/subject, A-level similar. Registration deadline
 * Feb-Mar (late fees £60-180). Payment due 30 days from invoice.
 *
 * This profile is secondary-focused. Primary schools with zero E21 budget
 * won't be affected since 0 × any weight = 0.
 */
const EXAM_FEES: SeasonalProfile = {
  name: "Exam Fees",
  cfr_codes: ["E21"],
  weights: {
    1: 0.5, // Minimal
    2: 3.0, // GCSE/A-level registration deadline — main billing month
    3: 3.5, // Late registrations, amendment fees
    4: 1.5, // Final entries, additional subjects
    5: 1.0, // Exam season begins
    6: 0.5, // Exam season continues
    7: 0.5, // Results processing fees
    8: 0.5, // Results day admin, remarks/appeals
    9: 0.3, // New year admin
    10: 0.3, // Early registration (optional)
    11: 0.2, // Minimal
    12: 0.2, // Minimal
  },
  rationale:
    "Secondary-focused: GCSE/A-level registration fees Feb-Mar (~£48-50/subject). SATs are FREE for primary schools (STA-funded). Primary E21 should be £0.",
};

/**
 * Flat profile for anything we can't categorise.
 */
const FLAT: SeasonalProfile = {
  name: "Flat (Default)",
  cfr_codes: [],
  weights: {
    1: 1.0,
    2: 1.0,
    3: 1.0,
    4: 1.0,
    5: 1.0,
    6: 1.0,
    7: 1.0,
    8: 1.0,
    9: 1.0,
    10: 1.0,
    11: 1.0,
    12: 1.0,
  },
  rationale: "Default flat profile when no specific seasonal pattern applies.",
};

// =====================================================
// PROFILE REGISTRY
// =====================================================

const ALL_PROFILES: SeasonalProfile[] = [
  STAFF_SALARY,
  SUPPLY_TEACHING,
  CATERING_STAFF,
  OTHER_STAFF,
  INDIRECT_EMPLOYEE,
  STAFF_DEVELOPMENT,
  INSURANCE,
  BUILDING_MAINTENANCE,
  GROUNDS_MAINTENANCE,
  CLEANING,
  WATER,
  ENERGY_COMBINED,
  RATES,
  LEARNING_RESOURCES,
  ICT,
  ADMIN_SUPPLIES,
  CATERING_SUPPLIES,
  PROFESSIONAL_SERVICES,
  SPECIAL_FACILITIES,
  OTHER_OCCUPATION,
  EXAM_FEES,
];

/** Sub-profiles for energy — used when cost centre name reveals gas vs electricity */
export const ENERGY_SUB_PROFILES = { gas: GAS, electricity: ELECTRICITY };

/** School occupancy model — exported for UI display */
export { SCHOOL_OCCUPANCY, HEATING_DEGREE_DAYS };

/** CFR code → profile lookup */
const CFR_PROFILE_MAP = new Map<string, SeasonalProfile>();
for (const profile of ALL_PROFILES) {
  for (const code of profile.cfr_codes) {
    CFR_PROFILE_MAP.set(code, profile);
  }
}

// =====================================================
// PUBLIC API
// =====================================================

/**
 * Get the seasonal profile for a given CFR code and optional cost centre name.
 * Falls back to flat profile if no specific profile exists.
 */
export function getSeasonalProfile(
  cfrCode: string,
  costCentreName?: string,
): SeasonalProfile {
  // Energy sub-detection: if E16, check name for gas vs electricity
  if (cfrCode === "E16" && costCentreName) {
    const lower = costCentreName.toLowerCase();
    if (
      lower.includes("gas") ||
      lower.includes("heating") ||
      lower.includes("fuel oil")
    ) {
      return GAS;
    }
    if (lower.includes("electric") || lower.includes("power")) {
      return ELECTRICITY;
    }
  }

  return CFR_PROFILE_MAP.get(cfrCode) || FLAT;
}

/**
 * Calculate the profiled budget for each month of the financial year.
 *
 * @param annualBudget - Total annual budget for this line
 * @param cfrCode - CFR code (e.g. "E01", "E16")
 * @param budgetCycle - "la" (April start) or "academy" (September start)
 * @param costCentreName - Optional name for sub-detection (e.g. "Gas" vs "Electricity")
 * @returns Array of 12 monthly budget amounts (fy_month 1-12)
 */
export function profileBudget(
  annualBudget: number,
  cfrCode: string,
  budgetCycle: "la" | "academy",
  costCentreName?: string,
): MonthlyBudgetProfile[] {
  const profile = getSeasonalProfile(cfrCode, costCentreName);
  const fyStartMonth = budgetCycle === "la" ? 4 : 9; // April or September

  const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Get weights for the 12 months of the FY in calendar order
  const fyWeights: { calMonth: number; weight: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const calMonth = ((fyStartMonth - 1 + i) % 12) + 1;
    fyWeights.push({ calMonth, weight: profile.weights[calMonth] });
  }

  // Normalise weights so they sum to 12.0 (preserving relative ratios)
  const weightSum = fyWeights.reduce((s, w) => s + w.weight, 0);
  const normFactor = weightSum > 0 ? 12.0 / weightSum : 1.0;

  let cumulative = 0;
  return fyWeights.map((fw, i) => {
    const normWeight = fw.weight * normFactor;
    const monthBudget = Math.round((annualBudget * normWeight) / 12);
    cumulative += monthBudget;

    return {
      month: fw.calMonth,
      month_name: MONTH_NAMES[fw.calMonth - 1],
      fy_month: i + 1,
      planned: monthBudget,
      planned_cumulative: cumulative,
    };
  });
}

/**
 * Calculate the expected spend to date based on seasonal profile.
 * More accurate than flat (budget * monthsElapsed / 12).
 */
export function expectedSpendToDate(
  annualBudget: number,
  cfrCode: string,
  budgetCycle: "la" | "academy",
  monthsElapsed: number,
  costCentreName?: string,
): number {
  const monthly = profileBudget(
    annualBudget,
    cfrCode,
    budgetCycle,
    costCentreName,
  );
  return monthly.slice(0, monthsElapsed).reduce((sum, m) => sum + m.planned, 0);
}

/**
 * Calculate variance against profiled budget (not flat).
 * Returns positive = overspend, negative = underspend.
 */
export function profiledVariance(
  annualBudget: number,
  actualSpend: number,
  cfrCode: string,
  budgetCycle: "la" | "academy",
  monthsElapsed: number,
  costCentreName?: string,
): {
  variance: number;
  variance_percent: number;
  rag: "red" | "amber" | "green";
} {
  const expected = expectedSpendToDate(
    annualBudget,
    cfrCode,
    budgetCycle,
    monthsElapsed,
    costCentreName,
  );

  const variance = actualSpend - expected;
  const variancePct =
    expected > 0 ? Math.round((variance / expected) * 1000) / 10 : 0;

  const rag: "red" | "amber" | "green" =
    variancePct > 10 ? "red" : variancePct > 5 ? "amber" : "green";

  return { variance: Math.round(variance), variance_percent: variancePct, rag };
}

/**
 * Get all available profiles (for UI display / configuration).
 */
export function getAllProfiles(): SeasonalProfile[] {
  return [...ALL_PROFILES, GAS, ELECTRICITY];
}

// =====================================================
// ICFP / FBIT / SRM BENCHMARKS
// =====================================================
// Sources: DfE ICFP guidance, FBIT tool, SRM Self-Assessment 2024/25,
// DfE School Workforce Census 2024, ESFA CFR benchmarking data.

/**
 * DfE FBIT-style RAG thresholds for expenditure as % of total income.
 *
 * NOTE: FBIT uses RELATIVE benchmarking (percentile vs 30 similar schools),
 * not fixed absolute thresholds. These are guidance-level approximations
 * derived from observed FBIT outputs and DfE/ISBL guidance. For precise
 * RAG rating, compare against the school's actual FBIT similar set.
 *
 * Red ≈ above ~80th percentile of similar schools.
 * Amber ≈ 40th-80th percentile.
 * Green ≈ below ~40th percentile.
 */
export const FBIT_THRESHOLDS = {
  /** Total staff cost as % of income */
  staffing: { green_max: 75, amber_max: 80, red_above: 80 },
  /** Teaching staff (E01) as % of total expenditure */
  teaching_staff: { green_max: 52, amber_max: 56, red_above: 56 },
  /** Support staff (E03-E07) as % of total expenditure */
  support_staff: { green_max: 22, amber_max: 26, red_above: 26 },
  /** Supply staff (E02+E26) as % of total expenditure */
  supply_staff: { green_max: 2.5, amber_max: 4, red_above: 4 },
  /** Energy (E16) as % of total expenditure */
  energy: { green_max: 2.5, amber_max: 4, red_above: 4 },
  /** Premises (E12-E18 total) as % of total expenditure */
  premises_total: { green_max: 8, amber_max: 12, red_above: 12 },
  /** Educational supplies (E19-E22) as % of total expenditure */
  educational_supplies: { green_max: 5, amber_max: 8, red_above: 8 },
  /** Bought-in professional services (E27, E28a/b) as % of total expenditure */
  professional_services: { green_max: 5, amber_max: 8, red_above: 8 },
  /** Catering (E25) as % of total expenditure — net of income */
  catering_net: { green_max: 3, amber_max: 5, red_above: 5 },
} as const;

/**
 * ICFP metrics for primary schools (DfE guidance + SRM checklist).
 * PTR = pupil-to-teacher ratio, Contact ratio = % timetable delivered.
 */
export const ICFP_BENCHMARKS = {
  primary: {
    /** Total staff cost as % of income — DfE target 75-78% */
    staff_cost_ratio_target: 78,
    staff_cost_ratio_floor: 75,
    /** Pupil-to-teacher ratio (SWC 2024: national avg 20.8) */
    ptr_national_avg: 20.8,
    ptr_efficient_range: [22, 26] as [number, number],
    /** Average class size 2024/25 */
    avg_class_size: 26.4,
    /** Contact ratio: % of timetable taught (primary ≈ 0.78-0.90) */
    contact_ratio_range: [0.78, 0.9] as [number, number],
    /** Per-pupil expenditure benchmarks (DfE 2024/25, maintained primary schools) */
    per_pupil_total_expenditure: 8213, // £ average (all maintained 2024/25)
    per_pupil_teaching_staff: 2724, // £ (FBIT 2023 data)
    per_pupil_support_staff: 1200,
    per_pupil_premises: 500,
    per_pupil_supplies: 350,
    per_pupil_energy: 69, // £ (FBIT 2023, varies 20%+ by region)
    per_pupil_catering: 185, // £ (supplies only, net of income)
  },
  secondary: {
    staff_cost_ratio_target: 80,
    staff_cost_ratio_floor: 75,
    ptr_national_avg: 16.7,
    ptr_efficient_range: [18, 22] as [number, number],
    avg_class_size: 22.5,
    contact_ratio_range: [0.72, 0.78] as [number, number],
    per_pupil_total_expenditure: 7200,
    per_pupil_teaching_staff: 3600,
    per_pupil_support_staff: 1400,
    per_pupil_premises: 600,
    per_pupil_supplies: 450,
    per_pupil_energy: 200,
  },
  /** DfE teacher sickness data 2023/24 — drives supply teaching demand */
  sickness: {
    /** % of teachers who took at least one sickness absence */
    pct_teachers_with_absence: 65.7,
    /** Average days per teacher (those who took absence) */
    avg_days_per_teacher: 8.3,
    /** National supply teaching spend 2024/25 */
    national_supply_spend_millions: 682,
  },
  /** Employer on-cost rates 2025/26 */
  on_costs: {
    /** Teachers' Pension Scheme employer rate (inc 0.08% admin levy) */
    tps_employer_rate: 28.68,
    /** LGPS employer rate range (support staff) */
    lgps_employer_rate_low: 18,
    lgps_employer_rate_high: 22,
    /** Employer NI rate from April 2025 */
    employer_ni_rate: 15.0,
    /** Combined on-cost multiplier: salary × this = total cost (TPS + NI) */
    teacher_on_cost_multiplier: 1.4368, // 1 + 0.2868 + 0.15
    support_on_cost_multiplier: 1.35, // 1 + 0.20 + 0.15 (LGPS mid-range)
  },
} as const;

/**
 * SRM Self-Assessment top-10 planning checks (gov.uk).
 * Each check has a threshold that triggers further review.
 */
export const SRM_CHECKS = {
  /** Check 1: Staffing ratio */
  staffing_as_pct_income: { threshold: 80, metric: "% of total income" },
  /** Check 2: Teacher cost per pupil */
  teacher_cost_per_pupil_high: { threshold: 3500, metric: "£ per pupil" },
  /** Check 3: Pupil-to-teacher ratio (primary) */
  ptr_low: { threshold: 19, metric: "PTR below this = overstaffed" },
  /** Check 4: Class size (primary, KS2) */
  class_size_low: { threshold: 23, metric: "pupils below this = inefficient" },
  /** Check 5: Teacher contact ratio */
  contact_ratio_low: { threshold: 0.78, metric: "below = underutilised" },
  /** Check 6: Spend per pupil comparison */
  spend_per_pupil_comparison: {
    threshold: 1.1,
    metric: "ratio vs similar schools (>1.1 = 10% over)",
  },
  /** Check 7: Average teacher cost */
  avg_teacher_cost: { threshold: 48000, metric: "£ — above = high (primary)" },
  /** Check 8: Senior leader as % of workforce */
  senior_leader_pct: { threshold: 10, metric: "% of teaching staff" },
  /** Check 9: Curriculum cost per subject */
  curriculum_cost_per_subject: {
    threshold: null,
    metric: "compare with similar",
  },
  /** Check 10: Three-year budget forecast surplus */
  three_year_surplus: { threshold: 0, metric: "£ — must be positive" },
} as const;

/**
 * Typical primary school (400 pupils) expenditure breakdown by CFR group.
 * Source: DfE CFR benchmarking data 2023/24, median values for LA-maintained primaries.
 * Used as default ratios when no FMS data is available.
 */
export const CFR_TYPICAL_PRIMARY_SPLIT: Record<
  string,
  { pct: number; description: string }
> = {
  E01: { pct: 42.0, description: "Teaching Staff" },
  E02: { pct: 1.5, description: "Supply Teaching" },
  E03: { pct: 16.0, description: "Education Support Staff" },
  E04: { pct: 2.0, description: "Premises Staff" },
  E05: { pct: 4.5, description: "Administrative Staff" },
  E06: { pct: 0.5, description: "Catering Staff" },
  E07: { pct: 1.5, description: "Other Staff" },
  E08: { pct: 1.5, description: "Indirect Employee Expenses (NI, pension)" },
  E09: { pct: 0.8, description: "Staff Development" },
  E10: { pct: 0.5, description: "Supply Teacher Insurance" },
  E11: { pct: 1.2, description: "Staff Insurance" },
  E12: { pct: 1.5, description: "Building Maintenance" },
  E13: { pct: 0.5, description: "Grounds Maintenance" },
  E14: { pct: 1.5, description: "Cleaning" },
  E15: { pct: 0.3, description: "Water" },
  E16: { pct: 2.5, description: "Energy" },
  E17: { pct: 0.0, description: "Business Rates (LA pays centrally)" },
  E18: { pct: 0.5, description: "Other Occupation" },
  E19: { pct: 1.5, description: "Learning Resources" },
  E20: { pct: 1.2, description: "ICT" },
  E21: { pct: 0.1, description: "Exam Fees" },
  E22: { pct: 0.5, description: "Admin Supplies" },
  E23: { pct: 0.8, description: "Insurance Premiums" },
  E24: { pct: 0.3, description: "Educational Visits" },
  E25: { pct: 2.5, description: "Catering Supplies" },
  E26: { pct: 0.5, description: "Agency Supply" },
  E27: { pct: 1.5, description: "Other Services" },
  E28a: { pct: 5.5, description: "Bought-in Professional Services" },
  E29: { pct: 0.2, description: "Loan Interest / Bank Charges" },
  E30: { pct: 2.5, description: "Revenue Contributions to Capital" },
  E31: { pct: 3.0, description: "Community Focused Staff/Activities" },
  E32: { pct: 1.0, description: "Other Expenditure" },
};

/**
 * Academy GAG payment schedule (ESFA).
 * Academies receive monthly payments, but not in equal twelfths.
 * LA-maintained schools get even monthly twelfths from the LA.
 */
export const FUNDING_PAYMENT_SCHEDULE = {
  /** GAG: 12 equal monthly instalments, 1st working day (ESFA) */
  academy_gag: {
    description:
      "ESFA pays GAG monthly on 1st working day. Equal twelfths (8.33% each). New academies: 6th working day of opening month.",
    monthly_weights: {
      1: 1.0,
      2: 1.0,
      3: 1.0,
      4: 1.0,
      5: 1.0,
      6: 1.0,
      7: 1.0,
      8: 1.0,
      9: 1.0,
      10: 1.0,
      11: 1.0,
      12: 1.0,
    },
  },
  /** LA DSG: monthly twelfths, per LA's Scheme for Financing Schools */
  la_maintained: {
    description:
      "LA pays monthly in even twelfths from DSG. Most LAs pay on 1st or 15th.",
    monthly_weights: {
      1: 1.0,
      2: 1.0,
      3: 1.0,
      4: 1.0,
      5: 1.0,
      6: 1.0,
      7: 1.0,
      8: 1.0,
      9: 1.0,
      10: 1.0,
      11: 1.0,
      12: 1.0,
    },
  },
  /** Pupil Premium: quarterly (Jul, Oct, Jan, Apr) — 25% each */
  pupil_premium: {
    description:
      "Quarterly: July, October, January, April (equal 25% each). Rates 2024/25: Primary FSM6 £1,480, Secondary FSM6 £1,050, LAC £2,570, Service £340.",
    quarterly_months: [7, 10, 1, 4] as number[],
  },
  /** PE & Sport Premium: 2 payments (November, April) */
  pe_sports_premium: {
    description: "Two payments: November and April.",
    payment_months: [11, 4] as number[],
  },
  /** Universal Infant Free School Meals: 1 lump payment in July */
  uifsm: {
    description: "Single lump sum in July.",
    payment_months: [7] as number[],
  },
} as const;

/**
 * Median teacher salary benchmarks (TPS data 2023/24).
 * Used for ICFP analysis and average teacher cost calculations.
 */
export const TEACHER_SALARY_BENCHMARKS = {
  /** Median salary across all teachers */
  all_teachers: 46525,
  /** Primary classroom teachers */
  primary_classroom: 44870,
  /** Secondary classroom teachers */
  secondary_classroom: 48773,
  /** Headteachers */
  headteacher: 79430,
  /** Other leadership (DHT, AHT) */
  other_leadership: 63430,
  /** Coverage multiplier: teachers needed per class (PPA + management + absence) */
  coverage_multiplier: 1.39,
  /** NFF minimum per-pupil funding (primary) 2024/25 */
  nff_minimum_primary_per_pupil: 4655,
  /** Average total spend per pupil (maintained schools, 2024/25) */
  avg_total_spend_per_pupil: 8213,
} as const;

// =====================================================
// FORECAST ENGINE
// =====================================================

/**
 * Budget forecast calculator: takes current year actuals and projects next year
 * with configurable percentage assumptions per category.
 */
export interface ForecastAssumption {
  cfr_code: string;
  description: string;
  current_budget: number;
  current_actual: number;
  change_percent: number;
  change_reason: string;
  projected_budget: number;
}

export interface BudgetForecast {
  financial_year: string;
  assumptions: ForecastAssumption[];
  total_current_budget: number;
  total_projected_budget: number;
  total_change: number;
  total_change_percent: number;
  monthly_profile: MonthlyBudgetProfile[];
  icfp_metrics: {
    projected_staff_cost: number;
    projected_income: number;
    staff_cost_ratio: number;
    icfp_band: "green" | "amber" | "red";
    benchmark_primary_avg: number;
  };
}

/**
 * Standard DfE/ESFA default assumptions for next year planning.
 *
 * Sources (2025/26):
 * - STRB 2025: 4.0% teacher pay award; DfE proposed 6.5% over 3 years (front-loaded ~2.5% for 2026/27)
 * - NJC 2025: 2-3% support staff
 * - Employer NI: 15% (rose from 13.8% Apr 2025, now stable)
 * - TPS employer: 28.68% (inc 0.08% admin levy)
 * - Energy: volatile, Ofgem cap +5.1% elec Q1 2026, plan +5% p.a. (still 35% above pre-crisis)
 * - CPI: 3.8% Sept 2025, forecast ~2.5-3% for 2026/27
 * - Food: moderating from highs, ~3%
 * - Building: BCIS indices 3-4%
 */
export const DEFAULT_ASSUMPTIONS: Record<
  string,
  { percent: number; reason: string }
> = {
  // Staffing
  E01: {
    percent: 2.5,
    reason:
      "STRB pay award (DfE proposed 6.5% over 3 years, ~2.5% for 2026/27 year 2)",
  },
  E02: { percent: 5.0, reason: "Supply cost inflation above pay award" },
  E03: { percent: 2.5, reason: "Support staff pay award (NJC 2-3%)" },
  E04: { percent: 2.5, reason: "NJC pay award" },
  E05: { percent: 2.5, reason: "NJC pay award" },
  E06: { percent: 2.5, reason: "NJC pay award" },
  E07: { percent: 2.5, reason: "NJC pay award" },
  E08: {
    percent: 3.0,
    reason:
      "Employer NI stable at 15% (already rose Apr 2025). TPS 28.68% stable.",
  },
  E09: { percent: 2.5, reason: "CPI-linked (~2.5-3% forecast)" },
  E10: { percent: 2.5, reason: "Insurance premium inflation" },
  E11: { percent: 2.5, reason: "Insurance premium inflation" },
  // Premises
  E12: { percent: 4.0, reason: "Building cost inflation (BCIS 3-4%)" },
  E13: { percent: 3.0, reason: "General inflation" },
  E14: { percent: 3.0, reason: "Contract uplift" },
  E15: { percent: 5.0, reason: "Water rate increases" },
  E16: {
    percent: 5.0,
    reason: "Energy: still 35% above pre-crisis. Ofgem cap volatile. Plan +5%.",
  },
  E17: { percent: 2.0, reason: "Business rate revaluation" },
  E18: { percent: 2.5, reason: "CPI-linked contracts" },
  // Supplies
  E19: { percent: 2.5, reason: "CPI-linked (~2.5-3%)" },
  E20: { percent: 3.0, reason: "Software licence inflation" },
  E21: { percent: 0.0, reason: "Exam fees typically fixed" },
  E22: { percent: 2.5, reason: "CPI-linked" },
  E23: { percent: 3.0, reason: "RPA/insurance relatively stable (2-3%)" },
  E24: { percent: 2.5, reason: "CPI-linked" },
  E25: { percent: 3.0, reason: "Food price inflation moderating (~3%)" },
  E26: { percent: 5.0, reason: "Agency fee inflation" },
  E27: { percent: 2.5, reason: "General inflation" },
  E28a: { percent: 3.0, reason: "Professional fee inflation" },
};

/**
 * Generate a budget forecast for next year based on current data and assumptions.
 */
export function generateForecast(
  currentYear: {
    financial_year: string;
    budget_cycle: "la" | "academy";
    lines: {
      cfr_code: string;
      description: string;
      budget: number;
      actual: number;
    }[];
    total_income: number;
  },
  customAssumptions?: Record<string, number>,
): BudgetForecast {
  const fyParts = currentYear.financial_year.split("-");
  const nextFY = `${parseInt(fyParts[0]) + 1}-${parseInt(fyParts[1]) + 1}`;

  const assumptions: ForecastAssumption[] = [];
  let totalCurrentBudget = 0;
  let totalProjectedBudget = 0;
  let projectedStaffCost = 0;

  const staffCodes = [
    "E01",
    "E02",
    "E03",
    "E04",
    "E05",
    "E06",
    "E07",
    "E08",
    "E26",
  ];

  for (const line of currentYear.lines) {
    if (line.budget <= 0) continue; // Skip income lines

    const defaultAssumption = DEFAULT_ASSUMPTIONS[line.cfr_code];
    const changePct =
      customAssumptions?.[line.cfr_code] ?? defaultAssumption?.percent ?? 2.0;
    const reason = defaultAssumption?.reason ?? "General inflation";

    const projected = Math.round(line.budget * (1 + changePct / 100));

    assumptions.push({
      cfr_code: line.cfr_code,
      description: line.description,
      current_budget: line.budget,
      current_actual: line.actual,
      change_percent: changePct,
      change_reason: reason,
      projected_budget: projected,
    });

    totalCurrentBudget += line.budget;
    totalProjectedBudget += projected;

    if (staffCodes.includes(line.cfr_code)) {
      projectedStaffCost += projected;
    }
  }

  // ICFP metrics — use FBIT_THRESHOLDS for RAG banding
  const projectedIncome = Math.round(currentYear.total_income * 1.02); // Assume 2% funding increase
  const staffRatio =
    projectedIncome > 0
      ? Math.round((projectedStaffCost / projectedIncome) * 1000) / 10
      : 0;

  const icfpBand: "green" | "amber" | "red" =
    staffRatio <= FBIT_THRESHOLDS.staffing.green_max
      ? "green"
      : staffRatio <= FBIT_THRESHOLDS.staffing.amber_max
        ? "amber"
        : "red";

  // Generate BLENDED monthly profile: weight each line's seasonal profile by its budget share.
  // This is much more accurate than using a single profile for the total.
  const blendedWeights: Record<number, number> = {};
  for (let m = 1; m <= 12; m++) blendedWeights[m] = 0;

  for (const a of assumptions) {
    const profile = getSeasonalProfile(a.cfr_code);
    const share =
      totalProjectedBudget > 0 ? a.projected_budget / totalProjectedBudget : 0;
    for (let m = 1; m <= 12; m++) {
      blendedWeights[m] += profile.weights[m] * share;
    }
  }

  // Convert blended weights to monthly profile
  const fyStartMonth = currentYear.budget_cycle === "la" ? 4 : 9;
  const MONTH_NAMES_FN = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const fyWeights: { calMonth: number; weight: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const calMonth = ((fyStartMonth - 1 + i) % 12) + 1;
    fyWeights.push({ calMonth, weight: blendedWeights[calMonth] || 1 });
  }
  const weightSum = fyWeights.reduce((s, w) => s + w.weight, 0);
  const normFactor = weightSum > 0 ? 12.0 / weightSum : 1.0;
  let cumulative = 0;
  const monthlyProfile: MonthlyBudgetProfile[] = fyWeights.map((fw, i) => {
    const normWeight = fw.weight * normFactor;
    const monthBudget = Math.round((totalProjectedBudget * normWeight) / 12);
    cumulative += monthBudget;
    return {
      month: fw.calMonth,
      month_name: MONTH_NAMES_FN[fw.calMonth - 1],
      fy_month: i + 1,
      planned: monthBudget,
      planned_cumulative: cumulative,
    };
  });

  return {
    financial_year: nextFY,
    assumptions,
    total_current_budget: totalCurrentBudget,
    total_projected_budget: totalProjectedBudget,
    total_change: totalProjectedBudget - totalCurrentBudget,
    total_change_percent:
      totalCurrentBudget > 0
        ? Math.round(
            ((totalProjectedBudget - totalCurrentBudget) / totalCurrentBudget) *
              1000,
          ) / 10
        : 0,
    monthly_profile: monthlyProfile,
    icfp_metrics: {
      projected_staff_cost: projectedStaffCost,
      projected_income: projectedIncome,
      staff_cost_ratio: staffRatio,
      icfp_band: icfpBand,
      benchmark_primary_avg:
        ICFP_BENCHMARKS.primary.staff_cost_ratio_target - 1.5, // 76.5 median
    },
  };
}
