#!/bin/bash

# Simple Strategic Map v2 API Test Script
# Tests basic GET operation without authentication

API_BASE="http://localhost:8989"
ORG_SLUG="cloud"

echo "🔍 Testing Strategic Map v2 API"
echo "=================================="
echo ""

echo "📥 GET all items for organization: $ORG_SLUG"
echo "---"

curl -s "$API_BASE/api/strategic_map_v2?organization_slug=$ORG_SLUG" | jq '.'

echo ""
echo "=================================="
echo "✅ If you see JSON data above with items, the API is working!"
echo ""
echo "Check for:"
echo "  - Items should have 'colIndex' that is NOT null"
echo "  - yearly_0_0 should exist (yearly item with yearIndex=0)"
echo "  - monthly_0_XXXXX should exist (cascaded December item)"
