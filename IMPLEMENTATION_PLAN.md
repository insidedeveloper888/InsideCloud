# Multi-Tenant Lark Authentication Implementation Plan

## Overview
This guide will help you implement and test multi-tenant Lark authentication. The implementation is divided into:
- **What YOU need to do** (manual setup steps)
- **What I CAN HELP implement** (code changes)

---

## Phase 1: Prerequisites & Setup

### Step 1.1: Create Supabase Project (YOU DO)
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Service Role Key (Settings → API → service_role key)
   - Anon Key (Settings → API → anon/public key)

### Step 1.2: Create Organizations Table in Supabase (I CAN HELP)
**I will create a migration SQL file for you to run in Supabase SQL Editor**

The table will store:
- `organization_id` (unique identifier)
- `organization_name`
- `lark_app_id`
- `lark_app_secret` (encrypted)
- `noncestr`
- `is_active`

### Step 1.3: Prepare Multiple Lark Apps (YOU DO)
For testing, you need at least 2 Lark organizations with their own apps:

**For Organization 1:**
1. Go to Lark Developer Console
2. Create a new "Web App" application
3. Note down:
   - App ID (e.g., `cli_xxxxx`)
   - App Secret
   - Generate a random `noncestr` (32 characters)

**For Organization 2:**
1. Repeat the same process in a different Lark organization
2. Note down App ID, App Secret, and noncestr

**Important:** Each Lark app must have:
- ✅ Contact API permissions (read users, departments)
- ✅ Authentication API permissions
- ✅ Bitable API permissions (if needed)

---

## Phase 2: Backend Implementation

### Step 2.1: Install Supabase Client (I CAN HELP)
**I will:**
- Add `@supabase/supabase-js` to `package.json`
- Create Supabase client configuration file

### Step 2.2: Create Environment Variables File (YOU DO)
Create `.env` file in project root:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=8989
```

**Important:** Add `.env` to `.gitignore` if not already there!

### Step 2.3: Create Organization Config Helper (I CAN HELP)
**I will create:**
- `server/organization_helper.js` - Functions to:
  - Query Supabase for organization credentials
  - Cache credentials in session
  - Validate organization exists and is active

### Step 2.4: Update Authentication Endpoints (I CAN HELP)
**I will modify `server/server.js`:**

1. **`getSignParameters` function:**
   - Accept `organization_id` parameter
   - Query Supabase for org credentials
   - Use org-specific `appId`, `appSecret`, `noncestr`
   - Generate signature with org-specific credentials

2. **`getUserAccessToken` function:**
   - Accept `organization_id` parameter
   - Query Supabase for org credentials
   - Use org-specific `appId`, `appSecret` for token exchange
   - Store `organization_id` in session

3. **New endpoint: `getOrganizationConfig`:**
   - Validates organization exists
   - Returns org config (without secrets)
   - Used by frontend to verify org before auth

### Step 2.5: Update Session Management (I CAN HELP)
**I will update session storage to include:**
- `organization_id`
- `lark_app_id` (cached)
- `noncestr` (cached)

---

## Phase 3: Frontend Implementation

### Step 3.1: Create Organization Selector Component (I CAN HELP)
**I will create:**
- `src/components/organizationSelector/index.js`
- `src/components/organizationSelector/index.css`
- Component features:
  - Input field for Organization ID
  - Validation against backend
  - Stores org_id in localStorage
  - Shows error if org doesn't exist

### Step 3.2: Update Authentication Flow (I CAN HELP)
**I will modify `src/utils/auth_access_util.js`:**

1. **`handleJSAPIAccess`:**
   - Check for `organization_id` in localStorage
   - If missing, show organization selector
   - Send `organization_id` to backend when requesting sign parameters

2. **`handleUserAuth`:**
   - Include `organization_id` in token exchange request
   - Store `organization_id` with user session

### Step 3.3: Update Home Page (I CAN HELP)
**I will modify `src/pages/home/index.js`:**
- Add organization selector before authentication
- Show organization selector if `organization_id` not set
- Pass `organization_id` through auth flow

### Step 3.4: Update API Calls (I CAN HELP)
**I will update all API calls to include `organization_id`:**
- Add `organization_id` parameter to all backend requests
- Ensure backend validates org_id on each request

---

## Phase 4: Data Setup

### Step 4.1: Insert Test Organizations (YOU DO)
**I will provide SQL script for you to run in Supabase:**

```sql
-- Insert Organization 1
INSERT INTO organizations (
  organization_id,
  organization_name,
  lark_app_id,
  lark_app_secret,
  noncestr,
  is_active
) VALUES (
  'org-001',  -- Your custom org ID
  'Test Organization 1',
  'cli_xxxxx',  -- Org 1's Lark App ID
  'your-app-secret-1',  -- Org 1's Lark App Secret
  'your-noncestr-1',  -- Org 1's noncestr
  true
);

-- Insert Organization 2
INSERT INTO organizations (
  organization_id,
  organization_name,
  lark_app_id,
  lark_app_secret,
  noncestr,
  is_active
) VALUES (
  'org-002',  -- Your custom org ID
  'Test Organization 2',
  'cli_yyyyy',  -- Org 2's Lark App ID
  'your-app-secret-2',  -- Org 2's Lark App Secret
  'your-noncestr-2',  -- Org 2's noncestr
  true
);
```

**You will:**
- Replace placeholders with actual values
- Run in Supabase SQL Editor
- Verify data inserted correctly

---

## Phase 5: Testing

### Step 5.1: Test Organization Selection (YOU TEST)
1. Start the application: `npm run start`
2. Open app in Lark (Organization 1)
3. **Expected:** Organization selector appears
4. Enter Organization ID: `org-001`
5. **Expected:** Organization validated, auth proceeds
6. **Expected:** JSAPI authentication succeeds
7. **Expected:** User authentication succeeds
8. **Expected:** Dashboard loads with Organization 1 data

### Step 5.2: Test Organization Isolation (YOU TEST)
1. Clear browser cookies/localStorage
2. Open app in Lark (Organization 2)
3. Enter Organization ID: `org-002`
4. **Expected:** Authentication uses Organization 2 credentials
5. **Expected:** User sees Organization 2 data
6. **Expected:** No cross-contamination with Organization 1

### Step 5.3: Test Invalid Organization (YOU TEST)
1. Enter invalid Organization ID: `invalid-org`
2. **Expected:** Error message shown
3. **Expected:** Authentication blocked
4. **Expected:** User-friendly error message

### Step 5.4: Test Session Persistence (YOU TEST)
1. Authenticate with Organization 1
2. Refresh page
3. **Expected:** Organization ID remembered
4. **Expected:** No need to re-enter Organization ID
5. **Expected:** Session persists correctly

### Step 5.5: Test Multiple Organizations Simultaneously (YOU TEST)
1. Open two browser windows:
   - Window 1: Organization 1
   - Window 2: Organization 2
2. **Expected:** Each window uses correct organization
3. **Expected:** No credential mixing
4. **Expected:** Independent sessions

---

## Phase 6: Verification Checklist

### Backend Verification
- [ ] Supabase client connects successfully
- [ ] Organization credentials retrieved from Supabase
- [ ] JSAPI signature uses org-specific credentials
- [ ] User token exchange uses org-specific credentials
- [ ] Session stores organization_id correctly
- [ ] All endpoints validate organization_id

### Frontend Verification
- [ ] Organization selector appears when needed
- [ ] Organization ID validated before auth
- [ ] Organization ID stored in localStorage
- [ ] Organization ID sent with all API calls
- [ ] Error handling for invalid organizations
- [ ] Session persistence works correctly

### Security Verification
- [ ] App Secret never exposed to frontend
- [ ] Organization credentials encrypted in Supabase
- [ ] Session isolation between organizations
- [ ] Invalid organization_id rejected
- [ ] Rate limiting on credential lookups (if implemented)

---

## Implementation Order

**Recommended sequence:**

1. ✅ **Phase 1** - Setup (You + Me)
2. ✅ **Phase 2** - Backend (Me)
3. ✅ **Phase 4** - Data Setup (You)
4. ✅ **Phase 3** - Frontend (Me)
5. ✅ **Phase 5** - Testing (You)

---

## What I Will Implement

When you're ready, I will:

1. ✅ Create Supabase migration SQL file
2. ✅ Add Supabase client dependency
3. ✅ Create organization helper functions
4. ✅ Update all authentication endpoints
5. ✅ Create organization selector component
6. ✅ Update frontend authentication flow
7. ✅ Update all API calls
8. ✅ Add error handling
9. ✅ Update session management

---

## What You Need to Do

1. ✅ Create Supabase project
2. ✅ Create 2+ Lark apps (one per organization)
3. ✅ Set up environment variables
4. ✅ Run SQL migration in Supabase
5. ✅ Insert test organization data
6. ✅ Test authentication flow
7. ✅ Verify multi-tenant isolation

---

## Ready to Start?

**Tell me when you're ready and I'll begin implementing:**

1. "Start Phase 1" - I'll create the Supabase migration SQL
2. "Start Phase 2" - I'll implement backend changes
3. "Start Phase 3" - I'll implement frontend changes
4. "Start all phases" - I'll implement everything in order

Or if you've completed some steps, let me know which phase to start with!

