# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **📋 For Architecture Decisions & Design Standards**: See [ARCHITECTURE.md](ARCHITECTURE.md)
>
> CLAUDE.md focuses on **operational commands and workflows**. For architecture decisions, component standards, UI/UX guidelines, and development patterns, refer to ARCHITECTURE.md.

## Development Commands

### Initial Setup
```bash
npm install
npm run config  # Interactive CLI to configure Lark App ID, App Secret, and API port
```

The `config` command generates:
- `src/config/client_config.js` - Frontend Lark configuration
- `server/server_config.js` - Backend Lark configuration

### Running the Application
```bash
npm run start              # Start both backend (port 8989) and frontend (port 3000)
npm run start:web          # React dev server only
npm run start:server       # Koa backend server only
npm run start:with-ngrok   # Start with ngrok tunnel for Lark testing
```

### Build and Deployment
```bash
npm run build              # Production build
npm run deploy             # Deploy to Vercel production
npm run deploy:preview     # Deploy to Vercel preview environment
```

### Testing
No test suite is currently configured in this project.

## High-Level Architecture

### Application Type
Multi-tenant Lark (Feishu) workspace application with strategic planning features. Full-stack React + Node.js with dual deployment modes (Koa dev server + Vercel serverless).

### Technology Stack
- **Frontend**: React 18, Tailwind CSS 3.4 (primary), shadcn/ui, Framer Motion
  - *Note*: Material-UI 5 is being phased out (see ADR-002 in ARCHITECTURE.md)
- **Backend**: Koa 2 (dev) + Vercel serverless functions (prod)
- **Database**: Supabase (PostgreSQL)
- **External Integration**: Lark Open Platform APIs, Lark H5 JS SDK

### Multi-Tenant Architecture

Each organization has:
- Unique `organization_slug` identifier
- Separate Lark app credentials stored in Supabase `organizations.lark_credentials`
- Isolated member access via `organization_members` table with roles (owner, admin, member)

**Organization Context Flow:**
1. User selects organization via OrganizationSelector
2. `organization_slug` stored in localStorage
3. All API requests include `organization_slug` query parameter
4. Backend validates organization exists and fetches org-specific Lark credentials
5. Session stores `organization_id` for subsequent requests

### Dual Authentication Flow

The app supports two authentication modes:

**1. JSAPI Authentication (Production - Inside Lark)**
```
Frontend → handleJSAPIAccess()
  ↓
Backend /api/get_sign_parameters → Calculate signature with jsapi_ticket
  ↓
window.h5sdk.config() → Initialize Lark JSAPI
  ↓
window.tt.requestAuthCode() → Get authorization code
  ↓
Backend /api/get_user_access_token → Exchange code for user_access_token
  ↓
Store in session as lk_token cookie → Sync user to Supabase
```

**2. OAuth 2.0 Flow (Development - External Browser)**

Enabled when `REACT_APP_ALLOW_EXTERNAL_BROWSER=true`:
```
Detect JSAPI unavailable → Redirect to Lark OAuth
  ↓
User authorizes → Redirect back with code in URL
  ↓
Extract code and organization_slug from state parameter
  ↓
Backend exchanges code for user_access_token (same as JSAPI)
```

**Token Revalidation Strategy:**
When a token expires (Lark returns code: -2), the frontend:
1. Clears invalid `lk_token` from localStorage and cookies
2. Recursively calls `handleUserAuth()` to restart authentication
3. Prevents redirect loops and provides seamless reauth

### Session-Based Authentication

- Koa session middleware with 2-hour cookie expiration
- `lk_token` cookie stores Lark user access token
- Backend validates token with Lark API on each request
- Support for both cookie (browser) and Authorization header (webview):
  ```javascript
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const lkToken = bearerToken || cookies.lk_token;
  ```

### Role-Based Access Control

After authentication:
1. Backend queries Supabase RPC: `get_auth_user_by_lark(lark_user_id, email)`
2. Gets `individuals.id` by `user_id`
3. Gets `organization_members.role_code` by `individual_id` + `organization_id`
4. Sets `session.is_admin = (role_code === 'admin' || role_code === 'owner')`
5. Frontend checks `isAdmin` to show/hide admin features

### Document Parser - Production Ready ✅

**Status**: Production-ready as of 2025-11-18 (v1.0.0)

The document parser is a **pure frontend tool for parsing and formatting accounting software exports** with no database or API dependencies.

**Key Features:**
- ✅ Pure frontend implementation (no database, no API, no file storage)
- ✅ Multi-software support (SQL Accounting, Autocount ready for future)
- ✅ Excel (.xlsx, .xls) and CSV file format support
- ✅ Custom parsers for each document type with invoice+item combination
- ✅ Live preview table with metadata display
- ✅ CSV export with timestamped filenames
- ✅ Proper number formatting (2 decimal places), date standardization (YYYY-MM-DD)
- ✅ Automatic handling of totals rows and count summary rows

**Supported Document Types (SQL Accounting):**
1. Customer Document Listing - Invoice with Item
2. Supplier Document Listing
3. GL Document Listing - OR
4. GL Document Listing - PV

**Data Transformation:**
- Combines invoice rows with multiple item rows (one output row per item)
- Inserts item columns at specified positions in output
- Cleans placeholder values ("----")
- Handles Excel date formatting and custom cell formats
- Skips summary/totals rows automatically

**Implementation Files:**
- **Main Component**: `src/tools/document-parser/index.jsx`
- **Parsers**: `src/tools/document-parser/parsers/sql-accounting/` (separate file per document type)
- **Components**: `src/tools/document-parser/components/` (SoftwareSelector, DocumentTypeSelector, FileUploader, DataPreviewTable, DownloadButton)
- **Utilities**: `src/tools/document-parser/utils/constants.js`, `parsers/common/excelReader.js`, `parsers/common/csvReader.js`

### Contact Management (名单管理) - Production Ready ✅

**Status**: Production-ready as of 2025-11-19 (v1.0.0)

The Contact Management tool is a **full-featured CRM system for managing customer, supplier, COI (Center of Influence), and internal contacts** with configurable rating scales and comprehensive filtering.

**Key Features:**
- ✅ Full CRUD operations for contacts with multi-field forms
- ✅ Configurable customer rating system (3-10 star scale)
- ✅ Advanced filtering by type, stage, traffic source, tags, and ratings
- ✅ Custom pipeline stages with color-coding
- ✅ Traffic channel (marketing source) management
- ✅ Tag system for flexible categorization
- ✅ Sales and customer service assignment
- ✅ Referral tracking (referred_by_contact_id)
- ✅ Malaysian address validation (state dropdown)
- ✅ Avatar support with color backgrounds
- ✅ Search functionality across all fields
- ✅ List view (table and card modes)
- ✅ Dashboard with key metrics
- ✅ Settings panel for rating scale configuration

**Unique Features:**
- **Configurable Rating Scale**: Organizations can set rating scale from 3-10 stars via settings
- **Dynamic Filters**: Rating filters adapt automatically to configured scale (Low/Medium/High ranges)
- **Percentage-Based Colors**: Star colors calculate dynamically (70%+ green, 40-69% amber, <40% red)
- **Multi-Entity Support**: Handle both individuals and companies with company-specific fields
- **Referral Network**: Track referral relationships between contacts
- **Assignment System**: Assign contacts to sales and customer service teams

**Data Model:**
- **Contacts**: Personal info, business info, contact details, address, assignments, ratings
- **Contact Stages**: Custom pipeline stages (Lead → Qualified → Won, etc.)
- **Traffic Channels**: Marketing sources (Website, Referral, Social Media, etc.)
- **Contact Tags**: Flexible categorization with many-to-many relationships
- **Contact Settings**: Organization-level configuration (rating scale)

**Implementation Files:**
- **Main Component**: `src/tools/contact-management/index.jsx`
- **Backend Controller**: `server/contact_management_controller.js`
- **Components**: `src/tools/contact-management/components/` (ContactListView, ContactFormDialog, FilterPanel, SettingsView, StarRating, etc.)
- **Hooks**: `src/tools/contact-management/hooks/` (useContacts, useContactStages, useTrafficChannels, useContactTags, useContactSettings)
- **Complete Schema**: `docs/contact-management-complete-schema.sql`

### Inventory Management (库存管理) - Production Ready ✅

**Status**: Production-ready as of 2025-11-22

A comprehensive inventory management system with multi-location stock tracking, purchase orders, suppliers, and stock movements.

**Key Features:**
- ✅ Product catalog with SKU, categories, and units of measurement
- ✅ Multi-location inventory tracking (warehouses, sites, vehicles)
- ✅ Stock movements (IN/OUT) with batch recording support
- ✅ Purchase order management with supplier integration
- ✅ Supplier management with contact details
- ✅ Low stock alerts and inventory thresholds
- ✅ Custom categories and units per organization
- ✅ Quick add product functionality
- ✅ Mobile-responsive card views for tables
- ✅ Real-time stock level calculations

**Implementation Files:**
- **Main Component**: `src/tools/inventory/index.jsx`
- **Backend Controller**: `server/inventory_controller.js`
- **API Client**: `src/tools/inventory/api/inventory.js`
- **Complete Schema**: `docs/inventory/inventory_schema.sql`
- **Documentation**: `docs/inventory/` (integration plans, setup guides, feature docs)

### Strategic Map - Production Ready ✅

**Status**: Production-ready as of 2025-11-17 (v2.2.0)

The strategic map feature is a **fully database-driven, real-time collaborative goal planning tool** with automatic cascading from yearly to daily views.

**Key Features:**
- ✅ Full CRUD operations with database persistence
- ✅ PostgreSQL triggers for automatic cascade creation and updates
- ✅ Supabase Realtime for multi-user collaboration
- ✅ Smart deduplication to prevent duplicate items from realtime events
- ✅ Optimistic updates with automatic rollback on errors
- ✅ Advanced year management (auto-discovery, hide/show, default 5-year view)
- ✅ Clickable hyperlinks in goal text
- ✅ ISO 8601 compliant weekly view
- ✅ Timezone-aware date formatting

**Cascade Hierarchy:**
- Yearly goals → December monthly goal → Last week of December → Sunday of last week
- Cascade creates 4 database records automatically via triggers
- Updates propagate to all descendants recursively
- Frontend displays pre-cascaded data from database

**Real-Time Collaboration:**
- Supabase Realtime subscription broadcasts INSERT/UPDATE/DELETE events
- Cell-based mutation tracking prevents duplicates from own actions
- Changes from other users appear instantly across all clients
- Optimistic updates provide instant feedback while API processes in background

**Architecture:**
```
User Action
  ↓
Frontend (Optimistic Update)
  ↓
API Call → Backend Controller
  ↓
Database (Trigger Cascade)
  ↓
Realtime Broadcast
  ↓
All Connected Clients (Update UI)
```

**Implementation Files:**
- **Backend**: `server/strategic_map_controller.js` (full CRUD with cascade support)
- **Frontend**: `src/tools/strategic-map/index.jsx` (1,400+ lines, main orchestrator)
- **Realtime Hook**: `src/tools/strategic-map/hooks/useRealtimeSync.js`
- **API Client**: `src/tools/strategic-map/api.js`
- **Database Triggers**: SQL functions for cascade creation and updates

### Hybrid Deployment Architecture

**Development Mode:**
- Koa server on `localhost:8989`
- Create React App proxy forwards `/api/*` to Koa
- Same codebase as production serverless functions

**Production Mode (Vercel):**
- Serverless functions in `/api/` directory
- Static React build served from `/build`
- `vercel.json` rewrites route requests to appropriate handlers

**Code Sharing:**
Logic is duplicated between `server/server.js` (Koa) and `/api/*.js` (Vercel) to maintain consistency across environments.

**⚠️ CRITICAL: When Adding New API Endpoints**

When implementing a new API endpoint, you **MUST** implement it in **BOTH** places:

1. **Koa Development Server** (`server/server.js`):
   ```javascript
   // STEP 1: Add OPTIONS handler for CORS preflight (REQUIRED!)
   router.options('/api/new-endpoint', async (ctx) => {
     serverUtil.configAccessControl(ctx);
     ctx.status = 200;
   })

   // STEP 2: Add route with Koa syntax
   router.get('/api/new-endpoint', async (ctx) => {
     serverUtil.configAccessControl(ctx)  // CORS handling
     const param = ctx.query.param
     // ... implementation
     ctx.body = { code: 0, data: result }
   })
   ```

2. **Vercel Production** (`api/[...path].js` + handler):
   ```javascript
   // Create handler: server/api_handlers/new_endpoint.js
   module.exports = async function handler(req, res) {
     if (handleCors(req, res)) return;  // CORS handling
     const param = req.query.param
     // ... implementation
     res.status(200).json({ code: 0, data: result })
   }

   // Register in api/[...path].js
   const newEndpoint = require('../server/api_handlers/new_endpoint');
   const routes = {
     '/api/new-endpoint': newEndpoint,
     // ...
   };
   ```

**Common Mistakes:**
1. ❌ Creating only the Vercel handler and forgetting the Koa route
   - Symptom: Endpoint works in production but **fails in development** (localhost:8989)
   - Symptom: API requests stuck at "Pending" status during local development

2. ❌ Forgetting the OPTIONS handler for CORS preflight
   - Symptom: CORS error: "No 'Access-Control-Allow-Origin' header is present"
   - Symptom: Browser shows preflight request failed
   - Root cause: Browser sends OPTIONS request before GET/POST, needs handler

**Mandatory Checklist for New API Endpoints:**
- [ ] Add **OPTIONS handler** to `server/server.js` for CORS preflight
- [ ] Add route (GET/POST/etc) to `server/server.js` (Koa)
- [ ] Create handler in `server/api_handlers/` (Vercel)
- [ ] Register route in `api/[...path].js` (Vercel unified router)
- [ ] Test in both dev (`npm run start:server`) and prod (Vercel deploy)
- [ ] Verify no CORS errors in browser console
- [ ] Apply product access middleware if needed (`requireProductAccess()`)

## Key Implementation Patterns

### 1. Organization-Specific App IDs
Each organization can have different Lark app credentials. The frontend stores the organization-specific `app_id` in localStorage and uses it for JSAPI calls.

### 2. Optimistic Updates with Cascade Support
Strategic Map uses optimistic updates for instant UX feedback:
```javascript
// Optimistic: Update UI immediately
setData(prev => ({
  ...prev,
  [key]: prev[key].map(item => item.id === id ? { ...item, text: newText } : item)
}));

// API: Send to backend
const result = await StrategicMapAPI.updateItem(...);

// Cascade: Update all descendants returned by database trigger
if (result.data.cascadedItems) {
  result.data.cascadedItems.forEach(cascadedItem => {
    updateItemInState(cascadedItem);
  });
}

// Rollback: If API fails, revert to old value
catch (error) {
  setData(prev => ({
    ...prev,
    [key]: prev[key].map(item => item.id === id ? { ...item, text: oldText } : item)
  }));
}
```

### 3. User Sync on Login
Every authentication triggers `syncLarkUser()`:
- Check if `auth.users` exists by `lark_user_id`
- If not: Create user, individual, and organization_member records
- If exists: Update profile (name, email, avatar_url)
- Ensures all authenticated users are in database

## Configuration Requirements

### Environment Variables (.env)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Required for RLS bypass
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...  # Optional
REACT_APP_ALLOW_EXTERNAL_BROWSER=true  # Enable OAuth for local dev
```

### Lark App Setup
1. Create Lark app at [https://open.feishu.cn](https://open.feishu.cn)
2. Enable scopes: `contact:user.id:readonly`, `contact:user:readonly`
3. Configure OAuth redirect URI:
   - Local: `http://localhost:3000`
   - Production: Your Vercel domain
4. Run `npm run config` and input App ID and App Secret
5. Store credentials in Supabase `organizations.lark_credentials` JSONB

### Supabase Database Tables
Required tables:
- `organizations` - Multi-tenant organizations with `lark_credentials` JSONB
- `individuals` - User profiles
- `organization_members` - Roles (owner, admin, member)
- `strategic_map_items` - Strategic planning data with cascade triggers
- `audit_events` - Audit logging

Required RPC function:
- `get_auth_user_by_lark(p_lark_user_id, p_email)` - Find auth user by Lark ID or email

## Important Documentation

Comprehensive documentation exists in the `/docs` folder:

- **🏗️ Architecture Guide**: [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture decisions, component standards, UI/UX guidelines
- **Getting Started**: [docs/project/project-understanding.md](docs/project/project-understanding.md)
- **Strategic Map Solution**: [docs/strategic-map/strategic-map-solution-summary.md](docs/strategic-map/strategic-map-solution-summary.md)
- **Strategic Map CRUD Guide**: [docs/strategic-map/strategic-map-crud-guide.md](docs/strategic-map/strategic-map-crud-guide.md)
- **Strategic Map Cascade Flow**: [docs/strategic-map/strategic-map-cascade-flow.md](docs/strategic-map/strategic-map-cascade-flow.md)
- **Lark API Overview**: [docs/lark/lark-api-overview.md](docs/lark/lark-api-overview.md)
- **OAuth Local Development**: [docs/guides/oauth-local-development.md](docs/guides/oauth-local-development.md)

Refer to these documents for detailed implementation guides and API documentation.

## Project Structure (Updated 2025-11-14)

### New Tool-Based Organization
Following **ADR-001** in ARCHITECTURE.md, the project now uses a tool-based structure:

```
src/
├── tools/                          # Lark integration tools
│   ├── strategic-map/             # Strategic planning tool
│   │   ├── index.jsx              # Main view
│   │   ├── components/            # Tool-specific components
│   │   ├── hooks/                 # Custom hooks
│   │   └── utils/                 # Tool utilities
│   └── _template/                 # Template for new tools
├── components/
│   ├── ui/                        # shadcn/ui components (Button, Card, etc.)
│   ├── layout/                    # Topbar, ProtectedLayout
│   └── organization/              # OrganizationSelector
├── contexts/                      # React contexts
│   └── OrganizationContext.jsx   # Multi-tenant organization context
├── lib/                          # Shared utilities
│   └── utils.js                  # cn() for Tailwind class merging
└── pages/                        # Top-level pages
    └── home/                     # Dashboard
```

### Deprecated/Archived
- **archived/components/StrategicMap/** - Old Material-UI implementation (2,581 lines)
  - Replaced by `src/tools/strategic-map/` (187 lines, Tailwind CSS)

## Entry Points

- **Frontend**: [src/pages/home/index.js](src/pages/home/index.js) - Main application entry
- **Tools**:
  - [src/tools/strategic-map/index.jsx](src/tools/strategic-map/index.jsx) - Strategic map tool
  - [src/tools/inventory/index.jsx](src/tools/inventory/index.jsx) - Inventory management
  - [src/tools/contact-management/index.jsx](src/tools/contact-management/index.jsx) - Contact management
  - [src/tools/document-parser/index.jsx](src/tools/document-parser/index.jsx) - Document parser
- **Backend (Dev)**: [server/server.js](server/server.js) - Koa server with all API endpoints
- **Backend (Prod)**: [api/strategic_map.js](api/strategic_map.js) - Primary serverless function
- **Authentication**: [src/utils/auth_access_util.js](src/utils/auth_access_util.js) - Auth utilities
- **Organization Logic**: [server/organization_helper.js](server/organization_helper.js) - Multi-tenant helpers
- **Organization Context**: [src/contexts/OrganizationContext.jsx](src/contexts/OrganizationContext.jsx) - React context provider

## Key Architecture Decisions

See [ARCHITECTURE.md](ARCHITECTURE.md) for full details. Key decisions:

- **ADR-001**: Tool-based project structure (`/src/tools/`)
- **ADR-002**: Tailwind CSS + shadcn/ui (replacing Material-UI)
- **ADR-003**: Client-side storage first, database sync later (completed in v2.2.0)
- **ADR-004**: Hybrid deployment (Koa dev + Vercel production)
- **ADR-005**: Auto-expanding textarea with fixed-width columns
- **ADR-006**: Strategic map cascading - client-side pattern (migrated to database in v2.2.0)

## Recent Major Milestones

### ✅ Contact Management v1.0.0 - Production Ready (2025-11-19)
- Full CRM system with customer, supplier, COI, and internal contact types
- Configurable rating system (3-10 stars) at organization level
- Dynamic rating filters that adapt to configured scale
- Comprehensive contact forms with all fields (personal, business, address)
- Advanced filtering by type, stage, traffic source, tags, and ratings
- Custom pipeline stages and traffic channels management
- Tag system for flexible categorization
- Sales and customer service assignment tracking
- Malaysian address validation with state dropdown
- Search functionality across all contact fields
- Professional UI with table and card view modes

### ✅ Strategic Map v2.2.0 - Production Ready (2025-11-17)
- Full migration from localStorage to database-driven architecture
- PostgreSQL triggers for automatic cascading
- Supabase Realtime for multi-user collaboration
- Smart deduplication system to prevent duplicate items
- Advanced year management with auto-discovery
- Enterprise-grade features: hyperlinks, ISO 8601 compliance, timezone handling

For complete details, see [ARCHITECTURE.md - Change Log v2.2.0](ARCHITECTURE.md#220---2025-11-17--strategic-map-production-ready)
