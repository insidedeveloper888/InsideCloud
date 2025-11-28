# Project Cleanup Guide

> **Purpose**: Identify and remove outdated, duplicate, or unnecessary files

**Last Cleanup**: [Never] → **Target**: Monthly
**Next Cleanup**: 2025-12-28

---

## 🎯 Cleanup Goals

1. **Reduce cognitive load** - Less files = easier to navigate
2. **Remove confusion** - No outdated docs misleading developers
3. **Improve performance** - Smaller bundle size, faster builds
4. **Enforce standards** - Remove non-compliant code

---

## 📊 Current State Analysis

Run these commands to assess project health:

```bash
# Total file count
find . -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.md" \) | wc -l

# Files not touched in 6+ months
find . -type f -mtime +180 \( -name "*.js" -o -name "*.jsx" \) -exec ls -lh {} \;

# Large files (>500 lines)
find src server -name "*.js" -o -name "*.jsx" | xargs wc -l | awk '$1 > 500' | sort -rn

# Duplicate component names
find src/components src/tools -name "*.jsx" | sed 's/.*\///' | sort | uniq -d

# Orphaned files (not imported anywhere)
# (Manual check required)
```

---

## 🗂️ File Categories

### Category 1: SAFE to Delete ✅

These can be deleted immediately:

#### 1.1 Archived Components
```bash
# Location: archived/
# Reason: Explicitly marked as archived
# Action: Delete entire folder

rm -rf archived/
```

**Estimated savings**: ~5-10 MB

---

#### 1.2 Backup Files
```bash
# Pattern: *.backup, *.old, *.bak, *_old.*, *-backup.*
find . -name "*.backup" -o -name "*.old" -o -name "*.bak"

# Example findings:
.clinerules.v1.backup  ← Keep (recent reference)
server/server.old.js   ← DELETE (if >3 months old)
```

**Action**:
```bash
# Review each, then delete
find . \( -name "*.backup" -o -name "*.old" -o -name "*.bak" \) -mtime +90 -delete
```

---

#### 1.3 Empty Test Files
```bash
# Find test files with no actual tests
grep -l "TODO.*test" src/**/*.test.js server/**/*.test.js

# Or files with only imports, no test cases
find . -name "*.test.js" -exec sh -c 'grep -L "test\\|it\\|describe" "$1"' _ {} \;
```

**Action**: Delete or write the tests.

---

#### 1.4 Commented-Out Code Files
```bash
# Find files that are mostly comments
find src server -name "*.js" -o -name "*.jsx" | while read file; do
  total=$(wc -l < "$file")
  comments=$(grep -c "^//" "$file" || echo 0)
  if [ $total -gt 0 ] && [ $((comments * 100 / total)) -gt 80 ]; then
    echo "Mostly commented: $file ($comments/$total lines)"
  fi
done
```

**Action**: If file is >80% comments, delete or uncomment.

---

### Category 2: CHECK Before Deleting ⚠️

These need verification:

#### 2.1 Large Components (>1000 lines)
```bash
find src/tools -name "*.jsx" | xargs wc -l | awk '$1 > 1000'
```

**Current findings**:
```
2162 src/tools/inventory/index.jsx      ← Should be split
1665 src/tools/strategic-map/index.jsx  ← Should be split
```

**Action**: Don't delete, but **refactor** into smaller components.

**How to refactor**:
1. Extract list view → `{Module}ListView.jsx`
2. Extract form → `{Module}FormDialog.jsx`
3. Extract filters → `FilterPanel.jsx` (use shared)
4. Main file should be <300 lines (orchestrator only)

---

#### 2.2 Duplicate Components
```bash
# Find components with same name in different folders
find src -name "*.jsx" | sed 's/.*\///' | sort | uniq -d

# Example duplicates:
# Button.jsx (found in 3 places)
# Modal.jsx (found in 2 places)
```

**Decision matrix**:
```
IF component is in src/components/ui/
  AND also in src/tools/{module}/components/
THEN
  DELETE the tool-specific version
  UPDATE imports to use shared version
```

**Action script**:
```bash
# Find all non-ui Button components
find src/tools -name "Button.jsx" -o -name "Modal.jsx" -o -name "Dialog.jsx"

# For each, check if it's truly custom or just a duplicate
# Delete duplicates, keep custom variants (if justified)
```

---

#### 2.3 Unused Hooks
```bash
# Find custom hooks not imported anywhere
for hook in src/tools/*/hooks/*.js; do
  name=$(basename $hook .js)
  count=$(grep -r "from.*$name" src/ | wc -l)
  if [ $count -eq 0 ]; then
    echo "❌ Unused hook: $hook"
  fi
done
```

**Action**: If unused for >3 months AND not part of planned feature, delete.

---

#### 2.4 Outdated Documentation
```bash
# Find docs mentioning old APIs or removed features
grep -r "material-ui" docs/  # We migrated away from Material-UI
grep -r "localStorage.*strategic" docs/  # Strategic Map now uses database
```

**Action**:
```markdown
# Tag outdated sections
❌ OUTDATED (2025-11): This section describes Material-UI components.
We now use shadcn/ui. See /docs/design-system/component-library.md

# Or delete entire file if completely obsolete
```

---

### Category 3: NEVER Delete Without Team Approval 🚫

#### 3.1 Active Backend Files
```
server/
├── server.js             ← NEVER
├── *_controller.js       ← NEVER (unless feature removed)
├── api_handlers/         ← NEVER
└── supabase_client.js    ← NEVER
```

#### 3.2 Active Frontend Tools
```
src/tools/
├── strategic-map/        ← NEVER
├── sales-management/     ← NEVER
├── contact-management/   ← NEVER
├── inventory/            ← NEVER
└── ... (all active modules)
```

#### 3.3 Core Documentation
```
.clinerules              ← NEVER
CLAUDE.md                ← NEVER
ARCHITECTURE.md          ← NEVER
package.json             ← NEVER
docs/patterns/           ← NEVER (update instead)
```

---

## 🔍 Manual Review Checklist

### Before Monthly Cleanup

**Step 1: Inventory**
```bash
# Create snapshot
find . -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.md" \) > /tmp/before_cleanup.txt
wc -l /tmp/before_cleanup.txt
```

**Step 2: Categorize**
```bash
# Archived
find archived/ -type f | wc -l

# Large components
find src/tools -name "*.jsx" -exec wc -l {} \; | awk '$1 > 1000'

# Duplicates
find src -name "*.jsx" | sed 's/.*\///' | sort | uniq -d

# Old files
find . -type f -mtime +180 \( -name "*.js" -o -name "*.jsx" \)
```

**Step 3: Propose Changes**
Create a cleanup PR with:
```markdown
## Cleanup Summary

### Deletions (SAFE)
- `archived/` folder (2.3 MB)
- 5 backup files (*.backup, *.old)
- 3 empty test files

### Refactoring (NEEDED)
- Split `src/tools/inventory/index.jsx` (2162 → 5 files ~400 lines each)
- Split `src/tools/strategic-map/index.jsx` (1665 → 3 files ~500 lines each)

### Duplicates Removed
- Deleted `src/tools/sales-management/components/Button.jsx` (use shared)
- Deleted `src/tools/contact-management/components/Modal.jsx` (use shared)

### Documentation Updates
- Removed Material-UI references (migrated to shadcn/ui)
- Updated localStorage references (now using database)
```

**Step 4: Get Approval**
- Senior developer review
- Run tests
- Deploy to staging
- Merge

**Step 5: After Cleanup**
```bash
# Create snapshot
find . -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.md" \) > /tmp/after_cleanup.txt

# Compare
echo "Before: $(wc -l < /tmp/before_cleanup.txt) files"
echo "After: $(wc -l < /tmp/after_cleanup.txt) files"
echo "Deleted: $(($(wc -l < /tmp/before_cleanup.txt) - $(wc -l < /tmp/after_cleanup.txt))) files"
```

---

## 🎯 Specific Cleanup Tasks

### Task 1: Remove Duplicate Hooks (Sales Management)

**Problem**: You have 13 hooks that are 95% identical.

**Current**:
```
src/tools/sales-management/hooks/
├── useSalesOrders.js (4,614 lines)
├── useQuotations.js (4,686 lines)
├── useDeliveryOrders.js (4,536 lines)
├── useInvoices.js (4,398 lines)
└── ... (9 more similar files)
```

**Goal**: Create generic hook, delete duplicates.

**Action Plan**:
```bash
# 1. Create generic hook
cat > src/hooks/useCRUD.js << 'EOF'
export function useCRUD(resourceName, organizationSlug) {
  // Generic CRUD implementation
  // See previous recommendation
}
EOF

# 2. Replace usage in components
# Example: In SalesOrderListView.jsx
# OLD: import { useSalesOrders } from '../hooks/useSalesOrders';
# NEW: import { useCRUD } from '@/hooks/useCRUD';
#      const { items: salesOrders, ... } = useCRUD('sales_orders', orgSlug);

# 3. Delete old hooks
rm src/tools/sales-management/hooks/useSalesOrders.js
rm src/tools/sales-management/hooks/useQuotations.js
# ... (delete all 13 files)

# 4. Test thoroughly
npm test
npm run build
```

**Estimated savings**: ~40,000 lines of duplicate code → ~500 lines generic code

---

### Task 2: Archive Old Design System

**Problem**: Material-UI files still present but no longer used.

**Action**:
```bash
# 1. Find Material-UI imports
grep -r "@mui/material" src/

# 2. If count = 0, safe to remove
npm uninstall @mui/material @emotion/react @emotion/styled

# 3. Archive old component docs
mkdir -p docs/archived/material-ui/
mv docs/material-ui-components.md docs/archived/material-ui/

# 4. Add note
cat > docs/archived/material-ui/README.md << 'EOF'
# Archived: Material-UI Components

**Deprecated**: 2025-11-14
**Replaced by**: shadcn/ui + Tailwind CSS
**See**: /docs/design-system/component-library.md

These files are kept for historical reference only.
DO NOT use Material-UI in new code.
EOF
```

---

### Task 3: Clean Up Server.js

**Problem**: `server/server.js` is 2,805 lines with duplicated logic.

**Goal**: Reduce to <500 lines by using handlers.

**Action**:
```bash
# Already have api_handlers/, need to use them in server.js

# Current (BAD):
# router.get('/api/products', async (ctx) => {
#   // 50 lines of logic
# });

# Target (GOOD):
# const productsHandler = require('./api_handlers/products');
# router.all('/api/products', async (ctx) => {
#   await productsHandler(convertCtxToReq(ctx), convertCtxToRes(ctx));
# });

# This is a refactoring task, not deletion
# Create new issue: "Refactor server.js to use api_handlers"
```

---

## 📋 Monthly Checklist Template

```markdown
# Cleanup Checklist - [Month Year]

## Pre-Cleanup Inventory
- [ ] Total files: _____
- [ ] Files >1000 lines: _____
- [ ] Files not modified in 6 months: _____
- [ ] Duplicate component names: _____

## Safe Deletions
- [ ] Remove `archived/` folder
- [ ] Remove `*.backup` files older than 3 months
- [ ] Remove empty test files
- [ ] Remove files that are >80% commented

## Refactoring Tasks
- [ ] Split large components (>1000 lines)
- [ ] Extract duplicate hooks to shared utility
- [ ] Consolidate server.js routes to use handlers

## Documentation Updates
- [ ] Archive outdated docs (mark with ❌ OUTDATED)
- [ ] Update references to removed features
- [ ] Add missing pattern files

## Post-Cleanup
- [ ] Run tests: `npm test`
- [ ] Run build: `npm run build`
- [ ] Check bundle size didn't increase
- [ ] Deploy to staging
- [ ] Team review
- [ ] Merge cleanup PR

## Metrics
- Files deleted: _____
- Lines of code reduced: _____
- Bundle size change: _____ KB
- Build time change: _____ seconds
```

---

## 🚨 Emergency Rollback

If cleanup breaks something:

```bash
# 1. Find the cleanup commit
git log --oneline | grep -i cleanup

# 2. Revert it
git revert [commit-hash]

# 3. Or restore specific file
git checkout HEAD~1 -- path/to/deleted/file.js

# 4. Report issue
# "Cleanup broke [feature X]. Reverted [commit]. Need to investigate why."
```

---

## 📊 Success Metrics

Track these monthly:

| Metric | Target | Current | Trend |
|--------|--------|---------|-------|
| Total files | <500 | ??? | ➡️ |
| Files >1000 lines | 0 | 2 | ⬇️ Goal |
| Duplicate components | 0 | ??? | ⬇️ Goal |
| Code duplication % | <15% | 65% | ⬇️ Goal |
| Outdated docs | 0 | ??? | ⬇️ Goal |
| Bundle size | <2MB | ??? | ⬇️ Goal |

---

Last Updated: 2025-11-28
Next Cleanup: 2025-12-28
Owner: Tech Lead
