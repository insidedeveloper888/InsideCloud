/**
 * Setup script to insert Inventory Management product and access records
 * Run with: node scripts/setup-inventory.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function setupInventory() {
  try {
    console.log('🚀 Starting Inventory Management product setup...\n');

    // Step 1: Check if product already exists
    console.log('📝 Step 1: Checking for existing product...');
    const { data: existingProduct } = await supabase
      .from('products')
      .select('*')
      .eq('product_key', 'inventory')
      .single();

    let product;

    if (existingProduct) {
      console.log('ℹ️  Product already exists, updating...');
      const { data: updatedProduct, error: updateError } = await supabase
        .from('products')
        .update({
          product_name: 'Inventory Management',
          description: 'Complete inventory management system with stock tracking, purchase orders, suppliers, and warehouse management.',
          category: 'operations',
          icon: 'Package',
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('product_key', 'inventory')
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating product:', updateError);
        process.exit(1);
      }

      product = updatedProduct;
      console.log('✅ Product updated:', product);
    } else {
      console.log('📝 Creating new product...');
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert([
          {
            product_key: 'inventory',
            product_name: 'Inventory Management',
            description: 'Complete inventory management system with stock tracking, purchase orders, suppliers, and warehouse management.',
            category: 'operations',
            icon: 'Package',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (productError) {
        console.error('❌ Error inserting product:', productError);
        process.exit(1);
      }

      product = newProduct;
      console.log('✅ Product created:', product);
    }

    // Step 2: Get all organizations
    console.log('\n📝 Step 2: Fetching all organizations...');
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, slug, name');

    if (orgError) {
      console.error('❌ Error fetching organizations:', orgError);
      process.exit(1);
    }

    console.log(`✅ Found ${organizations.length} organization(s):`);
    organizations.forEach(org => {
      console.log(`   - ${org.slug} (${org.name})`);
    });

    // Step 3: Check existing access records
    console.log('\n📝 Step 3: Checking existing access records...');
    const { data: existingAccess } = await supabase
      .from('organization_product_access')
      .select('organization_id')
      .eq('product_id', product.id);

    const existingOrgIds = new Set(existingAccess?.map(a => a.organization_id) || []);
    const orgsToAdd = organizations.filter(org => !existingOrgIds.has(org.id));

    if (orgsToAdd.length === 0) {
      console.log('✅ All organizations already have access to Inventory');
    } else {
      console.log(`📝 Step 4: Granting access to ${orgsToAdd.length} organization(s)...`);

      const accessRecords = orgsToAdd.map(org => ({
        organization_id: org.id,
        product_id: product.id,
        is_enabled: true,
        settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data: access, error: accessError } = await supabase
        .from('organization_product_access')
        .insert(accessRecords)
        .select();

      if (accessError) {
        console.error('❌ Error inserting access records:', accessError);
        process.exit(1);
      }

      console.log(`✅ Created ${access.length} new access record(s)`);
      access.forEach((a, i) => {
        console.log(`   - ${orgsToAdd[i].slug}`);
      });
    }

    // Step 4: Verification
    console.log('\n📝 Step 5: Verifying setup...');
    const { data: allAccess, error: verifyError } = await supabase
      .from('organization_product_access')
      .select(`
        is_enabled,
        organizations:organization_id (slug, name)
      `)
      .eq('product_id', product.id);

    if (verifyError) {
      console.error('❌ Error verifying access:', verifyError);
      process.exit(1);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Inventory Management product setup complete!');
    console.log('='.repeat(60));
    console.log('\nProduct Details:');
    console.log(`  Product ID: ${product.id}`);
    console.log(`  Product Key: ${product.product_key}`);
    console.log(`  Product Name: ${product.product_name}`);
    console.log(`  Category: ${product.category}`);
    console.log(`  Status: ${product.status}`);
    console.log(`\nAccess Summary:`);
    console.log(`  Total organizations with access: ${allAccess.length}`);
    console.log(`  Enabled: ${allAccess.filter(a => a.is_enabled).length}`);
    console.log(`  Disabled: ${allAccess.filter(a => !a.is_enabled).length}`);
    console.log('\nOrganizations:');
    allAccess.forEach(a => {
      const status = a.is_enabled ? '✅' : '❌';
      console.log(`  ${status} ${a.organizations.slug} - ${a.organizations.name}`);
    });
    console.log('\nNext steps:');
    console.log('  ✅ Product is already integrated in the frontend');
    console.log('  ✅ Inventory module is accessible at /inventory route');
    console.log('  ✅ All features are ready to use');
    console.log('\nUsers can now:');
    console.log('  - Manage products and stock items');
    console.log('  - Create and track purchase orders');
    console.log('  - Manage suppliers and warehouses');
    console.log('  - View stock movements and analytics');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

setupInventory();
