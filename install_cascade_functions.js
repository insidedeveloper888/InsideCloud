// Install helper functions and cascade trigger in Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://rituzypqhjawhyrxoddj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdHV6eXBxaGphd2h5cnhvZGRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ2MDk1MSwiZXhwIjoyMDc1MDM2OTUxfQ.8hHBVLug-P_2LxQoFN6n0-deXgNfxK3ozPf4pD7zZJY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL(sql, description) {
  console.log(`\n📝 ${description}...`);

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }

  console.log(`✅ Success!`);
  if (data) {
    console.log('   Result:', data);
  }
  return true;
}

async function installFunctions() {
  console.log('=== Installing Cascade Helper Functions & Trigger ===\n');

  // Read SQL files
  const helperFunctionsSQL = fs.readFileSync('create_helper_functions.sql', 'utf8');
  const cascadeTriggerSQL = fs.readFileSync('fix_create_cascaded_items_trigger.sql', 'utf8');

  // Split into individual statements (simple split by semicolon)
  const helperStatements = helperFunctionsSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s.toLowerCase() !== 'select');

  const triggerStatements = cascadeTriggerSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  // Execute helper functions
  console.log('Step 1: Creating helper functions...');
  for (const stmt of helperStatements) {
    if (stmt.toLowerCase().includes('create') || stmt.toLowerCase().includes('replace')) {
      await executeSQL(stmt + ';', 'Executing statement');
    }
  }

  // Execute cascade trigger
  console.log('\nStep 2: Creating cascade trigger...');
  for (const stmt of triggerStatements) {
    await executeSQL(stmt + ';', 'Executing statement');
  }

  console.log('\n\n=== Installation Complete! ===');
  console.log('\nVerifying installation...');

  // Verify functions exist
  const checkSQL = `
    SELECT proname AS function_name
    FROM pg_proc
    WHERE proname IN (
      'create_cascaded_items',
      'get_last_week_of_month',
      'get_sunday_of_iso_week',
      'date_to_date_key'
    )
    ORDER BY proname;
  `;

  const { data: functions, error } = await supabase.rpc('exec_sql', { sql_query: checkSQL });

  if (!error && functions) {
    console.log('\n✅ Functions installed:');
    functions.forEach(f => console.log(`   - ${f.function_name}`));
  }

  console.log('\n🎉 Ready to test cascading!');
}

installFunctions().catch(console.error);
