# Quick Reference: Development & Testing

**Version**: 1.0.0
**Last Updated**: 2025-11-25

This is a quick reference card for common development and testing operations. For detailed information, see the comprehensive guides linked below.

---

## Essential Commands

### Start Development Servers (CRITICAL)

**ALWAYS use this command:**

```bash
pkill -f "server/server.js"; pkill -f "react-scripts"; npm run start
```

**Why?** Kills zombie processes and ensures ports 3000 and 8989 are free.

**Verification:**
```bash
lsof -i :3000  # React dev server
lsof -i :8989  # Koa backend server
```

**Full documentation:** [DEVELOPMENT_SERVER_PRACTICES.md](DEVELOPMENT_SERVER_PRACTICES.md)

---

### Test API Endpoints

```bash
# Health check
curl http://localhost:8989/api/health

# Test GET endpoint
curl http://localhost:8989/api/contacts?organization_slug=test-org

# Test POST endpoint
curl -X POST http://localhost:8989/api/contacts \
  -H "Content-Type: application/json" \
  -d '{"first_name":"John","last_name":"Doe"}'
```

---

### Port Conflict Resolution

```bash
# Check what's using port 3000
lsof -i :3000

# Kill specific process by PID
kill -9 <PID>

# Or use the standard cleanup command
pkill -f "server/server.js"; pkill -f "react-scripts"; npm run start
```

---

## Agent Coordination

### test-driven-developer Agent Workflow

```
1. Start servers: pkill -f "server/server.js"; pkill -f "react-scripts"; npm run start
2. Implement feature (backend + frontend)
3. Create test scenarios (use template)
4. Handoff to playwright-testing-agent
5. Review test report
6. Fix failures
7. Repeat until all tests pass
```

**Test Scenario Template:**
```markdown
## Test Scenario: [Feature Name]

**Test ID**: [TOOL-ACTION-XXX]

**Prerequisites:**
- Organization: test-org-slug
- User: admin@example.com (admin role)

**Steps:**
1. Navigate to [URL]
2. Click [element]
3. Enter [data]
4. Verify [outcome]

**Expected Results:**
- [UI changes]
- [API responses]
- [Database state]

**Validation:**
- Console: No errors
- Network: [Expected API calls]
- DOM: [Expected elements]
```

---

### playwright-testing-agent Workflow

```
1. Verify servers running (ports 3000, 8989)
2. Launch browser via Playwright MCP
3. Execute test steps
4. Capture evidence (screenshots, logs)
5. Generate test report
6. Handoff report to test-driven-developer
```

**Test Report Template:**
```markdown
## Test Report: [Feature Name]

**Test ID**: [TOOL-ACTION-XXX]
**Status**: ✅ PASS / ❌ FAIL
**Executed**: 2025-11-25 19:45:00

**Results:**
- Step 1: ✅ PASS - [description]
- Step 2: ❌ FAIL - [description]

**Evidence:**
- Screenshot: [filename]
- Console Logs: [errors found]
- Network Requests: [API failures]

**Root Cause Analysis:**
[Specific reason for failure]

**Recommendations:**
1. [Specific fix needed]
```

**Full documentation:** [TESTING_WORKFLOW_GUIDE.md](TESTING_WORKFLOW_GUIDE.md)

---

## Common Issues

### Issue: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
pkill -f "server/server.js"; pkill -f "react-scripts"; npm run start
```

---

### Issue: API Requests Stuck at "Pending"

**Root Cause:** Koa server not running

**Solution:**
```bash
# Check if Koa running
lsof -i :8989

# If not, restart servers
pkill -f "server/server.js"; pkill -f "react-scripts"; npm run start
```

---

### Issue: CORS Error

**Error:**
```
Access to fetch has been blocked by CORS policy
```

**Root Cause:** Missing OPTIONS handler for CORS preflight

**Solution (in server/server.js):**
```javascript
// Add OPTIONS handler BEFORE GET/POST handler
router.options('/api/endpoint', async (ctx) => {
  serverUtil.configAccessControl(ctx);
  ctx.status = 200;
})

router.get('/api/endpoint', async (ctx) => {
  serverUtil.configAccessControl(ctx);
  // ... endpoint logic
})
```

---

### Issue: Element Not Found (Playwright Test)

**Error:**
```
Error: Element not found: button:has-text("New Contact")
```

**Debugging:**
```
1. Take screenshot: mcp__playwright__browser_take_screenshot()
2. Check console: mcp__playwright__browser_console_messages()
3. Try alternative selectors:
   - [data-testid="new-contact-btn"]
   - button >> text="New Contact"
4. Add wait condition: mcp__playwright__browser_wait_for()
```

---

## Playwright MCP Tools Quick Reference

**Navigation:**
```javascript
mcp__playwright__browser_navigate("http://localhost:3000")
mcp__playwright__browser_navigate_back()
```

**Interaction:**
```javascript
mcp__playwright__browser_click({
  element: "button description",
  ref: "button:has-text('Click Me')"
})

mcp__playwright__browser_type({
  element: "input field",
  ref: "input[name='first_name']",
  text: "John"
})

mcp__playwright__browser_select_option({
  element: "dropdown",
  ref: "select[name='contact_type']",
  values: ["customer"]
})
```

**Validation:**
```javascript
mcp__playwright__browser_snapshot()
mcp__playwright__browser_take_screenshot("test-step-1.png")
mcp__playwright__browser_console_messages({ onlyErrors: true })
mcp__playwright__browser_network_requests()
mcp__playwright__browser_wait_for({ text: "Success message" })
```

---

## New API Endpoint Checklist

When adding a new API endpoint, you MUST update BOTH places:

### 1. Koa Development Server (server/server.js)

```javascript
// OPTIONS handler for CORS (REQUIRED!)
router.options('/api/endpoint', async (ctx) => {
  serverUtil.configAccessControl(ctx);
  ctx.status = 200;
})

// Actual endpoint
router.get('/api/endpoint', async (ctx) => {
  serverUtil.configAccessControl(ctx);
  const param = ctx.query.param;
  // ... implementation
  ctx.body = { code: 0, data: result };
})
```

### 2. Vercel Production (api/[...path].js + handler)

```javascript
// Create handler: server/api_handlers/endpoint.js
module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  const param = req.query.param;
  // ... implementation
  res.status(200).json({ code: 0, data: result });
}

// Register in: api/[...path].js
const endpoint = require('../server/api_handlers/endpoint');
const routes = {
  '/api/endpoint': endpoint,
  // ...
};
```

### 3. Verification

```bash
# Test locally
curl http://localhost:8989/api/endpoint

# Check for CORS errors in browser console
# Deploy to Vercel and test production
```

**Checklist:**
- [ ] Add OPTIONS handler to server/server.js (CORS preflight)
- [ ] Add GET/POST/PUT/DELETE handler to server/server.js
- [ ] Create Vercel handler in server/api_handlers/
- [ ] Register in api/[...path].js
- [ ] Test locally
- [ ] Test in browser (check Network tab for CORS errors)
- [ ] Deploy and test production

---

## New Product/Tool Checklist

When adding a new product to the platform:

### 1. App.js Routes (src/App.js)

```javascript
<Route path="/new_product" element={<Home />} />
```

### 2. Home Page Access Control (src/pages/home/index.js)

```javascript
useEffect(() => {
  if (!isAdmin &&
      activeView !== 'dashboard' &&
      activeView !== 'strategic_map' &&
      activeView !== 'new_product') {  // ADD HERE
    setActiveView('dashboard');
  }
}, [isAdmin, activeView]);
```

### 3. Verification

```bash
# Test navigation as non-admin user
# Test navigation as admin user
# Verify URL updates correctly
# Verify back/forward browser buttons work
```

**Checklist:**
- [ ] Add route in src/App.js
- [ ] Add case in renderActiveView() switch statement
- [ ] Add to access control allowed views list
- [ ] Add product record to database public.products table
- [ ] Test navigation as non-admin user
- [ ] Test navigation as admin user

---

## Architecture Documentation

**Primary References:**
- [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture decisions, component standards, ADRs
- [CLAUDE.md](CLAUDE.md) - AI agent operational commands and high-level architecture
- [DEVELOPMENT_SERVER_PRACTICES.md](DEVELOPMENT_SERVER_PRACTICES.md) - Server management guide
- [TESTING_WORKFLOW_GUIDE.md](TESTING_WORKFLOW_GUIDE.md) - Agent coordination protocol

**Agent Configuration:**
- [.claude/agents/test-driven-developer.md](.claude/agents/test-driven-developer.md)
- [.claude/agents/playwright-testing-agent.md](.claude/agents/playwright-testing-agent.md)

---

## Port Assignments

| Port | Service                  | Access URL                     |
|------|--------------------------|--------------------------------|
| 3000 | React Dev Server         | http://localhost:3000          |
| 8989 | Koa Backend Server       | http://localhost:8989/api/*    |

**Reserved:** Do not use these ports for other services during development.

---

## npm Scripts

```json
{
  "start": "npm run start:server & npm run start:web",
  "start:web": "BROWSER=none react-scripts start",
  "start:server": "node ./server/server.js",
  "start:with-ngrok": "npm run start:server & npm run start:web & ngrok http 3000",
  "build": "react-scripts build",
  "deploy": "vercel --prod",
  "deploy:preview": "vercel",
  "config": "node ./cli/cli.js config"
}
```

---

## Environment Variables

Required in `.env`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
REACT_APP_ALLOW_EXTERNAL_BROWSER=true  # For OAuth in local dev
```

---

## Key Architecture Decisions (ADRs)

- **ADR-001**: Tool-based project structure (`/src/tools/`)
- **ADR-002**: Tailwind CSS + shadcn/ui (replacing Material-UI)
- **ADR-004**: Hybrid deployment (Koa dev + Vercel production)
- **ADR-012**: React Router navigation with product access control
- **ADR-013**: Development server standard start procedure

**Full list:** [ARCHITECTURE.md](ARCHITECTURE.md#2-architecture-decisions)

---

## Production Tools

| Tool                  | Status | Key Features                                   |
|-----------------------|--------|------------------------------------------------|
| Strategic Map         | ✅ Prod | Goal planning with cascade (year → daily)      |
| Contact Management    | ✅ Prod | CRM with configurable ratings, filtering       |
| Sales Management      | ✅ Prod | Quotations → Invoices workflow with PDF        |
| Inventory Management  | ✅ Prod | Multi-location stock tracking, purchase orders |
| Document Parser       | ✅ Prod | Pure frontend CSV/Excel parser                 |

---

## Getting Help

**For Development Issues:**
1. Check this quick reference
2. Consult [DEVELOPMENT_SERVER_PRACTICES.md](DEVELOPMENT_SERVER_PRACTICES.md)
3. Review [ARCHITECTURE.md](ARCHITECTURE.md) ADRs

**For Testing Issues:**
1. Check this quick reference
2. Consult [TESTING_WORKFLOW_GUIDE.md](TESTING_WORKFLOW_GUIDE.md)
3. Review agent documentation in `.claude/agents/`

**For Architecture Questions:**
1. Review [ARCHITECTURE.md](ARCHITECTURE.md)
2. Check [CLAUDE.md](CLAUDE.md) for high-level overview
3. Consult specific tool documentation in `/docs/`

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-25
**Maintained By**: Architecture Overseer
