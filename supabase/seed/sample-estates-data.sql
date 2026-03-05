-- Seed: Sample Estates Compliance Data for Testing "Wow Factor"
-- Organization: Use a fixed test ID or the first one from organizations
-- Let's just create sample records linked to the first organization

DO $$ 
DECLARE 
    org_id UUID;
    user_id TEXT;
    cont_id UUID;
BEGIN
    SELECT id INTO org_id FROM organizations LIMIT 1;
    SELECT id INTO user_id FROM users WHERE email LIKE '%admin%' LIMIT 1;
    
    IF org_id IS NULL THEN
        RAISE NOTICE 'No organization found to link seed data.';
        RETURN;
    END IF;

    -- 1. Create a Contractor with an expiring DBS
    INSERT INTO estates_contractors (organization_id, name, contact_info, dbs_expiry_date, accreditation_status)
    VALUES (org_id, 'John Smith (Water Safety Services)', 'john@watersafety.example.com', NOW() + INTERVAL '3 weeks', 'active')
    RETURNING id INTO cont_id;

    -- 2. Create a Compliance Task due in 7 days (Upcoming)
    INSERT INTO estates_compliance_tasks (organization_id, title, domain, due_date, status, assigned_to_contractor_id)
    VALUES (org_id, 'Weekly Flushing of Little Used Outlets', 'legionella', NOW() + INTERVAL '3 days', 'pending', cont_id);

    -- 3. Create an Overdue Compliance Task
    INSERT INTO estates_compliance_tasks (organization_id, title, domain, due_date, status)
    VALUES (org_id, 'Cold Water Tank Temperature Check', 'legionella', NOW() - INTERVAL '2 days', 'overdue');

    -- 4. Create a recent Helpdesk Ticket related to the domain
    INSERT INTO estates_helpdesk_tickets (organization_id, title, description, domain, status, priority, created_by)
    VALUES (org_id, 'Cold water tank temperature high', 'The cold water tank in the infant block is reading 24°C.', 'legionella', 'in_progress', 'high', user_id);

    -- 5. Create a Recent Update (Activity Log)
    INSERT INTO activity_log (organization_id, action_type, entity_type, entity_name, description, user_id)
    VALUES (org_id, 'update', 'compliance_knowledge', 'Temperature Control Strategy', 'Updated statutory temperature thresholds based on latest ACOP L8 guidance.', user_id);

END $$;
