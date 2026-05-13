-- Ensure physical meter identity includes the utility type.
-- MPAN/MPRN/water references come from different utility domains, so the same
-- reference string should not collide across electricity, gas, and water.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'energy_meters_organization_id_meter_reference_key'
  ) THEN
    ALTER TABLE energy_meters
      DROP CONSTRAINT energy_meters_organization_id_meter_reference_key;
  END IF;
END $$;

ALTER TABLE energy_meters
  ADD CONSTRAINT energy_meters_org_type_reference_key
  UNIQUE (organization_id, meter_type, meter_reference);

CREATE INDEX IF NOT EXISTS idx_energy_meters_org_type
  ON energy_meters(organization_id, meter_type);
