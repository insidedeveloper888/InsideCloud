// Check which functions actually exist in the database
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rituzypqhjawhyrxoddj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdHV6eXBxaGphd2h5cnhvZGRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ2MDk1MSwiZXhwIjoyMDc1MDM2OTUxfQ.8hHBVLug-P_2LxQoFN6n0-deXgNfxK3ozPf4pD7zZJY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFunctions() {
  console.log('=== Checking Which Functions Exist ===\n');

  const functionsToTest = [
    { name: 'get_last_week_of_month', params: { p_year: 2025, p_month: 12 } },
    { name: 'get_sunday_of_iso_week', params: { p_year: 2025, p_week_number: 52 } },
    { name: 'date_to_date_key', params: { p_date: '2025-12-28' } },
    { name: 'create_cascaded_items', params: {} }
  ];

  for (const func of functionsToTest) {
    process.stdout.write(`Testing ${func.name}... `);

    try {
      if (func.name === 'create_cascaded_items') {
        // This is a trigger function, can't call directly
        console.log('⚠️  (trigger function, cannot test directly)');
        continue;
      }

      const { data, error } = await supabase.rpc(func.name, func.params);

      if (error) {
        console.log(`❌ Does not exist or error: ${error.message}`);
      } else {
        console.log(`✅ Exists! Result: ${data}`);
      }
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
  }

  console.log('\n=== Checking Trigger Status ===\n');

  // Try to query trigger information via a workaround
  // Since we can't query pg_trigger directly via supabase-js, let's test if cascade works

  console.log('Testing if cascade works by creating a test item...\n');

  const testGoal = `CASCADE_TEST_${Date.now()}`;

  const { data: newItem, error: insertError } = await supabase
    .from('strategic_map_items')
    .insert({
      organization_id: '00000000-0000-0000-0000-000000000001', // Dummy org ID
      text: testGoal,
      timeframe: 'yearly',
      category_index: 0,
      year_index: 0,
      status: 'neutral',
      is_cascaded: false,
      cascade_level: 0
    })
    .select()
    .single();

  if (insertError) {
    console.log('❌ Could not create test item:', insertError.message);
    return;
  }

  console.log(`✅ Created test yearly item: "${testGoal}"`);
  console.log(`   ID: ${newItem.id}`);

  // Wait a moment for trigger to fire
  await new Promise(resolve => setTimeout(resolve, 500));

  // Check for cascaded items
  const { data: cascadedItems, error: cascadeError } = await supabase
    .from('strategic_map_items')
    .select('*')
    .eq('parent_item_id', newItem.id);

  if (cascadeError) {
    console.log('❌ Error checking cascaded items:', cascadeError.message);
  } else {
    console.log(`\nCascaded items created: ${cascadedItems.length}`);

    if (cascadedItems.length > 0) {
      cascadedItems.forEach(item => {
        console.log(`  - ${item.timeframe}: cascade_level=${item.cascade_level}`);
      });
    } else {
      console.log('  ⚠️  NO CASCADED ITEMS! Trigger is not working.');
    }
  }

  // Clean up test items
  console.log('\nCleaning up test items...');
  await supabase
    .from('strategic_map_items')
    .delete()
    .eq('text', testGoal);

  console.log('✅ Test complete\n');
}

checkFunctions().catch(console.error);
