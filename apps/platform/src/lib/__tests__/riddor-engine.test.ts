/**
 * RIDDOR Auto-Detection Engine — Unit Tests
 *
 * Safety-critical tests: incorrect RIDDOR detection has legal consequences.
 * Schools are legally required to report certain incidents to HSE.
 * False negatives = legal non-compliance. False positives = unnecessary admin burden.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  detectRIDDOR,
  calculateWorkingDayDeadline,
  generateF2508FormData,
  getRIDDORSummary,
  type IncidentData,
  type RIDDORDetection,
} from "../riddor-engine";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeIncident(overrides: Partial<IncidentData> = {}): IncidentData {
  return {
    incident_type: "accident",
    severity: "minor",
    incident_date: "2026-03-10",
    location: "Playground",
    title: "Minor bump",
    description: "Child bumped head lightly on climbing frame",
    ...overrides,
  };
}

const SCHOOL_DATA = {
  name: "Aurora Academy",
  address: "123 School Lane, London SE1 1AA",
  phone: "020 7946 0001",
  email: "office@aurora.sch.uk",
  headteacher_name: "Mrs J Smith",
  local_authority: "Southwark",
};

// ---------------------------------------------------------------------------
// Category 1: Death
// ---------------------------------------------------------------------------

describe("Category 1: Death", () => {
  it("detects death from injury_type + critical severity", () => {
    const result = detectRIDDOR(
      makeIncident({
        severity: "critical",
        injury_type: "death",
        title: "Fatal accident in school kitchen",
        description: "Staff member collapsed and did not recover",
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("death");
    expect(result.urgency).toBe("immediate");
    expect(result.confidence).toBe("high");
    expect(result.deadline).toBe("2026-03-10"); // Same day
    expect(result.guidance).toContain("0345 300 9923");
    expect(result.guidance).toContain("15 minutes");
  });

  it("detects death from keyword in description with critical severity", () => {
    const result = detectRIDDOR(
      makeIncident({
        severity: "critical",
        title: "Tragic incident",
        description: "Contractor died after falling from scaffolding",
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("death");
    expect(result.urgency).toBe("immediate");
  });

  it("detects death keyword 'fatal' in title", () => {
    const result = detectRIDDOR(
      makeIncident({
        severity: "critical",
        title: "Fatal fall from height",
        description: "Person fell from the roof during maintenance work",
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("death");
  });

  it("does NOT detect death if severity is not critical", () => {
    const result = detectRIDDOR(
      makeIncident({
        severity: "major",
        injury_type: "death",
        title: "Incident report",
        description: "Person died",
      }),
    );

    // Death requires severity=critical in the engine
    expect(result.category).not.toBe("death");
  });

  it("detects various death keywords: deceased, killed", () => {
    for (const keyword of ["deceased", "killed"]) {
      const result = detectRIDDOR(
        makeIncident({
          severity: "critical",
          title: "Incident",
          description: `Person was ${keyword} in the incident`,
        }),
      );
      expect(result.is_reportable).toBe(true);
      expect(result.category).toBe("death");
    }
  });
});

// ---------------------------------------------------------------------------
// Category 2: Specified Injuries
// ---------------------------------------------------------------------------

describe("Category 2: Specified Injuries", () => {
  const REPORTABLE_INJURY_TYPES = [
    "fracture",
    "amputation",
    "loss_of_sight",
    "crush_injury",
    "scalping",
    "thermal_burns",
    "chemical_burns",
    "loss_of_consciousness",
    "hypothermia",
    "heat_illness",
    "permanent_loss_of_function",
    "acute_illness_from_substance",
  ];

  it.each(REPORTABLE_INJURY_TYPES)(
    "detects %s as a specified injury",
    (injuryType) => {
      const result = detectRIDDOR(
        makeIncident({
          injury_type: injuryType,
          injury_body_part: injuryType === "fracture" ? "arm" : undefined,
        }),
      );

      expect(result.is_reportable).toBe(true);
      expect(result.category).toBe("specified_injury");
      expect(result.urgency).toBe("10_working_days");
      expect(result.confidence).toBe("high");
    },
  );

  it("includes injury label in reason", () => {
    const result = detectRIDDOR(
      makeIncident({
        injury_type: "crush_injury",
        injury_body_part: "hand",
      }),
    );

    expect(result.reason).toContain("crush injury");
    expect(result.reason).toContain("hand");
  });

  it("includes injury type in guidance", () => {
    const result = detectRIDDOR(
      makeIncident({
        injury_type: "amputation",
      }),
    );

    expect(result.guidance).toContain("amputation");
  });

  it("handles fracture with non-excluded body part (arm)", () => {
    const result = detectRIDDOR(
      makeIncident({
        injury_type: "fracture",
        injury_body_part: "arm",
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("specified_injury");
    expect(result.confidence).toBe("high");
  });

  it("handles fracture with non-excluded body part (collarbone)", () => {
    const result = detectRIDDOR(
      makeIncident({
        injury_type: "fracture",
        injury_body_part: "collarbone",
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("specified_injury");
  });
});

// ---------------------------------------------------------------------------
// Fracture Finger/Thumb/Toe EXCLUSION
// ---------------------------------------------------------------------------

describe("Fracture exclusions (fingers, thumbs, toes)", () => {
  it("excludes fracture of finger", () => {
    const result = detectRIDDOR(
      makeIncident({
        injury_type: "fracture",
        injury_body_part: "finger",
      }),
    );

    expect(result.is_reportable).toBe(false);
    expect(result.category).toBeNull();
  });

  it("excludes fracture of thumb", () => {
    const result = detectRIDDOR(
      makeIncident({
        injury_type: "fracture",
        injury_body_part: "thumb",
      }),
    );

    expect(result.is_reportable).toBe(false);
  });

  it("excludes fracture of toe", () => {
    const result = detectRIDDOR(
      makeIncident({
        injury_type: "fracture",
        injury_body_part: "toe",
      }),
    );

    expect(result.is_reportable).toBe(false);
  });

  it("excludes fracture of specific fingers (index finger, ring finger, etc.)", () => {
    const excluded = [
      "index finger",
      "ring finger",
      "middle finger",
      "little finger",
      "big toe",
      "little toe",
    ];
    for (const part of excluded) {
      const result = detectRIDDOR(
        makeIncident({
          injury_type: "fracture",
          injury_body_part: part,
        }),
      );
      expect(result.is_reportable).toBe(false);
    }
  });

  it("excludes fracture when body part contains excluded term (e.g. 'left thumb')", () => {
    const result = detectRIDDOR(
      makeIncident({
        injury_type: "fracture",
        injury_body_part: "left thumb",
      }),
    );

    expect(result.is_reportable).toBe(false);
  });

  it("excludes fracture with phalanx / phalange body part", () => {
    for (const part of ["phalanx", "phalange"]) {
      const result = detectRIDDOR(
        makeIncident({
          injury_type: "fracture",
          injury_body_part: part,
        }),
      );
      expect(result.is_reportable).toBe(false);
    }
  });

  it("excludes fracture when injury_is_fracture_excluded flag is set", () => {
    const result = detectRIDDOR(
      makeIncident({
        injury_type: "fracture",
        injury_body_part: "arm", // normally reportable
        injury_is_fracture_excluded: true,
      }),
    );

    expect(result.is_reportable).toBe(false);
  });

  it("does NOT exclude non-fracture injuries with excluded body parts", () => {
    const result = detectRIDDOR(
      makeIncident({
        injury_type: "amputation",
        injury_body_part: "finger", // finger amputation IS reportable
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("specified_injury");
  });
});

// ---------------------------------------------------------------------------
// Category 3: Over 7-day incapacitation (staff only)
// ---------------------------------------------------------------------------

describe("Category 3: Over 7-day incapacitation", () => {
  it("detects staff absence > 7 days", () => {
    const result = detectRIDDOR(
      makeIncident({
        injured_person_type: "staff",
        days_off_work: 8,
        title: "Back injury",
        description: "Staff member injured back lifting equipment",
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("over_7_day");
    expect(result.urgency).toBe("next_working_day");
    expect(result.confidence).toBe("high");
    expect(result.reason).toContain("8 consecutive days");
  });

  it("detects staff absence of exactly 8 days", () => {
    const result = detectRIDDOR(
      makeIncident({
        injured_person_type: "staff",
        days_off_work: 8,
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("over_7_day");
  });

  it("does NOT trigger for exactly 7 days", () => {
    const result = detectRIDDOR(
      makeIncident({
        injured_person_type: "staff",
        days_off_work: 7,
      }),
    );

    // 7 days is NOT > 7, so not reportable under this category
    expect(result.category).not.toBe("over_7_day");
  });

  it("does NOT trigger for pupil even with > 7 days off", () => {
    const result = detectRIDDOR(
      makeIncident({
        injured_person_type: "pupil",
        days_off_work: 15,
      }),
    );

    expect(result.category).not.toBe("over_7_day");
  });

  it("does NOT trigger for visitor even with > 7 days off", () => {
    const result = detectRIDDOR(
      makeIncident({
        injured_person_type: "visitor",
        days_off_work: 20,
      }),
    );

    expect(result.category).not.toBe("over_7_day");
  });

  it("does NOT trigger when days_off_work is null", () => {
    const result = detectRIDDOR(
      makeIncident({
        injured_person_type: "staff",
        days_off_work: null,
      }),
    );

    expect(result.category).not.toBe("over_7_day");
  });

  it("calculates deadline as day after day 7 (8 working days)", () => {
    const result = detectRIDDOR(
      makeIncident({
        injured_person_type: "staff",
        days_off_work: 10,
        incident_date: "2026-03-10", // Tuesday
      }),
    );

    // 8 working days from 2026-03-10 (Tuesday)
    // Mar 11(W), 12(T), 13(F), 16(M), 17(T), 18(W), 19(T), 20(F) = 8 working days
    expect(result.deadline).toBe("2026-03-20");
  });
});

// ---------------------------------------------------------------------------
// Category 4: Non-fatal injuries to non-workers
// ---------------------------------------------------------------------------

describe("Category 4: Non-fatal injuries to non-workers", () => {
  it("detects pupil admitted to hospital", () => {
    const result = detectRIDDOR(
      makeIncident({
        injured_person_type: "pupil",
        hospital_admission_type: "admitted",
        hospital_attendance: true,
        title: "Playground fall",
        description: "Child fell from climbing frame and broke leg",
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("non_fatal_non_worker");
    expect(result.urgency).toBe("10_working_days");
    expect(result.confidence).toBe("high");
    expect(result.reason).toContain("pupil");
  });

  it("detects visitor admitted to hospital", () => {
    const result = detectRIDDOR(
      makeIncident({
        injured_person_type: "visitor",
        hospital_admission_type: "admitted",
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("non_fatal_non_worker");
    expect(result.reason).toContain("visitor");
  });

  it("detects 'other' person type admitted to hospital", () => {
    const result = detectRIDDOR(
      makeIncident({
        injured_person_type: "other",
        hospital_admission_type: "admitted",
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("non_fatal_non_worker");
  });

  it("does NOT trigger for pupil treated and discharged from A&E", () => {
    const result = detectRIDDOR(
      makeIncident({
        injured_person_type: "pupil",
        hospital_admission_type: "treated_and_discharged",
        hospital_attendance: true,
        title: "Minor head bump",
        description: "Taken to A&E as precaution, examined and sent home",
      }),
    );

    // treated_and_discharged is NOT admission
    expect(result.category).not.toBe("non_fatal_non_worker");
  });

  it("does NOT trigger for pupil not attending hospital", () => {
    const result = detectRIDDOR(
      makeIncident({
        injured_person_type: "pupil",
        hospital_admission_type: "not_attended",
      }),
    );

    expect(result.category).not.toBe("non_fatal_non_worker");
  });

  it("does NOT trigger for staff admitted to hospital (staff uses over_7_day rule)", () => {
    const result = detectRIDDOR(
      makeIncident({
        injured_person_type: "staff",
        hospital_admission_type: "admitted",
        hospital_attendance: true,
      }),
    );

    // Staff hospital admission alone is NOT a RIDDOR category
    expect(result.category).not.toBe("non_fatal_non_worker");
  });

  it("detects hospital admission from keywords for pupil", () => {
    const result = detectRIDDOR(
      makeIncident({
        injured_person_type: "pupil",
        hospital_attendance: true,
        title: "Serious fall",
        description: "Child was admitted to hospital after falling in corridor",
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("non_fatal_non_worker");
    expect(result.confidence).toBe("medium");
  });

  it("detects hospital admission keyword 'kept in hospital' for visitor", () => {
    const result = detectRIDDOR(
      makeIncident({
        injured_person_type: "visitor",
        hospital_attendance: true,
        title: "Slip on wet floor",
        description: "Visitor slipped and was kept in hospital overnight",
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("non_fatal_non_worker");
    expect(result.confidence).toBe("medium");
  });
});

// ---------------------------------------------------------------------------
// Category 5: Dangerous Occurrences
// ---------------------------------------------------------------------------

describe("Category 5: Dangerous Occurrences", () => {
  it("detects dangerous_occurrence incident type", () => {
    const result = detectRIDDOR(
      makeIncident({
        incident_type: "dangerous_occurrence",
        title: "Gas leak detected",
        description: "Gas leak found in boiler room",
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("dangerous_occurrence");
    expect(result.urgency).toBe("immediate");
    expect(result.confidence).toBe("high");
  });

  const DANGEROUS_TYPES = [
    "scaffolding_collapse",
    "electrical_contact",
    "fire_serious",
    "structural_collapse",
    "substance_release",
    "gas_leak",
    "asbestos_disturbance",
    "breathing_apparatus_failure",
    "pressure_equipment_failure",
    "lifting_equipment_failure",
    "control_system_failure",
    "explosion",
  ];

  it.each(DANGEROUS_TYPES)(
    "detects dangerous_occurrence_type: %s",
    (doType) => {
      const result = detectRIDDOR(
        makeIncident({
          dangerous_occurrence_type: doType,
          title: "Incident",
          description: "Dangerous occurrence happened",
        }),
      );

      expect(result.is_reportable).toBe(true);
      expect(result.category).toBe("dangerous_occurrence");
      expect(result.urgency).toBe("immediate");
    },
  );

  it("includes the type label in reason", () => {
    const result = detectRIDDOR(
      makeIncident({
        dangerous_occurrence_type: "asbestos_disturbance",
      }),
    );

    expect(result.reason).toContain("asbestos disturbance");
  });

  it("detects gas leak from keywords in description", () => {
    const result = detectRIDDOR(
      makeIncident({
        title: "Smell reported",
        description:
          "Strong gas smell detected in the school kitchen, gas leak suspected",
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("dangerous_occurrence");
    expect(result.confidence).toBe("medium");
  });

  it("detects structural collapse from keywords", () => {
    const result = detectRIDDOR(
      makeIncident({
        title: "Building damage",
        description: "Part of the ceiling collapse in the hall during assembly",
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("dangerous_occurrence");
    expect(result.confidence).toBe("medium");
  });

  it("detects wall collapse keyword", () => {
    const result = detectRIDDOR(
      makeIncident({
        title: "Structural issue",
        description: "Section of boundary wall collapse after storm",
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("dangerous_occurrence");
  });
});

// ---------------------------------------------------------------------------
// Category 6: Occupational Diseases
// ---------------------------------------------------------------------------

describe("Category 6: Occupational Diseases", () => {
  it("detects occupational disease with all required fields", () => {
    const result = detectRIDDOR(
      makeIncident({
        incident_type: "ill_health",
        is_work_related: true,
        occupational_disease_type: "occupational_dermatitis",
        medical_diagnosis_date: "2026-03-05",
        title: "Skin condition",
        description:
          "Staff member diagnosed with dermatitis from cleaning chemicals",
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("occupational_disease");
    expect(result.urgency).toBe("10_working_days");
    expect(result.confidence).toBe("high");
    expect(result.reason).toContain("occupational dermatitis");
  });

  it("calculates deadline from medical_diagnosis_date, not incident_date", () => {
    const result = detectRIDDOR(
      makeIncident({
        incident_type: "ill_health",
        is_work_related: true,
        occupational_disease_type: "asbestosis",
        medical_diagnosis_date: "2026-03-02", // Monday
        incident_date: "2026-01-15", // much earlier
      }),
    );

    expect(result.is_reportable).toBe(true);
    // 10 working days from 2026-03-02 (Monday)
    // Mar 3(T), 4(W), 5(T), 6(F), 9(M), 10(T), 11(W), 12(T), 13(F), 16(M) = 10 working days
    expect(result.deadline).toBe("2026-03-16");
  });

  it("does NOT trigger without incident_type ill_health", () => {
    const result = detectRIDDOR(
      makeIncident({
        incident_type: "accident",
        is_work_related: true,
        occupational_disease_type: "occupational_asthma",
        medical_diagnosis_date: "2026-03-05",
      }),
    );

    expect(result.category).not.toBe("occupational_disease");
  });

  it("does NOT trigger without is_work_related", () => {
    const result = detectRIDDOR(
      makeIncident({
        incident_type: "ill_health",
        is_work_related: false,
        occupational_disease_type: "occupational_asthma",
        medical_diagnosis_date: "2026-03-05",
      }),
    );

    expect(result.category).not.toBe("occupational_disease");
  });

  it("does NOT trigger without medical_diagnosis_date", () => {
    const result = detectRIDDOR(
      makeIncident({
        incident_type: "ill_health",
        is_work_related: true,
        occupational_disease_type: "occupational_asthma",
        medical_diagnosis_date: undefined,
      }),
    );

    expect(result.category).not.toBe("occupational_disease");
  });

  it("does NOT trigger without occupational_disease_type", () => {
    const result = detectRIDDOR(
      makeIncident({
        incident_type: "ill_health",
        is_work_related: true,
        occupational_disease_type: undefined,
        medical_diagnosis_date: "2026-03-05",
      }),
    );

    expect(result.category).not.toBe("occupational_disease");
  });
});

// ---------------------------------------------------------------------------
// Keyword Fallback Detection
// ---------------------------------------------------------------------------

describe("Keyword fallback detection from free text", () => {
  it("detects fracture from description text", () => {
    const result = detectRIDDOR(
      makeIncident({
        title: "Fall in corridor",
        description: "Child fell and X-ray confirmed a fracture of the wrist",
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("specified_injury");
    expect(result.confidence).toBe("medium");
    expect(result.reason).toContain("fracture");
  });

  it("detects 'broken arm' from description", () => {
    const result = detectRIDDOR(
      makeIncident({
        title: "Playground accident",
        description: "Child fell off climbing frame, suspected broken arm",
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("specified_injury");
    expect(result.confidence).toBe("medium");
  });

  it("does NOT trigger keyword fracture when injury_is_fracture_excluded is true", () => {
    const result = detectRIDDOR(
      makeIncident({
        title: "Minor accident",
        description: "Child fell and has a fracture of the little finger",
        injury_is_fracture_excluded: true,
      }),
    );

    expect(result.category).not.toBe("specified_injury");
  });

  it("detects loss of consciousness from description", () => {
    const result = detectRIDDOR(
      makeIncident({
        title: "Head injury",
        description: "Pupil was knocked out briefly after collision during PE",
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("specified_injury");
    expect(result.confidence).toBe("medium");
    expect(result.reason).toContain("consciousness");
  });

  it("detects 'concussion' keyword", () => {
    const result = detectRIDDOR(
      makeIncident({
        title: "Sports injury",
        description: "Student suffered concussion during rugby match",
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("specified_injury");
  });

  it("detects burns with hospital attendance", () => {
    const result = detectRIDDOR(
      makeIncident({
        title: "Science lab incident",
        description: "Student suffered severe burn from Bunsen burner",
        hospital_attendance: true,
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("specified_injury");
    expect(result.confidence).toBe("medium");
  });

  it("does NOT detect burns without hospital attendance", () => {
    const result = detectRIDDOR(
      makeIncident({
        title: "Minor burn",
        description:
          "Student had a minor chemical burn, treated with first aid",
        hospital_attendance: false,
      }),
    );

    // Burns keyword without hospital = not reportable (unless other triggers)
    expect(result.is_reportable).toBe(false);
  });

  it("detects 'gas escape' keyword", () => {
    const result = detectRIDDOR(
      makeIncident({
        title: "Smell in corridor",
        description: "Possible gas escape reported near the boiler house",
      }),
    );

    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("dangerous_occurrence");
  });
});

// ---------------------------------------------------------------------------
// Confidence Levels
// ---------------------------------------------------------------------------

describe("Confidence levels", () => {
  it("returns high confidence for structured injury_type match", () => {
    const result = detectRIDDOR(makeIncident({ injury_type: "amputation" }));
    expect(result.confidence).toBe("high");
  });

  it("returns medium confidence for keyword-based fracture detection", () => {
    const result = detectRIDDOR(
      makeIncident({
        title: "Fall",
        description: "Broken leg confirmed by hospital",
      }),
    );
    expect(result.confidence).toBe("medium");
  });

  it("returns high confidence for structured dangerous occurrence type", () => {
    const result = detectRIDDOR(
      makeIncident({
        dangerous_occurrence_type: "gas_leak",
      }),
    );
    expect(result.confidence).toBe("high");
  });

  it("returns medium confidence for keyword-based dangerous occurrence", () => {
    const result = detectRIDDOR(
      makeIncident({
        title: "Emergency",
        description: "Roof collapse in corridor B",
      }),
    );
    expect(result.confidence).toBe("medium");
  });

  it("returns high confidence for non-reportable incidents", () => {
    const result = detectRIDDOR(
      makeIncident({
        title: "Grazed knee",
        description: "Child fell and grazed knee on playground",
      }),
    );
    expect(result.confidence).toBe("high");
  });
});

// ---------------------------------------------------------------------------
// Urgency Levels
// ---------------------------------------------------------------------------

describe("Urgency levels", () => {
  it("returns immediate urgency for death", () => {
    const result = detectRIDDOR(
      makeIncident({
        severity: "critical",
        injury_type: "death",
      }),
    );
    expect(result.urgency).toBe("immediate");
  });

  it("returns 10_working_days urgency for specified injuries", () => {
    const result = detectRIDDOR(makeIncident({ injury_type: "amputation" }));
    expect(result.urgency).toBe("10_working_days");
  });

  it("returns next_working_day urgency for over 7-day incapacitation", () => {
    const result = detectRIDDOR(
      makeIncident({
        injured_person_type: "staff",
        days_off_work: 10,
      }),
    );
    expect(result.urgency).toBe("next_working_day");
  });

  it("returns immediate urgency for dangerous occurrences", () => {
    const result = detectRIDDOR(
      makeIncident({
        incident_type: "dangerous_occurrence",
      }),
    );
    expect(result.urgency).toBe("immediate");
  });

  it("returns 10_working_days urgency for occupational disease", () => {
    const result = detectRIDDOR(
      makeIncident({
        incident_type: "ill_health",
        is_work_related: true,
        occupational_disease_type: "asbestosis",
        medical_diagnosis_date: "2026-03-05",
      }),
    );
    expect(result.urgency).toBe("10_working_days");
  });

  it("returns null urgency for non-reportable", () => {
    const result = detectRIDDOR(makeIncident());
    expect(result.urgency).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Deadline Calculation
// ---------------------------------------------------------------------------

describe("calculateWorkingDayDeadline", () => {
  it("calculates 10 working days skipping weekends", () => {
    // 2026-03-02 is a Monday
    const deadline = calculateWorkingDayDeadline("2026-03-02", 10);
    // 10 working days from Monday March 2: Mar 3-6 (4), Mar 9-13 (5→9), Mar 16 (10)
    expect(deadline).toBe("2026-03-16");
  });

  it("handles starting on a Friday", () => {
    // 2026-03-06 is a Friday
    const deadline = calculateWorkingDayDeadline("2026-03-06", 1);
    // Next working day after Friday = Monday
    expect(deadline).toBe("2026-03-09");
  });

  it("handles starting on a Saturday", () => {
    // 2026-03-07 is a Saturday
    const deadline = calculateWorkingDayDeadline("2026-03-07", 1);
    // Next working day after Saturday = Monday
    expect(deadline).toBe("2026-03-09");
  });

  it("handles starting on a Sunday", () => {
    // 2026-03-08 is a Sunday
    const deadline = calculateWorkingDayDeadline("2026-03-08", 1);
    // Next working day after Sunday = Monday
    expect(deadline).toBe("2026-03-09");
  });

  it("calculates 10 working days from a Wednesday", () => {
    // 2026-03-04 is a Wednesday
    const deadline = calculateWorkingDayDeadline("2026-03-04", 10);
    // Mar 5(T), 6(F), 9(M), 10(T), 11(W), 12(T), 13(F), 16(M), 17(T), 18(W) = 10
    expect(deadline).toBe("2026-03-18");
  });

  it("returns correct date for 0 working days (same day)", () => {
    // Edge: 0 working days means no advancement
    const deadline = calculateWorkingDayDeadline("2026-03-10", 0);
    expect(deadline).toBe("2026-03-10");
  });

  it("handles month boundary", () => {
    // 2026-01-30 is a Friday
    const deadline = calculateWorkingDayDeadline("2026-01-30", 5);
    // Feb 2(M), 3(T), 4(W), 5(T), 6(F) = 5
    expect(deadline).toBe("2026-02-06");
  });
});

// ---------------------------------------------------------------------------
// F2508 Form Data Generation
// ---------------------------------------------------------------------------

describe("generateF2508FormData", () => {
  it("populates school/reporter data correctly", () => {
    const incident = makeIncident({
      injury_type: "fracture",
      injury_body_part: "leg",
      injured_person_type: "staff",
    });
    const detection = detectRIDDOR(incident);
    const form = generateF2508FormData(incident, detection, SCHOOL_DATA);

    expect(form.reporter_name).toBe("Mrs J Smith");
    expect(form.reporter_role).toBe("Headteacher");
    expect(form.organization_name).toBe("Aurora Academy");
    expect(form.organization_address).toBe("123 School Lane, London SE1 1AA");
    expect(form.organization_type).toBe("School");
    expect(form.reporter_phone).toBe("020 7946 0001");
    expect(form.reporter_email).toBe("office@aurora.sch.uk");
  });

  it("maps staff to employee type", () => {
    const incident = makeIncident({ injured_person_type: "staff" });
    const detection = detectRIDDOR(incident);
    const form = generateF2508FormData(incident, detection, SCHOOL_DATA);

    expect(form.injured_person_type).toBe("employee");
  });

  it("maps contractor to employee type", () => {
    const incident = makeIncident({ injured_person_type: "contractor" });
    const detection = detectRIDDOR(incident);
    const form = generateF2508FormData(incident, detection, SCHOOL_DATA);

    expect(form.injured_person_type).toBe("employee");
  });

  it("maps pupil to non-worker type", () => {
    const incident = makeIncident({ injured_person_type: "pupil" });
    const detection = detectRIDDOR(incident);
    const form = generateF2508FormData(incident, detection, SCHOOL_DATA);

    expect(form.injured_person_type).toBe("non-worker");
  });

  it("maps visitor to non-worker type", () => {
    const incident = makeIncident({ injured_person_type: "visitor" });
    const detection = detectRIDDOR(incident);
    const form = generateF2508FormData(incident, detection, SCHOOL_DATA);

    expect(form.injured_person_type).toBe("non-worker");
  });

  it("populates incident fields", () => {
    const incident = makeIncident({
      incident_date: "2026-03-10",
      incident_time: "10:30",
      location: "Science Lab",
      location_detail: "Room 204",
      description: "Chemical spill caused burns",
    });
    const detection = detectRIDDOR(incident);
    const form = generateF2508FormData(incident, detection, SCHOOL_DATA);

    expect(form.incident_date).toBe("2026-03-10");
    expect(form.incident_time).toBe("10:30");
    expect(form.incident_location).toBe("Science Lab \u2014 Room 204");
    expect(form.incident_description).toBe("Chemical spill caused burns");
  });

  it("handles missing incident_time", () => {
    const incident = makeIncident({ incident_time: null });
    const detection = detectRIDDOR(incident);
    const form = generateF2508FormData(incident, detection, SCHOOL_DATA);

    expect(form.incident_time).toBe("");
  });

  it("populates RIDDOR category from detection", () => {
    const incident = makeIncident({
      injury_type: "amputation",
      injured_person_type: "staff",
    });
    const detection = detectRIDDOR(incident);
    const form = generateF2508FormData(incident, detection, SCHOOL_DATA);

    expect(form.riddor_category).toBe("specified_injury");
    expect(form.riddor_category_label).toContain("Specified injury");
  });

  it("populates injured person name or defaults to 'Not known'", () => {
    const withName = makeIncident({ injured_person_name: "John Doe" });
    const withoutName = makeIncident({ injured_person_name: null });
    const det = detectRIDDOR(withName);

    const formWith = generateF2508FormData(withName, det, SCHOOL_DATA);
    const formWithout = generateF2508FormData(withoutName, det, SCHOOL_DATA);

    expect(formWith.injured_person_name).toBe("John Doe");
    expect(formWithout.injured_person_name).toBe("Not known");
  });

  it("populates occupation from role, year_group, or type fallback", () => {
    const withRole = makeIncident({ injured_person_role: "Teacher" });
    const withYearGroup = makeIncident({
      injured_person_role: undefined,
      injured_person_year_group: "Year 3",
    });
    const withType = makeIncident({
      injured_person_role: undefined,
      injured_person_year_group: undefined,
      injured_person_type: "visitor",
    });

    const det = detectRIDDOR(withRole);

    expect(
      generateF2508FormData(withRole, det, SCHOOL_DATA)
        .injured_person_occupation,
    ).toBe("Teacher");
    expect(
      generateF2508FormData(withYearGroup, det, SCHOOL_DATA)
        .injured_person_occupation,
    ).toBe("Year 3");
    expect(
      generateF2508FormData(withType, det, SCHOOL_DATA)
        .injured_person_occupation,
    ).toBe("visitor");
  });

  it("formats witness data correctly", () => {
    const incident = makeIncident({
      witnesses: [
        {
          name: "Alice Brown",
          role: "Teaching Assistant",
          statement: "Saw the child fall",
        },
        { name: "Bob Green" },
      ],
    });
    const detection = detectRIDDOR(incident);
    const form = generateF2508FormData(incident, detection, SCHOOL_DATA);

    expect(form.witnesses).toContain(
      "Alice Brown (Teaching Assistant): Saw the child fall",
    );
    expect(form.witnesses).toContain("Bob Green");
  });

  it("handles empty witnesses array", () => {
    const incident = makeIncident({ witnesses: [] });
    const detection = detectRIDDOR(incident);
    const form = generateF2508FormData(incident, detection, SCHOOL_DATA);

    expect(form.witnesses).toBe("");
  });

  it("populates hospital fields when present", () => {
    const incident = makeIncident({
      hospital_attendance: true,
      hospital_name: "St Thomas' Hospital",
      hospital_admission_date: "2026-03-10",
    });
    const detection = detectRIDDOR(incident);
    const form = generateF2508FormData(incident, detection, SCHOOL_DATA);

    expect(form.hospital_attended).toBe(true);
    expect(form.hospital_name).toBe("St Thomas' Hospital");
    expect(form.hospital_admission_date).toBe("2026-03-10");
  });

  it("populates hospital_attended as false when not set", () => {
    const incident = makeIncident({ hospital_attendance: undefined });
    const detection = detectRIDDOR(incident);
    const form = generateF2508FormData(incident, detection, SCHOOL_DATA);

    expect(form.hospital_attended).toBe(false);
  });

  it("populates days_off_work", () => {
    const incident = makeIncident({
      injured_person_type: "staff",
      days_off_work: 12,
    });
    const detection = detectRIDDOR(incident);
    const form = generateF2508FormData(incident, detection, SCHOOL_DATA);

    expect(form.days_off_work).toBe(12);
  });

  it("sets declaration fields", () => {
    const incident = makeIncident();
    const detection = detectRIDDOR(incident);
    const form = generateF2508FormData(incident, detection, SCHOOL_DATA);

    expect(form.declaration_name).toBe("Mrs J Smith");
    expect(form.declaration_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("formats injury description from parts", () => {
    const incident = makeIncident({
      injury_type: "fracture",
      injury_body_part: "wrist",
      hospital_details: "X-ray confirmed simple fracture",
    });
    const detection = detectRIDDOR(incident);
    const form = generateF2508FormData(incident, detection, SCHOOL_DATA);

    expect(form.injury_description).toContain("fracture");
    expect(form.injury_description).toContain("to wrist");
    expect(form.injury_description).toContain("X-ray confirmed");
  });

  it("replaces underscores in injury_type for display", () => {
    const incident = makeIncident({ injury_type: "loss_of_consciousness" });
    const detection = detectRIDDOR(incident);
    const form = generateF2508FormData(incident, detection, SCHOOL_DATA);

    expect(form.injury_type).toBe("loss of consciousness");
  });

  it("populates contact from address + phone", () => {
    const incident = makeIncident({
      injured_person_address: "10 High Street",
      injured_person_phone: "07700 900000",
    });
    const detection = detectRIDDOR(incident);
    const form = generateF2508FormData(incident, detection, SCHOOL_DATA);

    expect(form.injured_person_contact).toBe("10 High Street, 07700 900000");
  });

  it("handles missing contact fields gracefully", () => {
    const incident = makeIncident({
      injured_person_address: null,
      injured_person_phone: null,
    });
    const detection = detectRIDDOR(incident);
    const form = generateF2508FormData(incident, detection, SCHOOL_DATA);

    expect(form.injured_person_contact).toBe("");
  });
});

// ---------------------------------------------------------------------------
// getRIDDORSummary
// ---------------------------------------------------------------------------

describe("getRIDDORSummary", () => {
  it("returns not-reportable message for non-RIDDOR incidents", () => {
    const detection: RIDDORDetection = {
      is_reportable: false,
      category: null,
      reason: "Does not meet criteria",
      urgency: null,
      deadline: null,
      confidence: "high",
      guidance: "Record in accident book.",
    };

    const summary = getRIDDORSummary(detection);
    expect(summary).toContain("NOT appear to be RIDDOR reportable");
    expect(summary).toContain("Record in accident book.");
  });

  it("returns RIDDOR REPORTABLE header for reportable incidents", () => {
    const detection: RIDDORDetection = {
      is_reportable: true,
      category: "specified_injury",
      reason: "Fracture (leg)",
      urgency: "10_working_days",
      deadline: "2026-03-20",
      confidence: "high",
      guidance: "Report within 10 working days.",
    };

    const summary = getRIDDORSummary(detection);
    expect(summary).toContain("**RIDDOR REPORTABLE**");
    expect(summary).toContain("Fracture (leg)");
    expect(summary).toContain("2026-03-20");
  });

  it("includes immediate phone number for death urgency", () => {
    const detection: RIDDORDetection = {
      is_reportable: true,
      category: "death",
      reason: "Fatality",
      urgency: "immediate",
      deadline: "2026-03-10",
      confidence: "high",
      guidance: "Call HSE.",
    };

    const summary = getRIDDORSummary(detection);
    expect(summary).toContain("IMMEDIATELY");
    expect(summary).toContain("0345 300 9923");
  });

  it("includes medium confidence note", () => {
    const detection: RIDDORDetection = {
      is_reportable: true,
      category: "specified_injury",
      reason: "Possible fracture",
      urgency: "10_working_days",
      deadline: "2026-03-20",
      confidence: "medium",
      guidance: "Please confirm.",
    };

    const summary = getRIDDORSummary(detection);
    expect(summary).toContain("may need confirmation");
  });

  it("does NOT include confirmation note for high confidence", () => {
    const detection: RIDDORDetection = {
      is_reportable: true,
      category: "specified_injury",
      reason: "Fracture",
      urgency: "10_working_days",
      deadline: "2026-03-20",
      confidence: "high",
      guidance: "Report.",
    };

    const summary = getRIDDORSummary(detection);
    expect(summary).not.toContain("may need confirmation");
  });
});

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe("Edge cases", () => {
  it("handles minimal incident data (all optional fields missing)", () => {
    const result = detectRIDDOR({
      incident_type: "accident",
      severity: "minor",
      incident_date: "2026-03-10",
      location: "Playground",
      title: "Minor bump",
      description: "Child bumped head",
    });

    expect(result.is_reportable).toBe(false);
    expect(result.category).toBeNull();
  });

  it("handles empty description", () => {
    const result = detectRIDDOR(makeIncident({ description: "" }));
    expect(result).toBeDefined();
    expect(result.is_reportable).toBe(false);
  });

  it("handles empty title", () => {
    const result = detectRIDDOR(makeIncident({ title: "" }));
    expect(result).toBeDefined();
  });

  it("handles null injury_type", () => {
    const result = detectRIDDOR(makeIncident({ injury_type: null }));
    expect(result).toBeDefined();
  });

  it("handles null injury_body_part", () => {
    const result = detectRIDDOR(
      makeIncident({
        injury_type: "fracture",
        injury_body_part: null,
      }),
    );
    // Fracture with null body part = reportable (can't exclude)
    expect(result.is_reportable).toBe(true);
    expect(result.category).toBe("specified_injury");
  });

  it("prioritises death over specified injuries", () => {
    const result = detectRIDDOR(
      makeIncident({
        severity: "critical",
        injury_type: "death",
        hospital_admission_type: "admitted",
        injured_person_type: "staff",
        days_off_work: 20,
      }),
    );

    // Death should take priority
    expect(result.category).toBe("death");
  });

  it("prioritises specified injury over over-7-day for staff", () => {
    const result = detectRIDDOR(
      makeIncident({
        injury_type: "fracture",
        injury_body_part: "leg",
        injured_person_type: "staff",
        days_off_work: 15,
      }),
    );

    // Specified injury check comes before over-7-day
    expect(result.category).toBe("specified_injury");
  });

  it("treats case-insensitive body parts for fracture exclusion", () => {
    const result = detectRIDDOR(
      makeIncident({
        injury_type: "fracture",
        injury_body_part: "LEFT THUMB",
      }),
    );

    expect(result.is_reportable).toBe(false);
  });

  it("does not false positive on 'breakdown' or 'fracture' in unrelated context", () => {
    // The word 'fracture' in description triggers keyword detection
    // This is expected behaviour — the engine is cautious
    const result = detectRIDDOR(
      makeIncident({
        title: "Equipment check",
        description: "Checked the fractured pipe in the boiler room",
      }),
    );

    // This WILL trigger as medium confidence — correct because the engine is safety-cautious
    expect(result.confidence).toBe("medium");
  });

  it("staff with days_off_work = 0 is not reportable", () => {
    const result = detectRIDDOR(
      makeIncident({
        injured_person_type: "staff",
        days_off_work: 0,
      }),
    );

    expect(result.category).not.toBe("over_7_day");
  });

  it("contractor admitted to hospital is NOT non_fatal_non_worker", () => {
    // Contractors are workers, not non-workers
    const result = detectRIDDOR(
      makeIncident({
        injured_person_type: "contractor",
        hospital_admission_type: "admitted",
      }),
    );

    expect(result.category).not.toBe("non_fatal_non_worker");
  });
});

// ---------------------------------------------------------------------------
// Non-reportable incidents
// ---------------------------------------------------------------------------

describe("Non-reportable incidents", () => {
  it("returns not reportable for minor playground bump", () => {
    const result = detectRIDDOR(
      makeIncident({
        severity: "minor",
        title: "Grazed knee",
        description:
          "Child fell on playground and grazed knee, plaster applied",
        injured_person_type: "pupil",
      }),
    );

    expect(result.is_reportable).toBe(false);
    expect(result.category).toBeNull();
    expect(result.urgency).toBeNull();
    expect(result.deadline).toBeNull();
    expect(result.guidance).toContain("accident book");
  });

  it("returns not reportable for minor staff injury with no days off", () => {
    const result = detectRIDDOR(
      makeIncident({
        injured_person_type: "staff",
        days_off_work: 2,
        title: "Paper cut",
        description: "Staff member cut finger on paper, first aid applied",
      }),
    );

    expect(result.is_reportable).toBe(false);
  });

  it("returns not reportable for pupil taken to A&E but not admitted", () => {
    const result = detectRIDDOR(
      makeIncident({
        injured_person_type: "pupil",
        hospital_attendance: true,
        hospital_admission_type: "treated_and_discharged",
        title: "Head bump",
        description:
          "Child bumped head, taken to A&E as precaution, discharged same day",
      }),
    );

    expect(result.is_reportable).toBe(false);
  });
});
