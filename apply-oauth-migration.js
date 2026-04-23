/**
 * Apply OAuth Tokens Migration
 *
 * This script applies the 20260326_oauth_tokens.sql migration
 * to create the oauth_tokens table and supporting functions.
 *
 * To run: node apply-oauth-migration.js
 */

const { Client } = require('pg');

const connectionString = 'postgresql://postgres.ygquvauptwyvlhkyxkwy:crZoN27nZ60BnVcE@aws-1-eu-west-2.pooler.supabase.com:5432/postgres';
const migrationFile = './apps/platform/supabase/migrations/20260326_oauth_tokens.sql';

async function applyMigration() {
  console.log('=== Applying OAuth Tokens Migration ===\n');

  // Read migration SQL
  const fs = require('fs');
  const sql = fs.readFileSync(migrationFile, 'utf8');

  console.log('1. Reading migration file...');
  console.log(`   File: ${migrationFile}`);
  console.log(`   Size: ${sql.length} bytes`);

  // Connect to database
  console.log('\n2. Connecting to database...');
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('   ✓ Connected');

    // Apply migration
    console.log('\n3. Applying migration...');
    await client.query(sql);
    console.log('   ✓ Migration applied successfully');

    // Verify table creation
    console.log('\n4. Verifying table creation...');
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'oauth_tokens'
      );
    `);

    if (result.rows[0].exists) {
      console.log('   ✓ oauth_tokens table created');
    } else {
      console.log('   ✗ Table not found');
    }

    console.log('\n=== Migration Complete ===\n');
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    console.error('\nTo apply manually:');
    console.log('1. Go to Supabase dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy contents of: apps/platform/supabase/migrations/20260326_oauth_tokens.sql');
    console.log('4. Run the SQL');
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration().catch(console.error);
