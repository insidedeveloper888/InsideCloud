# Development Server Practices

**Version**: 1.0.0
**Last Updated**: 2025-11-25
**Maintained By**: Architecture Overseer + Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Critical Server Start Command](#critical-server-start-command)
3. [Port Management](#port-management)
4. [Development Server Architecture](#development-server-architecture)
5. [Common Issues and Solutions](#common-issues-and-solutions)
6. [Testing Workflows](#testing-workflows)
7. [Agent Coordination](#agent-coordination)

---

## Overview

InsideCloud uses a **hybrid deployment architecture** with separate development and production server configurations:

- **Development**: Koa server (localhost:8989) + React Dev Server (localhost:3000)
- **Production**: Vercel Serverless Functions + Static React Build

This document establishes critical practices for reliable development server operation, particularly for browser-based testing workflows.

---

## Critical Server Start Command

### Standard Server Start Procedure

**ALWAYS use this command when starting the development server:**

```bash
pkill -f "server/server.js"; pkill -f "react-scripts"; npm run start
```

### Why This Command Is Critical

**Problem Without Clean Shutdown:**
- Port 3000 remains occupied by zombie React process
- Port 8989 remains occupied by zombie Koa process
- `npm run start` fails with `EADDRINUSE` error
- Browser-based tests fail to connect

**Solution Components:**

1. **`pkill -f "server/server.js"`**: Kills any existing Koa server processes
   - Targets processes matching `server/server.js` in command line
   - Ensures port 8989 is freed

2. **`pkill -f "react-scripts"`**: Kills any existing React dev server processes
   - Targets processes matching `react-scripts` in command line
   - Ensures port 3000 is freed

3. **`npm run start`**: Starts both servers cleanly
   - Launches Koa server on port 8989
   - Launches React dev server on port 3000
   - Proxy configuration routes `/api/*` to Koa

### Package.json Scripts

The project's `package.json` defines these npm scripts:

```json
{
  "scripts": {
    "start": "npm run start:server & npm run start:web",
    "start:web": "BROWSER=none react-scripts start",
    "start:server": "node ./server/server.js",
    "start:with-ngrok": "npm run start:server & npm run start:web & ngrok http 3000"
  }
}
```

**Key Details:**
- `start` runs both servers in parallel using `&`
- `start:web` uses `BROWSER=none` to prevent auto-opening browser
- `start:server` launches Koa on port 8989 (configured in `server/server.js`)
- React dev server defaults to port 3000 (Create React App default)

### When to Use This Command

**ALWAYS use the full cleanup command when:**
- Starting work on a new feature
- Launching browser-based testing workflows
- Recovering from port conflicts
- After system crashes or forced process termination
- Before running Playwright tests via MCP tools

**Agent-Specific Guidance:**
- `test-driven-developer` agent: Include this command in implementation workflow
- `playwright-testing-agent` agent: Verify servers are running before test execution
- All agents: Reference this command when encountering port conflicts

---

## Port Management

### Reserved Ports

**Port 3000 - React Development Server (Frontend)**
- **Purpose**: Serves React application during development
- **Technology**: Create React App dev server with hot reload
- **Configuration**: `package.json` proxy setting routes `/api/*` to port 8989
- **Access**: `http://localhost:3000`
- **Features**:
  - Hot module replacement (HMR)
  - Fast refresh for React components
  - Source maps for debugging
  - Proxy for API requests

**Port 8989 - Koa Backend Server (API)**
- **Purpose**: Handles all `/api/*` requests during development
- **Technology**: Koa 2 with koa-router
- **Configuration**: `server/server.js` line ~50: `const port = 8989`
- **Access**: `http://localhost:8989`
- **Features**:
  - Session management
  - CORS configuration
  - API endpoint implementations
  - Same logic as Vercel serverless functions

### Port Conflict Detection

**Symptoms of Port Conflicts:**
```
Error: listen EADDRINUSE: address already in use :::3000
Error: listen EADDRINUSE: address already in use :::8989
```

**Quick Diagnosis:**
```bash
# Check what's using port 3000
lsof -i :3000

# Check what's using port 8989
lsof -i :8989

# Kill specific process by PID
kill -9 <PID>
```

**Prevention:**
- Always use the standard server start command with `pkill` cleanup
- Avoid `Ctrl+C` to stop servers (may leave zombie processes)
- Use `pkill` commands before manual `npm run start`

### Network Configuration

**Localhost Access:**
```
Frontend: http://localhost:3000
Backend:  http://localhost:8989/api/*
```

**Proxy Configuration:**
The React dev server proxies API requests:
```javascript
// In browser: fetch('/api/products')
// Actually calls: http://localhost:8989/api/products
```

**Configured in package.json:**
```json
{
  "proxy": "http://localhost:8989"
}
```

---

## Development Server Architecture

### Development Mode Request Flow

```
Browser (localhost:3000)
  ↓
React Dev Server (port 3000)
  ├─ Static assets (HTML, JS, CSS) → Served directly
  └─ /api/* requests → Proxied to Koa server
       ↓
Koa Server (port 8989)
  ├─ Session validation
  ├─ CORS handling
  ├─ API endpoint logic
  └─ Supabase + Lark API calls
       ↓
Response → Browser
```

### Production Mode Request Flow (Vercel)

```
Browser (insidecloud.vercel.app)
  ↓
Vercel Edge Network
  ├─ Static React Build → Served from CDN
  └─ /api/* requests → Serverless Functions
       ↓
Serverless Function (api/[...path].js)
  ├─ Route matching
  ├─ Handler execution (server/api_handlers/*)
  ├─ Session validation
  └─ Supabase + Lark API calls
       ↓
Response → Browser
```

### Code Duplication Pattern

**CRITICAL: All API endpoints MUST exist in BOTH places:**

1. **Koa Development Server** (`server/server.js`):
   ```javascript
   // OPTIONS handler for CORS preflight
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

2. **Vercel Serverless** (`api/[...path].js` + handler):
   ```javascript
   // Create: server/api_handlers/endpoint.js
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

**Why Duplication?**
- Koa: Fast local development with hot reload
- Vercel: Scalable production with serverless
- Same logic, different frameworks
- Shared helpers in `/lib/` minimize duplication

---

## Common Issues and Solutions

### Issue 1: Server Won't Start (Port Already in Use)

**Symptom:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Root Cause:**
Previous server process not properly terminated.

**Solution:**
```bash
# Use the standard cleanup command
pkill -f "server/server.js"; pkill -f "react-scripts"; npm run start
```

**Prevention:**
- Always use `pkill` cleanup before starting servers
- Avoid force-quitting terminal windows
- Add cleanup command to shell aliases

---

### Issue 2: API Requests Stuck at "Pending"

**Symptom:**
- Frontend loads successfully on localhost:3000
- API requests in Network tab show "Pending" indefinitely
- No response, no errors

**Root Cause:**
Koa server not running, React proxy can't forward requests.

**Diagnosis:**
```bash
# Check if Koa server is running
lsof -i :8989

# Should show: node server/server.js
```

**Solution:**
```bash
# Restart both servers with cleanup
pkill -f "server/server.js"; pkill -f "react-scripts"; npm run start
```

**Verification:**
```bash
# Test Koa server directly
curl http://localhost:8989/api/health

# Should return: {"status":"ok"}
```

---

### Issue 3: CORS Errors in Browser Console

**Symptom:**
```
Access to fetch at 'http://localhost:8989/api/endpoint' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Root Cause:**
Missing OPTIONS handler for CORS preflight request.

**Explanation:**
Modern browsers send an OPTIONS request before actual GET/POST requests (CORS preflight). If no OPTIONS handler exists, the browser blocks the request.

**Solution:**
Add OPTIONS handler to `server/server.js`:
```javascript
// MUST come before GET/POST handler
router.options('/api/endpoint', async (ctx) => {
  serverUtil.configAccessControl(ctx); // Sets CORS headers
  ctx.status = 200;
})

router.get('/api/endpoint', async (ctx) => {
  serverUtil.configAccessControl(ctx);
  // ... endpoint logic
})
```

**Checklist for New Endpoints:**
- [ ] Add OPTIONS handler to `server/server.js`
- [ ] Add GET/POST handler to `server/server.js`
- [ ] Create Vercel handler in `server/api_handlers/`
- [ ] Register in `api/[...path].js`
- [ ] Test in browser (check Network tab for CORS errors)

---

### Issue 4: Endpoint Works in Production, Fails Locally

**Symptom:**
- API endpoint works on Vercel production
- Same endpoint fails locally with 404 or timeout

**Root Cause:**
Missing Koa route in `server/server.js`.

**Common Mistake:**
Developer creates Vercel handler but forgets to add Koa route.

**Solution:**
Check if route exists in `server/server.js`:
```bash
# Search for endpoint definition
grep -n "'/api/endpoint'" server/server.js

# Should show both OPTIONS and GET/POST routes
```

If missing, add both OPTIONS and GET/POST handlers.

**Prevention:**
- Use checklist when adding new endpoints (see "Checklist for New Endpoints" above)
- Test locally before deploying to production

---

### Issue 5: Testing Workflow Interrupted (Permission Issue)

**Symptom:**
- Playwright test launched via MCP tools
- Permission not granted for browser launch
- Test workflow halted

**Root Cause:**
MCP server requires explicit permission to launch browser.

**Solution:**
1. Grant permission when prompted by MCP server
2. Re-run test scenario after permission granted
3. Ensure Playwright browser is installed:
   ```bash
   mcp__playwright__browser_install
   ```

**Agent Coordination:**
- `playwright-testing-agent`: Always check browser availability before test execution
- `test-driven-developer`: Inform user if testing workflow requires permission grant

---

## Testing Workflows

### Browser-Based Testing with Playwright MCP

**Prerequisites:**
1. **Development servers running**: Use standard start command
2. **Playwright browser installed**: Check with testing agent
3. **MCP server permissions granted**: Allow browser launch

**Workflow:**
```
test-driven-developer agent (Implementation)
  ↓
Provides test scenarios to playwright-testing-agent
  ↓
playwright-testing-agent (Testing)
  ├─ mcp__playwright__browser_navigate → localhost:3000
  ├─ mcp__playwright__browser_click → Interact with UI
  ├─ mcp__playwright__browser_type → Enter data
  ├─ mcp__playwright__browser_snapshot → Capture state
  ├─ mcp__playwright__browser_console_messages → Check errors
  └─ mcp__playwright__browser_network_requests → Validate API calls
  ↓
Reports results back to test-driven-developer
  ↓
Iteration (if tests fail)
```

**Critical Requirements:**
- Both servers MUST be running on ports 3000 and 8989
- Browser MUST have access to localhost:3000
- MCP server MUST have permission to launch browser
- Test data MUST exist in Supabase test organization

### Testing Agent Best Practices

**Before Test Execution:**
```bash
# 1. Verify servers are running
lsof -i :3000  # React dev server
lsof -i :8989  # Koa backend server

# 2. If not running, start with cleanup
pkill -f "server/server.js"; pkill -f "react-scripts"; npm run start

# 3. Verify browser installation
# (handled by playwright-testing-agent via MCP tools)
```

**During Test Execution:**
- Capture screenshots at each major step
- Monitor console for errors/warnings
- Inspect network requests for API failures
- Validate DOM elements with accessibility snapshots

**After Test Execution:**
- Report pass/fail with evidence (screenshots, logs)
- Identify root cause of failures (console errors, network issues, DOM problems)
- Provide specific recommendations to test-driven-developer

---

## Agent Coordination

### test-driven-developer Agent

**Responsibilities:**
- Implement features following TDD workflow
- Provide clear test scenarios to playwright-testing-agent
- Analyze test results and fix failures
- Ensure development servers are running before testing

**When to Start Development Server:**
```bash
# At the beginning of implementation workflow
pkill -f "server/server.js"; pkill -f "react-scripts"; npm run start

# Verify servers started successfully
# React dev server: http://localhost:3000
# Koa backend: http://localhost:8989
```

**Test Scenario Format:**
```markdown
## Test Scenario: [Feature Name]

**Test ID**: [TOOL-ACTION-001]

**Prerequisites:**
- Organization: test-org-slug
- User: test user with admin role
- Test data: [specific records needed]

**Steps:**
1. Navigate to [URL]
2. Click [element description]
3. Enter [data] in [field]
4. Verify [expected outcome]

**Expected Results:**
- [Specific UI changes]
- [API responses]
- [Database state]

**Validation:**
- Console: No errors
- Network: Successful API calls (200 status)
- DOM: [Expected elements present]
```

---

### playwright-testing-agent Agent

**Responsibilities:**
- Execute test scenarios using Playwright MCP tools
- Capture evidence (screenshots, console logs, network traces)
- Validate expected outcomes
- Report results with actionable feedback

**Pre-Test Checklist:**
- [ ] Verify development servers running (ports 3000, 8989)
- [ ] Confirm browser launch permission granted
- [ ] Validate test organization exists in database
- [ ] Check test data prerequisites

**Test Execution Template:**
```
1. Launch Browser:
   - mcp__playwright__browser_navigate("http://localhost:3000")

2. Initial State Capture:
   - mcp__playwright__browser_snapshot() → Baseline

3. Execute Test Steps:
   - mcp__playwright__browser_click(element)
   - mcp__playwright__browser_type(text)
   - mcp__playwright__browser_select_option(value)

4. Validation:
   - mcp__playwright__browser_console_messages(onlyErrors: true)
   - mcp__playwright__browser_network_requests()
   - mcp__playwright__browser_snapshot() → Final state

5. Evidence Capture:
   - mcp__playwright__browser_take_screenshot(filename)

6. Generate Report:
   - Pass/Fail status
   - Evidence attachments
   - Failure root cause analysis
   - Recommendations
```

**Reporting Format:**
```markdown
## Test Report: [Feature Name]

**Test ID**: [TOOL-ACTION-001]
**Status**: ✅ PASS / ❌ FAIL
**Executed**: 2025-11-25 19:45:00

**Results:**
- Step 1: ✅ PASS - Browser navigated to localhost:3000
- Step 2: ❌ FAIL - Element not found: [selector]
- Step 3: ⏭️ SKIPPED - Dependency on Step 2

**Evidence:**
- Screenshot 1: [path/to/screenshot.png]
- Console Logs: [errors/warnings found]
- Network Requests: [API failures detected]

**Root Cause Analysis:**
[Specific reason for failure]

**Recommendations:**
1. [Specific fix needed]
2. [Alternative approach]
```

---

### Coordination Protocol

**Phase 1: Implementation (test-driven-developer)**
```
1. Start servers with cleanup command
2. Implement feature (backend + frontend)
3. Create test scenarios
4. Handoff to playwright-testing-agent
```

**Phase 2: Testing (playwright-testing-agent)**
```
1. Verify servers running
2. Execute test scenarios
3. Capture evidence
4. Generate test report
5. Handoff report to test-driven-developer
```

**Phase 3: Iteration (test-driven-developer)**
```
1. Review test report
2. Analyze failures
3. Fix bugs
4. Create new test scenarios
5. Handoff to playwright-testing-agent
6. Repeat until all tests pass
```

**Communication Best Practices:**
- Use structured test scenario format
- Provide specific test data and prerequisites
- Include expected outcomes with measurable criteria
- Capture and share evidence (screenshots, logs)
- Analyze root causes, not just symptoms
- Suggest specific fixes, not generic recommendations

---

## Quick Reference

### Standard Server Start Command
```bash
pkill -f "server/server.js"; pkill -f "react-scripts"; npm run start
```

### Verify Servers Running
```bash
lsof -i :3000  # React dev server
lsof -i :8989  # Koa backend server
```

### Test API Endpoint Directly
```bash
curl http://localhost:8989/api/health
```

### Check Console for Errors
```bash
# In browser DevTools: Console tab
# Or via playwright-testing-agent:
mcp__playwright__browser_console_messages(onlyErrors: true)
```

### Common Port Conflict Resolution
```bash
# Kill specific process
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
lsof -i :8989 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Then restart
npm run start
```

---

## Document History

| Version | Date       | Changes                                    | Author               |
|---------|------------|--------------------------------------------|----------------------|
| 1.0.0   | 2025-11-25 | Initial documentation                      | Architecture Overseer|

**Next Review**: 2025-12-25

**Related Documentation:**
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture and ADRs
- [CLAUDE.md](CLAUDE.md) - AI agent operational commands
- [.claude/agents/test-driven-developer.md](.claude/agents/test-driven-developer.md) - TDD agent configuration
- [.claude/agents/playwright-testing-agent.md](.claude/agents/playwright-testing-agent.md) - Testing agent configuration
