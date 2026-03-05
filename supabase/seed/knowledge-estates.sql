-- Seed: Legionella Expert Knowledge (Priority 2 POC)
-- Domain: Legionella (Water Safety)

INSERT INTO compliance_domains (domain, name, summary, urgency_level, primary_authority)
VALUES (
    'legionella', 
    'Legionella & Water Safety', 
    'Management of water systems to prevent Legionella growth in school buildings according to HSE ACOP L8.', 
    'critical', 
    'HSE'
) ON CONFLICT (domain) DO UPDATE SET summary = EXCLUDED.summary;

-- ACOP L8: Temperature Controls
INSERT INTO compliance_knowledge (domain, topic, is_statutory, legislation_reference, content, contractor_context, tags)
VALUES (
    'legionella',
    'Temperature Control Strategy',
    true,
    'HSE ACOP L8 (paragraph 67) / HSG274 Part 2',
    '## Statutory Temperature Requirements
- **Hot Water Storage:** Must be at least 60°C (to kill bacteria).
- **Hot Water Distribution:** Must reach at least 50°C (55°C in healthcare) within one minute at outlets.
- **Cold Water Storage/Distribution:** Must be below 20°C (to keep bacteria dormant).
- **Risk Assessment:** A written risk assessment is statutory under the Health and Safety at Work Act.',
    '**Common Upsell:** Contractors suggesting a "biological dose" or "UV treatment" as a replacement for temperature control. 
**Reality:** In the UK, temperature control is the primary statutory defense. Chemical dosing is an *adjunct*, not a replacement. If your temps are correct, you usually don't need expensive UV or chemical systems.',
    ARRAY['statutory', 'temperature', 'ACOP L8']
);

-- HSG274 Part 2: Weekly Flushing
INSERT INTO compliance_knowledge (domain, topic, is_statutory, legislation_reference, content, contractor_context, tags)
VALUES (
    'legionella',
    'Little Used Outlets (Flushing)',
    true,
    'HSG274 Part 2 (paragraphs 2.50-2.52)',
    '## Flushing Little Used Outlets
- **Requirement:** Any outlet not used for 7 days or more must be flushed weekly for several minutes.
- **Recording:** Results must be recorded and kept for 5 years.
- **Strategy:** If an outlet is permanently redundant, it should be removed (deadleg management).',
    '**Common Upsell:** Selling expensive "automated flushing" valves for school sinks.
**Reality:** While automated valves work, they are expensive to maintain. Manual flushing by school site staff is perfectly compliant. Only consider automated for inaccessible areas.',
    ARRAY['statutory', 'flushing', 'maintenance']
);

-- Risk Assessment Frequency
INSERT INTO compliance_knowledge (domain, topic, is_statutory, legislation_reference, content, contractor_context, tags)
VALUES (
    'legionella',
    'Risk Assessment Review',
    true,
    'ACOP L8',
    '## When to Review?
- ACOP L8 states the risk assessment must be reviewed "regularly" or if there is "reason to suspect it is no longer valid".
- Significant changes include: changes to the water system, building use, or results of monitoring.',
    '**Common Upsell:** Contractors claiming a "statutory requirement" for a full new Legionella Risk Assessment (LRA) every 24 months.
**Reality:** There is no fixed "24-month" statutory rule for a *new* LRA. You must *review* it regularly. An annual desktop review by the Responsible Person is often sufficient if the site hasn't changed.',
    ARRAY['statutory', 'risk-assessment', 'compliance']
);

-- Deadlegs and Redundant Pipework
INSERT INTO compliance_knowledge (domain, topic, is_statutory, legislation_reference, content, contractor_context, tags)
VALUES (
    'legionella',
    'Deadlegs and Dead Ends',
    true,
    'HSG274 Part 2',
    '## Managing Stagnation
- Deadlegs (lengths of pipe closed at one end) must be removed.
- Capped pipes from removed basins are a primary source of Legionella contamination.',
    '**Contractor Upsell:** Quoting to "disinfect" a system when deadlegs are present.
**Reality:** Disinfection (chlorination) will NOT fix a deadleg risk because the chemical cannot reach the stagnant water. Removing the pipe is the only statutory fix. Don''t pay for disinfection until deadlegs are gone.',
    ARRAY['statutory', 'plumbing', 'risk']
);

-- Tank Replacements
INSERT INTO compliance_knowledge (domain, topic, is_statutory, legislation_reference, content, contractor_context, tags)
VALUES (
    'legionella',
    'Water Tank Condition',
    false,
    'HSG274 Part 2',
    '## Tank Maintenance
- Inspect tanks annually for debris, scale, or rust.
- Clean and disinfect only if a inspection shows it is necessary.',
    '**Common Upsell:** Suggesting a full cold water tank replacement based on "surface rust" or "minor scale".
**Reality:** Most tanks can be cleaned and relined with an epoxy coating for a fraction of the cost of replacement. Always ask for a "clean and reline" quote before agreeing to a new tank.',
    ARRAY['advisory', 'tanks', 'cost-saving']
);

-- SEED SAMPLE COMPLIANCE DATA (For Testing "Wow Factor")
-- Assuming tables: estates_helpdesk_tickets, compliance_tasks (from audit)
-- Let's check the actual table names first.
