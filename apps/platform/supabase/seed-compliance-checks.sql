-- COMPLIANCE CHECK LIBRARY — SEED DATA
-- Task 021: 150+ statutory and best practice compliance checks for UK schools
-- Run AFTER 20260406_compliance_check_library.sql migration
--
-- Sources: HSE guidance, Building Regulations, DfE Keeping Children Safe in Education,
-- Regulatory Reform (Fire Safety) Order 2005, Control of Asbestos Regulations 2012,
-- Electricity at Work Regulations 1989, Gas Safety (Installation and Use) Regulations 1998,
-- LOLER 1998, PSSR 2000, PUWER 1998, COSHH 2002, Work at Height Regulations 2005,
-- Workplace (Health, Safety and Welfare) Regulations 1992, Food Safety Act 1990,
-- Equality Act 2010, BS EN standards.

-- Clear existing seed data (idempotent)
DELETE FROM public.compliance_checks WHERE is_active = true OR is_active = false;

-- ============================================================================
-- FIRE SAFETY (11 checks)
-- ============================================================================

INSERT INTO public.compliance_checks (check_name, regulatory_source, category, subcategory, frequency, responsible_role, requires_competent_person, generates_certificate, is_statutory, guidance_text, consequence_of_noncompliance, default_priority) VALUES

-- 1
('Fire Risk Assessment', 'Regulatory Reform (Fire Safety) Order 2005, Article 9', 'fire_safety', 'Fire Risk Assessment', 'annually', 'Headteacher / External Assessor', true, true, true,
'A competent person must assess fire risks and record significant findings. Review annually or when significant changes occur (building work, change of use, fire incident). Must cover means of escape, fire detection, fire-fighting equipment, and emergency procedures.',
'Criminal prosecution under RRO 2005. Fines up to unlimited amount. Prohibition or enforcement notices. Personal liability for responsible person. Insurance may be invalidated.',
'critical'),

-- 2
('Fire Alarm Weekly Test', 'RRO 2005; BS 5839-1:2017', 'fire_safety', 'Fire Alarm', 'weekly', 'Site Manager', false, false, true,
'Test a different manual call point each week in rotation so all call points are tested within a year. Record the call point tested, time, zone activated, and any faults. Inform occupants before testing. Test should trigger the alarm and be audible throughout.',
'Alarm system may fail undetected during a real fire. Enforcement notice under RRO 2005. Insurance claim could be rejected if testing records are incomplete.',
'high'),

-- 3
('Fire Alarm 6-Monthly Service', 'BS 5839-1:2017', 'fire_safety', 'Fire Alarm', '6_monthly', 'External Contractor', true, true, true,
'Professional inspection and service of the complete fire alarm system by a competent fire alarm engineer. Includes testing all detectors, call points, sounders, and panel. Check battery condition, zone plans, and cause-and-effect programming.',
'System degradation may not be detected. Non-compliance with BS 5839. Fire authority enforcement action. Insurance implications.',
'high'),

-- 4
('Emergency Lighting Monthly Test', 'BS 5266-1:2016; RRO 2005', 'fire_safety', 'Emergency Lighting', 'monthly', 'Site Manager', false, false, true,
'Briefly test all emergency luminaires by simulating mains failure (using the test key/switch). Check each unit illuminates. Record any failures and arrange replacement. This is a brief functional test, not the annual 3-hour duration test.',
'Emergency lights may fail during a power cut or fire, preventing safe evacuation. Enforcement notice from fire authority.',
'high'),

-- 5
('Emergency Lighting Annual 3-Hour Test', 'BS 5266-1:2016', 'fire_safety', 'Emergency Lighting', 'annually', 'External Contractor', true, true, true,
'Full rated duration test (typically 3 hours) of all emergency lighting. Simulate mains failure and confirm all units maintain illumination for the full rated period. Replace batteries/units that fail. Must be done by a competent person.',
'Non-compliance with BS 5266. Units may fail during extended power outage. Liability if evacuation is hampered.',
'high'),

-- 6
('Fire Extinguisher Annual Service', 'BS 5306-3:2017; RRO 2005', 'fire_safety', 'Fire Extinguisher', 'annually', 'External Contractor', true, true, true,
'Annual inspection and service of all portable fire extinguishers by a BAFE-registered engineer. Check condition, pressure, weight, tamper indicators. Replace any discharged or faulty units. Affix service label.',
'Non-compliant extinguishers may fail during a fire. Criminal liability under RRO 2005. Insurance claim rejection.',
'high'),

-- 7
('Fire Extinguisher 5-Year Extended Service', 'BS 5306-3:2017', 'fire_safety', 'Fire Extinguisher', '5_yearly', 'External Contractor', true, true, true,
'Extended service including discharge and recharge of extinguishers (CO2 units require 10-year hydraulic test). More thorough than annual service. Replacement may be more cost-effective for older units.',
'Over-age extinguishers may fail or become dangerous. Non-compliance with BS 5306.',
'medium'),

-- 8
('Fire Door Quarterly Inspection', 'RRO 2005; BS 8214:2016', 'fire_safety', 'Fire Doors', 'termly', 'Site Manager', false, false, true,
'Inspect all fire doors: check self-closing mechanism works, intumescent strips and smoke seals are intact, gaps are within tolerance (3mm±1mm), door and frame are undamaged, signage is in place, doors are not wedged open unless held by automatic release.',
'Fire doors that fail to close properly allow fire and smoke to spread, potentially cutting off escape routes. Enforcement notice. Personal liability.',
'high'),

-- 9
('Fire Drill', 'RRO 2005; DfE guidance', 'fire_safety', 'Emergency Procedures', 'termly', 'Headteacher', false, false, true,
'Conduct a full evacuation drill at least once per term. Vary the scenario (blocked exit, during lunch, assembly). Time the evacuation. Record observations: did all exits work, were visitors accounted for, did staff follow procedures? Brief staff on findings.',
'Staff and pupils may not know what to do in a real fire. Fire authority criticism during inspection. Safeguarding concern if pupils cannot be accounted for.',
'high'),

-- 10
('Means of Escape Daily Check', 'RRO 2005', 'fire_safety', 'Escape Routes', 'daily', 'Site Manager', false, false, true,
'Daily visual check that all escape routes are clear of obstruction, final exit doors open easily and are unlocked during occupation, fire exit signs are visible, and no combustible materials are stored in corridors or stairwells.',
'Blocked escape routes can cause fatalities. Immediate enforcement action by fire authority. Criminal prosecution.',
'critical'),

-- 11
('Sprinkler System Service', 'BS EN 12845; LPC Rules', 'fire_safety', 'Sprinkler System', '6_monthly', 'External Contractor', true, true, false,
'Professional service and inspection of the sprinkler system including pump sets, valves, pipework, heads, and water supplies. Weekly pump test and flow switch test should also be conducted by site staff where applicable. Not all schools have sprinklers — only applies if system is installed.',
'Sprinkler system may fail to operate during a fire. Insurance requirement if installed. Could invalidate building insurance.',
'medium'),

-- ============================================================================
-- ELECTRICAL (4 checks)
-- ============================================================================

-- 12
('EICR Fixed Wiring Test', 'Electricity at Work Regulations 1989; BS 7671 (IET Wiring Regulations)', 'electrical', 'Fixed Wiring', '5_yearly', 'External Contractor', true, true, true,
'Electrical Installation Condition Report (EICR) — comprehensive test and inspection of all fixed electrical installations. Performed by a competent electrician (NICEIC/NAPIT registered). Covers distribution boards, circuits, earthing, bonding, and accessory condition. Must achieve satisfactory rating.',
'Electrocution risk, fire from faulty wiring. Criminal prosecution under Electricity at Work Regulations. Insurance invalidation. HSE enforcement action. School closure possible if dangerous.',
'critical'),

-- 13
('PAT Testing (Portable Appliance Testing)', 'Electricity at Work Regulations 1989; HSE guidance', 'electrical', 'Portable Appliances', 'annually', 'Competent Person / External Contractor', true, true, true,
'Visual inspection and where appropriate, electrical testing of all portable electrical appliances. Frequency should be risk-based — higher risk items (kettles, heaters) tested more often. Record results with pass/fail labels. Remove failed items from service immediately.',
'Electric shock or fire from faulty appliances. Employer liability. HSE enforcement. Insurance implications.',
'high'),

-- 14
('RCD (Residual Current Device) Test', 'BS 7671; Electricity at Work Regulations 1989', 'electrical', 'RCD Protection', 'termly', 'Site Manager', false, false, true,
'Press the test button on each RCD at least quarterly to verify it trips correctly. If RCD does not trip, take the circuit out of service and arrange repair. This is a user test — the RCD is also tested as part of the EICR.',
'RCDs protect against electrocution. A non-functioning RCD means the circuit has no earth fault protection. Potential fatality.',
'high'),

-- 15
('Thermal Imaging Survey', 'Best practice; IET guidance', 'electrical', 'Electrical Infrastructure', 'annually', 'External Contractor', true, true, false,
'Infrared thermographic survey of main switchboards and distribution boards to detect hot spots caused by loose connections, overloaded circuits, or component degradation. Best practice addition to EICR regime. Particularly valuable in older buildings.',
'Undetected hot spots can cause electrical fires. Not statutory but strongly recommended by insurers and IET.',
'medium'),

-- ============================================================================
-- GAS (4 checks)
-- ============================================================================

-- 16
('Annual Gas Safety Check (CP12/CP42)', 'Gas Safety (Installation and Use) Regulations 1998', 'gas', 'Gas Installations', 'annually', 'Gas Safe Registered Engineer', true, true, true,
'Annual safety inspection and test of all gas appliances and associated pipework by a Gas Safe registered engineer. For commercial/school settings, CP42 applies (non-domestic). Certificate must be issued and retained for 2 years. Covers boilers, water heaters, catering equipment.',
'Carbon monoxide poisoning (potentially fatal). Criminal prosecution under Gas Safety Regulations. HSE enforcement. School closure order. Insurance invalidation.',
'critical'),

-- 17
('Boiler Annual Service', 'Gas Safety Regulations 1998; manufacturer requirements', 'gas', 'Boilers', 'annually', 'Gas Safe Registered Engineer', true, true, true,
'Full service of all gas boilers including combustion analysis, flue integrity check, burner cleaning, controls check, and safety device testing. Must be performed by Gas Safe engineer. Service record retained. Often combined with CP42 inspection.',
'Boiler failure causing CO exposure. Loss of heating affecting school operation. Criminal liability if not maintained to Gas Safety Regulations.',
'critical'),

-- 18
('Carbon Monoxide Detector Maintenance', 'Building Regulations Part J; best practice', 'gas', 'CO Detection', 'weekly', 'Site Manager', false, false, true,
'Weekly functional test of CO detectors (press test button). Replace batteries annually. Replace detector units per manufacturer instructions (typically 5-7 years). Record all tests. CO detectors required in rooms with gas appliances under Building Regs.',
'Undetected carbon monoxide leak. CO is odourless and colourless — can be fatal. Failure to maintain required detectors is a regulatory breach.',
'high'),

-- 19
('Gas Tightness Test', 'IGEM/UP/1A; Gas Safety Regulations 1998', 'gas', 'Gas Pipework', 'annually', 'Gas Safe Registered Engineer', true, true, true,
'Test of the gas pipework installation for leaks using pressure test methods. Usually done as part of the annual CP42 inspection. Any leaks detected must be repaired immediately. Emergency procedures if gas escape detected.',
'Gas explosion risk. Carbon monoxide risk. Criminal prosecution. Insurance invalidation. Potential for mass casualty incident in a school setting.',
'critical'),

-- ============================================================================
-- ASBESTOS (6 checks)
-- ============================================================================

-- 20
('Asbestos Management Survey', 'Control of Asbestos Regulations 2012; HSE guidance HSG264', 'asbestos', 'Survey', 'as_needed', 'UKAS-accredited Surveyor', true, true, true,
'Initial management survey to identify and record the location, extent, and condition of asbestos-containing materials (ACMs). Required for all buildings built before 2000. Must be conducted by UKAS-accredited surveyor. Results form the basis of the Asbestos Management Plan.',
'Criminal prosecution under CAR 2012. Fines up to unlimited. Imprisonment up to 2 years. HSE enforcement notice. Asbestos exposure can cause mesothelioma (fatal). Massive compensation claims.',
'critical'),

-- 21
('Asbestos Annual Condition Re-Inspection', 'Control of Asbestos Regulations 2012, Reg 4', 'asbestos', 'Condition Monitoring', 'annually', 'Competent Person', true, false, true,
'Annual re-inspection of all known asbestos-containing materials to assess their condition. Check for damage, deterioration, or disturbance. Update the asbestos register with current condition scores. Prioritise remedial action for any materials showing deterioration.',
'Deteriorating ACMs may release fibres without detection. Non-compliance with duty to manage. HSE enforcement. Potential exposure of staff and children.',
'critical'),

-- 22
('Refurbishment & Demolition Survey (R&D Survey)', 'Control of Asbestos Regulations 2012; HSG264', 'asbestos', 'Survey', 'as_needed', 'UKAS-accredited Surveyor', true, true, true,
'Required before any refurbishment, maintenance, or demolition work that may disturb the building fabric. More intrusive than management survey — may involve destructive inspection. Must be done BEFORE contractors start work. Results determine safe working methods.',
'Work may disturb unknown ACMs, exposing workers and occupants. Criminal prosecution. HSE prohibition notice stopping all work. Massive cleanup costs.',
'critical'),

-- 23
('Asbestos Management Plan Review', 'Control of Asbestos Regulations 2012, Reg 4', 'asbestos', 'Management Plan', '6_monthly', 'Site Manager / Headteacher', false, false, true,
'Review the Asbestos Management Plan every 6 months. Ensure the asbestos register is up to date. Check that labels and warning signs are in place. Verify contractor sign-in procedures reference asbestos locations. Update following any building work or re-survey.',
'Outdated management plan means contractors may not know where ACMs are. Regulatory non-compliance. Potential exposure incident.',
'high'),

-- 24
('Contractor Asbestos Briefing', 'Control of Asbestos Regulations 2012, Reg 4(10)', 'asbestos', 'Contractor Management', 'as_needed', 'Site Manager', false, false, true,
'Before any contractor begins work that could disturb building fabric, they MUST be shown the asbestos register and sign to confirm they have been briefed. This applies to maintenance, refurbishment, and installation work. Log the briefing.',
'Contractors may drill into or disturb ACMs without knowing. Criminal liability on the duty holder. HSE enforcement. Potential exposure of contractors and building occupants.',
'critical'),

-- 25
('Asbestos Awareness Training', 'Control of Asbestos Regulations 2012, Reg 10', 'asbestos', 'Training', 'annually', 'Headteacher', false, false, true,
'Annual awareness training for all staff who may come into contact with or disturb asbestos during their normal work (site team, caretakers, cleaners). Training covers: what asbestos is, where it might be found, what to do if you find it, emergency procedures.',
'Untrained staff may unknowingly disturb ACMs. Non-compliance with CAR 2012 training requirements. HSE enforcement.',
'high'),

-- ============================================================================
-- LEGIONELLA / WATER (9 checks)
-- ============================================================================

-- 26
('Legionella Risk Assessment', 'HSE ACoP L8; HSG274 Parts 1-3', 'legionella_water', 'Risk Assessment', '2_yearly', 'External Water Treatment Specialist', true, true, true,
'Comprehensive risk assessment of the entire water system by a competent water treatment specialist. Covers hot and cold systems, cooling towers, spas, decorative fountains. Identifies risks and specifies control measures. Full reassessment every 2 years.',
'Legionella outbreak causing Legionnaires disease (potentially fatal). Criminal prosecution under Health and Safety at Work Act. HSE enforcement. Massive compensation claims. School closure.',
'critical'),

-- 27
('Hot Water Monthly Temperature Checks', 'HSE L8 paras 157-158; HSG274', 'legionella_water', 'Temperature Monitoring', 'monthly', 'Site Manager', false, false, true,
'Measure and record hot water temperatures at sentinel outlets (nearest and furthest from the calorifier). Hot water should be stored at 60°C+ and distributed at 50°C+ within one minute of running. Investigate and act on any readings below thresholds.',
'Water stored below 60°C supports legionella growth. Failure to monitor is non-compliance with L8. Potential outbreak leading to prosecution.',
'high'),

-- 28
('Cold Water Monthly Temperature Checks', 'HSE L8 paras 157-158; HSG274', 'legionella_water', 'Temperature Monitoring', 'monthly', 'Site Manager', false, false, true,
'Measure and record cold water temperatures at sentinel outlets (nearest and furthest from the storage tank). Cold water should be below 20°C (ideally below 15°C). Investigate warm readings — may indicate inadequate insulation, proximity to heat sources, or system issues.',
'Cold water above 20°C supports legionella growth. Non-compliance with L8. Investigation needed if persistently warm.',
'high'),

-- 29
('Weekly Flushing of Low-Use Outlets', 'HSE L8 para 155; HSG274', 'legionella_water', 'Flushing', 'weekly', 'Site Manager / Caretaker', false, false, true,
'Flush all outlets (taps, showers) that have not been used for 7+ days by running water for at least 2 minutes. Record which outlets were flushed and the date. Particularly important during school holidays. Identify and consider removing dead legs.',
'Stagnant water in low-use outlets is a primary legionella risk. Non-compliance with L8. Potential outbreak from a single unused shower.',
'high'),

-- 30
('Quarterly Showerhead Clean and Descale', 'HSG274 Part 2', 'legionella_water', 'Shower Maintenance', 'termly', 'Site Manager / Caretaker', false, false, true,
'Remove, clean, and descale all showerheads and hoses. Biofilm and scale in showerheads is a significant legionella risk as the shower produces aerosols which can be inhaled. Replace any showerheads that cannot be adequately cleaned.',
'Showerheads with biofilm/scale create ideal legionella conditions and generate aerosols for inhalation — the primary infection route.',
'high'),

-- 31
('TMV (Thermostatic Mixing Valve) Service', 'HTM 04-01; HSG274; Building Regs Part G', 'legionella_water', 'TMV Maintenance', '6_monthly', 'Competent Plumber', true, false, true,
'Service and test all TMVs (used to prevent scalding at accessible outlets). Check inlet and outlet temperatures, failsafe operation, and strainer/filter condition. TMVs can harbour legionella if not maintained — water sits at ideal growth temperature in the mixing chamber.',
'TMV failure can cause scalding (especially children). Unmaintained TMVs are a legionella risk. Non-compliance with HTM 04-01.',
'high'),

-- 32
('Cold Water Storage Tank Annual Inspection', 'HSG274 Part 2; Water Supply (Water Fittings) Regulations 1999', 'legionella_water', 'Storage Tank', 'annually', 'External Contractor', true, false, true,
'Annual inspection of cold water storage tanks: check lid is secure and insect-proof, insulation is intact, no debris or contamination, overflow is screened, water turnover is adequate, no dead legs connected. Clean tank if contaminated.',
'Contaminated cold water tank introduces bacteria to entire cold water system. Non-compliance with water regulations and L8.',
'high'),

-- 33
('Calorifier Annual Inspection', 'HSG274 Part 2', 'legionella_water', 'Hot Water System', 'annually', 'External Contractor', true, false, true,
'Annual inspection of calorifiers (hot water cylinders): check stored water temperature (60°C+), inspect anode condition, check for stratification, assess thermal insulation, inspect drain valve. De-sludge if necessary.',
'Calorifier operating below 60°C is a primary legionella risk. Sediment build-up provides nutrients for bacterial growth.',
'high'),

-- 34
('Legionella Sampling', 'HSG274; risk assessment recommendation', 'legionella_water', 'Water Testing', 'termly', 'External Laboratory', true, true, false,
'Water sampling for legionella bacteria at representative outlets. Not strictly statutory but strongly recommended by risk assessors and insurers. Results above 100 CFU/L require investigation; above 1000 CFU/L requires immediate remedial action. Retain results for 5 years.',
'Without sampling, legionella colonisation may go undetected until an outbreak occurs. Recommended by HSE and most risk assessors.',
'medium'),

-- ============================================================================
-- LOLER — LIFTING (3 checks)
-- ============================================================================

-- 35
('Passenger Lift Thorough Examination', 'Lifting Operations and Lifting Equipment Regulations 1998 (LOLER)', 'loler_lifting', 'Passenger Lift', '6_monthly', 'Insurance Engineer / Competent Person', true, true, true,
'Thorough examination by a competent person (typically insurance company engineer) every 6 months for passenger lifts. Covers all safety-critical components: suspension, brakes, doors, interlocks, car, shaft, landing doors, emergency systems. Written report within 28 days.',
'Criminal prosecution under LOLER. HSE enforcement notice or prohibition notice (lift taken out of service). Insurance invalidation. Potential fatal accident.',
'critical'),

-- 36
('Goods Lift / Service Lift Annual Examination', 'LOLER 1998', 'loler_lifting', 'Goods Lift', 'annually', 'Insurance Engineer / Competent Person', true, true, true,
'Annual thorough examination for goods lifts and service lifts not carrying persons. Covers structural integrity, safety devices, controls, and operational testing. If any lift could carry persons even occasionally, 6-monthly examination applies instead.',
'Criminal prosecution under LOLER. Equipment could fail causing injury. Insurance invalidation.',
'high'),

-- 37
('Other Lifting Equipment Examination', 'LOLER 1998', 'loler_lifting', 'Lifting Equipment', '6_monthly', 'Insurance Engineer / Competent Person', true, true, true,
'Thorough examination of all other lifting equipment: hoists (including disabled access hoists), tail lifts on vehicles, mobile elevating work platforms, chains, slings, shackles. 6-monthly if used to lift persons, annually otherwise.',
'LOLER prosecution. Equipment failure causing injury or death. Insurance invalidation. Particular risk with disabled access hoists in schools.',
'high'),

-- ============================================================================
-- PSSR — PRESSURE SYSTEMS (2 checks)
-- ============================================================================

-- 38
('Written Scheme of Examination', 'Pressure Systems Safety Regulations 2000 (PSSR)', 'pssr_pressure', 'Documentation', 'as_needed', 'Competent Person / Insurance Engineer', true, true, true,
'A written scheme of examination must be prepared by a competent person for all pressure systems. Covers boilers, pressurised hot water systems, air receivers, autoclaves. The scheme specifies what parts to examine, the nature of examination, and intervals. Must be in place BEFORE the system is used.',
'Criminal prosecution under PSSR. Pressure vessel explosion (potentially catastrophic). HSE prohibition notice. Insurance invalidation.',
'critical'),

-- 39
('Pressure Vessel Examination', 'Pressure Systems Safety Regulations 2000', 'pssr_pressure', 'Pressure Vessels', 'annually', 'Insurance Engineer / Competent Person', true, true, true,
'Examination of pressure vessels according to the written scheme — typically every 14 months for steam systems, annually for others. Covers boilers, calorifiers, expansion vessels, compressed air receivers. Report within 28 days. Defects graded by severity.',
'Pressure vessel failure can cause explosion with fatalities. Criminal prosecution under PSSR. Immediate prohibition notice.',
'critical'),

-- ============================================================================
-- PUWER — EQUIPMENT (3 checks)
-- ============================================================================

-- 40
('Workshop Equipment Annual Inspection', 'Provision and Use of Work Equipment Regulations 1998 (PUWER)', 'puwer_equipment', 'Workshop Equipment', 'annually', 'Competent Person', true, false, true,
'Annual inspection of all work equipment including DT workshop machinery, grounds maintenance equipment, kitchen equipment. Check guards are in place, emergency stops work, condition is safe. Particular attention to woodworking and metalworking machines in DT workshops.',
'Injury from unguarded or poorly maintained equipment. Criminal prosecution under PUWER. HSE enforcement. Employer liability claims.',
'high'),

-- 41
('Kitchen Equipment Annual Service', 'PUWER 1998; Food Safety Act 1990', 'puwer_equipment', 'Kitchen Equipment', 'annually', 'External Contractor', true, true, true,
'Annual service of all commercial kitchen equipment: ovens, fryers, dishwashers, mixers, slicers, extraction hoods. Check safety interlocks, guarding, electrical connections, gas connections (if applicable). Gas equipment requires Gas Safe engineer.',
'Equipment failure causing injury or fire. Non-compliance with PUWER and food safety regulations. Environmental health enforcement.',
'high'),

-- 42
('Grounds Maintenance Equipment Inspection', 'PUWER 1998; HSE guidance', 'puwer_equipment', 'Grounds Equipment', 'annually', 'Site Manager / External Contractor', true, false, true,
'Annual inspection of all grounds maintenance equipment: mowers (ride-on and pedestrian), strimmers, hedge cutters, chainsaws, blowers. Check blade guards, safety switches, vibration levels. Ensure operators have appropriate training and PPE.',
'Injury from poorly maintained grounds equipment. PUWER prosecution. Particular risk from unguarded blades and high-vibration tools.',
'high'),

-- ============================================================================
-- COSHH — HAZARDOUS SUBSTANCES (4 checks)
-- ============================================================================

-- 43
('COSHH Assessments Review', 'Control of Substances Hazardous to Health Regulations 2002', 'coshh_hazardous', 'COSHH Assessments', 'annually', 'Site Manager / Science Technician', false, false, true,
'Review and update COSHH assessments for all hazardous substances used in the school: cleaning chemicals, science chemicals, DT materials, art materials, grounds chemicals, swimming pool chemicals. Ensure safety data sheets are current and accessible.',
'Criminal prosecution under COSHH Regulations. HSE enforcement. Staff or pupil exposure to hazardous substances. Compensation claims.',
'high'),

-- 44
('COSHH Inventory Maintenance', 'COSHH 2002', 'coshh_hazardous', 'Inventory', 'termly', 'Site Manager', false, false, true,
'Maintain an up-to-date inventory of all hazardous substances stored on site. Check quantities against maximum storage limits. Dispose of expired or unnecessary chemicals. Verify storage conditions meet SDS requirements (ventilation, segregation, temperature).',
'Incorrect storage can cause chemical reactions, fire, or exposure. Non-compliance with COSHH. Environmental contamination from improper disposal.',
'medium'),

-- 45
('LEV (Local Exhaust Ventilation) Examination', 'COSHH 2002, Reg 9; HSE guidance HSG258', 'coshh_hazardous', 'Ventilation', 'annually', 'External Contractor', true, true, true,
'Thorough examination and test of all local exhaust ventilation systems every 14 months (annually recommended). Covers DT workshop extraction (wood dust, fumes), science fume cupboards, art kilns, kitchen extraction. Competent examiner must provide written report.',
'Wood dust exposure above WEL causes respiratory disease. Criminal prosecution under COSHH. HSE enforcement notice. Compensation claims from affected staff.',
'high'),

-- 46
('PPE Assessment and Checks', 'Personal Protective Equipment at Work Regulations 1992; COSHH 2002', 'coshh_hazardous', 'PPE', 'termly', 'Site Manager / Department Heads', false, false, true,
'Assess PPE provision across the school: science goggles, DT workshop PPE (goggles, ear defenders, gloves), cleaning PPE, grounds PPE. Check PPE condition, replace worn items, ensure correct sizes available. Verify PPE is appropriate for the hazard.',
'Inadequate PPE leads to injury or exposure. Non-compliance with PPE Regulations. Employer liability.',
'medium'),

-- ============================================================================
-- WORKING AT HEIGHT (3 checks)
-- ============================================================================

-- 47
('Working at Height Risk Assessment', 'Work at Height Regulations 2005', 'working_at_height', 'Risk Assessment', 'annually', 'Site Manager / Headteacher', false, false, true,
'Annual review of all working at height activities: roof access, gutter cleaning, changing light bulbs/projector lamps, window cleaning, tree work, staging for events. Ensure hierarchy of controls is applied: avoid, prevent, minimise. Update for any new activities.',
'Falls from height are the largest cause of workplace deaths. Criminal prosecution under Work at Height Regulations. HSE enforcement. Employer liability.',
'high'),

-- 48
('Ladder and Step Inspection', 'Work at Height Regulations 2005; HSE guidance', 'working_at_height', 'Access Equipment', 'termly', 'Site Manager', false, false, true,
'Inspect all ladders, step ladders, kick stools, and mobile access towers. Check for damage, corrosion, missing feet, bent rungs. Remove defective equipment from service. Verify each item has an asset tag and is recorded. Only use ladders for short-duration, low-risk work.',
'Defective ladders cause falls. HSE enforcement. Work at Height prosecution. Insurance implications if defective equipment used.',
'medium'),

-- 49
('Roof and High-Level Access Review', 'Work at Height Regulations 2005; CDM Regulations 2015', 'working_at_height', 'Roof Access', 'annually', 'External Contractor / Surveyor', true, false, true,
'Annual review of roof access arrangements: edge protection, roof lights (fragile roof marking), anchor points, access hatches, safety signage. Verify roof light covers/guards are in place. Check if any contractors need roof access and safe systems are in place.',
'Falls through fragile roofs (especially roof lights) are a common cause of death. Criminal prosecution. HSE prohibition notice.',
'high'),

-- ============================================================================
-- WORKPLACE GENERAL (5 checks)
-- ============================================================================

-- 50
('Health and Safety Policy Annual Review', 'Health and Safety at Work Act 1974', 'workplace_general', 'Policy', 'annually', 'Headteacher / Governing Body', false, false, true,
'Annual review and update of the school health and safety policy. Must include the statement of intent (signed by headteacher/chair of governors), organisation section (responsibilities), and arrangements section (procedures). Communicate changes to all staff.',
'Criminal prosecution under HSWA 1974. HSE enforcement. Lack of policy is a fundamental compliance failure.',
'high'),

-- 51
('First Aid Assessment and Equipment Check', 'Health and Safety (First-Aid) Regulations 1981', 'workplace_general', 'First Aid', 'termly', 'School Business Manager', false, false, true,
'Review first aid provision: sufficient trained first aiders for staff/pupil numbers, first aid kits stocked and in date, automated external defibrillator (AED) maintained and accessible, accident book available, first aid room suitable. Check expiry dates on all supplies.',
'Inadequate first aid provision risks lives. Non-compliance with First Aid Regulations. Employer liability if someone is not treated promptly.',
'high'),

-- 52
('Display Screen Equipment (DSE) Assessment', 'Health and Safety (Display Screen Equipment) Regulations 1992', 'workplace_general', 'DSE', 'annually', 'School Business Manager', false, false, true,
'Assessment of workstations for all habitual DSE users (typically office staff, admin, teachers with significant computer use). Check screen position, chair adjustment, desk height, lighting, breaks policy. Arrange eye tests for eligible staff on request.',
'Musculoskeletal disorders, eye strain, headaches. Non-compliance with DSE Regulations. Employer liability claims.',
'low'),

-- 53
('Occupational Health Surveillance', 'Management of Health and Safety at Work Regulations 1999; various substance-specific regs', 'workplace_general', 'Occupational Health', 'annually', 'Headteacher / HR', false, false, true,
'Health surveillance for staff exposed to specific hazards: wood dust (DT teachers), noise (music/DT), vibration (grounds staff), chemicals (science technicians, cleaners). Includes audiometry, lung function testing, skin checks as appropriate.',
'Occupational disease may develop undetected. Non-compliance with specific health surveillance requirements. Employer liability. Compensation claims.',
'medium'),

-- 54
('Workplace Inspection (General)', 'Workplace (Health, Safety and Welfare) Regulations 1992', 'workplace_general', 'Premises', 'termly', 'Site Manager / Safety Representative', false, false, true,
'General workplace inspection covering: temperature, ventilation, lighting, cleanliness, floor condition, traffic routes, sanitary facilities, rest areas, drinking water. Use a structured checklist. Record findings and track remedial actions to completion.',
'General deterioration of workplace conditions. Non-compliance with Workplace Regulations. HSE enforcement on specific issues.',
'medium'),

-- ============================================================================
-- CDM — CONSTRUCTION (2 checks)
-- ============================================================================

-- 55
('Construction Phase Plan Review', 'Construction (Design and Management) Regulations 2015', 'cdm_construction', 'Project Management', 'as_needed', 'Principal Contractor / CDM Adviser', true, false, true,
'For any construction, refurbishment, or maintenance project: ensure a construction phase plan is in place before work begins. The plan must address site-specific risks, access arrangements, welfare facilities, emergency procedures, and coordination with school activities.',
'Criminal prosecution under CDM Regulations. Work must not start without a plan. HSE prohibition notice. School liable as client.',
'high'),

-- 56
('Asbestos Survey Before Works (Pre-Refurbishment)', 'CDM 2015; Control of Asbestos Regulations 2012', 'cdm_construction', 'Asbestos Management', 'as_needed', 'UKAS-accredited Surveyor', true, true, true,
'Before ANY building work that could disturb the fabric of a pre-2000 building, a refurbishment and demolition (R&D) asbestos survey must be completed for the work area. Results determine safe working methods and whether licensed removal is needed.',
'Asbestos exposure from construction work. Criminal prosecution under both CDM and CAR. Work stoppage. Massive decontamination costs. Health claims.',
'critical'),

-- ============================================================================
-- PLAYGROUND (4 checks)
-- ============================================================================

-- 57
('Playground Daily Visual Inspection', 'BS EN 1176; HSE guidance', 'playground', 'Daily Check', 'daily', 'Site Manager / Caretaker', false, false, true,
'Daily visual check of all playground equipment and surfaces before children use them. Look for: broken or missing parts, sharp edges, entrapment hazards, litter (glass, needles), animal fouling, trip hazards, waterlogging. Remove hazards or close equipment.',
'Child injury from defective equipment or hazardous surface. Employer/occupier liability. Negligence claim if inspection not done.',
'high'),

-- 58
('Playground Operational (Weekly/Monthly) Inspection', 'BS EN 1176; RoSPA guidance', 'playground', 'Routine Inspection', 'weekly', 'Site Manager', false, false, true,
'More detailed inspection of all playground equipment: check fixings, chains, ropes, bearings, moving parts, structural integrity, surface condition. Test equipment functionality. Record findings. More thorough than daily visual — look underneath and behind.',
'Structural failure not caught by daily visual check. Component wear leading to collapse. Child injury.',
'high'),

-- 59
('Playground Annual Inspection', 'BS EN 1176; BS EN 1177', 'playground', 'Annual Inspection', 'annually', 'Registered Playground Inspector (RPII)', true, true, true,
'Annual comprehensive inspection by a registered playground inspector (RPII qualified). Covers all installed equipment against BS EN 1176 standards and impact-absorbing surfaces against BS EN 1177. Written report with risk ratings. Must include measurements and photographs.',
'Non-compliance with BS EN standards. Equipment may not meet current safety requirements. Liability if child is injured on un-inspected equipment. Insurance requirement.',
'high'),

-- 60
('Playground Surface (Impact Absorbing) Test', 'BS EN 1177', 'playground', 'Safety Surface', '3_yearly', 'External Testing Company', true, true, false,
'Critical Fall Height (CFH) testing of impact-absorbing playground surfaces using HIC (Head Injury Criterion) methodology. Ensures surfaces adequately cushion falls from the maximum fall height of adjacent equipment. Rubber, bark, and wet-pour all degrade over time.',
'Surface that has hardened or thinned will not adequately protect children from falls. Head injuries. Negligence if surface is known to be deficient.',
'high'),

-- ============================================================================
-- KITCHEN / CATERING (5 checks)
-- ============================================================================

-- 61
('Food Hygiene Rating Inspection Preparation', 'Food Safety Act 1990; Food Hygiene Regulations 2006', 'kitchen_catering', 'Food Hygiene', 'annually', 'Kitchen Manager / Headteacher', false, false, true,
'Prepare for Environmental Health inspection. Ensure: HACCP documentation is current, food temperature records are complete, cleaning schedules are followed, staff training certificates are available, allergen management procedures are documented, pest control records are accessible.',
'Environmental health enforcement. Food hygiene rating below 5 is reputational damage. Formal action possible including closure of kitchen. Criminal prosecution for serious breaches.',
'high'),

-- 62
('Kitchen Deep Clean', 'Food Safety Act 1990; Food Hygiene Regulations 2006', 'kitchen_catering', 'Cleaning', 'termly', 'Kitchen Manager / Contract Cleaner', false, false, true,
'Thorough deep clean of the entire kitchen including: extraction canopy and filters, behind and underneath all equipment, walls, ceilings, floors, drains, storage areas. More thorough than daily cleaning schedule. Consider professional deep clean at least annually.',
'Accumulated grease is a fire risk and hygiene hazard. Environmental health inspection failure. Pest attraction.',
'medium'),

-- 63
('Kitchen Extraction System Service', 'TR19 Grease; DW/172; Building Regulations', 'kitchen_catering', 'Ventilation', 'annually', 'External Contractor', true, true, true,
'Professional clean and inspection of kitchen extraction system including canopy, ductwork, and fan. Grease build-up in extract ductwork is a significant fire risk. Inspection and cleaning to TR19 Grease standard. Certificate of cleanliness issued.',
'Kitchen fire from grease-laden ductwork. Insurance invalidation if extract system not maintained. TR19 compliance is typically an insurance requirement.',
'high'),

-- 64
('Food Temperature Monitoring', 'Food Safety Act 1990; HACCP principles', 'kitchen_catering', 'Temperature Control', 'daily', 'Kitchen Staff', false, false, true,
'Daily recording of fridge/freezer temperatures (opening check), food delivery temperatures, cooking temperatures (core temp 75°C+), hot holding temperatures (63°C+), and cooling records. Calibrate thermometers monthly. Act immediately on out-of-range readings.',
'Foodborne illness affecting pupils and staff. Environmental health enforcement. Criminal prosecution for serious food safety failures.',
'high'),

-- 65
('Allergen Management Review', 'EU FIC Regulation 1169/2011 (retained in UK law); Natasha''s Law 2021', 'kitchen_catering', 'Allergens', 'termly', 'Kitchen Manager', false, false, true,
'Review allergen management: verify 14 allergen declarations on all menus, check PPDS (prepacked for direct sale) labelling compliance (Natasha''s Law), review individual pupil allergy action plans, check staff training is current, test allergen communication procedures.',
'Anaphylaxis (potentially fatal). Criminal prosecution. Natasha''s Law penalties. Massive reputational damage. Civil litigation.',
'critical'),

-- ============================================================================
-- TREES & GROUNDS (3 checks)
-- ============================================================================

-- 66
('Tree Survey and Risk Assessment', 'Occupiers'' Liability Act 1957/1984; HSE guidance', 'trees_grounds', 'Trees', '3_yearly', 'Arboricultural Consultant', true, true, true,
'Professional tree survey of all trees on the school site by a qualified arboriculturalist. Assess: condition, stability, disease, proximity to buildings and play areas, dead wood, root damage. Categorise trees by risk. Schedule remedial work (pruning, felling, monitoring).',
'Falling tree or branch causing injury or death. Occupiers'' liability if known risks not managed. Insurance claims. Falling trees can also damage buildings.',
'high'),

-- 67
('Grounds Condition Inspection', 'Occupiers'' Liability Act 1957/1984', 'trees_grounds', 'Playing Fields', 'termly', 'Site Manager / PE Lead', false, false, true,
'Inspect playing fields and hard courts: check surface condition, drainage, trip hazards, goal post stability and anchorage (free-standing goals MUST be anchored), perimeter fencing, litter. Check for hazardous items (glass, metal, needles). Record and act on findings.',
'Child injury from poorly maintained surfaces or unstable goal posts. Free-standing goal posts have caused fatalities. Occupiers'' liability.',
'high'),

-- 68
('Boundary Fence and Gate Inspection', 'DfE guidance on school security; Occupiers'' Liability Acts', 'trees_grounds', 'Security Perimeter', 'termly', 'Site Manager', false, false, true,
'Inspect all boundary fences, walls, and gates: check structural integrity, gaps or damage, self-closing mechanisms on pedestrian gates, vehicle gate operation, padlock condition, anti-climb features. Report and repair any breaches promptly.',
'Safeguarding risk: unauthorized access to school grounds. Child leaving site unnoticed. Occupiers'' liability for boundary failure causing injury.',
'high'),

-- ============================================================================
-- INSURANCE (2 checks)
-- ============================================================================

-- 69
('Insurance Policy Annual Review', 'Education Act; employer responsibilities', 'insurance', 'Policy Review', 'annually', 'School Business Manager / Headteacher', false, false, true,
'Annual review of all insurance policies before renewal: employer''s liability (legal minimum), public liability, building and contents, personal accident, travel, engineering inspection, governors'' liability, cyber insurance. Ensure cover matches current risks and values.',
'Inadequate cover leaving school exposed to uninsured losses. Expired employer''s liability is a criminal offence. Gaps in cover could bankrupt the school.',
'high'),

-- 70
('Engineering Insurance Inspection Programme', 'LOLER, PSSR, Electricity at Work Regulations', 'insurance', 'Engineering Inspections', 'annually', 'School Business Manager', false, false, true,
'Confirm the engineering insurance programme covers all statutory inspections: lifts (LOLER), pressure systems (PSSR), electrical installations, local exhaust ventilation. Verify inspection schedules are current and all reports have been received and actioned.',
'Statutory inspections missed if not tracked. Double jeopardy: non-compliance with specific regulations AND insurance cover may be void.',
'high'),

-- ============================================================================
-- ACCESSIBILITY (3 checks)
-- ============================================================================

-- 71
('Accessibility Audit', 'Equality Act 2010; DfE accessibility planning duties', 'accessibility', 'Audit', '3_yearly', 'Access Consultant / SENCO', true, true, true,
'Comprehensive accessibility audit of the school premises covering: wheelchair access (ramps, lifts, door widths), sensory impairments (hearing loops, visual contrast, signage), toilets, parking, emergency evacuation for disabled persons, furniture, outdoor areas.',
'Discrimination claim under Equality Act 2010. Failure in anticipatory duty. DfE compliance concern. Inability to accommodate pupils or staff with disabilities.',
'high'),

-- 72
('Disabled Refuge / PEEP Review', 'RRO 2005; Equality Act 2010; BS 9999', 'accessibility', 'Emergency Evacuation', 'annually', 'Site Manager / SENCO', false, false, true,
'Review Personal Emergency Evacuation Plans (PEEPs) for all pupils and staff with disabilities. Check disabled refuges are clearly marked, unobstructed, and communication systems work. Update PEEPs when circumstances change. Practice evacuation with disabled persons.',
'Disabled person trapped during evacuation. Discrimination claim. Criminal liability under RRO 2005 (failure to plan for all occupants).',
'high'),

-- 73
('Hearing Loop / Assistive Technology Check', 'Equality Act 2010; BS EN 60118-4', 'accessibility', 'Assistive Technology', 'termly', 'Site Manager / IT Lead', false, false, true,
'Test all hearing (induction) loops in offices, reception, hall, and classrooms. Check field strength meets BS EN 60118-4 standard. Verify assistive listening devices are working. Check that signage indicating loop availability is displayed.',
'Failure in reasonable adjustment duty under Equality Act. Exclusion of hearing-impaired visitors, parents, staff, or pupils.',
'medium'),

-- ============================================================================
-- LIGHTNING PROTECTION (2 checks)
-- ============================================================================

-- 74
('Lightning Protection System Test', 'BS EN 62305; Building Regulations', 'lightning', 'Lightning Conductor', 'annually', 'External Contractor', true, true, true,
'Annual visual inspection and electrical test of the lightning protection system (if installed). Measure earth resistance of each earth termination. Check all conductors, bonds, and fixings. Verify any additions/modifications to the building have been bonded into the system.',
'Lightning strike causing fire, structural damage, or injury. Non-compliance with BS EN 62305. Insurance may require evidence of testing.',
'medium'),

-- 75
('Lightning Risk Assessment', 'BS EN 62305-2', 'lightning', 'Risk Assessment', '5_yearly', 'Lightning Protection Specialist', true, true, false,
'Risk assessment to determine whether lightning protection is required and the appropriate level of protection. Consider building height, location, construction, contents, and occupancy. Reassess if building is extended or use changes significantly.',
'Unprotected building at risk of lightning strike. Fire, structural damage. Particular risk for tall buildings, spires, or buildings in exposed locations.',
'low'),

-- ============================================================================
-- RADON (2 checks)
-- ============================================================================

-- 76
('Radon Testing', 'PHE/UKHSA guidance; Ionising Radiations Regulations 2017', 'radon', 'Radon Monitoring', '3_yearly', 'External Testing Service', true, true, true,
'Radon testing using passive detectors deployed for 3 months (preferably October-March). Required in radon Affected Areas. Action level: 300 Bq/m³ for workplaces (schools). If above, install radon mitigation (sump and fan). Re-test every 3 years and after mitigation.',
'Radon is the second largest cause of lung cancer after smoking. Non-compliance with workplace exposure limits. HSE enforcement. Duty of care to staff and pupils.',
'high'),

-- 77
('Radon Mitigation System Check', 'PHE/UKHSA guidance', 'radon', 'Mitigation', 'annually', 'Site Manager', false, false, true,
'If radon mitigation is installed (sump and fan system): check fan is running (listen/feel), check fan indicator, monitor electricity consumption, listen for unusual noise. Annual professional check of the system recommended. Re-test radon levels annually after installation.',
'Mitigation system failure allows radon to accumulate again. Radon exposure risk to all building occupants.',
'high'),

-- ============================================================================
-- OIL STORAGE (2 checks)
-- ============================================================================

-- 78
('Oil Storage Tank Inspection', 'Oil Storage Regulations 2001 (England); Building Regulations Part J', 'oil_storage', 'Oil Tank', 'annually', 'External Contractor / Site Manager', true, false, true,
'Annual inspection of oil storage tanks and associated pipework: check tank condition, bund integrity (must hold 110% of tank capacity), sight gauge, fill point, vent, filter, fire valve. Check for leaks, corrosion, vegetation encroachment. Oil tanks over 3500L require secondary containment.',
'Oil spill causing environmental pollution. Criminal prosecution under Environmental Damage Regulations. Clean-up costs can exceed £100,000. Insurance claim complications.',
'high'),

-- 79
('Oil Delivery and Usage Records', 'Oil Storage Regulations 2001; HMRC requirements', 'oil_storage', 'Records', 'monthly', 'Site Manager / Bursar', false, false, true,
'Maintain records of oil deliveries, usage, and stock levels. Cross-reference with heating degree days and previous years to identify unusual consumption (which may indicate a leak). Reconcile delivery notes with tank gauge readings.',
'Undetected slow leak causing gradual environmental contamination. Unexpected fuel costs from theft or waste. HMRC may query fuel usage.',
'low'),

-- ============================================================================
-- PEST CONTROL (2 checks)
-- ============================================================================

-- 80
('Pest Control Contract Review', 'Prevention of Damage by Pests Act 1949; Food Safety Act 1990', 'pest_control', 'Contract Management', 'annually', 'School Business Manager', false, false, true,
'Annual review of pest control contract and service frequency. Ensure coverage includes: rodents, insects (wasps, ants, cockroaches), birds. Review visit reports, bait station plans, activity logs. Increase frequency if activity detected. Kitchen areas require higher frequency.',
'Pest infestation causing food contamination, disease, building damage. Environmental health enforcement. Reputational damage. Ofsted safeguarding concern if pest issue affects children.',
'medium'),

-- 81
('Pest Activity Monitoring', 'Prevention of Damage by Pests Act 1949', 'pest_control', 'Monitoring', 'monthly', 'Site Manager / Caretaker', false, false, true,
'Monthly check for signs of pest activity: droppings, gnaw marks, grease marks, nesting materials, dead insects, unusual smells, damage to stored food/materials. Check bait stations are intact. Report any activity to pest control contractor immediately.',
'Early detection prevents infestation. Rodents can cause structural damage (gnawing wires causing fires). Health risk from droppings contaminating food preparation areas.',
'medium'),

-- ============================================================================
-- EMERGENCY PLANNING (3 checks)
-- ============================================================================

-- 82
('Emergency Plan Annual Review', 'Civil Contingencies Act 2004; DfE guidance', 'emergency_planning', 'Emergency Plan', 'annually', 'Headteacher', false, false, true,
'Annual review and update of the school emergency plan covering: evacuation, lockdown, severe weather, utility failure, pandemic, flooding, fire, bomb threat, intruder, IT failure. Update contact details, review mutual aid arrangements with neighbouring schools.',
'Uncoordinated emergency response putting lives at risk. DfE expects all schools to have emergency plans. Safeguarding failure.',
'high'),

-- 83
('Lockdown Drill', 'DfE guidance; counter-terrorism (PROTECT duty)', 'emergency_planning', 'Lockdown', 'annually', 'Headteacher', false, false, true,
'Annual lockdown drill (at minimum). Staff and age-appropriate pupils should know the signal, where to go, and what to do. Test communication systems. Review effectiveness and address gaps. Consider different scenarios (external threat, internal threat).',
'Staff and pupils unprepared for intruder or external threat. PROTECT duty (Martyn''s Law) will make this statutory. Safeguarding concern.',
'high'),

-- 84
('Business Continuity Plan Review', 'DfE guidance; good governance', 'emergency_planning', 'Business Continuity', 'annually', 'Headteacher / School Business Manager', false, false, true,
'Review the business continuity plan: arrangements for loss of building, loss of staff, IT failure, utility failure, supply chain disruption. Update remote learning provision. Test backup systems. Review with governing body.',
'Prolonged closure affecting pupil education. DfE expectation. Governance concern if plan does not exist.',
'medium'),

-- ============================================================================
-- BUILDING FABRIC (4 checks)
-- ============================================================================

-- 85
('Building Condition Survey', 'DfE Condition Data Collection; good estate management', 'building_fabric', 'Condition Survey', '5_yearly', 'Building Surveyor', true, true, true,
'Comprehensive condition survey of all school buildings: structure, roofs, walls, windows, doors, floors, ceilings, drainage. Grade each element by condition (A-D). Identify priorities for capital investment. Feeds into the asset management plan and CIF/SCA bids.',
'Undetected structural deterioration. Inability to bid for DfE capital funding without survey. Reactive rather than planned maintenance costs more. Building failure risk.',
'high'),

-- 86
('Flat Roof Inspection', 'Building Regulations; BS 6229', 'building_fabric', 'Roofing', '6_monthly', 'Site Manager / Roofing Contractor', false, false, true,
'Inspect flat roofs twice yearly (spring and autumn): check membrane condition, flashings, upstands, outlets, ponding, vegetation growth, debris accumulation, plant and equipment bases. Clear outlets and gutters. Check for signs of water ingress internally.',
'Water ingress causing ceiling collapse, electrical hazards, mould. Structural damage from prolonged water penetration. Disruption to teaching.',
'medium'),

-- 87
('Gutters and Drainage Inspection', 'Building Regulations; good maintenance practice', 'building_fabric', 'Drainage', '6_monthly', 'Site Manager / External Contractor', false, false, true,
'Inspect and clear all gutters, downpipes, gullies, and drainage channels twice yearly (ideally autumn and spring). Check for blockages, leaks, sagging, overflow evidence. Ensure below-ground drainage is flowing. CCTV survey of underground drains if problems suspected.',
'Blocked gutters cause water penetration, damp, and structural damage. Blocked drains cause flooding. Standing water attracts pests.',
'medium'),

-- 88
('Structural Movement Monitoring', 'Building Regulations; structural engineering guidance', 'building_fabric', 'Structure', 'annually', 'Site Manager / Structural Engineer', false, false, true,
'Monitor any known structural cracks or movement. Measure crack widths with tell-tales. Check for new cracking. Particular attention after extreme weather, nearby construction, or changes in ground conditions. Refer significant changes to structural engineer.',
'Undetected structural movement could lead to partial or full building collapse. Safety risk. Major capital expenditure if not caught early.',
'high'),

-- ============================================================================
-- SECURITY (3 checks)
-- ============================================================================

-- 89
('CCTV System Check and Compliance', 'Data Protection Act 2018 (UK GDPR); ICO CCTV Code of Practice; Protection of Freedoms Act 2012', 'security', 'CCTV', 'monthly', 'Site Manager / DPO', false, false, true,
'Monthly check that all CCTV cameras are operational, recording, and positioned correctly. Review data retention settings (typically 30 days). Ensure signage is displayed at all entry points. Verify DPIA has been completed. Check access controls for footage viewing.',
'ICO enforcement for non-compliant CCTV. Fines under UK GDPR. Footage inadmissible if system not properly managed. Safeguarding gaps if cameras are not working.',
'medium'),

-- 90
('Intruder Alarm Service', 'BS EN 50131; insurance requirements', 'security', 'Intruder Alarm', '6_monthly', 'External Contractor', true, true, true,
'Professional service and test of the intruder alarm system every 6 months. Check all sensors (PIR, door contacts, vibration), keypads, communication paths (dialler, monitoring station link), battery backup, tamper protection. Update user codes as needed.',
'Alarm failure during break-in. Insurance claim rejected without service records. Loss of equipment and data.',
'medium'),

-- 91
('Access Control System Review', 'DfE Keeping Children Safe in Education; school security guidance', 'security', 'Access Control', 'termly', 'Site Manager / Headteacher', false, false, true,
'Review access control: visitor sign-in procedures, ID badges, fob/key audit (recover from leavers), intercom/buzzer system, single point of entry during school hours, delivery management. Test door entry systems. Review DBS check records for regular visitors.',
'Safeguarding failure: unauthorized person accessing children. DfE/Ofsted critical finding. Criminal liability if preventable incident occurs.',
'high'),

-- ============================================================================
-- GROUNDS MAINTENANCE (3 checks)
-- ============================================================================

-- 92
('Japanese Knotweed / Invasive Species Survey', 'Wildlife and Countryside Act 1981; Anti-social Behaviour, Crime and Policing Act 2014', 'grounds_maintenance', 'Invasive Species', 'annually', 'Grounds Contractor / Ecologist', true, false, true,
'Annual survey for invasive species, particularly Japanese Knotweed, Giant Hogweed, and Himalayan Balsam. Japanese Knotweed can cause structural damage and is a criminal offence to allow to spread. Giant Hogweed sap causes severe burns — critical risk near children.',
'Criminal offence to cause Japanese Knotweed to spread in the wild. Giant Hogweed causes photosensitive burns (medical emergency). Structural damage from knotweed. Property devaluation.',
'high'),

-- 93
('Hard Surface Condition Inspection', 'Occupiers'' Liability Act 1957/1984', 'grounds_maintenance', 'Hard Surfaces', 'termly', 'Site Manager', false, false, true,
'Inspect all hard surfaces: playgrounds, car parks, paths, courtyards, ramps. Check for potholes, cracked tarmac, uneven paving, trip hazards, drainage issues, line markings. Prioritise repairs to high-traffic areas and routes used by wheelchair users.',
'Trip/fall injuries to pupils, staff, or visitors. Occupiers'' liability claims. Particular risk for wheelchair users and visually impaired.',
'medium'),

-- 94
('Car Park and Traffic Management Review', 'Workplace Transport Safety guidance (HSE); school travel plan obligations', 'grounds_maintenance', 'Traffic Management', 'annually', 'Site Manager / Headteacher', false, false, true,
'Review traffic management: separation of pedestrians and vehicles (especially at drop-off/pick-up), speed limits, signage, one-way systems, disabled parking, staff parking allocation, delivery vehicle routes. Review after any incidents or near-misses.',
'Vehicle-pedestrian collision in school grounds. HSE enforcement for workplace transport. Safeguarding concern if children at risk from vehicles.',
'high'),

-- ============================================================================
-- WATER & ENERGY (2 checks)
-- ============================================================================

-- 95
('Water Quality Testing (Drinking Water)', 'Water Supply (Water Quality) Regulations 2016; DWI guidance', 'water_energy', 'Water Quality', 'annually', 'External Testing Service', true, true, false,
'Annual testing of drinking water quality at taps used for drinking and food preparation. Test for bacteria (coliforms, E. coli), lead (in older buildings), pH, and turbidity. Particularly important in older buildings with lead pipework or galvanised steel tanks.',
'Contaminated drinking water causing illness. Particular risk from lead in older buildings. Parents and media highly sensitive to water quality in schools.',
'medium'),

-- 96
('Energy Performance Certificate (EPC/DEC)', 'Energy Performance of Buildings Regulations 2012', 'water_energy', 'Energy Performance', 'annually', 'Accredited Energy Assessor', true, true, true,
'Display Energy Certificate (DEC) required for public buildings over 250m². Must be displayed prominently. Valid for 1 year (DEC) with advisory report valid for 7 years. Shows actual energy use compared to benchmark. Schools should aim for at least a D rating.',
'Criminal offence not to display a valid DEC. Fixed penalty notice. Missed opportunity for energy cost savings. DfE may query energy spend.',
'medium'),

-- ============================================================================
-- VEHICLES (3 checks)
-- ============================================================================

-- 97
('Minibus Annual Inspection (Section 19/22)', 'Road Traffic Act 1988; Public Passenger Vehicles Act 1981', 'vehicles', 'Minibus', 'annually', 'Competent Vehicle Inspector', true, true, true,
'Annual inspection of school minibuses. Section 19 permit holders must ensure vehicles meet MOT-equivalent standards. Check brakes, tyres, lights, steering, bodywork, seatbelts, wheelchair access (if fitted). Maintain daily defect check log. Driver licence and training verification.',
'Criminal prosecution under road traffic legislation. Prohibition notice removing vehicle from road. Personal liability on driver and school. Fatal accident potential.',
'critical'),

-- 98
('Minibus Daily Defect Check', 'Road Traffic Act 1988; Highway Code', 'vehicles', 'Minibus', 'daily', 'Driver', false, false, true,
'Daily walk-around check before each journey: tyres (pressure, tread, damage), lights, mirrors, windscreen, wipers, fluid levels, seatbelts, wheelchair equipment, first aid kit, fire extinguisher, warning triangle. Record in defect book. Do not use vehicle if defect found.',
'Unroadworthy vehicle carrying children. Driver and operator liability. Criminal prosecution. Insurance invalidation.',
'high'),

-- 99
('Vehicle Insurance and Permit Review', 'Road Traffic Act 1988; Section 19 Permit conditions', 'vehicles', 'Administration', 'annually', 'School Business Manager', false, false, true,
'Annual review: vehicle insurance covers all intended use (including educational visits), Section 19 permit is valid, driver licences are current and appropriate (D1 or D1+E), driver training records are up to date. Keep copies of all driver licences.',
'Driving without valid permit is a criminal offence. Uninsured vehicle use is a criminal offence. Invalidated insurance means personal liability for any accident.',
'high'),

-- ============================================================================
-- ADMINISTRATION (4 checks)
-- ============================================================================

-- 100
('Compliance Register Annual Audit', 'Good governance; DfE guidance', 'administration', 'Compliance Register', 'annually', 'School Business Manager', false, false, true,
'Annual audit of the compliance register: verify all statutory inspections are scheduled, certificates are on file, overdue items are escalated. Cross-reference with insurance requirements. Report to governors/trustees on compliance status.',
'Missed statutory inspections. Unknown compliance gaps. Governance failure. Inability to demonstrate due diligence in the event of an incident.',
'high'),

-- 101
('Contractor Document Verification', 'CDM 2015; school duty of care', 'administration', 'Contractor Management', 'annually', 'Site Manager / Bursar', false, false, true,
'Annual review of all regular contractors: verify public liability insurance (minimum £5m), employer''s liability insurance, professional indemnity (where relevant), accreditations (Gas Safe, NICEIC, BAFE, etc.), DBS checks for staff working with children, risk assessments.',
'Using uninsured or unqualified contractors. Liability falls on school if contractor causes injury or damage. Safeguarding risk from unvetted individuals.',
'high'),

-- 102
('Health and Safety Training Matrix Review', 'Management of Health and Safety at Work Regulations 1999', 'administration', 'Training', 'annually', 'School Business Manager / HR', false, false, true,
'Review training matrix for all staff: first aid certification, fire marshal training, manual handling, working at height, COSHH awareness, asbestos awareness, food hygiene (kitchen staff), educational visits leader. Schedule renewal training before certificates expire.',
'Untrained staff performing safety-critical tasks. Non-compliance with multiple regulations. Personal liability in event of incident.',
'high'),

-- 103
('Accident and Incident Report Review', 'RIDDOR 2013; Social Security (Claims and Payments) Regulations 1979', 'administration', 'Incident Management', 'termly', 'Health and Safety Lead / Headteacher', false, false, true,
'Review all accident and incident reports from the term. Check RIDDOR reportable incidents were reported within required timescales. Identify trends (repeat locations, times, activities). Implement preventive measures. Report patterns to governors.',
'Failure to report under RIDDOR is a criminal offence. Trends not identified means repeat incidents. HSE investigation may reveal systematic failures.',
'high'),

-- ============================================================================
-- ADDITIONAL CHECKS TO REACH 150+ TOTAL
-- ============================================================================

-- FIRE SAFETY — Additional
-- 104
('Fire Alarm Annual Full Test', 'BS 5839-1:2017', 'fire_safety', 'Fire Alarm', 'annually', 'External Contractor', true, true, true,
'Annual comprehensive test of the entire fire alarm system including all detectors, call points, and sounders. Verify cause-and-effect programming. Test all building management system interfaces. More comprehensive than 6-monthly service.',
'System defects not detected by weekly tests. Non-compliance with BS 5839.',
'high'),

-- 105
('Dry Riser Annual Test', 'BS 9990:2015', 'fire_safety', 'Dry Riser', 'annually', 'External Contractor', true, true, true,
'Annual pressure test and inspection of dry riser system (if installed, typically multi-storey buildings). Test at 7 bar for 15 minutes. Check inlet, landing valves, signage, access. Essential for fire service access to upper floors.',
'Dry riser failure prevents fire service from fighting fire on upper floors. Insurance requirement where installed.',
'medium'),

-- ELECTRICAL — Additional
-- 106
('Lightning Protection Test', 'BS EN 62305', 'electrical', 'Lightning Protection', 'annually', 'External Contractor', true, true, true,
'Annual earth resistance test and visual inspection of lightning protection system. Check all air terminations, down conductors, earth electrodes, and bonds. Verify additions to building have been incorporated.',
'Lightning strike damage to building and occupants. Insurance requirement where system installed.',
'medium'),

-- LEGIONELLA — Additional
-- 107
('TMV Failsafe Test', 'HTM 04-01; Building Regs Part G', 'legionella_water', 'Scald Prevention', '6_monthly', 'Competent Plumber', true, false, true,
'Test TMV failsafe mechanism — if the cold water supply fails, the valve should shut off hot water to prevent scalding. Particularly critical in EYFS settings, SEN provisions, and changing areas.',
'TMV failure causing scalding injury, particularly to young or vulnerable children. Regulatory breach. Negligence liability.',
'high'),

-- WORKPLACE — Additional
-- 108
('Asbestos Register Availability Check', 'Control of Asbestos Regulations 2012', 'workplace_general', 'Asbestos', 'monthly', 'Site Manager', false, false, true,
'Monthly check that the asbestos register is readily available at reception for contractors and visitors. Verify sign-in procedure includes asbestos briefing requirement.',
'Contractors working without knowledge of ACM locations. Potential fibre release. Criminal liability on duty holder.',
'high'),

-- 109
('Noise Assessment (Music/DT)', 'Control of Noise at Work Regulations 2005', 'workplace_general', 'Noise', 'annually', 'Competent Person', true, false, true,
'Noise assessment in music rooms, DT workshops, and any other areas where noise levels may exceed 80dB (lower exposure action value). Provide hearing protection above 85dB (upper action value). Health surveillance (audiometry) for exposed staff.',
'Noise-induced hearing loss. Criminal prosecution under Noise Regulations. Compensation claims from staff. Required where daily exposure exceeds 80dB.',
'medium'),

-- 110
('Manual Handling Assessment', 'Manual Handling Operations Regulations 1992', 'workplace_general', 'Manual Handling', 'annually', 'Site Manager / HR', false, false, true,
'Assess manual handling tasks: furniture moves, deliveries, kitchen stores, PE equipment, special needs (hoisting). Apply hierarchy: avoid, reduce, mitigate. Provide training for relevant staff. Review following any manual handling injury.',
'Back injuries are the most common workplace injury. Non-compliance with Manual Handling Regulations. Employer liability claims.',
'medium'),

-- PLAYGROUND — Additional
-- 111
('MUGA / Sports Court Inspection', 'BS EN 15312; DfE guidance', 'playground', 'Sports Courts', 'annually', 'External Contractor', true, true, false,
'Annual inspection of multi-use games areas and sports courts: surface condition, line markings, goal/net fixings, fencing, floodlighting, drainage. Surface repainting and repair as needed.',
'Slip/trip injuries from deteriorated surfaces. Equipment failure. Liability for injury on poorly maintained courts.',
'medium'),

-- KITCHEN — Additional
-- 112
('Gas Interlock System Test (Kitchen)', 'Gas Safety Regulations; IGEM/UP/11', 'kitchen_catering', 'Gas Safety', '6_monthly', 'Gas Safe Engineer', true, true, true,
'Test the gas interlock system which links gas supply to the kitchen ventilation system. Gas must shut off if extraction fails. Also test gas proving system and emergency gas shut-off valve. Critical safety system.',
'Gas accumulation in kitchen if extraction fails — explosion risk. Carbon monoxide build-up. Criminal liability under Gas Safety Regulations.',
'critical'),

-- SECURITY — Additional
-- 113
('Fire and Security System Integration Check', 'BS 5839; BS EN 50131', 'security', 'System Integration', 'annually', 'External Contractor', true, false, true,
'Annual check that fire and security systems are properly integrated: fire alarm releases magnetic door holders and shuts fire doors, interfaces with access control (releases locked doors on escape routes), intruder alarm isolates during occupation.',
'Fire doors held open electrically may not release. Locked doors may prevent escape in fire. System conflicts between security and fire safety.',
'high'),

-- BUILDING FABRIC — Additional
-- 114
('Window and Glazing Safety Check', 'Building Regulations Part N; BS 6262; Workplace Regulations', 'building_fabric', 'Glazing', 'annually', 'Site Manager', false, false, true,
'Check all glazing in critical locations (doors, sidelights, below 800mm, in activity areas) is safety glass or has safety film. Check window restrictors on upper floors are fitted and functional (opening limited to 100mm). Replace any cracked or broken panes.',
'Child falling from unrestricted window (fatalities have occurred). Injury from non-safety glass breakage. Non-compliance with Building Regulations.',
'high'),

-- 115
('Asbestos Label and Sign Check', 'Control of Asbestos Regulations 2012', 'building_fabric', 'Asbestos Signage', 'termly', 'Site Manager', false, false, true,
'Check all asbestos warning labels and signs are in place on identified ACMs (or in plant rooms/voids containing ACMs). Replace any missing or damaged labels. Verify labels match the current asbestos register.',
'Missing labels mean people may unknowingly disturb ACMs. Regulatory non-compliance. Contractor safety risk.',
'medium'),

-- EMERGENCY — Additional
-- 116
('Defibrillator (AED) Monthly Check', 'Resuscitation Council UK guidance; first aid regulations', 'emergency_planning', 'First Aid', 'monthly', 'Designated First Aider', false, false, true,
'Monthly check of all AEDs: power on self-test passes, pads are in date, battery charge indicator is satisfactory, unit is accessible and signposted, cabinet alarm works (if applicable). Record check date. Replace pads/battery as needed.',
'AED may not function during cardiac arrest. Pads past expiry may not adhere properly. Battery failure means no shock delivery.',
'high'),

-- GROUNDS — Additional
-- 117
('Outdoor Learning Area Inspection', 'EYFS statutory framework; BS EN 1176/1177', 'grounds_maintenance', 'Outdoor Learning', 'termly', 'EYFS Lead / Site Manager', false, false, true,
'Inspect outdoor learning areas including forest school sites, outdoor classrooms, mud kitchens, water play areas, growing areas. Check equipment condition, surface drainage, boundary security, poisonous plants, stinging insects, trip hazards.',
'Child injury in outdoor learning environment. EYFS requirements for safe outdoor provision. Ofsted concern if outdoor area is unsafe.',
'medium'),

-- INSURANCE — Additional
-- 118
('Public Liability Insurance Certificate Display', 'Employer''s Liability (Compulsory Insurance) Act 1969', 'insurance', 'Display Requirements', 'annually', 'School Business Manager', false, false, true,
'Verify that the Employer''s Liability Insurance certificate is displayed prominently (or made reasonably accessible electronically). Check the policy is current and covers all employees. Fine of up to £2,500 per day for non-display.',
'Criminal offence. Daily fine of up to £2,500. Insurance may still be valid but non-display is separately prosecutable.',
'medium'),

-- OIL STORAGE — Additional
-- 119
('Bund Integrity Test', 'Oil Storage Regulations 2001; CIRIA C736', 'oil_storage', 'Secondary Containment', 'annually', 'External Contractor', true, true, true,
'Annual integrity test of the oil tank bund (secondary containment). Check for cracks, vegetation penetration, rainwater accumulation, valve condition. Bund must hold 110% of the largest tank capacity. Drain accumulated rainwater only if confirmed uncontaminated.',
'Bund failure means oil spill reaches ground/watercourse. Environmental prosecution. Clean-up costs £10,000-£100,000+.',
'high'),

-- PEST — Additional
-- 120
('Wasp Nest Season Inspection', 'Health and Safety at Work Act 1974', 'pest_control', 'Seasonal Pests', 'termly', 'Site Manager', false, false, true,
'Pre-summer and early autumn inspection for wasp nests: check eaves, soffits, loft spaces, air bricks, playground equipment, sheds, trees. Arrange professional treatment immediately if nests found. Do NOT attempt DIY removal near children.',
'Wasp stings — some children may have severe allergic reactions (anaphylaxis). Duty of care to remove known nests.',
'high'),

-- VEHICLES — Additional
-- 121
('Driver Licence Check', 'Road Traffic Act 1988; employer duty of care', 'vehicles', 'Driver Management', '6_monthly', 'School Business Manager', false, false, true,
'Check all minibus drivers'' licences every 6 months using DVLA check code or DAVIS service. Verify D1 entitlement (or D1 on grandfather rights for pre-1997 licence holders). Check for points, restrictions, or medical conditions.',
'Allowing unlicensed driver to drive school vehicle — criminal offence for both driver and operator. Insurance invalidated. Personal liability in accident.',
'high'),

-- ADMINISTRATION — Additional
-- 122
('RIDDOR Reporting Compliance Check', 'Reporting of Injuries, Diseases and Dangerous Occurrences Regulations 2013', 'administration', 'Incident Reporting', 'termly', 'Health and Safety Lead', false, false, true,
'Review all accidents/incidents from the term to identify any that should have been reported under RIDDOR. RIDDOR-reportable: death, specified injuries, over-7-day incapacitation, occupational diseases, dangerous occurrences. Report online within 10/15 days.',
'Failure to report is a criminal offence. HSE prosecution. Fine up to £20,000.',
'high'),

-- CDM — Additional
-- 123
('Permit to Work System Review', 'Management of Health and Safety at Work Regulations 1999; various specific regs', 'cdm_construction', 'Permits', 'annually', 'Site Manager', false, false, true,
'Review permit to work procedures for high-risk activities: hot work, roof access, confined spaces, electrical isolation, asbestos disturbance. Ensure forms are current, staff understand the system, and permits are being used consistently.',
'High-risk work without proper controls. Fire from uncontrolled hot work. Electrocution from un-isolated circuits. Asbestos exposure.',
'high'),

-- WORKPLACE — Additional
-- 124
('Slip and Trip Risk Assessment', 'Workplace (Health, Safety and Welfare) Regulations 1992; HSE guidance', 'workplace_general', 'Floor Safety', 'annually', 'Site Manager', false, false, true,
'Assess slip and trip hazards across the school: floor condition, cleaning methods (wet floor signs), transition strips, external paths in wet/icy weather, cable management, mat condition, lighting levels. Slips and trips are the most common cause of injury in workplaces.',
'Most common cause of major injury in schools. Compensation claims. HSE enforcement. Broken bones, head injuries from falls.',
'medium'),

-- 125
('Ventilation System Inspection', 'Workplace (Health, Safety and Welfare) Regulations 1992; Building Regulations Part F', 'workplace_general', 'Ventilation', 'annually', 'External Contractor', true, false, true,
'Annual inspection of mechanical ventilation systems: air handling units, heat recovery units, classroom ventilation units. Check filters, airflow rates, CO2 levels. Post-COVID awareness of ventilation importance. Clean/replace filters as needed.',
'Poor indoor air quality affecting concentration and health. CO2 above 1500ppm impairs learning. Post-COVID awareness. Workplace Regulations non-compliance.',
'medium'),

-- FIRE — Additional
-- 126
('Fire Door Annual Professional Survey', 'RRO 2005; Fire Safety (England) Regulations 2022', 'fire_safety', 'Fire Doors', 'annually', 'Certified Fire Door Inspector', true, true, true,
'From January 2023, the Fire Safety (England) Regulations 2022 require annual checks of all fire doors in common areas by a competent person, and quarterly checks of flat entrance doors. For schools: annual professional inspection of all fire doors recommended.',
'Fire doors are the primary method of compartmentation. Failed doors allow fire and smoke spread. New regulations increase duty. Enforcement action.',
'high'),

-- ACCESSIBILITY — Additional
-- 127
('Evacuation Chair / Refuges Equipment Check', 'RRO 2005; Equality Act 2010', 'accessibility', 'Evacuation Equipment', '6_monthly', 'Site Manager', false, false, true,
'Check all evacuation chairs and refuge equipment: condition, positioning, signage, accessibility. Ensure sufficient trained operators for each shift/floor. Test communication systems in refuges. Replace expired batteries in communication devices.',
'Disabled person unable to evacuate in emergency. Equipment failure during evacuation. Legal liability under both RRO and Equality Act.',
'high'),

-- BUILDING FABRIC — Additional
-- 128
('External Cladding Safety Review', 'Building Safety Act 2022; Building Regulations', 'building_fabric', 'Cladding', 'annually', 'Building Surveyor', true, false, true,
'Annual review of external wall systems and cladding: condition, fire rating (post-Grenfell awareness), fixings, weather-tightness. Buildings over 18m have additional requirements under Building Safety Act 2022. Any concerns about combustible cladding must be escalated immediately.',
'Fire spread via combustible cladding (Grenfell type risk). Building Safety Act requirements. Enforcement notice. Building closure.',
'high'),

-- KITCHEN — Additional
-- 129
('Water Boiler / Urn Safety Check', 'PUWER 1998; employer duty of care', 'kitchen_catering', 'Equipment Safety', 'termly', 'Kitchen Manager / Site Manager', false, false, true,
'Inspect water boilers and urns: stability, positioning (away from edges and child access), electrical connections, thermostat operation, drip trays, anti-tilt features. Scalding from water boilers is a known risk in schools, particularly in staff rooms accessible to children.',
'Scalding injury — water boilers are a top-5 burn/scald risk in schools. Particular risk to EYFS/KS1 children.',
'high'),

-- GROUNDS — Additional
-- 130
('Pond / Water Feature Risk Assessment', 'HSE guidance; Occupiers'' Liability Acts', 'grounds_maintenance', 'Water Safety', 'annually', 'Headteacher / Site Manager', false, false, true,
'Risk assessment for any ponds, water features, or open water on or adjacent to school grounds. Consider: fencing/barriers, depth, access, supervision arrangements, curriculum use, wildlife value, cover. Young children can drown in very shallow water.',
'Drowning — the most serious risk. Children can drown in a few centimetres of water. Occupiers'' liability. Coroner investigation.',
'critical'),

-- LEGIONELLA — Additional
-- 131
('Dead Leg Identification and Removal', 'HSE L8; HSG274', 'legionella_water', 'System Design', 'annually', 'Water Treatment Specialist', true, false, true,
'Annual review of the water system schematic to identify dead legs (capped-off pipework or redundant sections). Dead legs provide stagnant water where legionella can proliferate. Remove or regularly flush dead legs. Document all system changes.',
'Dead legs are a primary legionella risk. Stagnant warm water in dead legs is an ideal growth environment.',
'high'),

-- ELECTRICAL — Additional
-- 132
('Emergency Power Supply Test', 'BS 8519; Building Regulations', 'electrical', 'Emergency Power', 'monthly', 'Site Manager / External Contractor', false, false, true,
'Monthly test of generator or UPS (if installed): start-up, load transfer, run time, fuel level, battery condition. Annual full-load test by specialist. Ensure auto-transfer switch operates correctly. Critical for schools with medical needs pupils requiring powered equipment.',
'Power failure affecting life safety systems (fire alarm, emergency lighting, medical equipment). Business continuity impact.',
'medium'),

-- GAS — Additional
-- 133
('Kitchen Gas Emergency Shut-Off Valve Test', 'Gas Safety Regulations; IGEM/UP/11', 'gas', 'Emergency Controls', 'termly', 'Kitchen Manager / Site Manager', false, false, true,
'Test the kitchen gas emergency shut-off valve (usually a red handle near the kitchen entrance). Ensure all kitchen staff know its location and how to use it. Valve should shut off gas supply to all kitchen appliances. Test by operating the valve and confirming gas stops.',
'Kitchen staff unable to shut off gas in emergency. Gas leak or fire escalation. Staff safety training gap.',
'high'),

-- SECURITY — Additional
-- 134
('Key and Fob Audit', 'School security policy; DfE guidance', 'security', 'Key Management', 'annually', 'Site Manager', false, false, true,
'Annual audit of all keys and access fobs: verify who holds which keys, recover keys from leavers, check master key register, review key safe codes, change alarm codes after staff changes. Document the audit. Consider electronic access control for improved audit trails.',
'Unauthorized access to school premises. Safeguarding risk. Insurance may require evidence of key management. Burglary risk from unrecovered keys.',
'medium'),

-- ADMINISTRATION — Additional
-- 135
('Statutory Signage Audit', 'Various: HSWA 1974, Equality Act, RRO 2005, Fire Safety Order', 'administration', 'Signage', 'annually', 'Site Manager', false, false, true,
'Annual audit of all statutory signage: health and safety law poster (displayed), fire action notices (every floor), fire door keep shut signs, asbestos warning labels, CCTV signs, no smoking signs, electrical hazard signs, evacuation assembly point signs, first aid signs.',
'Missing statutory signage is a compliance failure. HSE inspectors check for the law poster. Fire authority checks fire signage. ICO checks CCTV signage.',
'medium'),

-- WORKPLACE — Additional
-- 136
('Welfare Facilities Check', 'Workplace (Health, Safety and Welfare) Regulations 1992', 'workplace_general', 'Welfare', 'termly', 'Site Manager', false, false, true,
'Check welfare facilities meet regulations: toilets clean and sufficient in number, hot water for handwashing, rest areas for staff, drinking water accessible, changing facilities where needed, temperature reasonable (minimum 16°C general, 13°C physical work).',
'Non-compliance with Workplace Regulations. Staff wellbeing impact. HSE enforcement on specific failures (e.g., insufficient toilets).',
'medium'),

-- FIRE — Additional
-- 137
('Arson Prevention Assessment', 'RRO 2005; Arson Prevention Bureau guidance', 'fire_safety', 'Arson Prevention', 'annually', 'Site Manager / Headteacher', false, false, true,
'Annual arson prevention review: wheelie bin storage (away from buildings), boundary security, lighting (PIR sensors), CCTV coverage, combustible storage (not against external walls), letterbox protection (if applicable). Arson is the single largest cause of school fires.',
'Arson is the #1 cause of school fires. Average arson claim exceeds £1m. School closure for months/years. Community impact.',
'high'),

-- GROUNDS — Additional
-- 138
('Outdoor Fixed Equipment Inspection (Non-Playground)', 'Occupiers'' Liability Acts; PUWER', 'grounds_maintenance', 'Fixed Equipment', 'annually', 'Site Manager', false, false, true,
'Annual inspection of non-playground outdoor fixed equipment: flagpoles, outdoor furniture (benches, tables), bike shelters, canopies, outdoor storage units, bins, signage posts. Check fixings, stability, corrosion, trip hazards around bases.',
'Equipment collapse or failure causing injury. Occupiers'' liability. Less frequently checked than playground equipment but can deteriorate.',
'low'),

-- BUILDING FABRIC — Additional
-- 139
('Internal Decoration and Surface Condition Check', 'Workplace Regulations 1992; DfE condition standards', 'building_fabric', 'Internal Finishes', 'annually', 'Site Manager', false, false, true,
'Annual assessment of internal decoration: peeling paint (lead paint risk in pre-1980 buildings), damaged plaster, ceiling tile condition, stained ceiling tiles (water ingress indicator), floor coverings (trip hazards, asbestos tiles in older buildings).',
'Water damage indicator missed. Lead paint exposure risk. Asbestos floor tiles disturbed. General deterioration affecting learning environment.',
'low'),

-- PUWER — Additional
-- 140
('PE Equipment Annual Inspection', 'PUWER 1998; BS EN 913; AfPE guidance', 'puwer_equipment', 'PE Equipment', 'annually', 'External Contractor', true, true, true,
'Annual inspection of all gymnasium and PE equipment: wall bars, climbing frames, ropes, beams, vaulting equipment, trampolines, portable goals. Inspection to BS EN 913 standard by qualified inspector. Written report with condition grading.',
'Equipment failure during PE causing serious injury. Fatalities have occurred from poorly maintained PE equipment. PUWER prosecution. Negligence claim.',
'high'),

-- COSHH — Additional
-- 141
('Swimming Pool Chemical Safety Check', 'HSG179 Managing Health and Safety in Swimming Pools; COSHH 2002', 'coshh_hazardous', 'Pool Chemicals', 'daily', 'Pool Operator', true, false, true,
'Daily testing and recording of pool water chemistry: pH (7.0-7.4), free chlorine (1-3mg/L), combined chlorine (<1mg/L), temperature. Check chemical storage (segregation of oxidisers and acids), dosing equipment, safety showers, PPE. Only applies to schools with pools.',
'Chemical exposure incidents (chlorine gas from acid/oxidiser mixing). Waterborne infection from inadequate disinfection. HSE enforcement. Pool closure.',
'critical'),

-- EMERGENCY — Additional
-- 142
('Bomb Threat / Suspicious Package Procedure Review', 'NaCTSO guidance; DfE guidance', 'emergency_planning', 'Counter-Terrorism', 'annually', 'Headteacher', false, false, true,
'Annual review of bomb threat and suspicious package procedures. Ensure telephone receivers have the bomb threat checklist nearby. Staff know the evacuation routes and assembly points (different from fire — move FURTHER away). Link with Prevent duty.',
'Incorrect response to bomb threat could endanger lives. PROTECT duty (Martyn''s Law) will mandate this. Counter-terrorism compliance.',
'high'),

-- INSURANCE — Additional
-- 143
('Professional Indemnity Check (for Advisors)', 'Good governance; trust/academy regulations', 'insurance', 'Professional Insurance', 'annually', 'School Business Manager', false, false, true,
'Annual check that any professional advisors used by the school (architects, surveyors, health and safety consultants) carry appropriate professional indemnity insurance. Verify cover levels match contract requirements. Keep copies of certificates.',
'Professional negligence with no insurance recovery. School bears full cost of advisor''s errors. Governance concern.',
'low'),

-- CDM — Additional
-- 144
('Hot Works Permit Compliance', 'Fire safety; CDM 2015; insurance requirements', 'cdm_construction', 'Hot Works', 'as_needed', 'Site Manager', false, false, true,
'Ensure hot works permit system is used for any welding, cutting, grinding, or use of open flame on school premises. Permits must specify: fire precautions, fire watch period (minimum 60 minutes post-work), and responsible person. Insurance typically requires this.',
'Fire from hot works is a major insurance claim category. Insurance may not pay out without evidence of hot works permit system.',
'high'),

-- ACCESSIBILITY — Additional
-- 145
('Accessibility Plan Annual Review', 'Equality Act 2010, Schedule 10; DfE guidance', 'accessibility', 'Planning', 'annually', 'SENCO / Headteacher', false, false, true,
'Schools have a legal duty to have an accessibility plan (reviewed annually) covering: increasing access to the curriculum, improving the physical environment, and improving information delivery. Must address needs of current and future disabled pupils.',
'Legal requirement under Equality Act. DfE can direct schools to prepare a plan. Ofsted will check accessibility provision. Discrimination claim.',
'high'),

-- LIGHTNING — Additional
-- 146
('Earthing System Test', 'BS 7671; BS EN 62305', 'lightning', 'Earthing', '5_yearly', 'Electrical Contractor', true, true, true,
'Test the main earthing system of the building including earth electrode resistance, bonding continuity, and equipotential bonding. Often combined with EICR testing. Inadequate earthing affects both lightning protection and electrical safety.',
'Electric shock risk from inadequate earthing. Lightning protection system ineffective without good earth. Non-compliance with BS 7671.',
'medium'),

-- WORKPLACE — Additional
-- 147
('Legionella Training for Site Staff', 'HSE L8 ACoP; ACOP L8', 'workplace_general', 'Training', 'annually', 'Headteacher / Facilities Manager', false, false, true,
'Annual training for site staff responsible for water hygiene tasks (temperature monitoring, flushing, visual inspections). Training should cover: what legionella is, how it grows, control measures, recording requirements, when to escalate.',
'Untrained staff performing water hygiene tasks incorrectly or not at all. Control measures break down. Outbreak risk increases.',
'medium'),

-- FIRE — Additional
-- 148
('Smoke Ventilation System Test', 'BS EN 12101; Building Regulations Approved Document B', 'fire_safety', 'Smoke Control', 'weekly', 'Site Manager', false, false, true,
'Weekly activation test of smoke ventilation systems (AOVs, smoke shafts, pressurisation systems). Check automatic and manual activation. Verify systems reset correctly. Monthly service by specialist. Only applies to buildings with installed smoke ventilation.',
'Smoke ventilation failure in a fire leads to smoke-filled escape routes. Non-compliance with Building Regulations. Insurance implication.',
'high'),

-- RADON — Additional
-- 149
('Radon Area Check (New Build / Extension)', 'Building Regulations Approved Document C; BRE Report BR211', 'radon', 'New Build', 'as_needed', 'Building Control / Architect', true, false, true,
'Before any new build or extension: check the site radon map (PHE/UKHSA) to determine if radon protection measures are needed in the construction. Radon barrier and/or sump required in affected areas. Must be addressed at design stage.',
'Radon protection omitted from new build, requiring expensive retrofit. Non-compliance with Building Regulations. Occupant exposure.',
'high'),

-- PEST — Additional
-- 150
('Bird Proofing and Nesting Check', 'Wildlife and Countryside Act 1981; building maintenance', 'pest_control', 'Birds', 'annually', 'Site Manager / Pest Control', false, false, true,
'Annual check of bird proofing measures: netting over plant rooms and loading bays, spikes on ledges, blocked entry points to roof voids. Check for new nesting sites. Note: most birds are protected during nesting season (March-August) — do not disturb active nests.',
'Bird fouling (slip hazard, health risk from dried droppings). Nesting in roof voids blocking ventilation. Gull attacks on pupils if nest nearby. Legal restrictions on disturbance during nesting.',
'low'),

-- WATER — Additional
-- 151
('Backflow Prevention Device Test', 'Water Supply (Water Fittings) Regulations 1999', 'water_energy', 'Backflow Prevention', 'annually', 'Plumber / External Contractor', true, true, true,
'Annual test of all backflow prevention devices (RPZ valves, check valves, air gaps). Prevents contaminated water from flowing back into the mains supply. Required by water regulations. Particularly important for science labs, swimming pools, and grounds irrigation.',
'Contamination of mains water supply. Water company enforcement. Public health risk. Legal liability under water regulations.',
'high'),

-- WORKPLACE — Additional
-- 152
('Lone Working Risk Assessment', 'Management of Health and Safety at Work Regulations 1999; HSE guidance', 'workplace_general', 'Lone Working', 'annually', 'Headteacher / HR', false, false, true,
'Risk assessment for all staff who work alone: caretakers (early morning/evening), cleaners, teachers working late, weekend workers. Identify risks, establish communication procedures, consider personal alarms or check-in systems.',
'Staff member injured or taken ill with no one aware. Delayed emergency response. Employer liability for failure to assess lone working risks.',
'medium'),

-- PUWER — Additional
-- 153
('Stage and Lighting Rig Inspection', 'LOLER 1998; PUWER 1998; BS 7905/7906', 'puwer_equipment', 'Stage Equipment', 'annually', 'External Contractor', true, true, true,
'Annual inspection of school hall stage equipment: flying systems, curtain tracks, lighting bars and rigs, electrical connections. Check structural fixings, wire ropes, pulleys, winches, and safety chains. Load limits must be clearly marked.',
'Lighting rig or scenery falling from height onto stage/audience. Electrical hazard from stage lighting. LOLER prosecution if lifting equipment not examined.',
'high'),

-- ADMIN — Additional
-- 154
('Governor/Trustee H&S Competency Check', 'DfE Governance Handbook; HSWA 1974', 'administration', 'Governance', 'annually', 'Clerk to Governors', false, false, true,
'Annual confirmation that the governing body/trust board has a named governor/trustee with health and safety oversight responsibility. Check they have received appropriate training. Schedule annual H&S report to full governing body. Review governor visits programme.',
'Governance gap in health and safety oversight. DfE/Ofsted governance concern. Board liability for H&S failures if no competent oversight.',
'medium'),

-- GROUNDS — Additional
-- 155
('Drain and Gully Clearance', 'Building Regulations; Flood and Water Management Act 2010', 'grounds_maintenance', 'Drainage', '6_monthly', 'Site Manager / External Contractor', false, false, true,
'Clear all external drains, gullies, and channel drains of debris, silt, and vegetation. Check flow. Essential before autumn/winter for flood prevention. Investigate slow-draining gullies. CCTV survey if persistent problems.',
'Surface flooding causing building damage, trip hazards, and access problems. Playground flooding. Damage to foundations from poor drainage.',
'medium'),

-- FIRE — Additional
-- 156
('Cooking Equipment Auto-Suppression Test', 'BS EN 16282; BESA TR19 Grease', 'fire_safety', 'Kitchen Fire Suppression', '6_monthly', 'External Contractor', true, true, true,
'Service and test of kitchen fire suppression system (Ansul/similar). Check nozzle alignment, agent level, detection links, manual pull station, gas shut-off integration. System must automatically suppress fire AND shut off gas and electricity to cooking equipment.',
'Kitchen fire not suppressed automatically. Fire spread via extraction ductwork. Insurance requirement where system installed. Catastrophic kitchen fire risk.',
'critical');
