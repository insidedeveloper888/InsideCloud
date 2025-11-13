## Goals
1. Verify the full round‑trip for StrategicMap: UI → API → Supabase.
2. Inspect and document the `public.strategic_map_items` schema and related tables.
3. Capture representative data samples across timeframes (yearly/monthly/weekly/daily).

## Read‑Only Verification Steps
1. Supabase Schema
   - List tables and confirm presence of `public.strategic_map_items`, `organizations`, `products`, `individuals`.
   - Describe columns for `strategic_map_items` and key constraints (ids, foreign keys, indexes, RLS if present).
2. Data Samples
   - Run SELECTs (read‑only) to fetch a small sample of `strategic_map_items` for:
     - One organization (by slug → organization_id)
     - Each timeframe (`yearly`, `monthly`, `weekly`, `daily`) including edge cases (auto‑generated vs manual).
   - Verify values used by the UI mapping: `row_index`, `column_index`, `item_index`, `status`, `timeframe_value` formats (YYYY‑MM‑DD).
3. Products & Org Linking
   - Confirm `products.key = 'strategic_map'` exists and capture `product_id`.
   - Validate items are scoped to `organization_id` and `product_id` as implemented.
4. Identity Resolution (Individual Scope)
   - Review RPC `get_auth_user_by_lark` existence and return shape.
   - Confirm `individuals` records structure enough to filter `individual_id` for `scope='individual'` items.
5. API Roundtrip Sanity
   - Using read‑only requests, inspect GET responses from your `/api/strategic_map` for one org and compare with direct Supabase SELECTs to ensure parity.

## Deliverables
- A concise schema doc for `strategic_map_items` and relationships used by the API.
- Verified examples demonstrating the column‑to‑UI mapping across timeframes.
- Notes on any discrepancies or potential improvements (indexes, constraints, RLS).

## Next Actions After Approval
- Execute the read‑only Supabase queries and capture results.
- Map findings back to UI behaviors and propose refinements as needed.