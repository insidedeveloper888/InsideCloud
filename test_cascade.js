// Test script to verify cascade is working
// Run this AFTER installing the SQL functions
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rituzypqhjawhyrxoddj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdHV6eXBxaGphd2h5cnhvZGRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ2MDk1MSwiZXhwIjoyMDc1MDM2OTUxfQ.8hHBVLug-P_2LxQoFN6n0-deXgNfxK3ozPf4pD7zZJY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCascade() {
  console.log('=== Testing Cascade After Installation ===\n');

  // Get the most recent yearly item to see its cascade chain
  const { data: items, error } = await supabase
    .from('strategic_map_items')
    .select('*')
    .eq('timeframe', 'yearly')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (items.length === 0) {
    console.log('No yearly items found. Create a new goal in the yearly view to test!');
    return;
  }

  const rootItem = items[0];
  console.log(`Root Item: "${rootItem.text}" (ID: ${rootItem.id})`);
  console.log(`Timeframe: ${rootItem.timeframe}, Category: ${rootItem.category_index}\n`);

  // Find all cascaded items
  const { data: allRelated, error: relError } = await supabase
    .from('strategic_map_items')
    .select('*')
    .or(`id.eq.${rootItem.id},parent_item_id.eq.${rootItem.id}`)
    .order('cascade_level', { ascending: true });

  if (relError) {
    console.error('Error finding related items:', relError);
    return;
  }

  console.log('Cascade Chain:');
  console.log('==============');

  const printItemTree = (items, parentId = null, indent = '') => {
    const children = items.filter(i =>
      (parentId === null && i.id === rootItem.id) ||
      (i.parent_item_id === parentId)
    );

    children.forEach(item => {
      const icon = item.is_cascaded ? '└─>' : '•';
      const status = item.is_cascaded ? '(CASCADED)' : '(ORIGINAL)';

      console.log(`${indent}${icon} [${item.timeframe.toUpperCase()}] ${status}`);
      console.log(`${indent}   Level: ${item.cascade_level || 0}`);

      if (item.timeframe === 'yearly') {
        console.log(`${indent}   Year Index: ${item.year_index}`);
      } else if (item.timeframe === 'monthly') {
        console.log(`${indent}   Month Col Index: ${item.month_col_index}`);
      } else if (item.timeframe === 'weekly') {
        console.log(`${indent}   Week Number: ${item.week_number}`);
      } else if (item.timeframe === 'daily') {
        console.log(`${indent}   Daily Date Key: ${item.daily_date_key}`);
      }

      console.log(`${indent}   Created: ${new Date(item.created_at).toLocaleString()}\n`);

      // Recursively print children
      printItemTree(items, item.id, indent + '   ');
    });
  };

  printItemTree(allRelated);

  // Summary
  const summary = {
    yearly: allRelated.filter(i => i.timeframe === 'yearly').length,
    monthly: allRelated.filter(i => i.timeframe === 'monthly').length,
    weekly: allRelated.filter(i => i.timeframe === 'weekly').length,
    daily: allRelated.filter(i => i.timeframe === 'daily').length,
  };

  console.log('\nSummary:');
  console.log('========');
  console.log(`Yearly:  ${summary.yearly} record(s) ${summary.yearly === 1 ? '✓' : '✗'}`);
  console.log(`Monthly: ${summary.monthly} record(s) ${summary.monthly === 1 ? '✓' : '✗'}`);
  console.log(`Weekly:  ${summary.weekly} record(s) ${summary.weekly === 1 ? '✓' : '✗'}`);
  console.log(`Daily:   ${summary.daily} record(s) ${summary.daily === 1 ? '✓' : '✗'}`);

  const isComplete = summary.yearly === 1 && summary.monthly === 1 &&
                     summary.weekly === 1 && summary.daily === 1;

  console.log('\n' + (isComplete ?
    '🎉 SUCCESS! Cascade is working correctly - all 4 timeframe records created!' :
    '⚠️  Cascade is incomplete. Expected 1 record for each timeframe.'));
}

testCascade().catch(console.error);
