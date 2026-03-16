/**
 * Statutory Compliance Checks Database
 *
 * Contains all statutory and good practice checks for UK school estates compliance.
 * Based on HSE guidance, Building Regulations, and education-specific requirements.
 */

export type CheckCategory = "statutory" | "good_practice" | "custom";
export type CheckFrequency =
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annually"
  | "termly"
  | "ad_hoc";
export type CheckStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "overdue"
  | "skipped"
  | "not_applicable"
  | "awaiting_documentation";

export interface StatutoryCheck {
  id: string;
  domain: ComplianceDomain;
  name: string;
  description: string;
  category: CheckCategory;
  frequency: CheckFrequency;
  reference?: string; // e.g., "HSE L8 para 157"
  referenceUrl?: string;
  estimatedDuration?: number; // minutes
  requiresQualification?: string; // e.g., "Gas Safe", "UKAS Asbestos Surveyor"
  evidenceRequired: string[];
  goodPracticeAlternatives?: string[];
  notes?: string;
}

export type ComplianceDomain =
  | "legionella"
  | "fire"
  | "asbestos"
  | "electrical"
  | "gas"
  | "water"
  | "mechanical"
  | "lifts"
  | "playground"
  | "accessibility"
  | "security"
  | "manual_handling"
  | "working_at_height"
  | "coshh"
  | "food_safety"
  | "transport"
  | "safeguarding"
  | "seasonal";

/**
 * Complete database of statutory compliance checks
 */
export const STATUTORY_CHECKS: Record<ComplianceDomain, StatutoryCheck[]> = {
  // ============================================================
  // LEGIONELLA MANAGEMENT
  // ============================================================
  legionella: [
    {
      id: "leg_monthly_temp_check",
      domain: "legionella",
      name: "Monthly Temperature Monitoring",
      description:
        "Check and record cold water (below 20°C) and hot water (stored at 60°C+, distributed at 50°C+) temperatures at sentinel outlets",
      category: "statutory",
      frequency: "monthly",
      reference: "HSE L8 paras 157-158",
      referenceUrl: "https://www.hse.gov.uk/pubns/books/l8.htm",
      estimatedDuration: 30,
      evidenceRequired: [
        "Temperature readings log",
        "Thermometer calibration certificate",
      ],
      notes:
        "Check representative outlets including calorifier, cold water tank, and distant outlets",
    },
    {
      id: "leg_weekly_flush",
      domain: "legionella",
      name: "Weekly Outlet Flushing",
      description:
        "Flush all outlets used infrequently (at least weekly if not used for 7+ days)",
      category: "statutory",
      frequency: "weekly",
      reference: "HSE L8 para 155",
      referenceUrl: "https://www.hse.gov.uk/pubns/books/l8.htm",
      estimatedDuration: 15,
      evidenceRequired: ["Flushing log", "Date of last use record"],
    },
    {
      id: "leg_annual_risk_assessment",
      domain: "legionella",
      name: "Annual Legionella Risk Assessment Review",
      description:
        "Review and update legionella risk assessment, considering any changes to the water system",
      category: "statutory",
      frequency: "annually",
      reference: "HSE L8",
      referenceUrl: "https://www.hse.gov.uk/pubns/books/l8.htm",
      estimatedDuration: 120,
      requiresQualification: "Competent person (ACoP L8 compliant)",
      evidenceRequired: ["Updated risk assessment", "Assessor certification"],
    },
    {
      id: "leg_two_yearly_review",
      domain: "legionella",
      name: "Two-Yearly System Review",
      description:
        "Comprehensive review of water system, monitoring regime, and control measures",
      category: "statutory",
      frequency: "annually", // Actually every 2 years, but tracked annually
      reference: "HSE L8",
      referenceUrl: "https://www.hse.gov.uk/pubns/books/l8.htm",
      estimatedDuration: 240,
      requiresQualification: "Competent person (ACoP L8 compliant)",
      evidenceRequired: ["Review report", "Action plan"],
      notes: "Full review every 2 years, monitored annually",
    },
    {
      id: "leg_calorifier_check",
      domain: "legionella",
      name: "Calorifier Monthly Inspection",
      description:
        "Check calorifier performance, stratification, and cleanliness",
      category: "statutory",
      frequency: "monthly",
      reference: "HSE HSG274",
      referenceUrl: "https://www.hse.gov.uk/pubns/priced/hsg274part2.pdf",
      estimatedDuration: 20,
      evidenceRequired: ["Inspection checklist", "Temperature records"],
    },
    {
      id: "leg_cold_water_tank",
      domain: "legionella",
      name: "Cold Water Tank Inspection",
      description:
        "Inspect cold water storage tank for condition, lid integrity, lagging, and contamination",
      category: "statutory",
      frequency: "annually",
      reference: "HSE HSG274",
      referenceUrl: "https://www.hse.gov.uk/pubns/priced/hsg274part2.pdf",
      estimatedDuration: 30,
      evidenceRequired: ["Tank inspection log", "Photos if issues found"],
    },
    {
      id: "leg_shower_clean",
      domain: "legionella",
      name: "Shower Head Cleaning and Descale",
      description: "Clean and descale shower heads and hoses every 3-6 months",
      category: "statutory",
      frequency: "quarterly",
      reference: "HSE HSG274",
      referenceUrl: "https://www.hse.gov.uk/pubns/priced/hsg274part2.pdf",
      estimatedDuration: 10,
      evidenceRequired: ["Cleaning log"],
    },
    // Good practice checks
    {
      id: "leg_sentinel_outlets",
      domain: "legionella",
      name: "Sentinel Outlet Monitoring",
      description:
        "Install and monitor sentinel outlets to assess water system condition",
      category: "good_practice",
      frequency: "monthly",
      reference: "HSE HSG274",
      referenceUrl: "https://www.hse.gov.uk/pubns/priced/hsg274part2.pdf",
      estimatedDuration: 15,
      evidenceRequired: ["Sentinel outlet readings"],
      notes:
        "HSE HSG274 describes as good practice example, not statutory requirement",
    },
  ],

  // ============================================================
  // FIRE SAFETY
  // ============================================================
  fire: [
    {
      id: "fire_weekly_alarm_test",
      domain: "fire",
      name: "Weekly Fire Alarm Test",
      description:
        "Test a different call point each week and record the result",
      category: "statutory",
      frequency: "weekly",
      reference: "RRO 2005, BS5839",
      referenceUrl:
        "https://www.legislation.gov.uk/ukdsi/2005/1541/contents/made",
      estimatedDuration: 15,
      evidenceRequired: ["Fire alarm logbook"],
      notes: "Test different call point weekly, test all annually",
    },
    {
      id: "fire_daily_log_check",
      domain: "fire",
      name: "Daily Fire Safety Log Check",
      description: "Visually check fire alarm panel for faults and record",
      category: "statutory",
      frequency: "daily",
      reference: "RRO 2005",
      referenceUrl:
        "https://www.legislation.gov.uk/ukdsi/2005/1541/contents/made",
      estimatedDuration: 5,
      evidenceRequired: ["Fire safety logbook"],
    },
    {
      id: "fire_monthly_extinguisher",
      domain: "fire",
      name: "Monthly Fire Extinguisher Check",
      description:
        "Check all extinguishers are in correct location, unobstructed, not damaged, pressure gauge in green",
      category: "statutory",
      frequency: "monthly",
      reference: "RRO 2005, BS5306",
      referenceUrl:
        "https://www.legislation.gov.uk/ukdsi/2005/1541/contents/made",
      estimatedDuration: 30,
      evidenceRequired: ["Extinguisher inspection record"],
    },
    {
      id: "fire_annual_extinguisher_service",
      domain: "fire",
      name: "Annual Fire Extinguisher Servicing",
      description:
        "Professional service and certification of all fire extinguishers",
      category: "statutory",
      frequency: "annually",
      reference: "BS5306",
      referenceUrl: "https://www.bsi.group.com/en/standards/british-standards",
      estimatedDuration: 60,
      requiresQualification: "BAFE qualified technician",
      evidenceRequired: ["Service certificate", "Engineer report"],
    },
    {
      id: "fire_emergency_lighting_test",
      domain: "fire",
      name: "Monthly Emergency Lighting Test",
      description: "Test all emergency lighting to ensure proper operation",
      category: "statutory",
      frequency: "monthly",
      reference: "RRO 2005, BS5266",
      referenceUrl:
        "https://www.legislation.gov.uk/ukdsi/2005/1541/contents/made",
      estimatedDuration: 30,
      evidenceRequired: ["Emergency lighting log"],
    },
    {
      id: "fire_annual_risk_assessment",
      domain: "fire",
      name: "Fire Risk Assessment Review",
      description:
        "Review and update fire risk assessment, considering changes to building or usage",
      category: "statutory",
      frequency: "annually",
      reference: "RRO 2005 Article 9",
      referenceUrl:
        "https://www.legislation.gov.uk/ukdsi/2005/1541/contents/made",
      estimatedDuration: 180,
      requiresQualification: "Competent fire risk assessor",
      evidenceRequired: ["Updated fire risk assessment", "Action plan"],
    },
    {
      id: "fire_exit_routes",
      domain: "fire",
      name: "Weekly Escape Route Inspection",
      description:
        "Check all escape routes are clear, exit signs illuminated, doors open freely",
      category: "statutory",
      frequency: "weekly",
      reference: "RRO 2005",
      referenceUrl:
        "https://www.legislation.gov.uk/ukdsi/2005/1541/contents/made",
      estimatedDuration: 20,
      evidenceRequired: ["Inspection log"],
    },
    {
      id: "fire_fighting_equipment",
      domain: "fire",
      name: "Fire Fighting Equipment Inspection",
      description:
        "Monthly inspection of fire blankets, hose reels, and other equipment",
      category: "statutory",
      frequency: "monthly",
      reference: "RRO 2005",
      referenceUrl:
        "https://www.legislation.gov.uk/ukdsi/2005/1541/contents/made",
      estimatedDuration: 20,
      evidenceRequired: ["Equipment log"],
    },
    {
      id: "fire_automatic_door",
      domain: "fire",
      name: "Monthly Fire Door Inspection",
      description:
        "Check fire doors close properly, intumescent seals intact, gaps correct size",
      category: "statutory",
      frequency: "monthly",
      reference: "RRO 2005",
      referenceUrl:
        "https://www.legislation.gov.uk/ukdsi/2005/1541/contents/made",
      estimatedDuration: 30,
      evidenceRequired: ["Fire door inspection log"],
    },
    {
      id: "fire_alarm_panel",
      domain: "fire",
      name: "Quarterly Fire Alarm Panel Service",
      description:
        "Professional service and testing of fire alarm control panel",
      category: "statutory",
      frequency: "quarterly",
      reference: "BS5839",
      referenceUrl: "https://www.bsi.group.com/en/standards/british-standards",
      estimatedDuration: 60,
      requiresQualification: "Qualified fire alarm engineer",
      evidenceRequired: ["Service certificate"],
    },
    {
      id: "fire_detector_cleaning",
      domain: "fire",
      name: "Annual Smoke Detector Cleaning",
      description: "Professional cleaning of all smoke and heat detectors",
      category: "good_practice",
      frequency: "annually",
      reference: "BS5839",
      referenceUrl: "https://www.bsi.group.com/en/standards/british-standards",
      estimatedDuration: 120,
      requiresQualification: "Qualified fire alarm engineer",
      evidenceRequired: ["Cleaning certificate"],
      notes: "Recommended to maintain detector sensitivity",
    },
  ],

  // ============================================================
  // ASBESTOS MANAGEMENT
  // ============================================================
  asbestos: [
    {
      id: "asb_annual_register_review",
      domain: "asbestos",
      name: "Annual Asbestos Register Review",
      description:
        "Review asbestos register for accuracy, update if any ACMs have been disturbed or removed",
      category: "statutory",
      frequency: "annually",
      reference: "CAR 2012",
      referenceUrl:
        "https://www.legislation.gov.uk/ukdsi/2012/2307/contents/made",
      estimatedDuration: 60,
      evidenceRequired: ["Updated register", "Review notes"],
    },
    {
      id: "asb_three_yearly_survey",
      domain: "asbestos",
      name: "Re-inspection Survey (Every 3 Years)",
      description:
        "Full re-survey of asbestos-containing materials by UKAS accredited surveyor",
      category: "statutory",
      frequency: "annually", // Tracked annually, done every 3 years
      reference: "CAR 2012",
      referenceUrl:
        "https://www.legislation.gov.uk/ukdsi/2012/2307/contents/made",
      estimatedDuration: 240,
      requiresQualification: "UKAS accredited surveyor",
      evidenceRequired: ["Survey report", "Management plan update"],
      notes: "Full re-survey every 3 years, annual review required",
    },
    {
      id: "asb_annual_visual",
      domain: "asbestos",
      name: "Annual Visual Inspection of ACMs",
      description:
        "Visual inspection of all known asbestos-containing materials for damage or deterioration",
      category: "statutory",
      frequency: "annually",
      reference: "CAR 2012",
      referenceUrl:
        "https://www.legislation.gov.uk/ukdsi/2012/2307/contents/made",
      estimatedDuration: 120,
      evidenceRequired: ["Inspection records", "Photos if concerns"],
    },
    {
      id: "asb_management_plan",
      domain: "asbestos",
      name: "Asbestos Management Plan Review",
      description:
        "Review and update asbestos management plan, ensuring all duties are covered",
      category: "statutory",
      frequency: "annually",
      reference: "CAR 2012 Regulation 4",
      referenceUrl:
        "https://www.legislation.gov.uk/ukdsi/2012/2307/contents/made",
      estimatedDuration: 60,
      evidenceRequired: ["Updated management plan"],
    },
    {
      id: "asb_alert_training",
      domain: "asbestos",
      name: "Asbestos Awareness Training",
      description:
        "Ensure all relevant staff have asbestos awareness training (refresh annually)",
      category: "statutory",
      frequency: "annually",
      reference: "CAR 2012",
      referenceUrl:
        "https://www.legislation.gov.uk/ukdsi/2012/2307/contents/made",
      estimatedDuration: 60,
      evidenceRequired: ["Training certificates", "Training matrix"],
    },
  ],

  // ============================================================
  // ELECTRICAL SAFETY
  // ============================================================
  electrical: [
    {
      id: "elec_fixed_wire_test",
      domain: "electrical",
      name: "Fixed Wire Testing (EICR)",
      description:
        "Periodic inspection and testing of electrical installations (5 yearly for schools)",
      category: "statutory",
      frequency: "annually", // Tracked annually, done every 5 years
      reference: "EAWR 1989, BS7671",
      referenceUrl:
        "https://www.legislation.gov.uk/ukdsi/1989/635/contents/made",
      estimatedDuration: 480,
      requiresQualification: "Qualified electrician",
      evidenceRequired: ["EICR certificate", "Observation codes sheet"],
      notes: "Every 5 years for schools, track annually for planning",
    },
    {
      id: "elec_pat_test",
      domain: "electrical",
      name: "Portable Appliance Testing (PAT)",
      description:
        "Testing of portable electrical equipment (Class 1 equipment annually, Class 2 every 2-4 years)",
      category: "statutory",
      frequency: "annually",
      reference: "EAWR 1989",
      referenceUrl:
        "https://www.legislation.gov.uk/ukdsi/1989/635/contents/made",
      estimatedDuration: 240,
      requiresQualification: "Competent person",
      evidenceRequired: ["PAT testing records", "Asset register"],
    },
    {
      id: "elec_residual_current",
      domain: "electrical",
      name: "RCD Quarterly Test",
      description: "Quarterly test of residual current devices (RCDs)",
      category: "statutory",
      frequency: "quarterly",
      reference: "BS7671",
      referenceUrl: "https://www.bsi.group.com/en/standards/british-standards",
      estimatedDuration: 30,
      evidenceRequired: ["Test log"],
    },
    {
      id: "elec_visual_inspection",
      domain: "electrical",
      name: "Visual Inspection of Distribution Boards",
      description:
        "Quarterly visual inspection of DBs for signs of overheating, damage, or moisture",
      category: "statutory",
      frequency: "quarterly",
      reference: "EAWR 1989",
      referenceUrl:
        "https://www.legislation.gov.uk/ukdsi/1989/635/contents/made",
      estimatedDuration: 30,
      evidenceRequired: ["Inspection log"],
    },
    {
      id: "elec_socket_check",
      domain: "electrical",
      name: "Socket Outlet Inspection",
      description:
        "Quarterly check of socket outlets for damage, cracks, or overheating signs",
      category: "good_practice",
      frequency: "quarterly",
      reference: "EAWR 1989",
      referenceUrl:
        "https://www.legislation.gov.uk/ukdsi/1989/635/contents/made",
      estimatedDuration: 60,
      evidenceRequired: ["Inspection log"],
    },
    {
      id: "elec_emergency_light_test",
      domain: "electrical",
      name: "Emergency Lighting Duration Test",
      description: "Annual 3-hour duration test of emergency lighting",
      category: "statutory",
      frequency: "annually",
      reference: "BS5266",
      referenceUrl: "https://www.bsi.group.com/en/standards/british-standards",
      estimatedDuration: 240,
      evidenceRequired: ["Test certificate"],
      notes: "Monthly flicker test, annual full duration test",
    },
  ],

  // ============================================================
  // GAS SAFETY
  // ============================================================
  gas: [
    {
      id: "gas_annual_safety_check",
      domain: "gas",
      name: "Annual Gas Safety Check",
      description:
        "Gas safety inspection of all gas appliances and flues by Gas Safe registered engineer",
      category: "statutory",
      frequency: "annually",
      reference: "GFPA 1995",
      referenceUrl: "https://www.legislation.gov.uk/ukpga/1995/23/contents",
      estimatedDuration: 180,
      requiresQualification: "Gas Safe registered engineer",
      evidenceRequired: ["Gas safety certificate (CP12)", "Engineer report"],
    },
    {
      id: "gas_government_check",
      domain: "gas",
      name: "Gas Safety Check (Education Specific)",
      description:
        "Additional gas safety requirements for educational establishments",
      category: "statutory",
      frequency: "annually",
      reference: "Education (School Premises) Regulations 1999",
      referenceUrl: "https://www.legislation.gov.uk/uksi/1999/2/contents/made",
      estimatedDuration: 120,
      requiresQualification: "Gas Safe registered engineer",
      evidenceRequired: ["Gas safety certificate", "Checklist"],
    },
    {
      id: "gas_visual_check",
      domain: "gas",
      name: "Monthly Visual Gas Appliance Check",
      description:
        "Visual check for gas leaks, proper ventilation, and safe operation",
      category: "statutory",
      frequency: "monthly",
      reference: "GFPA 1995",
      referenceUrl: "https://www.legislation.gov.uk/ukpga/1995/23/contents",
      estimatedDuration: 30,
      evidenceRequired: ["Monthly log"],
    },
    {
      id: "gas_emergency_controls",
      domain: "gas",
      name: "Gas Emergency Controls Check",
      description:
        "Monthly check that gas emergency shut-off controls are accessible and labelled",
      category: "statutory",
      frequency: "monthly",
      reference: "GFPA 1995",
      referenceUrl: "https://www.legislation.gov.uk/ukpga/1995/23/contents",
      estimatedDuration: 15,
      evidenceRequired: ["Checklist"],
    },
  ],

  // ============================================================
  // WATER QUALITY
  // ============================================================
  water: [
    {
      id: "water_drinking_quality",
      domain: "water",
      name: "Drinking Water Quality Test",
      description:
        "Annual testing of drinking water quality for bacteria and chemical parameters",
      category: "statutory",
      frequency: "annually",
      reference: "Water Supply (Water Quality) Regulations 2016",
      referenceUrl:
        "https://www.legislation.gov.uk/uksi/2016/614/contents/made",
      estimatedDuration: 60,
      requiresQualification: "UKAS accredited laboratory",
      evidenceRequired: ["Water quality certificate", "Lab results"],
    },
    {
      id: "water_tank_condition",
      domain: "water",
      name: "Cold Water Storage Tank Inspection",
      description:
        "Annual inspection of cold water storage tanks for condition, cleanliness, and contamination",
      category: "statutory",
      frequency: "annually",
      reference: "Water Supply Regulations 1999",
      referenceUrl:
        "https://www.legislation.gov.uk/uksi/1999/1148/contents/made",
      estimatedDuration: 30,
      evidenceRequired: ["Inspection log", "Photos if issues"],
    },
  ],

  // ============================================================
  // MECHANICAL / HEATING
  // ============================================================
  mechanical: [
    {
      id: "mech_boiler_service",
      domain: "mechanical",
      name: "Annual Boiler Service",
      description: "Annual service and certification of heating boilers",
      category: "statutory",
      frequency: "annually",
      reference: "Gas Safety (Installation and Use) Regulations 1998",
      referenceUrl:
        "https://www.legislation.gov.uk/uksi/1998/2451/contents/made",
      estimatedDuration: 120,
      requiresQualification: "Oftec/Gas Safe registered engineer",
      evidenceRequired: ["Service certificate"],
    },
    {
      id: "mech_ventilation_check",
      domain: "mechanical",
      name: "Ventilation System Inspection",
      description: "Quarterly inspection of mechanical ventilation systems",
      category: "good_practice",
      frequency: "quarterly",
      reference: "Workplace (Health, Safety and Welfare) Regulations 1992",
      referenceUrl:
        "https://www.legislation.gov.uk/uksi/1992/3004/contents/made",
      estimatedDuration: 60,
      evidenceRequired: ["Inspection log"],
    },
    {
      id: "mech_air_handling",
      domain: "mechanical",
      name: "Air Handling Unit Filter Check",
      description: "Monthly check and replacement of AHU filters as needed",
      category: "good_practice",
      frequency: "monthly",
      reference: "Workplace Regulations 1992",
      referenceUrl:
        "https://www.legislation.gov.uk/uksi/1992/3004/contents/made",
      estimatedDuration: 30,
      evidenceRequired: ["Maintenance log"],
    },
  ],

  // ============================================================
  // LIFTS & LOLER
  // ============================================================
  lifts: [
    {
      id: "lift_loler_examination",
      domain: "lifts",
      name: "LOLER Lift Examination (6 Monthly)",
      description:
        "Thorough examination of lift by competent person (every 6 months for passenger lifts)",
      category: "statutory",
      frequency: "annually", // Tracked annually, done every 6 months
      reference: "LOLER 1998",
      referenceUrl:
        "https://www.legislation.gov.uk/ukpga/1998/23/contents/made",
      estimatedDuration: 120,
      requiresQualification:
        "Competent person (insurance company or specialist)",
      evidenceRequired: ["LOLER examination report", "Certificate of test"],
      notes: "Every 6 months for passenger lifts, annually for goods lifts",
    },
    {
      id: "lift_daily_inspection",
      domain: "lifts",
      name: "Daily Lift Inspection",
      description:
        "Daily visual and functional check of lift operations and emergency telephone",
      category: "statutory",
      frequency: "daily",
      reference: "LOLER 1998",
      referenceUrl:
        "https://www.legislation.gov.uk/ukpga/1998/23/contents/made",
      estimatedDuration: 10,
      evidenceRequired: ["Daily log"],
    },
    {
      id: "lift_monthly_service",
      domain: "lifts",
      name: "Monthly Lift Service",
      description: "Monthly maintenance service by lift engineer",
      category: "good_practice",
      frequency: "monthly",
      reference: "PUWER 1998",
      referenceUrl:
        "https://www.legislation.gov.uk/ukpga/1998/37/contents/made",
      estimatedDuration: 60,
      requiresQualification: "Qualified lift engineer",
      evidenceRequired: ["Service report"],
    },
  ],

  // ============================================================
  // PLAYGROUND SAFETY
  // ============================================================
  playground: [
    {
      id: "play_annual_inspection",
      domain: "playground",
      name: "Annual Playground Equipment Inspection",
      description:
        "Annual professional inspection of all playground equipment by RPII qualified inspector",
      category: "statutory",
      frequency: "annually",
      reference: "PUWER 1998, RoSPA guidance",
      referenceUrl:
        "https://www.legislation.gov.uk/ukpga/1998/37/contents/made",
      estimatedDuration: 240,
      requiresQualification: "RPII qualified inspector",
      evidenceRequired: ["Inspection report", "Risk assessment"],
    },
    {
      id: "play_weekly_check",
      domain: "playground",
      name: "Weekly Playground Visual Inspection",
      description:
        "Weekly visual check for damage, litter, vandalism, and general safety",
      category: "statutory",
      frequency: "weekly",
      reference: "PUWER 1998",
      referenceUrl:
        "https://www.legislation.gov.uk/ukpga/1998/37/contents/made",
      estimatedDuration: 30,
      evidenceRequired: ["Weekly log"],
    },
    {
      id: "play_surfacing_check",
      domain: "playground",
      name: "Playground Surfacing Inspection",
      description:
        "Quarterly inspection of safety surfacing for wear, damage, and impact absorption",
      category: "statutory",
      frequency: "quarterly",
      reference: "EN 1177",
      referenceUrl: "https://www.bsi.group.com/en/standards/british-standards",
      estimatedDuration: 60,
      requiresQualification: "Competent person",
      evidenceRequired: ["Inspection log", "Drop test results if concerned"],
    },
  ],

  // ============================================================
  // ACCESSIBILITY
  // ============================================================
  accessibility: [
    {
      id: "access_audit",
      domain: "accessibility",
      name: "Accessibility Statement Review",
      description: "Review and update accessibility statement for the school",
      category: "statutory",
      frequency: "annually",
      reference: "Equality Act 2010",
      referenceUrl: "https://www.legislation.gov.uk/ukpga/2010/15/contents",
      estimatedDuration: 120,
      evidenceRequired: ["Accessibility statement"],
    },
    {
      id: "access_route_check",
      domain: "accessibility",
      name: "Accessible Route Inspection",
      description:
        "Monthly check that accessible routes, toilets, and facilities are functional",
      category: "statutory",
      frequency: "monthly",
      reference: "Equality Act 2010",
      referenceUrl: "https://www.legislation.gov.uk/ukpga/2010/15/contents",
      estimatedDuration: 30,
      evidenceRequired: ["Inspection log"],
    },
  ],

  // ============================================================
  // SECURITY
  // ============================================================
  security: [
    {
      id: "sec_perimeter_check",
      domain: "security",
      name: "Perimeter Security Inspection",
      description:
        "Weekly check of fences, gates, locks, and perimeter security",
      category: "good_practice",
      frequency: "weekly",
      reference: "Education (Independent School Standards) Regulations 2014",
      referenceUrl:
        "https://www.legislation.gov.uk/uksi/2014/3283/contents/made",
      estimatedDuration: 30,
      evidenceRequired: ["Security log"],
    },
    {
      id: "sec_cctv_check",
      domain: "security",
      name: "CCTV System Check",
      description:
        "Weekly check that CCTV cameras are recording and storage is functional",
      category: "good_practice",
      frequency: "weekly",
      estimatedDuration: 15,
      evidenceRequired: ["CCTV log"],
    },
  ],

  // ============================================================
  // MANUAL HANDLING
  // ============================================================
  manual_handling: [
    {
      id: "mh_risk_assessment",
      domain: "manual_handling",
      name: "Manual Handling Risk Assessment Review",
      description:
        "Review manual handling risk assessments for all relevant tasks",
      category: "statutory",
      frequency: "annually",
      reference: "Manual Handling Operations Regulations 1992",
      referenceUrl:
        "https://www.legislation.gov.uk/ukpga/1992/27/contents/made",
      estimatedDuration: 60,
      evidenceRequired: ["Risk assessments"],
    },
  ],

  // ============================================================
  // WORKING AT HEIGHT
  // ============================================================
  working_at_height: [
    {
      id: "wah_equipment_inspection",
      domain: "working_at_height",
      name: "Working at Height Equipment Inspection",
      description:
        "Annual inspection of ladders, steps, towers, and access equipment",
      category: "statutory",
      frequency: "annually",
      reference: "Work at Height Regulations 2005",
      referenceUrl:
        "https://www.legislation.gov.uk/ukksi/2005/735/contents/made",
      estimatedDuration: 60,
      requiresQualification: "Competent person",
      evidenceRequired: ["Inspection records", "Equipment register"],
    },
  ],

  // ============================================================
  // COSHH (CONTROL OF SUBSTANCES HAZARDOUS TO HEALTH)
  // ============================================================
  coshh: [], // Checks defined in coshh-checks.ts, imported and merged at runtime

  // ============================================================
  // FOOD SAFETY
  // ============================================================
  food_safety: [], // Checks defined in food-safety-checks.ts, imported and merged at runtime

  // ============================================================
  // TRANSPORT/MINIBUS
  // ============================================================
  transport: [], // Checks defined in transport-checks.ts, imported and merged at runtime

  // ============================================================
  // SAFEGUARDING/SITE SECURITY
  // ============================================================
  safeguarding: [], // Checks defined in safeguarding-checks.ts, imported and merged at runtime

  // ============================================================
  // SEASONAL MAINTENANCE
  // ============================================================
  seasonal: [], // Checks defined in seasonal-checks.ts, imported and merged at runtime
};

/**
 * Domain metadata for display
 */
export const DOMAIN_METADATA: Record<
  ComplianceDomain,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
    order: number;
  }
> = {
  legionella: {
    name: "Legionella Control",
    description: "Water system monitoring and temperature checks (HSE L8)",
    icon: "💧",
    color: "blue",
    order: 1,
  },
  fire: {
    name: "Fire Safety",
    description: "Fire alarms, extinguishers, escape routes (RRO 2005)",
    icon: "🔥",
    color: "red",
    order: 2,
  },
  asbestos: {
    name: "Asbestos Management",
    description: "Register maintenance and re-inspection (CAR 2012)",
    icon: "☣️",
    color: "purple",
    order: 3,
  },
  electrical: {
    name: "Electrical Safety",
    description: "Fixed wiring, PAT testing, emergency lighting",
    icon: "⚡",
    color: "yellow",
    order: 4,
  },
  gas: {
    name: "Gas Safety",
    description: "Annual safety checks and appliance inspection",
    icon: "🔥",
    color: "orange",
    order: 5,
  },
  water: {
    name: "Water Quality",
    description: "Drinking water testing and tank inspections",
    icon: "🚰",
    color: "cyan",
    order: 6,
  },
  mechanical: {
    name: "Mechanical & Heating",
    description: "Boilers, ventilation, and plant room equipment",
    icon: "🔧",
    color: "slate",
    order: 7,
  },
  lifts: {
    name: "Lifts & LOLER",
    description: "Lift examinations and maintenance (LOLER 1998)",
    icon: "🛗",
    color: "indigo",
    order: 8,
  },
  playground: {
    name: "Playground Safety",
    description: "Equipment inspection and surfacing checks",
    icon: "🎠",
    color: "pink",
    order: 9,
  },
  accessibility: {
    name: "Accessibility",
    description: "Accessible routes and facilities (Equality Act)",
    icon: "♿",
    color: "green",
    order: 10,
  },
  security: {
    name: "Security",
    description: "Perimeter, access control, and CCTV",
    icon: "🔒",
    color: "gray",
    order: 11,
  },
  manual_handling: {
    name: "Manual Handling",
    description: "Risk assessments and equipment (Manual Handling Regulations)",
    icon: "📦",
    color: "amber",
    order: 12,
  },
  working_at_height: {
    name: "Working at Height",
    description: "Access equipment and fall protection (WAH 2005)",
    icon: "🪜",
    color: "emerald",
    order: 13,
  },
  coshh: {
    name: "COSHH",
    description: "Hazardous substances management (COSHH 2002)",
    icon: "⚠️",
    color: "rose",
    order: 14,
  },
  food_safety: {
    name: "Food Safety",
    description: "HACCP, temperature monitoring, hygiene ratings",
    icon: "🍽️",
    color: "lime",
    order: 15,
  },
  transport: {
    name: "Transport & Minibuses",
    description: "Section 19 permits, PSVAR, MOT, driver checks",
    icon: "🚌",
    color: "violet",
    order: 16,
  },
  safeguarding: {
    name: "Safeguarding & Security",
    description: "Hidden areas, perimeter, lockdown, visitor management",
    icon: "🛡️",
    color: "sky",
    order: 17,
  },
  seasonal: {
    name: "Seasonal Maintenance",
    description: "Autumn, winter, spring, and summer maintenance tasks",
    icon: "🍂",
    color: "stone",
    order: 18,
  },
};

/**
 * Get all checks for a domain
 */
export function getChecksForDomain(domain: ComplianceDomain): StatutoryCheck[] {
  return STATUTORY_CHECKS[domain] || [];
}

/**
 * Get all statutory checks across all domains
 */
export function getAllStatutoryChecks(): StatutoryCheck[] {
  return Object.values(STATUTORY_CHECKS).flat();
}

/**
 * Get checks by frequency
 */
export function getChecksByFrequency(
  frequency: CheckFrequency,
): StatutoryCheck[] {
  return getAllStatutoryChecks().filter(
    (check) => check.frequency === frequency,
  );
}

/**
 * Get checks by category
 */
export function getChecksByCategory(category: CheckCategory): StatutoryCheck[] {
  return getAllStatutoryChecks().filter((check) => check.category === category);
}
