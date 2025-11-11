# InsideCloud × BOMS UI Integration Plan

## Goals
- Replace the current InsideCloud React UI with the BOMS template look & feel (side navigation, dashboards, admin areas) while keeping Lark authentication untouched.
- Reuse existing multi-tenant Lark auth + Supabase data flows for organization-aware content.
- Ensure Supabase objects, RPCs, and secrets remain valid; fill any gaps needed by the new UI (users, audit, compass modules, etc.).
- Deliver a verifiable migration path with incremental checkpoints, automated tests, and rollout guidance.

## Constraints & Assumptions
- **Auth**: Lark auth flow (frontend SDK bootstrap + backend Koa handlers + Supabase `get_lark_credentials`) stays intact. We only swap the UI shell and downstream API consumers.
- **Backend**: Keep the existing Koa server for Lark-specific flows. We can add controllers, services, or new routes, but avoid breaking current endpoints.
- **Frontend stack**: InsideCloud uses CRA + Tailwind. BOMS template is a Next.js App Router project with Material UI and Tailwind. We will port UI components into the CRA app (no Next.js runtime) by extracting reusable React components and Tailwind config.
- **Supabase**: Current schema includes `organizations`, `organization_auth_providers`, and related multi-tenant tables. No destructive changes; additions must be backward compatible.
- **Environments**: `.env` values (Supabase URL, service role, Lark credentials) already configured—do not rotate unless necessary.

## Current State Summary
- **InsideCloud Frontend**: `src/pages/home/index.js` provides dashboards and Lark SDK bootstrapping. Routing is mostly page-level directories under `src/pages`.
- **InsideCloud Backend**: `server/server.js` handles Koa routes for auth (`get_user_access_token`, `get_sign_parameters`, etc.), organization members, departments, and bitable tables using axios requests to Lark APIs. Supabase helper at `server/organization_helper.js` fetches credentials via RPC.
- **Supabase**: Verified via MCP tooling. Key findings:
  - Tables: `organizations` (slugs `cloud`, `inside`), `organization_auth_providers` (2 records, Lark provider), `individuals`, `organization_members`, plus rich BOMS-style tables (`products`, `system_admins`, etc.).
  - New `lark_users` table + `upsert_lark_user()` RPC capture every successful Lark login with org linkage.
  - Function `get_lark_credentials(slug text)` returns active credentials (confirmed for `cloud` and `inside`).
  - `auth.providers` table includes one `lark` entry; no missing migrations detected.
- **BOMS Template**: Next.js App Router with `app/protected` layouts, Material UI theme provider, side navigation, tables, role management pages, and API routes hitting Supabase.

## Integration Strategy
1. **Create Shared UI Library**
   - Extract BOMS UI primitives (navigation, layout, typography, cards) into a new package/directory inside InsideCloud (`src/boms-ui/`).
   - Copy Tailwind config tokens and Material UI theme; adapt to CRA environment (wrap `App` in `ThemeProvider`).
   - Replace CRA entry layout with BOMS shell component (`ProtectedLayout` equivalent) while preserving Lark SDK initialization.

2. **Routing & Page Mapping**
   - Map BOMS protected routes to InsideCloud equivalents: dashboard → `src/pages/home`, users → new `src/pages/admin/users`, audit logs, etc.
   - Implement React Router (or restructure CRA routing) to mirror BOMS nested layouts. Option: introduce `react-router-dom` v6 with layout routes to emulate Next.js nested structure.
   - Ensure Lark auth handshake still happens on initial load (e.g., `useEffect` triggers existing login process before showing protected layout).

3. **Data Access Layer**
   - Introduce a unified API client (e.g., `src/lib/apiClient.js`) to call existing Koa endpoints.
   - Port BOMS data hooks/services (users, organizations, audit logs) to call Supabase either directly (via service role edge functions) or through backend proxies, depending on security needs.
   - Confirm required Supabase RPCs exist; create new SQL functions/migrations if the BOMS components expect additional shape (e.g., paginated users list).
   - Ensure data loaders respect `organization_id` so each authenticated org only sees its own records (reuse `ctx.session.organization_id`).

4. **Backend Enhancements**
   - Organize Koa routes into modular routers (auth, organizations, users, analytics) to support the new UI pages.
   - Add endpoints that replicate BOMS API contract (e.g., `/api/admin/users`, `/api/admin/audit-logs`) but powered by Supabase queries using service key or Lark data where appropriate.
   - Keep Lark-related routes untouched; add integration tests to ensure they still return tokens and signatures.

5. **Supabase Alignment**
   - Audit BOMS schema requirements vs. current data. Enable policies for any new tables consumed by the frontend (or rely on service-role backend access).
   - Seed lookup data (roles, products) consistent with BOMS UI.
   - Set up Supabase Stored Procedures/Views mirroring BOMS expected responses (e.g., `list_admin_users`, `list_audit_events`).

6. **Auth Flow Bridging**
   - Continue using Lark cookie/session tokens to gate `ProtectedLayout` rendering.
   - Map Lark user identity to Supabase `individuals` / `organization_members` records. Add sync job if necessary to bridge Lark user info to Supabase tables.
   - Ensure logout flows clear both Lark session cookies and BOMS UI state.

7. **Styling & Assets**
   - Merge Tailwind configs (`tailwind.config.js` vs. `tailwind.config.ts`). Convert BOMS config to JS or CRA-friendly format, ensure class scanning includes `src/boms-ui/**/*`.
   - Import fonts, icons, and theme colors from BOMS template; adjust to avoid class name conflicts.

8. **Testing & Verification**
   - Unit tests for layout rendering and key components.
   - Integration tests for Lark login, Supabase data fetch, and new admin routes.
   - Manual QA checklist: login via Lark, navigate dashboard, view users, fetch audit logs.

## Milestones & Deliverables
1. **Preparation (Day 0-1)**
   - Copy BOMS UI components/assets into InsideCloud.
   - Confirm CRA builds with new dependencies (MUI, headless libs).
   - Document any manual Supabase seeds required.

2. **Shell Integration (Day 2-4)**
   - Implement new layout + navigation scaffolding.
   - Hook Lark auth guard to gate the shell.
   - Deploy feature branch to preview.

3. **Feature Parity (Day 5-8)**
   - Port dashboard widgets and data hooks.
   - Implement users/admin pages mapped to Supabase queries.
   - Ensure all Koa endpoints consumed by UI are available.

4. **QA & Hardening (Day 9-10)**
   - Regression tests for Lark auth endpoints.
   - Verify Supabase RLS/policies for any new endpoints.
   - Update documentation (`PROJECT_STRUCTURE.md`, runbooks, env samples).

## Supabase Verification Notes
- `get_lark_credentials('cloud')` and `get_lark_credentials('inside')` return active credentials (app ID + secret + nonce) and associated `organization_id`.
- `organizations` table has two active entries; ensure new UI allows switching org context via slug.
- `lark_users` remains empty until real logins occur; sync job now runs on both Koa and Vercel auth handlers (verified via test RPC call).
- `organization_members` currently has 1 record—seed additional records for UI demos or adapt components to handle empty states.
- No outstanding migrations detected; ensure future migrations use `supabase/migrations` pipeline.

## Open Questions / Follow-ups
- Should we migrate entirely to Next.js to reuse BOMS routing/APIs instead of porting into CRA? (Current plan assumes staying on CRA.)
- Do we need real-time features (e.g., Supabase Realtime) for user lists or dashboards?
- Clarify branding assets and theming overrides beyond BOMS defaults.
- Determine deployment strategy: single app (CRA + Koa) vs. multi-service (Next frontend + Koa backend).

## Next Actions
1. Confirm approach (port vs. migrate) with stakeholders.
2. Align Supabase schema requirements by reviewing BOMS API expectations.
3. Implement Supabase-backed data isolation (use `organization_id` filter paths) before wiring BOMS dashboards.
4. Begin shell integration work on a feature branch after approval of this plan.
