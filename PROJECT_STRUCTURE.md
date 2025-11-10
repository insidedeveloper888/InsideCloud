# InsideCloud Project Structure Documentation

## Project Overview

**InsideCloud** is a web application designed to run within the Lark (飞书) platform ecosystem. It serves as a ready-to-develop base application with Lark authorization integration, allowing developers to build internal tools and dashboards that leverage Lark's authentication and organizational data.

### Key Characteristics
- **Platform**: React-based Single Page Application (SPA)
- **Backend**: Node.js/Koa server for API endpoints
- **Authentication**: Lark OAuth 2.0 flow with JSAPI integration
- **Deployment**: Configured for Vercel deployment
- **Purpose**: Foundation for building Lark-integrated internal applications

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Lark Platform                            │
│  (Provides SDK, Authentication, Organizational Data)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ OAuth 2.0 / JSAPI
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Frontend (React)                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │  React App (src/)                                   │    │
│  │  - Pages (Home, NotFound)                           │    │
│  │  - Components (Dashboard, Lists, etc.)              │    │
│  │  - Utils (Auth utilities)                            │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP API Calls (/api/*)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Backend Server (Koa/Node.js)                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  API Endpoints (server/server.js)                   │    │
│  │  - Authentication                                    │    │
│  │  - Lark API Proxies                                 │    │
│  │  - Session Management                                │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Lark Open API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Lark Cloud Services                         │
│  (User Data, Departments, Bitable, etc.)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

### Root Level
```
InsideCloud/
├── api/                    # API endpoint handlers (Vercel serverless functions)
├── build/                  # Production build output
├── cli/                    # CLI tools for configuration
├── config/                 # Configuration files (departments.json)
├── docs/                   # Documentation files
├── node_modules/           # Dependencies
├── public/                 # Static assets
├── server/                 # Backend server code (Koa)
├── src/                    # Frontend React application
├── package.json            # Dependencies and scripts
├── vercel.json             # Vercel deployment configuration
└── tailwind.config.js      # Tailwind CSS configuration
```

### Frontend (`src/`)
```
src/
├── App.js                  # Main app component with routing
├── index.js                # React entry point
├── index.css               # Global styles
├── config/
│   └── client_config.js    # Client-side configuration (auto-generated)
├── pages/
│   ├── home/
│   │   ├── index.js        # Main dashboard/home page
│   │   └── index.css       # Home page styles
│   └── notfound/
│       └── index.js        # 404 page
├── components/
│   ├── bitableTables/      # Bitable tables component
│   ├── departmentsList/    # Departments list component
│   ├── membersList/        # Members list component
│   ├── topbar/             # Top navigation bar
│   ├── useapi/             # API usage component
│   ├── userinfo/           # User info display
│   ├── ProgressiveBlur.js  # UI utility component
│   └── ScrollArea.js       # Scrollable area component
└── utils/
    └── auth_access_util.js # Lark authentication utilities
```

### Backend (`server/`)
```
server/
├── server.js               # Main Koa server with all API routes
├── server_config.js        # Server configuration (auto-generated)
└── server_util.js          # Server utility functions
```

### API (`api/`)
```
api/
├── _utils.js               # Shared utilities for Vercel serverless functions
├── get_user_access_token.js
├── get_sign_parameters.js
├── get_organization_members.js
├── get_departments.js
├── get_department_users.js
└── get_bitable_tables.js
```

### CLI (`cli/`)
```
cli/
├── cli.js                  # CLI entry point
└── config_helper.js        # Configuration helper (generates config files)
```

---

## Core Components

### 1. Authentication Flow

#### Frontend Authentication (`src/utils/auth_access_util.js`)
- **JSAPI Access**: Handles Lark JSAPI authentication
  - Requests sign parameters from backend
  - Configures Lark SDK with appId, timestamp, noncestr, signature
  - Enables Lark SDK features (tt.getSystemInfo, tt.showActionSheet, etc.)

- **User Authentication**: Handles user login
  - Checks for existing session cookie (`lk_token`)
  - If no cookie, calls `tt.requestAuthCode` to get authorization code
  - Sends code to backend to exchange for `user_access_token`
  - Stores token in localStorage and cookie

#### Backend Authentication (`server/server.js`)
- **`getUserAccessToken`**: 
  - Receives authorization code from frontend
  - Exchanges code for `app_access_token` using App ID/Secret
  - Exchanges code for `user_access_token` using app_access_token
  - Stores user info in session and sets cookie
  - Returns user access token to frontend

- **`getSignParameters`**:
  - Generates JSAPI signature parameters
  - Gets `tenant_access_token` using App ID/Secret
  - Gets `jsapi_ticket` using tenant_access_token
  - Calculates signature using SHA1 hash
  - Returns sign parameters (appId, signature, noncestr, timestamp)

### 2. Lark API Integration

The backend acts as a proxy to Lark APIs, handling:

- **Organization Members** (`getOrganizationMembers`)
  - Fetches all users in the organization
  - Uses `tenant_access_token` for API calls
  - Returns user data with pagination support

- **Departments** (`getDepartments`)
  - Fetches department hierarchy
  - Supports filtering by parent department
  - Returns department structure and metadata

- **Department Users** (`getDepartmentUsers`)
  - Fetches users for specific departments
  - Reads department IDs from `config/departments.json`
  - Returns users grouped by department

- **Bitable Tables** (`getBitableTables`)
  - Fetches tables from Lark Bitable (multi-dimensional tables)
  - Uses `user_access_token` for user-scoped access
  - Returns table metadata and structure

### 3. Frontend Dashboard (`src/pages/home/index.js`)

The main dashboard component (`InternalIntelligenceHub`) includes:

- **Header**: User info, time, company status indicator
- **Company Overview**: Performance metrics, progress tracking
- **Department Performance**: KPI cards for each department
- **Announcements**: Company announcements and news
- **Employee Spotlight**: Top performers display
- **Company Roadmap**: Timeline of milestones

**Note**: Currently uses mock/placeholder data. This is where Supabase integration would provide real data.

### 4. Configuration System

#### CLI Configuration (`cli/config_helper.js`)
- Interactive CLI tool (`npm run config`)
- Prompts for:
  - Lark App ID
  - Lark App Secret
  - API Port (default: 8989)
- Generates:
  - `server/server_config.js` (server-side config)
  - `src/config/client_config.js` (client-side config)
  - Random `noncestr` for signature generation

#### Configuration Files
- **`server/server_config.js`**: Server configuration (auto-generated)
  - App ID/Secret
  - API paths
  - Noncestr for signatures
  - API port

- **`src/config/client_config.js`**: Client configuration (auto-generated)
  - App ID
  - API paths
  - API port/origin

- **`config/departments.json`**: Department IDs for department user queries
  - Manually configured list of department IDs
  - Used by `getDepartmentUsers` endpoint

---

## Technology Stack

### Frontend
- **React 18.2.0**: UI framework
- **React Router DOM 6.6.2**: Client-side routing
- **Tailwind CSS 3.4.18**: Utility-first CSS framework
- **Framer Motion 12.23.24**: Animation library
- **Recharts 3.3.0**: Charting library
- **Lucide React 0.548.0**: Icon library
- **Axios 1.2.3**: HTTP client
- **js-cookie 3.0.1**: Cookie management

### Backend
- **Koa 2.14.1**: Web framework
- **Koa Router 12.0.0**: Routing middleware
- **Koa Session 6.4.0**: Session management
- **Axios 1.2.3**: HTTP client for Lark API calls
- **Crypto-JS 4.1.1**: Cryptographic functions (SHA1 for signatures)
- **jsonwebtoken 9.0.0**: JWT token handling

### Development Tools
- **React Scripts 5.0.1**: Create React App build tools
- **Commander 10.0.0**: CLI framework
- **Inquirer 8.0.0**: Interactive CLI prompts
- **Chalk 4.1.2**: Terminal string styling

### Deployment
- **Vercel**: Platform for deployment
  - Serverless functions in `api/` directory
  - Static site hosting for React build

---

## Development Workflow

### Initial Setup
1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Lark App**
   ```bash
   npm run config
   ```
   - Enter Lark App ID and App Secret
   - Configure API port (default: 8989)

3. **Configure Departments** (Optional)
   - Edit `config/departments.json`
   - Add department IDs for department user queries

### Running Locally
```bash
npm run start
```
- Starts backend server on port 8989 (or configured port)
- Starts React dev server on port 3000
- React dev server proxies `/api/*` requests to backend

### Development Mode
- Frontend runs on `http://localhost:3000`
- Backend runs on `http://localhost:8989`
- React proxy forwards `/api/*` to backend
- Lark SDK may not be available in local development
  - App falls back to mock user data when SDK unavailable

### Building for Production
```bash
npm run build
```
- Creates optimized production build in `build/` directory
- Can be deployed to Vercel or any static hosting

### Deployment
```bash
npm run deploy          # Deploy to production
npm run deploy:preview   # Deploy preview
```

---

## API Endpoints

### Authentication Endpoints

#### `GET /api/get_user_access_token`
- **Purpose**: Exchange Lark authorization code for user access token
- **Query Parameters**:
  - `code` (optional): Authorization code from Lark
- **Response**: User access token and user info
- **Session**: Stores user info in session, sets `lk_token` cookie

#### `GET /api/get_sign_parameters`
- **Purpose**: Get JSAPI signature parameters for Lark SDK
- **Query Parameters**:
  - `url`: Current page URL (encoded)
- **Response**: Sign parameters (appId, signature, noncestr, timestamp)
- **Cookie**: Stores `jsapi_ticket` in cookie

### Data Endpoints

#### `GET /api/get_organization_members`
- **Purpose**: Get all organization members
- **Query Parameters**:
  - `page_size` (optional): Number of results per page (max 100)
  - `page_token` (optional): Pagination token
- **Authentication**: Requires user session
- **Response**: Array of user objects

#### `GET /api/get_departments`
- **Purpose**: Get department list
- **Query Parameters**:
  - `page_size` (optional): Results per page
  - `page_token` (optional): Pagination token
  - `parent_department_id` (optional): Filter by parent
  - `fetch_child` (optional): Include child departments
- **Authentication**: Requires user session
- **Response**: Array of department objects

#### `GET /api/get_department_users`
- **Purpose**: Get users for configured departments
- **Query Parameters**:
  - `page_size` (optional): Results per page
  - `page_token` (optional): Pagination token
- **Authentication**: Requires user session
- **Configuration**: Reads from `config/departments.json`
- **Response**: Array of department objects with user arrays

#### `GET /api/get_bitable_tables`
- **Purpose**: Get tables from Lark Bitable
- **Query Parameters**:
  - `app_token` (optional): Bitable app token (default: hardcoded)
- **Authentication**: Requires user session (uses user_access_token)
- **Response**: Array of table objects with metadata

---

## Session Management

### Backend Sessions
- **Framework**: Koa Session
- **Storage**: In-memory (development)
- **Key**: `lk_koa:session`
- **Lifetime**: 2 hours
- **Rolling**: Enabled (extends on each request)
- **Data Stored**:
  - `userinfo`: User access token and user data

### Cookies
- **`lk_token`**: User access token (2 minutes TTL)
- **`lk_jsticket`**: JSAPI ticket (2 minutes TTL)
- **Session Cookie**: Session identifier (httpOnly, signed)

---

## Lark Integration Details

### Authentication Flow
1. **JSAPI Configuration**:
   - Frontend requests sign parameters from backend
   - Backend gets `tenant_access_token` → `jsapi_ticket` → calculates signature
   - Frontend configures Lark SDK with sign parameters
   - SDK enables Lark features (tt.* APIs)

2. **User Login**:
   - Frontend calls `tt.requestAuthCode` to get authorization code
   - Frontend sends code to backend `/api/get_user_access_token`
   - Backend exchanges code for `app_access_token` → `user_access_token`
   - Backend stores user info in session
   - Frontend receives user access token

### Token Types
- **`app_access_token`**: Application-level token (from App ID/Secret)
- **`tenant_access_token`**: Tenant-level token (from App ID/Secret)
- **`user_access_token`**: User-level token (from authorization code)
- **`jsapi_ticket`**: Temporary ticket for JSAPI signatures

### API Scopes Required
- Contact API: Read organization members and departments
- Bitable API: Read multi-dimensional tables
- Authentication API: User login and token management

---

## Current State & Limitations

### What Works
✅ Lark authentication (JSAPI + OAuth)  
✅ User session management  
✅ Organization member fetching  
✅ Department structure fetching  
✅ Bitable table listing  
✅ Dashboard UI with mock data  
✅ Vercel deployment configuration  

### What's Missing / Mock Data
❌ Real data persistence (currently mock data in dashboard)  
❌ Database integration  
❌ User data storage  
❌ Analytics/metrics tracking  
❌ Real-time updates  
❌ Data synchronization with Lark  
❌ **Multi-tenant support** (currently single organization only) - See [Multi-Tenant Architecture Plan](#multi-tenant-architecture-plan) below

### Integration Points for Supabase

The project is ready for Supabase integration at these points:

1. **User Data Storage**
   - Store Lark user data in Supabase
   - Sync organization members to database
   - Cache department structures

2. **Dashboard Data**
   - Replace mock data in `src/pages/home/index.js`
   - Store company metrics, KPIs, announcements
   - Real-time data updates

3. **Session Management**
   - Replace in-memory sessions with Supabase Auth
   - Store user sessions in database
   - Cross-device session management

4. **API Data Caching**
   - Cache Lark API responses in Supabase
   - Reduce API rate limiting issues
   - Faster response times

5. **Real-time Features**
   - Supabase Realtime for live updates
   - Notifications and announcements
   - Live dashboard metrics

6. **File Storage**
   - Supabase Storage for attachments
   - User avatars and documents
   - Announcement images

---

## Multi-Tenant Architecture Plan

### Current Limitation

The current architecture is **single-tenant** - it only supports one Lark organization:
- App ID and App Secret are hardcoded in `server/server_config.js`
- All users must belong to the same Lark organization
- Configuration is organization-specific but stored in code/config files
- Cannot serve multiple Lark organizations simultaneously

### Proposed Multi-Tenant Solution

**Goal**: Support multiple Lark organizations, each with their own Lark App credentials.

#### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│              Multiple Lark Organizations                     │
│  Org A (appId_A, appSecret_A)                               │
│  Org B (appId_B, appSecret_B)                               │
│  Org C (appId_C, appSecret_C)                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ User enters Organization ID
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Frontend (React)                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │  1. User inputs Organization ID                     │    │
│  │  2. Query Supabase for org credentials             │    │
│  │  3. Get appId/appSecret/noncestr for org           │    │
│  │  4. Perform Lark authentication                     │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ API: Get Org Credentials
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Supabase Database                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │  organizations table                                 │    │
│  │  - organization_id (PK)                               │    │
│  │  - organization_name                                 │    │
│  │  - lark_app_id                                       │    │
│  │  - lark_app_secret                                   │    │
│  │  - noncestr                                           │    │
│  │  - is_active                                         │    │
│  │  - created_at                                        │    │
│  │  - updated_at                                        │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Return credentials
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Backend Server (Koa/Node.js)                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Uses org-specific credentials for:                  │    │
│  │  - JSAPI signature generation                       │    │
│  │  - User authentication                              │    │
│  │  - Lark API calls                                    │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Proposed Flow

#### 1. **Organization Selection (Frontend)**
   - User launches app in Lark
   - Frontend prompts user to enter **Organization ID**
   - Organization ID is stored in session/localStorage
   - If already set, skip prompt

#### 2. **Credential Retrieval (Backend)**
   - Frontend sends Organization ID to backend
   - Backend queries Supabase `organizations` table:
     ```sql
     SELECT lark_app_id, lark_app_secret, noncestr 
     FROM organizations 
     WHERE organization_id = ? AND is_active = true
     ```
   - If found, backend caches credentials in session
   - If not found, return error to frontend

#### 3. **Lark Authentication (Dynamic)**
   - Backend uses **org-specific credentials** for all Lark API calls:
     - `app_access_token`: Uses org's appId/appSecret
     - `tenant_access_token`: Uses org's appId/appSecret
     - `jsapi_ticket`: Uses org's tenant_access_token
     - `user_access_token`: Uses org's app_access_token
   - All subsequent Lark API calls use org-specific tokens

#### 4. **Session Management**
   - Session stores:
     - `organization_id`: Selected organization
     - `lark_app_id`: Org's Lark App ID
     - `lark_app_secret`: Org's Lark App Secret (encrypted)
     - `noncestr`: Org's noncestr
     - `userinfo`: User access token (org-specific)
   - Each organization's session is isolated

### Database Schema (Supabase)

#### `organizations` Table
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id VARCHAR(255) UNIQUE NOT NULL,
  organization_name VARCHAR(255) NOT NULL,
  lark_app_id VARCHAR(255) NOT NULL,
  lark_app_secret TEXT NOT NULL,  -- Encrypted in Supabase
  noncestr VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for fast lookups
CREATE INDEX idx_organizations_org_id ON organizations(organization_id);
CREATE INDEX idx_organizations_active ON organizations(is_active);
```

#### `organization_sessions` Table (Optional)
```sql
CREATE TABLE organization_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id VARCHAR(255) REFERENCES organizations(organization_id),
  session_id VARCHAR(255) NOT NULL,
  user_access_token TEXT,
  tenant_access_token TEXT,
  jsapi_ticket TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Required Changes

#### Frontend Changes

1. **Organization Selection Component**
   - New component: `src/components/organizationSelector/index.js`
   - Prompts user for Organization ID
   - Validates organization exists via API call
   - Stores `organization_id` in localStorage/session

2. **Authentication Flow Updates** (`src/utils/auth_access_util.js`)
   - Before JSAPI auth: Send `organization_id` to backend
   - Backend returns org-specific `appId` for JSAPI config
   - Store `organization_id` with user session

3. **API Calls**
   - All API calls include `organization_id` parameter
   - Backend uses org-specific credentials

#### Backend Changes

1. **New Endpoint: Get Organization Credentials**
   ```javascript
   GET /api/get_organization_config?organization_id=xxx
   ```
   - Queries Supabase for org credentials
   - Returns appId, appSecret, noncestr (if authorized)
   - Caches in session

2. **Updated Authentication Endpoints**
   - `getSignParameters`: Accepts `organization_id`, uses org-specific credentials
   - `getUserAccessToken`: Accepts `organization_id`, uses org-specific credentials
   - All endpoints validate `organization_id` exists and is active

3. **Session Updates**
   - Store `organization_id` in session
   - Store org-specific credentials (encrypted)
   - Validate org access on each request

4. **Supabase Client Integration**
   - Add `@supabase/supabase-js` to backend
   - Query `organizations` table for credentials
   - Handle errors (org not found, inactive, etc.)

### Security Considerations

1. **Credential Storage**
   - ✅ Store `lark_app_secret` encrypted in Supabase
   - ✅ Use Supabase Vault or encryption at rest
   - ✅ Never expose secrets to frontend

2. **Access Control**
   - ✅ Validate `organization_id` exists and is active
   - ✅ Rate limit organization credential lookups
   - ✅ Log all organization access attempts

3. **Session Isolation**
   - ✅ Each organization's session is isolated
   - ✅ Prevent cross-organization data access
   - ✅ Validate organization_id on every request

4. **Super Admin Management**
   - ✅ Super admin can CRUD organizations in Supabase
   - ✅ Admin interface to manage org credentials
   - ✅ Audit log for credential changes

### Implementation Steps (When Approved)

1. **Supabase Setup**
   - Create `organizations` table
   - Set up encryption for `lark_app_secret`
   - Create admin user for managing organizations

2. **Backend Updates**
   - Add Supabase client
   - Create `/api/get_organization_config` endpoint
   - Update all auth endpoints to accept `organization_id`
   - Modify credential retrieval to use Supabase

3. **Frontend Updates**
   - Create organization selector component
   - Update auth flow to include organization selection
   - Update all API calls to include `organization_id`

4. **Testing**
   - Test with multiple organizations
   - Verify session isolation
   - Test credential retrieval and caching

### Benefits

✅ **Multi-tenant support**: Serve multiple Lark organizations  
✅ **Centralized management**: All org configs in Supabase  
✅ **Scalability**: Easy to add new organizations  
✅ **Security**: Credentials stored securely, encrypted  
✅ **Isolation**: Each org's data and sessions are separate  
✅ **Flexibility**: Super admin can manage orgs without code changes  

### Open Questions / Considerations

1. **Organization ID Format**: 
   - How should users identify their organization?
   - UUID? Custom string? Lark tenant ID?

2. **Organization Discovery**:
   - Should users see a list of available organizations?
   - Or must they know their organization ID?

3. **First-Time Setup**:
   - How does super admin initially configure organizations?
   - Admin UI or direct database access?

4. **Credential Rotation**:
   - How to handle Lark App Secret changes?
   - Update in Supabase, invalidate sessions?

5. **Error Handling**:
   - What if organization_id doesn't exist?
   - What if credentials are invalid?
   - User-friendly error messages?

---

## Environment Variables

### Required (for production)
- `PORT`: Backend server port (default: 8989)
- `JWT_SECRET`: Secret for JWT tokens (if using JWT auth)

### Lark Configuration (Current - Single Tenant)
- Configured via `npm run config` CLI
- Stored in `server/server_config.js` and `src/config/client_config.js`
- **Do not commit** these files with real credentials

### Supabase Configuration (Multi-Tenant)
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for backend operations
- `SUPABASE_ANON_KEY`: Anonymous key for frontend (if needed)
- **Note**: These will be required when implementing multi-tenant architecture

---

## Security Considerations

### Current Implementation
- ✅ CORS configured (development mode)
- ✅ Session-based authentication
- ✅ HTTP-only cookies for sensitive data
- ✅ Signed cookies
- ⚠️ In-memory sessions (not scalable)
- ⚠️ No rate limiting
- ⚠️ CORS allows all origins (development only)

### Production Recommendations
- Use Redis or database for session storage
- Implement rate limiting
- Restrict CORS to specific domains
- Use environment variables for secrets
- Implement HTTPS only
- Add request validation
- Implement API authentication tokens

---

## Future Development with Supabase

### Recommended Integration Steps

1. **Setup Supabase Project**
   - Create Supabase project
   - Configure authentication providers
   - Set up database schema

2. **Database Schema Design**
   - Users table (sync with Lark users)
   - Departments table
   - Company metrics/KPIs tables
   - Announcements table
   - User sessions table

3. **Authentication Integration**
   - Use Supabase Auth alongside Lark auth
   - Store Lark tokens in Supabase
   - Implement token refresh logic

4. **Data Synchronization**
   - Background jobs to sync Lark data to Supabase
   - Real-time updates via Supabase Realtime
   - Cache Lark API responses

5. **API Enhancement**
   - Add Supabase client to backend
   - Query Supabase instead of mock data
   - Implement data mutations

6. **Frontend Updates**
   - Add Supabase client to frontend
   - Replace mock data with Supabase queries
   - Implement real-time subscriptions

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `server/server.js` | Main backend server with all API routes |
| `src/pages/home/index.js` | Main dashboard component |
| `src/utils/auth_access_util.js` | Lark authentication utilities |
| `server/server_config.js` | Server configuration (auto-generated) |
| `src/config/client_config.js` | Client configuration (auto-generated) |
| `config/departments.json` | Department IDs configuration |
| `vercel.json` | Vercel deployment configuration |
| `package.json` | Dependencies and scripts |

---

## Notes

- The `api/` directory contains Vercel serverless function handlers, but the main server runs in `server/server.js` for local development
- Configuration files (`server_config.js`, `client_config.js`) are auto-generated and should not be manually edited
- The dashboard currently displays mock data - this is the primary area for Supabase integration
- Lark SDK is only available when running inside Lark platform - local development uses mock data fallback
- Session storage is in-memory and will reset on server restart - Supabase would provide persistent storage

---

## Conclusion

This project provides a solid foundation for building Lark-integrated applications. The authentication flow is complete, and the infrastructure is ready for data persistence and real-time features through Supabase integration.

### Current State
- ✅ Single-tenant Lark authentication working
- ✅ Basic dashboard with mock data
- ✅ API endpoints for Lark data retrieval
- ✅ Session management in place

### Next Steps (Multi-Tenant Architecture)

The **Multi-Tenant Architecture Plan** (documented above) outlines a comprehensive approach to support multiple Lark organizations:

1. **Phase 1: Multi-Tenant Foundation**
   - Set up Supabase `organizations` table
   - Move Lark credentials to Supabase
   - Implement organization selection flow
   - Update authentication to use org-specific credentials

2. **Phase 2: Data Persistence**
   - Replace mock data with Supabase queries
   - Implement data synchronization between Lark and Supabase
   - Store user data, departments, and metrics

3. **Phase 3: Real-Time Features**
   - Add Supabase Realtime subscriptions
   - Live dashboard updates
   - Real-time notifications

4. **Phase 4: Enhanced Features**
   - Admin interface for managing organizations
   - Analytics and reporting
   - File storage integration

The architecture is well-structured and ready for these enhancements. The multi-tenant plan is **feasible and well-designed** - it maintains security, provides proper isolation, and scales to support multiple organizations.

