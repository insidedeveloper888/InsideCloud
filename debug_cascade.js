const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCascade() {
  console.log('\n=== Checking Test Goals in Database ===\n');

  const { data, error } = await supabase
    .from('strategic_map_items')
    .select('timeframe, category_index, year_index, month_col_index, week_number, daily_date_key, is_cascaded, cascade_level, text')
    .eq('organization_id', '86774cf1-7590-487e-9657-110cdf3c7fc9')
    .ilike('text', '%Test%')
    .eq('is_deleted', false)
    .order('cascade_level', { ascending: true })
    .order('timeframe', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} items:\n`);

  data.forEach((item, idx) => {
    console.log(`${idx + 1}. ${item.text}`);
    console.log(`   Timeframe: ${item.timeframe}`);
    console.log(`   Category Index: ${item.category_index}`);
    console.log(`   Year Index: ${item.year_index}`);
    console.log(`   Month Col Index: ${item.month_col_index}`);
    console.log(`   Week Number: ${item.week_number}`);
    console.log(`   Daily Date Key: ${item.daily_date_key}`);
    console.log(`   Is Cascaded: ${item.is_cascaded}`);
    console.log(`   Cascade Level: ${item.cascade_level}`);

    // Calculate frontend cell key
    let cellKey;
    if (item.timeframe === 'yearly') {
      cellKey = `yearly_${item.category_index}_${item.year_index}`;
    } else if (item.timeframe === 'monthly') {
      cellKey = `monthly_${item.category_index}_${item.month_col_index}`;
    } else if (item.timeframe === 'weekly') {
      cellKey = `weekly_${item.category_index}_${item.week_number}`;
    } else if (item.timeframe === 'daily') {
      cellKey = `daily_${item.category_index}_${item.daily_date_key}`;
    }
    console.log(`   Frontend Cell Key: ${cellKey}`);
    console.log('');
  });

  // Check what Week 1 should cascade to
  console.log('\n=== Week 1, 2026 Information ===');
  console.log('Week 1, 2026 runs from Monday Dec 29, 2025 to Sunday Jan 4, 2026');
  console.log('Expected daily_date_key for Sunday: 20260104');
  console.log('You mentioned looking at "Sun 3" but that would be Saturday Jan 3 (20260103)');
  console.log('The cascade should be on Sunday Jan 4, not Saturday Jan 3!\n');
}

debugCascade();
