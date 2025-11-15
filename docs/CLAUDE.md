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

### Database-Driven Strategic Map Cascading

The strategic map feature uses **PostgreSQL triggers** for cascading logic instead of application code.

**Cascade Hierarchy:**
- Yearly goals → Last monthly goal of year (December)
- Monthly goals → Last weekly goal of month
- Weekly goals → Last daily goal of week

**Why Database Triggers:**
- Ensures consistency across all clients
- Prevents race conditions
- Simplifies frontend logic (no complex cascade algorithms)
- Automatic parent-child relationship tracking via `parent_item_id`

**Frontend Pattern:**
After creating/editing strategic map items, silently refresh all related views (yearly, monthly, weekly, daily) to display database-generated cascades.

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

## Key Implementation Patterns

### 1. Organization-Specific App IDs
Each organization can have different Lark app credentials. The frontend stores the organization-specific `app_id` in localStorage and uses it for JSAPI calls.

### 2. Silent Cascade Refresh
After CRUD operations on strategic map items:
```javascript
// Update item
await axios.put('/api/strategic_map', { ... });
// Silent refresh to display database-generated cascades
await fetchYearlyGoals();
await fetchMonthlyGoals();
await fetchWeeklyGoals();
await fetchDailyGoals();
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
- **Tools**: [src/tools/strategic-map/index.jsx](src/tools/strategic-map/index.jsx) - Strategic map tool
- **Backend (Dev)**: [server/server.js](server/server.js) - Koa server with all API endpoints
- **Backend (Prod)**: [api/strategic_map.js](api/strategic_map.js) - Primary serverless function
- **Authentication**: [src/utils/auth_access_util.js](src/utils/auth_access_util.js) - Auth utilities
- **Organization Logic**: [server/organization_helper.js](server/organization_helper.js) - Multi-tenant helpers
- **Organization Context**: [src/contexts/OrganizationContext.jsx](src/contexts/OrganizationContext.jsx) - React context provider

## Key Architecture Decisions

See [ARCHITECTURE.md](ARCHITECTURE.md) for full details. Key decisions:

- **ADR-001**: Tool-based project structure (`/src/tools/`)
- **ADR-002**: Tailwind CSS + shadcn/ui (replacing Material-UI)
- **ADR-003**: Database triggers for strategic map cascading
- **ADR-004**: Hybrid deployment (Koa dev + Vercel production)
- **ADR-005**: Strategic map v2 pattern over component-based
