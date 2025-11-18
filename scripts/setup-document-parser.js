/**
 * Setup script to insert Document Parser product and access records
 * Run with: node scripts/setup-document-parser.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function setupDocumentParser() {
  try {
    console.log('🚀 Starting Document Parser product setup...\n');

    // Step 1: Insert product record
    console.log('📝 Step 1: Inserting Document Parser product...');
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert([
        {
          key: 'document_parser',
          name: 'Document Parser',
          description: 'Parse and extract information from documents',
          category: 'analytics',
          metadata: {}
        }
      ])
      .select();

    if (productError) {
      console.error('❌ Error inserting product:', productError);
      process.exit(1);
    }

    console.log('✅ Product inserted:', product[0]);

    // Step 2: Get all organizations
    console.log('\n📝 Step 2: Fetching all organizations...');
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, slug, name');

    if (orgError) {
      console.error('❌ Error fetching organizations:', orgError);
      process.exit(1);
    }

    console.log(`✅ Found ${organizations.length} organization(s)`);

    // Step 3: Insert organization_product_access records
    console.log('\n📝 Step 3: Creating access records for all organizations...');

    const accessRecords = organizations.map(org => ({
      organization_id: org.id,
      product_id: product[0].id,
      is_enabled: true,
      created_at: new Date().toISOString()
    }));

    const { data: access, error: accessError } = await supabase
      .from('organization_product_access')
      .insert(accessRecords)
      .select();

    if (accessError) {
      console.error('❌ Error inserting access records:', accessError);
      process.exit(1);
    }

    console.log(`✅ Created ${access.length} access record(s)`);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Document Parser product setup complete!');
    console.log('='.repeat(50));
    console.log('\nSummary:');
    console.log(`  Product ID: ${product[0].id}`);
    console.log(`  Product Name: ${product[0].display_name}`);
    console.log(`  Organizations with access: ${access.length}`);
    console.log('\nNext steps:');
    console.log('  1. Create DocumentParser component in src/tools/document-parser/');
    console.log('  2. Update DashboardContent component to display the product');
    console.log('  3. Update navigation handlers in home/index.js');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

setupDocumentParser();
