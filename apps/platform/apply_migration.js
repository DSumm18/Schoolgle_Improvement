const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = "postgresql://postgres.ygquvauptwyvlhkyxkwy:crZoN27nZ60BnVcE@aws-1-eu-west-2.pooler.supabase.com:5432/postgres";

async function applyMigration() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log("Connected to Supabase.");
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'supabase/migrations/20260409170000_mission_control_crm.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log("Applying CRM schema...");
    await client.query(sql);
    console.log("Migration applied successfully!");
    
  } catch (error) {
    console.error("Error applying migration:", error);
  } finally {
    await client.end();
  }
}

applyMigration();
