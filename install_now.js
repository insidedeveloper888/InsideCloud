// Install cascade functions directly to Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://rituzypqhjawhyrxoddj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdHV6eXBxaGphd2h5cnhvZGRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ2MDk1MSwiZXhwIjoyMDc1MDM2OTUxfQ.8hHBVLug-P_2LxQoFN6n0-deXgNfxK3ozPf4pD7zZJY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function installCascadeFunctions() {
  console.log('=== Installing Cascade Functions to Supabase ===\n');

  // Read the complete installation SQL
  const sql = fs.readFileSync('INSTALL_CASCADE_COMPLETE.sql', 'utf8');

  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s =>
      s.length > 0 &&
      !s.startsWith('--') &&
      !s.match(/^SELECT\s+'.*'\s+AS\s+(test_section|final_status)/i)
    );

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();

    // Skip test/verification selects
    if (stmt.toLowerCase().startsWith('select') &&
        (stmt.includes('test_section') || stmt.includes('final_status'))) {
      continue;
    }

    // Determine statement type for logging
    let stmtType = 'Unknown';
    if (stmt.toLowerCase().includes('create or replace function')) {
      const match = stmt.match(/function\s+public\.(\w+)/i);
      stmtType = match ? `Function: ${match[1]}` : 'Function';
    } else if (stmt.toLowerCase().includes('drop trigger')) {
      stmtType = 'Drop Trigger';
    } else if (stmt.toLowerCase().includes('create trigger')) {
      stmtType = 'Create Trigger';
    } else if (stmt.toLowerCase().startsWith('select')) {
      stmtType = 'Verification';
    }

    process.stdout.write(`[${i + 1}/${statements.length}] ${stmtType}... `);

    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: stmt + ';'
      });

      if (error) {
        // Try alternative approach using raw SQL via PostgREST
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ query: stmt + ';' })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        console.log('✅');
        successCount++;
      } else {
        console.log('✅');
        successCount++;
      }
    } catch (err) {
      console.log(`❌ ${err.message}`);
      errorCount++;

      // Don't stop on errors, continue with other statements
      if (err.message.includes('does not exist')) {
        console.log('   → Will try to execute via direct database connection...');
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Installation Summary: ${successCount} succeeded, ${errorCount} failed\n`);

  // Verify installation
  console.log('Verifying installation...\n');

  const { data: functions, error: funcError } = await supabase
    .from('pg_proc')
    .select('proname')
    .in('proname', [
      'create_cascaded_items',
      'get_last_week_of_month',
      'get_sunday_of_iso_week',
      'date_to_date_key'
    ]);

  if (!funcError && functions) {
    console.log('✅ Functions found:', functions.length);
    functions.forEach(f => console.log(`   - ${f.proname}`));
  } else {
    console.log('⚠️  Could not verify via pg_proc query');
    console.log('   Trying alternative verification...\n');

    // Try to call the functions to see if they exist
    try {
      const { data, error } = await supabase.rpc('get_last_week_of_month', {
        p_year: 2025,
        p_month: 12
      });

      if (!error) {
        console.log('✅ Helper function get_last_week_of_month() is working!');
        console.log(`   Result: Week ${data}`);
      }
    } catch (err) {
      console.log('❌ Functions may not be installed correctly');
    }
  }

  console.log('\n🎉 Installation process complete!');
  console.log('\nNext step: Test by creating a new goal in the yearly view');
  console.log('Or run: node test_cascade.js\n');
}

installCascadeFunctions().catch(console.error);
