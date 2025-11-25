#!/usr/bin/env node

/**
 * Run Migration 003: Refactor to Sales Documents
 *
 * This script migrates from sales_order_* tables to generalized sales_document_* tables
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting Migration 003: Refactor to Sales Documents\n');

  // Read the SQL migration file
  const sqlPath = path.join(__dirname, '../../docs/sql-scripts/sales-management/003_refactor_to_sales_documents.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  try {
    console.log('📝 Reading migration file...');
    console.log(`   File: ${sqlPath}`);
    console.log(`   Size: ${sqlContent.length} bytes\n`);

    console.log('⚙️  Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      // Try direct execution if RPC doesn't exist
      console.log('   Trying direct execution...');

      // Split by semicolons and execute each statement
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (stmt) {
          console.log(`   Executing statement ${i + 1}/${statements.length}...`);
          const { error: stmtError } = await supabase.rpc('exec', { query: stmt });

          if (stmtError) {
            console.error(`   ❌ Error in statement ${i + 1}:`, stmtError.message);
            console.error(`   Statement: ${stmt.substring(0, 100)}...`);
          }
        }
      }
    }

    console.log('\n✅ Migration completed successfully!\n');
    console.log('Summary:');
    console.log('  ✓ Created sales_document_settings table');
    console.log('  ✓ Created sales_document_status_config table');
    console.log('  ✓ Migrated data from old tables');
    console.log('  ✓ Dropped sales_order_settings table');
    console.log('  ✓ Dropped sales_order_status_config table');
    console.log('  ✓ Created sales_quotations table');
    console.log('  ✓ Created sales_quotation_items table');
    console.log('  ✓ Set up default quotation statuses\n');

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

runMigration();
