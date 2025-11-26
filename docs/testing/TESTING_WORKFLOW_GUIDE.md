# Testing Workflow Guide

**Version**: 1.0.0
**Last Updated**: 2025-11-25
**Maintained By**: Architecture Overseer + QA Team

---

## Table of Contents

1. [Overview](#overview)
2. [Agent Coordination Model](#agent-coordination-model)
3. [Workflow Phases](#workflow-phases)
4. [Playwright MCP Tools Integration](#playwright-mcp-tools-integration)
5. [Test Scenario Templates](#test-scenario-templates)
6. [Common Testing Patterns](#common-testing-patterns)
7. [Troubleshooting](#troubleshooting)

---

## Overview

InsideCloud uses a **collaborative test-driven development workflow** where two specialized AI agents work together:

- **test-driven-developer Agent**: Implements features and provides test scenarios
- **playwright-testing-agent Agent**: Executes browser-based tests using Playwright MCP tools

This guide establishes the coordination protocol, communication patterns, and best practices for effective testing workflows.

---

## Agent Coordination Model

### The Two-Agent Testing System

```
┌─────────────────────────────────────────────────────────────┐
│                   USER / PRODUCT OWNER                       │
│              (Defines requirements & features)               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              test-driven-developer Agent                     │
│                                                              │
│  Responsibilities:                                           │
│  • Analyze requirements                                      │
│  • Design architecture & data models                         │
│  • Implement backend (controllers, APIs, database)          │
│  • Implement frontend (components, hooks, state)            │
│  • Create test scenarios with acceptance criteria           │
│  • Fix bugs based on test feedback                          │
│                                                              │
│  Outputs:                                                    │
│  → Feature implementation                                    │
│  → Test scenarios (structured format)                        │
│  → Bug fixes after test failures                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Test Scenarios
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│             playwright-testing-agent Agent                   │
│                                                              │
│  Responsibilities:                                           │
│  • Verify development servers running                        │
│  • Launch browser via Playwright MCP tools                   │
│  • Execute test scenarios step-by-step                       │
│  • Capture evidence (screenshots, logs, network)            │
│  • Validate expected outcomes                               │
│  • Generate detailed test reports                           │
│                                                              │
│  Outputs:                                                    │
│  → Test reports (PASS/FAIL with evidence)                   │
│  → Screenshots at each test step                            │
│  → Console error logs                                       │
│  → Network request traces                                   │
│  → Root cause analysis for failures                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Test Reports
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Iteration Loop (if tests fail)                       │
│                                                              │
│  test-driven-developer Agent:                                │
│  1. Reviews test report                                      │
│  2. Analyzes root cause                                      │
│  3. Fixes implementation                                     │
│  4. Provides updated test scenarios                          │
│                                                              │
│  → Back to playwright-testing-agent for re-testing           │
└─────────────────────────────────────────────────────────────┘
```

### Communication Protocol

**Phase 1: Test Scenario Handoff**

test-driven-developer → playwright-testing-agent

**Required Information:**
- Test scenario ID and name
- Prerequisites (test data, organization, user role)
- Step-by-step instructions
- Expected outcomes with validation criteria
- Acceptance criteria

**Example:**
```markdown
## Test Scenario: Create New Customer Contact

**Test ID**: CONTACT-CREATE-001

**Prerequisites:**
- Organization: test-org-slug
- User: admin@example.com (admin role)
- Test data: None (will create new contact)

**Steps:**
1. Navigate to http://localhost:3000/contact_management
2. Click "New Contact" button
3. Fill in form:
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "john.doe@example.com"
   - Contact Type: "Customer"
   - Rating: 5 stars
4. Click "Save" button

**Expected Results:**
- Contact appears in list view
- Contact card shows "John Doe"
- Rating badge displays "5/10" with green color
- No console errors
- API request to POST /api/contacts succeeds (200 status)

**Validation:**
- Console: No errors or warnings
- Network: POST /api/contacts returns { code: 0 }
- DOM: Contact card exists with class "contact-card"
```

---

**Phase 2: Test Report Handoff**

playwright-testing-agent → test-driven-developer

**Required Information:**
- Test ID reference
- Overall status (PASS/FAIL)
- Step-by-step results
- Evidence attachments (screenshots, logs)
- Root cause analysis (for failures)
- Recommendations for fixes

**Example:**
```markdown
## Test Report: Create New Customer Contact

**Test ID**: CONTACT-CREATE-001
**Status**: ❌ FAIL
**Executed**: 2025-11-25 19:45:00

**Step Results:**
1. ✅ PASS - Navigated to http://localhost:3000/contact_management
2. ❌ FAIL - "New Contact" button not found
3. ⏭️ SKIPPED - Form fill depends on step 2
4. ⏭️ SKIPPED - Save button depends on step 3

**Evidence:**
- Screenshot 1: page-initial-load.png (shows contact list, no "New Contact" button visible)
- Console Logs: No errors
- Network Requests: GET /api/contacts (200 OK)

**Root Cause Analysis:**
The "New Contact" button is not visible on the page. Possible reasons:
1. Button may be conditionally rendered based on user role (admin check)
2. Button may be hidden by CSS (display: none)
3. Button may have different selector than expected

**Selector Attempted:**
`button:has-text("New Contact")`

**Recommendations:**
1. Verify OrganizationContext provides correct isAdmin flag
2. Check if button is gated by feature flag or product access
3. Inspect component JSX for button rendering logic
4. Try alternative selectors: [data-testid="new-contact-btn"]
```

---

## Workflow Phases

### Phase 1: Implementation (test-driven-developer)

**Step 1: Requirement Analysis**
- Review user requirements or bug report
- Identify affected tools/components
- List data model changes needed
- Define API contracts (request/response formats)

**Step 2: Server Preparation**
```bash
# ALWAYS start with clean server startup
pkill -f "server/server.js"; pkill -f "react-scripts"; npm run start

# Verify servers running
lsof -i :3000  # React dev server
lsof -i :8989  # Koa backend server
```

**Step 3: Backend Implementation**
- Database schema changes (migrations)
- Create controller functions
- Implement Koa routes in `server/server.js`
- Create Vercel handlers in `server/api_handlers/`
- Register routes in `api/[...path].js`

**Checklist for New API Endpoints:**
- [ ] Add OPTIONS handler (CORS preflight) to `server/server.js`
- [ ] Add GET/POST/PUT/DELETE handler to `server/server.js`
- [ ] Create Vercel handler in `server/api_handlers/`
- [ ] Register in `api/[...path].js`
- [ ] Test endpoint with curl: `curl http://localhost:8989/api/endpoint`

**Step 4: Frontend Implementation**
- Create/update React components in `/src/tools/{tool-name}/`
- Implement custom hooks for data fetching
- Add state management (useState, useEffect)
- Implement optimistic updates with rollback
- Add inline validation (no alert() dialogs)
- Ensure mobile responsiveness

**Step 5: Test Scenario Creation**
Create structured test scenarios for playwright-testing-agent:

**Template:**
```markdown
## Test Scenario: [Feature Name]

**Test ID**: [TOOL-ACTION-XXX]

**Prerequisites:**
- Organization: [slug]
- User: [email] ([role])
- Test data: [specific records/IDs]

**Steps:**
1. [Action with specific selector/text]
2. [Action with input data]
3. [Validation check]

**Expected Results:**
- [UI changes]
- [API responses]
- [Database state]

**Validation:**
- Console: [expected console state]
- Network: [expected API calls]
- DOM: [expected elements]
```

---

### Phase 2: Testing (playwright-testing-agent)

**Step 1: Pre-Test Verification**
```markdown
## Pre-Test Checklist

- [ ] Development servers running (ports 3000, 8989)
- [ ] Browser launch permission granted (MCP server)
- [ ] Playwright browser installed
- [ ] Test organization exists in database
- [ ] Test user account exists with correct role
- [ ] Test data prerequisites met
```

**Verification Commands:**
```bash
# Check servers (relay to user if not running)
lsof -i :3000  # React dev server
lsof -i :8989  # Koa backend server

# If not running, recommend:
pkill -f "server/server.js"; pkill -f "react-scripts"; npm run start
```

**Step 2: Browser Launch**
```
mcp__playwright__browser_navigate("http://localhost:3000")
```

**Step 3: Initial State Capture**
```
mcp__playwright__browser_snapshot()
mcp__playwright__browser_take_screenshot("test-id-initial.png")
```

**Step 4: Execute Test Steps**

Follow test scenario instructions precisely:

```javascript
// Example test step execution
mcp__playwright__browser_click({
  element: "New Contact button",
  ref: "button:has-text('New Contact')"
})

mcp__playwright__browser_type({
  element: "First Name field",
  ref: "input[name='first_name']",
  text: "John"
})

mcp__playwright__browser_select_option({
  element: "Contact Type dropdown",
  ref: "select[name='contact_type']",
  values: ["customer"]
})
```

**Step 5: Validation**

**Console Errors:**
```
mcp__playwright__browser_console_messages({
  onlyErrors: true
})
```

**Network Requests:**
```
mcp__playwright__browser_network_requests()
```

**DOM State:**
```
mcp__playwright__browser_snapshot()
```

**Step 6: Evidence Capture**
```
mcp__playwright__browser_take_screenshot("test-id-final.png")
```

**Step 7: Generate Test Report**

Use structured format (see "Phase 2: Test Report Handoff" above).

---

### Phase 3: Iteration (test-driven-developer)

**Step 1: Review Test Report**
- Read pass/fail status for each step
- Examine screenshots for visual issues
- Review console logs for JavaScript errors
- Check network traces for API failures

**Step 2: Root Cause Analysis**

**Common Failure Patterns:**

**Pattern 1: Element Not Found**
- Symptom: `button:has-text("New Contact")` not found
- Possible causes:
  - Button conditionally rendered (feature flag, role check)
  - Button has different text or selector
  - Button not loaded yet (timing issue)
- Solution:
  - Add wait conditions: `mcp__playwright__browser_wait_for`
  - Check component rendering logic
  - Use data-testid attributes for stable selectors

**Pattern 2: API Request Failed**
- Symptom: POST /api/contacts returns 500 error
- Possible causes:
  - Backend validation failed
  - Missing Koa route (only Vercel handler exists)
  - Database constraint violation
  - Missing CORS OPTIONS handler
- Solution:
  - Check `server/server.js` for route definition
  - Add OPTIONS handler if missing
  - Review backend controller error handling
  - Test endpoint directly: `curl http://localhost:8989/api/contacts`

**Pattern 3: Console Errors**
- Symptom: React errors in console
- Possible causes:
  - Undefined prop access
  - Missing null checks
  - State update on unmounted component
- Solution:
  - Add defensive checks: `data?.field || defaultValue`
  - Implement error boundaries
  - Fix async cleanup in useEffect

**Step 3: Implement Fix**
- Make targeted code changes based on root cause
- Add defensive programming (null checks, error handling)
- Improve selectors (add data-testid attributes)
- Add loading states or wait conditions

**Step 4: Create Updated Test Scenario**
- Refine steps based on learnings
- Add wait conditions if needed
- Update expected outcomes
- Include regression checks

**Step 5: Handoff to Testing Agent**
- Provide updated test scenarios
- Explain what was fixed
- Request re-test of failed scenarios
- Request regression test of previously passing scenarios

---

## Playwright MCP Tools Integration

### Available Tools

**Navigation:**
- `mcp__playwright__browser_navigate(url)` - Navigate to URL
- `mcp__playwright__browser_navigate_back()` - Go back
- `mcp__playwright__browser_tabs(action, index)` - Manage tabs

**Interaction:**
- `mcp__playwright__browser_click(element, ref, button, modifiers)` - Click elements
- `mcp__playwright__browser_type(element, ref, text, slowly, submit)` - Type text
- `mcp__playwright__browser_press_key(key)` - Press keyboard keys
- `mcp__playwright__browser_fill_form(fields)` - Fill multiple fields
- `mcp__playwright__browser_select_option(element, ref, values)` - Select dropdown
- `mcp__playwright__browser_drag(startElement, startRef, endElement, endRef)` - Drag/drop
- `mcp__playwright__browser_hover(element, ref)` - Hover over element
- `mcp__playwright__browser_file_upload(paths)` - Upload files

**Validation:**
- `mcp__playwright__browser_snapshot()` - Accessibility snapshot (preferred)
- `mcp__playwright__browser_take_screenshot(filename, type, fullPage, element, ref)` - Screenshot
- `mcp__playwright__browser_console_messages(onlyErrors)` - Console logs
- `mcp__playwright__browser_network_requests()` - Network requests
- `mcp__playwright__browser_evaluate(function, element, ref)` - Run JavaScript
- `mcp__playwright__browser_wait_for(text, textGone, time)` - Wait for conditions

**Advanced:**
- `mcp__playwright__browser_run_code(code)` - Execute Playwright code
- `mcp__playwright__browser_resize(width, height)` - Resize viewport
- `mcp__playwright__browser_handle_dialog(accept, promptText)` - Handle dialogs
- `mcp__playwright__browser_close()` - Close browser

### Best Practices

**Selector Strategy:**

**Priority Order:**
1. **data-testid attributes** (most stable)
   ```
   ref: "[data-testid='new-contact-btn']"
   ```

2. **Text content** (for buttons, links)
   ```
   ref: "button:has-text('New Contact')"
   ```

3. **Name attributes** (for form inputs)
   ```
   ref: "input[name='first_name']"
   ```

4. **CSS classes** (least stable, avoid if possible)
   ```
   ref: ".contact-form-submit-btn"
   ```

**Wait Strategies:**

**Wait for element to appear:**
```
mcp__playwright__browser_wait_for({
  text: "Contact created successfully"
})
```

**Wait for element to disappear:**
```
mcp__playwright__browser_wait_for({
  textGone: "Loading..."
})
```

**Wait for specific time (last resort):**
```
mcp__playwright__browser_wait_for({
  time: 2  // seconds
})
```

**Screenshot Strategy:**

**Capture at key points:**
```
// Initial state
mcp__playwright__browser_take_screenshot("test-id-01-initial.png")

// After form fill
mcp__playwright__browser_take_screenshot("test-id-02-form-filled.png")

// Final state
mcp__playwright__browser_take_screenshot("test-id-03-final.png")
```

**Full page screenshots:**
```
mcp__playwright__browser_take_screenshot({
  filename: "test-id-fullpage.png",
  fullPage: true
})
```

**Element screenshots:**
```
mcp__playwright__browser_take_screenshot({
  filename: "contact-card.png",
  element: "contact card",
  ref: "[data-testid='contact-card-123']"
})
```

---

## Test Scenario Templates

### Template 1: CRUD Operations

```markdown
## Test Scenario: [CREATE/READ/UPDATE/DELETE] [Entity]

**Test ID**: [TOOL]-[ENTITY]-[ACTION]-[XXX]

**Prerequisites:**
- Organization: test-org-slug
- User: admin@example.com (admin role)
- Test data: [Required existing data]

**Steps:**
1. Navigate to [URL]
2. Click [Action button]
3. Fill form:
   - Field 1: Value 1
   - Field 2: Value 2
4. Click "Save" button
5. Verify [Entity] appears in list

**Expected Results:**
- [Entity] created successfully
- Success message displayed
- List refreshed with new [Entity]
- No console errors
- API request succeeds (200 status)

**Validation:**
- Console: No errors
- Network: POST /api/[entities] returns { code: 0, data: {...} }
- DOM: [Entity] card exists with correct data

**Cleanup:**
- Delete test [Entity] after test completes
```

---

### Template 2: Form Validation

```markdown
## Test Scenario: Validate [Form Name] Required Fields

**Test ID**: [TOOL]-[FORM]-VALIDATION-[XXX]

**Prerequisites:**
- Organization: test-org-slug
- User: admin@example.com (admin role)

**Steps:**
1. Navigate to [URL]
2. Click "New [Entity]" button
3. Leave required fields empty
4. Click "Save" button
5. Verify validation errors appear

**Expected Results:**
- Form NOT submitted
- Validation errors displayed inline
- Required fields highlighted in red
- Error messages: "[Field] is required"
- No API request sent

**Validation:**
- Console: No errors
- Network: No POST request (validation failed client-side)
- DOM: Error messages visible with class "error-message"

**Additional Cases:**
- Test invalid email format
- Test duplicate entries
- Test field length limits
```

---

### Template 3: Multi-Step Workflow

```markdown
## Test Scenario: [Workflow Name] End-to-End

**Test ID**: [TOOL]-[WORKFLOW]-E2E-[XXX]

**Prerequisites:**
- Organization: test-org-slug
- User: admin@example.com (admin role)
- Test data: [Base data needed]

**Steps:**
1. **Step 1: [Action 1]**
   - Navigate to [URL]
   - Create [Entity 1]
   - Verify [Entity 1] created

2. **Step 2: [Action 2]**
   - Click "Convert to [Entity 2]"
   - Verify form auto-fills from [Entity 1]
   - Modify [specific fields]
   - Save [Entity 2]

3. **Step 3: [Action 3]**
   - Navigate to [Entity 2] list
   - Verify [Entity 2] appears
   - Check status badge shows correct state

**Expected Results:**
- All 3 steps complete successfully
- Data flows correctly between steps
- Status transitions work as expected
- No console errors throughout workflow

**Validation:**
- Console: No errors
- Network: All API requests succeed (200 status)
- Database: Verify relationship between [Entity 1] and [Entity 2]

**Cleanup:**
- Delete test [Entity 2]
- Delete test [Entity 1]
```

---

## Common Testing Patterns

### Pattern 1: Contact Management CRUD

**Test Scenario: Create Customer Contact**
```
1. Navigate to /contact_management
2. Click "New Contact" button
3. Fill form (first_name, last_name, email, contact_type: customer)
4. Select 5-star rating
5. Click "Save"
6. Verify contact appears in list with 5-star badge
```

**Test Scenario: Filter Contacts by Rating**
```
1. Navigate to /contact_management
2. Open filter panel
3. Select "High" rating filter (8-10 stars)
4. Verify only high-rated contacts displayed
5. Check active filter count badge shows "1"
```

---

### Pattern 2: Sales Management Workflow

**Test Scenario: Quotation → Sales Order Conversion**
```
1. Navigate to /sales_management
2. Create quotation with customer and line items
3. Click "Convert to Sales Order"
4. Verify form auto-fills with quotation data
5. Modify status to "Confirmed"
6. Save sales order
7. Verify sales order appears in list
8. Verify quotation status changed to "Converted"
```

---

### Pattern 3: Strategic Map Cascade

**Test Scenario: Yearly Goal Cascades to Monthly**
```
1. Navigate to /strategic_map
2. Add yearly goal: "Increase revenue by 20%"
3. Expand December monthly view
4. Verify yearly goal appears in December column (blue background, read-only)
5. Add monthly goal: "Close 5 major deals"
6. Verify both goals visible in December
```

---

## Troubleshooting

### Issue: Browser Launch Permission Denied

**Symptom:**
```
Error: Permission denied to launch browser
MCP server requires user approval
```

**Solution:**
1. Grant permission when MCP server prompts
2. Re-run test scenario after permission granted
3. For future tests, permission persists in MCP session

**Agent Action (playwright-testing-agent):**
```markdown
**Test Status**: ⏸️ PAUSED - Permission Required

**User Action Needed:**
Please grant permission for MCP server to launch browser.

**After Permission Granted:**
I will re-execute the test scenario.
```

---

### Issue: Servers Not Running

**Symptom:**
```
Error: Failed to navigate to http://localhost:3000
Connection refused
```

**Solution:**
```bash
# Kill zombie processes and restart servers
pkill -f "server/server.js"; pkill -f "react-scripts"; npm run start

# Verify servers running
lsof -i :3000  # React dev server
lsof -i :8989  # Koa backend server
```

**Agent Action (playwright-testing-agent):**
```markdown
**Test Status**: ❌ FAIL - Servers Not Running

**Root Cause:**
Development servers not accessible on ports 3000 and 8989.

**Recommendation:**
Please run the following command to start development servers:

```bash
pkill -f "server/server.js"; pkill -f "react-scripts"; npm run start
```

After servers start, I will re-execute the test scenario.
```

---

### Issue: Element Not Found

**Symptom:**
```
Error: Element not found: button:has-text("New Contact")
```

**Debugging Steps:**

1. **Take screenshot:**
   ```
   mcp__playwright__browser_take_screenshot("debug-element-not-found.png")
   ```

2. **Capture page snapshot:**
   ```
   mcp__playwright__browser_snapshot()
   ```

3. **Check console errors:**
   ```
   mcp__playwright__browser_console_messages({ onlyErrors: true })
   ```

4. **Try alternative selectors:**
   ```
   button >> text="New Contact"
   [data-testid="new-contact-btn"]
   .new-contact-button
   ```

**Agent Action (playwright-testing-agent):**
```markdown
**Step 2 Result**: ❌ FAIL - Element Not Found

**Attempted Selector:** `button:has-text("New Contact")`

**Evidence:**
- Screenshot: debug-element-not-found.png (attached)
- Page snapshot shows contact list, but no "New Contact" button visible

**Possible Causes:**
1. Button conditionally rendered based on user role (admin check)
2. Button has different text or selector
3. Button not loaded yet (timing issue)
4. Feature flag or product access check blocking button

**Recommendation:**
Please verify:
1. OrganizationContext provides correct isAdmin flag
2. Component rendering logic in ContactListView
3. Consider adding data-testid attribute for stable selector
4. Check if wait condition needed before clicking
```

---

### Issue: API Request Failed

**Symptom:**
```
Network request failed: POST /api/contacts (500 Internal Server Error)
```

**Debugging Steps:**

1. **Capture network trace:**
   ```
   mcp__playwright__browser_network_requests()
   ```

2. **Test API directly:**
   ```bash
   curl -X POST http://localhost:8989/api/contacts \
     -H "Content-Type: application/json" \
     -d '{"first_name":"John","last_name":"Doe"}'
   ```

3. **Check Koa server logs:**
   Look for error messages in terminal where `npm run start:server` is running.

**Agent Action (playwright-testing-agent):**
```markdown
**Step 4 Result**: ❌ FAIL - API Request Failed

**Request:** POST /api/contacts
**Status:** 500 Internal Server Error

**Request Payload:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "contact_type": "customer"
}
```

**Response:**
```json
{
  "error": "Column 'organization_id' is required"
}
```

**Root Cause:**
Backend validation failed - missing organization_id in request.

**Recommendation:**
1. Check if OrganizationContext provides organization_id to API client
2. Verify frontend includes organization_slug in query params
3. Review backend controller for proper organization_id extraction
```

---

## Document History

| Version | Date       | Changes                                    | Author               |
|---------|------------|--------------------------------------------|----------------------|
| 1.0.0   | 2025-11-25 | Initial testing workflow guide             | Architecture Overseer|

**Next Review**: 2025-12-25

**Related Documentation:**
- [DEVELOPMENT_SERVER_PRACTICES.md](DEVELOPMENT_SERVER_PRACTICES.md) - Server management guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture decisions and ADRs
- [.claude/agents/test-driven-developer.md](.claude/agents/test-driven-developer.md) - TDD agent details
- [.claude/agents/playwright-testing-agent.md](.claude/agents/playwright-testing-agent.md) - Testing agent details
