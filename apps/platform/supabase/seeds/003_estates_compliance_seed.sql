-- ============================================================================
-- ESTATES COMPLIANCE SEED DATA FOR AURORA ACADEMY
-- ============================================================================
-- Organization ID: c64ed86b-9eab-49ee-9829-0706ff371083
-- Test User ID: 00000000-0000-0000-0000-000000000999
-- ============================================================================

-- TEMPORARY: Insert a test user for seeding purposes
INSERT INTO auth.users (id, email)
VALUES ('00000000-0000-0000-0000-000000000999', 'test@aurora.tmp')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, auth_id, email, display_name)
VALUES ('00000000-0000-0000-0000-000000000999', '00000000-0000-0000-0000-000000000999', 'test@aurora.tmp', 'Aurora Test User')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- A. CONTRACTORS (10 total)
-- ============================================================================

INSERT INTO estates_contractors (id, organization_id, company_name, contact_name, email, phone, mobile, services, accreditations, insurance_certificates, status, preferred) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'FireSafe UK Ltd', 'John Mitchell', 'john.mitchell@firesafeuk.co.uk', '01179 123456', '07700 900123',
 '[{"service": "Fire Alarm Maintenance"}]'::jsonb,
 '[{"accreditation": "BAFE SP203", "number": "BAFE-12345", "expiry": "2025-12-31"}]'::jsonb,
 '[{"type": "Public Liability", "insurer": "Aviva", "amount": 5000000, "expiry": "2025-05-15"}]'::jsonb,
 'active', true),

('550e8400-e29b-41d4-a716-446655440002', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'Eagle Fire Protection', 'Sarah Thompson', 'sarah.t@eaglefire.co.uk', '01179 234567', '07700 900234',
 '[{"service": "Fire Risk Assessment"}]'::jsonb,
 '[{"accreditation": "IFE Registered", "number": "IFE-45678", "expiry": "2025-09-30"}]'::jsonb,
 '[{"type": "Public Liability", "insurer": "Zurich", "amount": 2000000, "expiry": "2025-08-20"}]'::jsonb,
 'active', false),

('550e8400-e29b-41d4-a716-446655440003', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'ABC Gas Services Ltd', 'David Wilson', 'd.wilson@abcgas.co.uk', '01179 345678', '07700 900456',
 '[{"service": "Gas Safety Inspection"}]'::jsonb,
 '[{"accreditation": "Gas Safe Register", "number": "123456", "expiry": "2025-10-31"}]'::jsonb,
 '[{"type": "Public Liability", "insurer": "Allianz", "amount": 2000000, "expiry": "2025-06-01"}]'::jsonb,
 'active', true),

('550e8400-e29b-41d4-a716-446655440004', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'British Gas Engineering', 'Emma Roberts', 'emma.roberts@britishgas.co.uk', '01179 456789', '07700 900567',
 '[{"service": "Boiler Servicing"}]'::jsonb,
 '[{"accreditation": "Gas Safe Register", "number": "234567", "expiry": "2025-11-30"}]'::jsonb,
 '[{"type": "Public Liability", "insurer": "British Gas", "amount": 10000000, "expiry": "2025-12-31"}]'::jsonb,
 'active', true),

('550e8400-e29b-41d4-a716-446655440005', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'Water Hygiene Solutions', 'Dr. Amanda Clarke', 'a.clarke@waterhygiene.co.uk', '01179 678901', '07700 900789',
 '[{"service": "Legionella Risk Assessment"}]'::jsonb,
 '[{"accreditation": "ACoP L8 Compliant", "number": "WH-L8-001", "expiry": "2025-07-31"}]'::jsonb,
 '[{"type": "Public Liability", "insurer": "AXA", "amount": 5000000, "expiry": "2025-09-15"}]'::jsonb,
 'active', true),

('550e8400-e29b-41d4-a716-446655440006', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'Legionella Control Ltd', 'James Miller', 'j.miller@legcontrol.co.uk', '01179 789012', '07700 900890',
 '[{"service": "Water Sampling"}]'::jsonb,
 '[{"accreditation": "ACoP L8 Compliant", "number": "LC-L8-002", "expiry": "2025-12-31"}]'::jsonb,
 '[{"type": "Public Liability", "insurer": "Direct Line", "amount": 2000000, "expiry": "2025-07-20"}]'::jsonb,
 'active', false),

('550e8400-e29b-41d4-a716-446655440007', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'Asbestos Management Services', 'Richard Green', 'r.green@asbestosms.co.uk', '01179 901234', '07700 901012',
 '[{"service": "Asbestos Survey"}]'::jsonb,
 '[{"accreditation": "UKAS Surveyor", "number": "UKAS-34567", "expiry": "2025-08-31"}]'::jsonb,
 '[{"type": "Public Liability", "insurer": "Zurich", "amount": 10000000, "expiry": "2025-10-15"}]'::jsonb,
 'active', true),

('550e8400-e29b-41d4-a716-446655440008', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'PowerCheck Electrical', 'Steve Harris', 's.harris@powercheck.co.uk', '01179 123457', '07700 901234',
 '[{"service": "EICR Inspection"}]'::jsonb,
 '[{"accreditation": "NICEIC Approved", "number": "NICE-12345", "expiry": "2025-09-30"}]'::jsonb,
 '[{"type": "Public Liability", "insurer": "NFU Mutual", "amount": 2000000, "expiry": "2025-07-31"}]'::jsonb,
 'active', true),

('550e8400-e29b-41d4-a716-446655440009', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'NICEC Testing Services', 'Neil Clark', 'n.clark@nicectest.co.uk', '01179 234568', '07700 901345',
 '[{"service": "Emergency Lighting Testing"}]'::jsonb,
 '[{"accreditation": "NICEIC Approved", "number": "NICE-23456", "expiry": "2025-11-30"}]'::jsonb,
 '[{"type": "Public Liability", "insurer": "Allianz", "amount": 2000000, "expiry": "2025-08-15"}]'::jsonb,
 'active', true),

('550e8400-e29b-41d4-a716-446655440010', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'Lift Maintenance Ltd', 'Tom Baker', 't.baker@liftmaint.co.uk', '01179 345689', '07700 902345',
 '[{"service": "LOLER Examination"}]'::jsonb,
 '[{"accreditation": "LEIA Member", "number": "LEIA-12345", "expiry": "2025-12-31"}]'::jsonb,
 '[{"type": "Public Liability", "insurer": "Hiscox", "amount": 5000000, "expiry": "2025-06-30"}]'::jsonb,
 'active', true)

ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- B. ASSETS
-- ============================================================================

INSERT INTO estates_assets (id, organization_id, asset_type, category, name, code, building, status, compliance_domains, specifications) VALUES
('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'building', 'main', 'Aurora Academy Main Building', 'BLD-001', 'Main Building', 'active',
 ARRAY['fire', 'asbestos', 'electrical', 'gas'],
 '{"floors": 3}'::jsonb),

('6ba7b810-9dad-11d1-80b4-00c04fd430c9', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'room', 'classroom', 'Main Hall', 'RM-001', 'Main Building', 'active',
 ARRAY['fire'],
 '{"capacity": 200}'::jsonb),

('6ba7b810-9dad-11d1-80b4-00c04fd430ca', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'room', 'plant', 'Boiler Room', 'RM-002', 'Main Building', 'active',
 ARRAY['gas', 'electrical'],
 '{"floor": "basement"}'::jsonb),

('6ba7b810-9dad-11d1-80b4-00c04fd430cb', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'fire_extinguisher', 'fire', 'Main Hall Extinguisher', 'FE-001', 'Main Building', 'active',
 ARRAY['fire'],
 '{"type": "Water"}'::jsonb),

('6ba7b810-9dad-11d1-80b4-00c04fd430cc', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'emergency_light', 'fire', 'Main Hall Emergency Light', 'EL-001', 'Main Building', 'active',
 ARRAY['fire'],
 '{"type": "Maintained"}'::jsonb)

ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- C. STATUTORY COMPLETIONS
-- ============================================================================

INSERT INTO estates_statutory_completions (id, organization_id, check_id, compliance_domain, status, completed_at, completed_by, next_due_date, evidence_ids, documents_received, rag_status) VALUES
('6ba7b810-9dad-11d1-80b4-00c04fd430d0', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'legionella_risk_assessment', 'legionella', 'completed', '2024-09-15', '00000000-0000-0000-0000-000000000999', '2025-09-15', ARRAY[]::uuid[], true, 'green'),

('6ba7b810-9dad-11d1-80b4-00c04fd430d1', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'legionella_monthly_temp_checks', 'legionella', 'completed', '2025-01-15', '00000000-0000-0000-0000-000000000999', '2025-02-15', ARRAY[]::uuid[], true, 'green'),

('6ba7b810-9dad-11d1-80b4-00c04fd430d3', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'fire_weekly_alarm_test', 'fire', 'completed', '2025-01-15', '00000000-0000-0000-0000-000000000999', '2025-01-22', ARRAY[]::uuid[], true, 'green'),

('6ba7b810-9dad-11d1-80b4-00c04fd430d4', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'fire_extinguisher_check', 'fire', 'completed', '2024-06-15', '00000000-0000-0000-0000-000000000999', '2025-06-15', ARRAY[]::uuid[], true, 'green'),

('6ba7b810-9dad-11d1-80b4-00c04fd430d5', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'fire_risk_assessment', 'fire', 'overdue', '2023-09-01', '00000000-0000-0000-0000-000000000999', '2024-09-01', ARRAY[]::uuid[], false, 'red'),

('6ba7b810-9dad-11d1-80b4-00c04fd430d6', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'gas_annual_safety_check', 'gas', 'completed', '2024-08-15', '00000000-0000-0000-0000-000000000999', '2025-08-15', ARRAY[]::uuid[], true, 'green'),

('6ba7b810-9dad-11d1-80b4-00c04fd430d8', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'electrical_eicr', 'electrical', 'completed', '2024-03-10', '00000000-0000-0000-0000-000000000999', '2027-03-10', ARRAY[]::uuid[], true, 'green'),

('6ba7b810-9dad-11d1-80b4-00c04fd430d9', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'emergency_lighting_test', 'electrical', 'completed', '2024-01-15', '00000000-0000-0000-0000-000000000999', '2025-01-15', ARRAY[]::uuid[], true, 'green'),

('6ba7b810-9dad-11d1-80b4-00c04fd430da', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'asbestos_register_review', 'asbestos', 'completed', '2024-06-01', '00000000-0000-0000-0000-000000000999', '2025-06-01', ARRAY[]::uuid[], true, 'green')

ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- D. HELPDESK TICKETS
-- ============================================================================

INSERT INTO estates_helpdesk_tickets (id, organization_id, ticket_number, module, title, description, category, priority, status, raised_by, assigned_to) VALUES
('6ba7b810-9dad-11d1-80b4-00c04fd430e0', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'TK-001', 'estates', 'Fire alarm fault', 'Fire alarm panel showing zone 3 fault.', 'fire_alarm', 'critical', 'open', '00000000-0000-0000-0000-000000000999', NULL),

('6ba7b810-9dad-11d1-80b4-00c04fd430e1', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'TK-002', 'estates', 'Damaged fire extinguisher', 'CO2 extinguisher has damaged hose.', 'fire_equipment', 'high', 'resolved', '00000000-0000-0000-0000-000000000999', NULL),

('6ba7b810-9dad-11d1-80b4-00c04fd430e2', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'TK-003', 'estates', 'Emergency light not working', 'Emergency light above main hall exit not illuminating.', 'emergency_lighting', 'medium', 'in_progress', '00000000-0000-0000-0000-000000000999', NULL),

('6ba7b810-9dad-11d1-80b4-00c04fd430e3', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'TK-004', 'estates', 'Water stain on ceiling', 'Possible water leak in science lab.', 'plumbing', 'medium', 'open', '00000000-0000-0000-0000-000000000999', NULL),

('6ba7b810-9dad-11d1-80b4-00c04fd430e4', 'c64ed86b-9eab-49ee-9829-0706ff371083', 'TK-005', 'estates', 'Lift making unusual noise', 'Lift making grinding noise.', 'lifts', 'high', 'open', '00000000-0000-0000-0000-000000000999', NULL)

ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SUMMARY:
-- - 10 Contractors (Fire, Gas, Legionella, Asbestos, Electrical, Lifts)
-- - 5 Assets (Building, Rooms, Fire Equipment)
-- - 9 Statutory Completions (completed, overdue)
-- - 5 Helpdesk Tickets (different priorities and statuses)
-- ============================================================================
