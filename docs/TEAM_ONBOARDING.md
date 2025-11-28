# Team Onboarding Guide - InsideCloud Project

> **For all developers (Junior & Senior)**: Read this BEFORE starting any coding session

---

## 🚀 Quick Start (5 minutes)

### Step 1: First Prompt Template

**Copy this into EVERY new Claude Code session**:

```markdown
Read .clinerules first. This is a multi-tenant SaaS ERP project with strict architectural rules.

Key context:
- Tech Stack: React 18 + Tailwind + shadcn/ui | Koa (dev) + Vercel (prod) | Supabase
- 6 Core Modules: Strategic Map, Contact, Sales, Inventory, Integrations, Document Parser
- CRITICAL: Multi-tenant isolation (NEVER violate)

Current task: [Describe your task here]

Before proceeding:
1. Which module am I working on? (Check /docs/agents/{module}-agent.md)
2. What pattern do I need? (Check Quick Lookup table in .clinerules)
3. Do I need to reference any pattern file? (Yes, always!)
```

### Step 2: Bookmark These Files

Print this checklist and stick it on your desk:

```
┌─────────────────────────┬──────────────────────────────────────┐
│ 每次写 Prompt 前检查：  │ 文件路径                             │
├─────────────────────────┼──────────────────────────────────────┤
│ ✅ 核心规则              │ .clinerules                          │
│ ✅ Quick Lookup 表       │ .clinerules (第 79-88 行)            │
│ ✅ 模块 Agent            │ /docs/agents/{module}-agent.md       │
│ ✅ Pattern 模板          │ /docs/patterns/                      │
└─────────────────────────┴──────────────────────────────────────┘
```

---

## 📋 Mandatory Reading (by Role)

### For ALL Developers

| Document | Purpose | Time | When to Read |
|----------|---------|------|--------------|
| `.clinerules` | Core architectural rules | 3 min | **Every session start** |
| `CLAUDE.md` | Project overview | 10 min | First day |
| `ARCHITECTURE.md` | Design decisions | 15 min | First week |
| `/docs/patterns/api-design.md` | API implementation | 5 min | Before adding any API |
| `/docs/patterns/multi-tenant-queries.md` | Security patterns | 5 min | Before any database query |

### For Senior Developers (Additional)

| Document | Purpose | When |
|----------|---------|------|
| `docs/PROMPT_REFACTORING_SUMMARY.md` | Why we use layered prompts | Before mentoring juniors |
| `/docs/agents/architecture-overseer.md` | System-wide decisions | Before major refactoring |
| `docs/PROJECT_CLEANUP_GUIDE.md` | Remove outdated files | Monthly cleanup |

---

## 🔒 Enforcement Mechanisms

### 1. Pre-Commit Hooks (Coming Soon)

We're adding Git hooks to **automatically check**:
- [ ] All new tables have `organization_id`
- [ ] All queries include `.eq('organization_id', ...)`
- [ ] New API routes registered in BOTH Koa + Vercel
- [ ] No duplicate components created

### 2. Code Review Checklist

**Before approving ANY PR**, verify:

```markdown
## Multi-Tenant Security ✅
- [ ] All new tables have `organization_id` field
- [ ] All SELECT queries filter by `organization_id`
- [ ] All UPDATE/DELETE queries filter by `organization_id`
- [ ] Tested with 2 different organizations (no data leak)

## Dual Deployment ✅
- [ ] API route added to `server/server.js` (Koa)
- [ ] API handler created in `server/api_handlers/`
- [ ] Route registered in `api/[...path].js` (Vercel)
- [ ] OPTIONS handler exists (CORS)
- [ ] Tested in localhost:8989 AND Vercel deployment

## Component Reuse ✅
- [ ] Checked `src/components/ui/` before creating new component
- [ ] No duplicate Button/Card/Dialog/Select components
- [ ] Used design tokens from `src/lib/design-tokens.js`

## Navigation ✅
- [ ] Route added to `src/App.js`
- [ ] Access control updated in `src/pages/home/index.js`
- [ ] Tested: URL doesn't redirect to dashboard

## Documentation ✅
- [ ] Updated relevant agent file in `/docs/agents/`
- [ ] Added to CLAUDE.md if new module
- [ ] Added migration SQL to `/docs/sql-scripts/`
```

### 3. Automated Tests (Future)

We plan to add:
```javascript
// tests/security/multi-tenant-isolation.test.js
test('Cannot access other organization data', async () => {
  const orgA = await createTestOrg('org-a');
  const orgB = await createTestOrg('org-b');

  const itemA = await createItem({ org_id: orgA.id, name: 'Item A' });

  // Try to fetch with Org B credentials
  const response = await fetch('/api/items?organization_slug=org-b');
  const data = await response.json();

  // MUST NOT include Item A
  expect(data.find(item => item.id === itemA.id)).toBeUndefined();
});
```

---

## 🎯 Common Scenarios for Seniors

### Scenario 1: "I need to add a new feature quickly"

**DON'T**:
```
❌ "Claude Code, add API for products, I'm in a hurry"
```

**DO**:
```
✅ "Read .clinerules, follow /docs/patterns/api-design.md
   Task: Add API for products (table: inventory_products)
   Note: This is URGENT, but DO NOT skip multi-tenant filters or CORS handlers"
```

**Why**: Even urgent tasks must follow security rules. Pattern files have templates that make it FASTER, not slower.

---

### Scenario 2: "Junior created code with issues"

**DON'T**:
```
❌ Fix silently without teaching
```

**DO**:
```
✅ 1. Identify which pattern was violated (check .clinerules)
   2. Show junior the relevant pattern file
   3. Ask junior to fix using the pattern
   4. Review together
```

**Example**:
```
"I see you missed the organization_id filter in this query.
Read /docs/patterns/multi-tenant-queries.md section 'Common Mistakes #1'.
Fix the query following the GOOD example, then I'll review."
```

---

### Scenario 3: "I disagree with a rule in .clinerules"

**Process**:
1. Open an issue: "Discuss: Should we change [rule X]?"
2. Present your reasoning (with code examples)
3. Team discussion
4. If approved: Update `.clinerules` + notify all devs
5. If rejected: Document WHY in `ARCHITECTURE.md` ADR

**DON'T**: Silently ignore the rule or work around it.

---

## 📢 Communication Protocol

### When You Update Project Rules

**Notify team via**:
1. Slack/Email: "Updated .clinerules v2.1 - Added [rule about X]"
2. Team meeting: Quick 5-min overview
3. Update `Last Updated` timestamp in `.clinerules`

**Template Message**:
```
📢 Project Rules Update

File: .clinerules v2.1
Change: Added enforcement for [specific rule]
Why: [Brief explanation]
Action Required:
  - Read updated .clinerules (takes 2 min)
  - Apply to all work starting [date]

Questions? Ping me.
```

---

### When You Find Outdated Documentation

**DON'T**: Ignore or mention verbally

**DO**:
1. Create issue: "Doc outdated: /docs/agents/sales-agent.md mentions old API"
2. OR: Fix immediately and commit with message: "docs: Update sales-agent.md - Fix outdated API reference"

---

## 🧹 File Cleanup Protocol

### What Files Can Be Deleted?

**SAFE to delete**:
- [ ] `archived/` folder contents (already marked as archived)
- [ ] Test files with no tests (e.g., `*.test.js` with `// TODO: Add tests`)
- [ ] `docs/old-*` or `docs/backup-*` files
- [ ] Commented-out components in `src/components/`

**CHECK before deleting**:
- [ ] `docs/` markdown files (might be referenced in prompts)
- [ ] Any controller or API handler (might be used by frontend)

**NEVER delete without asking**:
- [ ] `.clinerules` or any `.md` in root
- [ ] Any file in `src/tools/` (active modules)
- [ ] Any file in `server/` (active backend)

### Cleanup Checklist (Monthly)

Run this command to find candidates:
```bash
# Find files not modified in 90+ days
find . -name "*.js" -o -name "*.jsx" | xargs ls -lt | awk '{print $6, $7, $8, $9}' | grep -E '(Jan|Feb|Mar) (2024|2023)'

# Find TODO files
grep -r "TODO" --include="*.js" --include="*.jsx" docs/ src/ server/

# Find components not imported anywhere
for file in src/components/**/*.jsx; do
  name=$(basename $file .jsx)
  if ! grep -r "from.*$name" src/ > /dev/null; then
    echo "❌ Unused: $file"
  fi
done
```

See `/docs/PROJECT_CLEANUP_GUIDE.md` for detailed instructions.

---

## 🎓 Learning Path

### Week 1: Foundation
- [ ] Read `.clinerules` (3 min)
- [ ] Read `CLAUDE.md` (10 min)
- [ ] Complete one simple task using pattern file
- [ ] Ask senior to review

### Week 2: Patterns
- [ ] Read all files in `/docs/patterns/` (30 min total)
- [ ] Implement one API endpoint following pattern
- [ ] Implement one UI component following design system
- [ ] Ask senior to review

### Week 3: Modules
- [ ] Read agents for modules you'll work on (15 min each)
- [ ] Make one change to each module
- [ ] Understand how modules interact

### Week 4: Independence
- [ ] Lead a feature implementation end-to-end
- [ ] Write a new pattern file for a recurring task
- [ ] Help onboard next new developer

---

## 🚨 Red Flags - Stop and Ask Senior

If you see ANY of these, **STOP and ask senior before proceeding**:

```
🚨 Data from multiple organizations in same query result
🚨 API works in dev but returns 404 in production
🚨 Creating a component that looks similar to existing one
🚨 Hardcoding organization_id instead of getting from request
🚨 Copying code from one module to another (should use shared utility)
🚨 Migration SQL that drops tables or columns
🚨 More than 3 levels of nested ternary operators
🚨 Function longer than 200 lines
```

---

## 📞 Getting Help

### Before Asking Senior

1. **Search existing docs**:
   ```bash
   grep -r "your question keyword" docs/
   ```

2. **Check troubleshooting guide**:
   `/docs/troubleshooting/common-issues.md`

3. **Try the pattern file first**

### When Asking Senior

**BAD Question**:
```
❌ "My API doesn't work, help?"
```

**GOOD Question**:
```
✅ "I followed /docs/patterns/api-design.md to add products API.
   - Created handler in server/api_handlers/products.js ✅
   - Added Koa route in server/server.js ✅
   - Registered in api/[...path].js ✅
   - Added OPTIONS handler ✅

   But getting CORS error in browser:
   [paste exact error message]

   What am I missing?"
```

---

## 🎯 Success Metrics

You're **ready to work independently** when you can:

- [ ] Start any new Claude Code session with proper prompt template
- [ ] Identify which pattern file to reference for a task
- [ ] Add a complete API endpoint (Koa + Vercel) in <30 min
- [ ] Spot multi-tenant isolation violations in code review
- [ ] Explain to junior why we use layered prompt structure
- [ ] Update documentation when you find gaps

---

Last Updated: 2025-11-28
Maintainer: Tech Lead
Next Review: 2025-12-28
