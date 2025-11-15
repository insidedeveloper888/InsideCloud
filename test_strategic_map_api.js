/**
 * Strategic Map v2 API Test Script
 * Tests all CRUD operations and cascade behavior
 */

const axios = require('axios');

const API_BASE = 'http://localhost:8989';
const ORG_SLUG = 'cloud';

// Test authentication token (you'll need to replace this with a valid token)
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || '';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    ...(AUTH_TOKEN && { 'Authorization': `Bearer ${AUTH_TOKEN}` })
  }
});

async function testGetItems() {
  console.log('\n📥 TEST 1: GET all items');
  console.log('='.repeat(50));

  try {
    const response = await api.get(`/api/strategic_map_v2?organization_slug=${ORG_SLUG}`);
    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testCreateItem() {
  console.log('\n📝 TEST 2: CREATE a yearly item');
  console.log('='.repeat(50));

  const itemData = {
    organization_slug: ORG_SLUG,
    text: 'Test Yearly Goal - API Test',
    status: 'neutral',
    timeframe: 'yearly',
    categoryIndex: 0,  // 阶段成就
    yearIndex: 0       // First year (2025)
  };

  try {
    const response = await api.post('/api/strategic_map_v2', itemData);
    console.log('✅ Success!');
    console.log('Created item:', JSON.stringify(response.data.data.item, null, 2));
    console.log('Cascaded items:', JSON.stringify(response.data.data.cascadedItems, null, 2));
    return response.data.data.item;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testUpdateItem(itemId) {
  console.log('\n✏️  TEST 3: UPDATE item');
  console.log('='.repeat(50));

  const updates = {
    organization_slug: ORG_SLUG,
    text: 'Updated Test Goal - Modified via API',
    status: 'done'
  };

  try {
    const response = await api.put(`/api/strategic_map_v2?id=${itemId}`, updates);
    console.log('✅ Success!');
    console.log('Updated item:', JSON.stringify(response.data.data.item, null, 2));
    console.log('Cascaded items updated:', JSON.stringify(response.data.data.cascadedItems, null, 2));
    return response.data.data.item;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testDeleteItem(itemId) {
  console.log('\n🗑️  TEST 4: DELETE item');
  console.log('='.repeat(50));

  try {
    const response = await api.delete(`/api/strategic_map_v2?id=${itemId}&organization_slug=${ORG_SLUG}`);
    console.log('✅ Success!');
    console.log('Deleted item:', JSON.stringify(response.data.data.item, null, 2));
    console.log('Cascaded items deleted:', response.data.data.cascadedItemsDeleted);
    return response.data;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testBatchCreate() {
  console.log('\n📦 TEST 5: BATCH CREATE items');
  console.log('='.repeat(50));

  const batchData = {
    organization_slug: ORG_SLUG,
    items: [
      {
        text: 'Batch Item 1',
        status: 'neutral',
        timeframe: 'yearly',
        category_index: 1,
        year_index: 0
      },
      {
        text: 'Batch Item 2',
        status: 'neutral',
        timeframe: 'yearly',
        category_index: 2,
        year_index: 0
      }
    ]
  };

  try {
    const response = await api.post('/api/strategic_map_v2/batch', batchData);
    console.log('✅ Success!');
    console.log('Result:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    throw error;
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting Strategic Map v2 API Tests');
  console.log('='.repeat(50));
  console.log(`API Base: ${API_BASE}`);
  console.log(`Organization: ${ORG_SLUG}`);
  console.log(`Auth Token: ${AUTH_TOKEN ? 'Provided' : 'NOT PROVIDED (tests may fail)'}`);

  let createdItemId;

  try {
    // Test 1: Get all items (initial state)
    const initialData = await testGetItems();

    // Test 2: Create item
    const createdItem = await testCreateItem();
    createdItemId = createdItem.id;

    // Wait a bit for cascade triggers
    console.log('\n⏳ Waiting 500ms for cascade triggers...');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 3: Get all items (should show new item + cascaded)
    await testGetItems();

    // Test 4: Update item
    await testUpdateItem(createdItemId);

    // Wait a bit for cascade updates
    console.log('\n⏳ Waiting 500ms for cascade updates...');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 5: Get all items (should show updated item + cascaded)
    await testGetItems();

    // Test 6: Delete item
    await testDeleteItem(createdItemId);

    // Wait a bit for cascade deletes
    console.log('\n⏳ Waiting 500ms for cascade deletes...');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 7: Get all items (should not show deleted item)
    await testGetItems();

    // Test 8: Batch create (optional)
    // await testBatchCreate();

    console.log('\n✅ ALL TESTS PASSED!');
    console.log('='.repeat(50));

  } catch (error) {
    console.log('\n❌ TEST SUITE FAILED');
    console.log('='.repeat(50));
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(console.error);
