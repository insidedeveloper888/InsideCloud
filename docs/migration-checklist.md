# Migration Checklist - Moving to Paid Claude Code

This checklist guides you through setting up your project in the paid Claude Code environment with proper context management.

## Phase 1: File Setup (15 minutes)

### ☐ Task 1.1: Create `.clinerules` File
1. In your project root directory, create a new file named `.clinerules`
2. Copy the content from the artifact "`.clinerules - Project Context`"
3. Save the file
4. Verify it's in the root (same level as `package.json`, `CLAUDE.md`)

### ☐ Task 1.2: Create Agent Directory
1. In `/docs`, create a new folder: `mkdir docs/agents`
2. Navigate to the folder: `cd docs/agents`

### ☐ Task 1.3: Create 6 Agent Files
Copy the content from each artifact and save as:
- `strategic-map-agent.md`
- `contact-agent.md`
- `sales-agent.md`
- `inventory-agent.md`
- `integrations-agent.md`
- `document-parser-agent.md`

### ☐ Task 1.4: Verify File Structure
Run this command in your project root:
```bash
tree -L 2 docs/
```

Expected output:
```
docs/
├── agents/
│   ├── strategic-map-agent.md
│   ├── contact-agent.md
│   ├── sales-agent.md
│   ├── inventory-agent.md
│   ├── integrations-agent.md
│   └── document-parser-agent.md
├── ARCHITECTURE.md
├── (other existing files...)
```

---

## Phase 2: MCP Configuration (10 minutes)

### ☐ Task 2.1: Verify Filesystem MCP
You mentioned it's already installed. Verify by checking:
```bash
cat ~/.config/claude/claude_desktop_config.json
# or on Windows:
type %APPDATA%\Claude\claude_desktop_config.json
```

Should contain:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/your/project"]
    }
  }
}
```

### ☐ Task 2.2: Install Supabase MCP
1. Get your Supabase credentials:
   - URL: From `.env` file (`SUPABASE_URL`)
   - Service Role Key: From `.env` file (`SUPABASE_SERVICE_ROLE_KEY`)

2. Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "filesystem": { ... },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_KEY": "eyJ..."
      }
    }
  }
}
```

3. Restart Claude Desktop

---

## Phase 3: Test in Paid Claude Code (5 minutes)

### ☐ Task 3.1: Open Project
1. Open Claude Code (paid account)
2. Open your project folder

### ☐ Task 3.2: Verify Context Loading
**First prompt (copy exactly):**
```
Read .clinerules first, then read all files in /docs/agents/, then summarize this project's architecture.
```

**Expected response:**
Claude Code should correctly describe:
- 6 core modules (Strategic Map, Contact, Sales, Inventory, Integrations, Document Parser)
- Multi-tenant architecture with organization_id filtering
- Dual deployment (Koa dev + Vercel prod)
- Tech stack (React + Tailwind + Supabase + Lark)

**If response is incorrect:**
- Check `.clinerules` is in root directory
- Check `/docs/agents/` files exist
- Try closing and reopening the project

### ☐ Task 3.3: Test Agent Activation
**Second prompt (choose one module to test):**
```
Act as the Sales Management Agent (see /docs/agents/sales-agent.md). Explain the document conversion workflow from Quotation to Invoice.
```

**Expected response:**
Claude Code should explain:
- Quotation → Sales Order (auto-fill customer, items)
- Sales Order → Delivery Order (select items, assign technician)
- Delivery Order → Invoice (track payments)

**If response is vague or incorrect:**
- Claude Code is not reading the agent file
- Check file path: `/docs/agents/sales-agent.md`
- Ensure filename matches exactly (case-sensitive)

---

## Phase 4: Test Real Development Task (10 minutes)

Now test with a real bug fix or feature to see if Claude Code "remembers" the framework.

### ☐ Task 4.1: Simulate Bug Fix Scenario
**Prompt:**
```
Act as the Sales Management Agent. I found a bug: when I create a Sales Order from a Quotation, the customer name is not being auto-filled. Check the conversion logic in SalesOrderFormDialog.jsx and fix it.
```

**What to observe:**
- Does Claude Code reference the correct file path? (`src/tools/sales-management/components/SalesOrderFormDialog.jsx`)
- Does it understand the auto-fill logic without you explaining?
- Does it suggest the correct fix? (Check `quotation.customer_id` is being copied to `salesOrder.customer_id`)

### ☐ Task 4.2: Simulate New Feature Request
**Prompt:**
```
Act as the Inventory Management Agent. I want to add a "Quick Stock Adjustment" button in the product list that allows users to adjust stock levels without creating a full transaction. Implement this feature.
```

**What to observe:**
- Does Claude Code know to modify `src/tools/inventory/` files?
- Does it create the button in the correct component? (`ProductListView.jsx` or similar)
- Does it call the correct API? (`POST /api/inventory_transactions` with transaction_type='adjustment')
- Does it handle organization_id filtering?

---

## Phase 5: Address Common Issues

### Issue 1: Claude Code Still "Forgets" Framework
**Symptom:** After 30+ messages, Claude Code starts making mistakes again.

**Solution:**
- Start a new session
- First message: "Read .clinerules and /docs/agents/[module]-agent.md, then continue working on [task]"
- This reloads context without losing your place

### Issue 2: Claude Code Suggests Wrong File Paths
**Symptom:** Claude Code says to modify files that don't exist or are in wrong locations.

**Solution:**
- Update `.clinerules` with more specific file paths
- Use Filesystem MCP to let Claude Code explore the directory structure
- Explicitly correct it: "That file doesn't exist. The correct path is ..."

### Issue 3: Claude Code Doesn't Use MCP Tools
**Symptom:** Claude Code doesn't query Supabase schema even though MCP is installed.

**Solution:**
- Explicitly ask: "Use the Supabase MCP to check the schema for the `sales_orders` table"
- If still doesn't work, check MCP configuration in claude_desktop_config.json
- Restart Claude Desktop

### Issue 4: Agent Files Too Long (Context Window Overflow)
**Symptom:** Claude Code gets confused when reading all 6 agents at once.

**Solution:**
- Don't load all agents upfront
- Only load the relevant agent for current task
- Example: "Act as Sales Management Agent (read /docs/agents/sales-agent.md only), then ..."

---

## Phase 6: Optimize Workflow (Ongoing)

### Best Practices for Using Agents

#### ✅ DO:
- Start each new session with: "Read .clinerules first"
- Activate specific agent: "Act as [Module] Agent"
- Reference agent file explicitly: "(see /docs/agents/[module]-agent.md)"
- Give concrete examples: "Like in SalesOrderFormDialog.jsx, line 123"
- Correct mistakes immediately: "No, the table name is `sales_orders`, not `salesOrders`"

#### ❌ DON'T:
- Assume Claude Code "remembers" from previous sessions
- Load all 6 agents at once (context overflow)
- Give vague instructions: "Fix the sales module" → Be specific: "Fix the customer auto-fill bug in SalesOrderFormDialog.jsx"
- Continue long conversations without reloading context (>50 messages = start new session)

### When to Update Agent Files

Update agent files when:
- [ ] You add a new API endpoint (update relevant agent's API Endpoints section)
- [ ] You fix a recurring bug (add to Common Bugs and Solutions)
- [ ] You change database schema (update Database Schema section)
- [ ] You implement a new integration pattern (add to Key Implementation Patterns)

### When to Update `.clinerules`

Update `.clinerules` when:
- [ ] You add a new module (add to 6 Core Modules section)
- [ ] You change architecture principles (update Architecture Principles section)
- [ ] You discover a new common mistake (add to Common Mistakes to Avoid)
- [ ] You change deployment process (update Development Workflow section)

---

## Phase 7: Long-Term Maintenance

### Weekly Tasks
- [ ] Review agent files for outdated information
- [ ] Check if new bugs should be documented in agent files
- [ ] Update `.clinerules` if project structure changed

### Monthly Tasks
- [ ] Review all 6 agent files for consistency
- [ ] Check if new modules need new agent files
- [ ] Update database schemas in agent files after migrations

### When Onboarding New Developers
Give them:
1. `.clinerules` file (read this first)
2. `CLAUDE.md` (operational guide)
3. `ARCHITECTURE.md` (design decisions)
4. Relevant agent file(s) for their module

---

## Success Criteria

You'll know the setup is working when:
- ✅ Claude Code correctly identifies which module a file belongs to
- ✅ Claude Code suggests the right API endpoint without you specifying
- ✅ Claude Code remembers to filter by `organization_id` in queries
- ✅ Claude Code references the correct controller when implementing features
- ✅ Bug fixes don't break other modules (because agents are isolated)
- ✅ You can say "Act as [Module] Agent" and it immediately understands the context

---

## Emergency Rollback

If something goes wrong and Claude Code gets more confused:

### ☐ Rollback Step 1: Verify Files
```bash
# Check .clinerules exists
ls -la .clinerules

# Check agents exist
ls -la docs/agents/
```

### ☐ Rollback Step 2: Simplify Context
Temporarily remove all agent files, keep only `.clinerules`:
```bash
mv docs/agents/ docs/agents_backup/
```

Then test if `.clinerules` alone helps.

### ☐ Rollback Step 3: Start Fresh Session
Close Claude Code, restart it, open project again.

First message:
```
This is a multi-tenant ERP system with 6 modules. Read .clinerules for full context.
```

If this works better than loading agents, then agents might be too detailed. Simplify them.

---

## Next Steps After Successful Setup

Once Claude Code is consistently "remembering" your framework:

1. **Tackle your backlog**: Start with highest-priority bug/feature
2. **Document patterns**: When you solve a tricky problem, add it to the relevant agent file
3. **Refine agents**: If Claude Code still makes mistakes in certain areas, update that agent's Common Bugs section
4. **Train your team**: Share this setup with other developers

---

## Contact for Help

If you get stuck during migration:
1. Check which phase you're in
2. Read the "Common Issues" for that phase
3. Try the suggested solution
4. If still stuck, start a new conversation and share:
   - Which task you're on
   - What error you're seeing
   - What you've tried already

---

**Estimated Total Time: 40-60 minutes**

**Priority Order:**
1. Phase 1 (File Setup) - CRITICAL
2. Phase 2 (MCP Configuration) - CRITICAL
3. Phase 3 (Test) - CRITICAL
4. Phase 4 (Real Task) - RECOMMENDED
5. Phase 5-7 (Optimization) - OPTIONAL (do as needed)

---

Good luck! Remember: The goal is not to make Claude Code "perfect" but to make it **consistent and predictable**. With proper context files, it should make the same types of mistakes every time, which you can then document and prevent.