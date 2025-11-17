// Quick script to check cascade status by examining actual data
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rituzypqhjawhyrxoddj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdHV6eXBxaGphd2h5cnhvZGRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ2MDk1MSwiZXhwIjoyMDc1MDM2OTUxfQ.8hHBVLug-P_2LxQoFN6n0-deXgNfxK3ozPf4pD7zZJY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCascadeStatus() {
  console.log('=== Checking Strategic Map Cascade Status ===\n');

  // Check recent strategic map items to see what's cascaded
  const { data: items, error: itemsError } = await supabase
    .from('strategic_map_items')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (itemsError) {
    console.error('Error fetching items:', itemsError);
    return;
  }

  console.log(`Total items fetched: ${items.length}\n`);

  // Group by timeframe
  const byTimeframe = {};
  items.forEach(item => {
    if (!byTimeframe[item.timeframe]) {
      byTimeframe[item.timeframe] = [];
    }
    byTimeframe[item.timeframe].push(item);
  });

  console.log('Items by timeframe:');
  Object.keys(byTimeframe).forEach(tf => {
    console.log(`  ${tf}: ${byTimeframe[tf].length} items`);
  });

  console.log('\n=== Recent Items Detail ===');
  items.forEach((item, idx) => {
    console.log(`\n${idx + 1}. ${item.timeframe.toUpperCase()} (${item.is_cascaded ? 'CASCADED' : 'ORIGINAL'})`);
    console.log(`   Text: ${item.text?.substring(0, 50)}${item.text?.length > 50 ? '...' : ''}`);
    console.log(`   Category: ${item.category_index}, Cascade Level: ${item.cascade_level || 0}`);

    if (item.timeframe === 'yearly') {
      console.log(`   Year Index: ${item.year_index}`);
    } else if (item.timeframe === 'monthly') {
      console.log(`   Month Col Index: ${item.month_col_index}`);
    } else if (item.timeframe === 'weekly') {
      console.log(`   Week Number: ${item.week_number}`);
    } else if (item.timeframe === 'daily') {
      console.log(`   Daily Date Key: ${item.daily_date_key}`);
    }

    console.log(`   Parent ID: ${item.parent_item_id || 'None (root item)'}`);
    console.log(`   Created: ${new Date(item.created_at).toLocaleString()}`);
  });

  // Find cascade chains
  console.log('\n\n=== Cascade Chains Analysis ===');
  const rootItems = items.filter(i => !i.parent_item_id && !i.is_cascaded);

  rootItems.forEach(root => {
    console.log(`\nRoot: [${root.timeframe}] ${root.text?.substring(0, 40)}`);

    // Find direct children
    const children = items.filter(i => i.parent_item_id === root.id);
    children.forEach(child => {
      console.log(`  └─> [${child.timeframe}] is_cascaded=${child.is_cascaded}`);

      // Find grandchildren
      const grandchildren = items.filter(i => i.parent_item_id === child.id);
      grandchildren.forEach(gc => {
        console.log(`      └─> [${gc.timeframe}] is_cascaded=${gc.is_cascaded}`);

        // Find great-grandchildren
        const ggc = items.filter(i => i.parent_item_id === gc.id);
        ggc.forEach(g => {
          console.log(`          └─> [${g.timeframe}] is_cascaded=${g.is_cascaded}`);
        });
      });
    });

    if (children.length === 0) {
      console.log(`  └─> NO CASCADED CHILDREN FOUND!`);
    }
  });
}

checkCascadeStatus().catch(console.error);
