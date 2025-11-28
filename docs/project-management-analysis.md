# Project Management Module Analysis

> **Document Purpose**: Comprehensive analysis of the current Project Management module to inform future development
> **Date**: 2025-11-28
> **Status**: Analysis Only - No Code Changes

---

## Executive Summary

The Project Management module is currently a **frontend prototype** with **no database schema**. It uses mock data and mock API calls with simulated delays. This is in stark contrast to Contact Management, Inventory, and Sales Management modules which are production-ready with full database integration.

### Key Finding: NO DATABASE TABLES EXIST

```sql
-- Query result: Empty array
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE '%project%';
-- Result: []
```

**This means all current functionality is ephemeral and will be lost on page refresh.**

---

## Part 1: Database Schema Analysis

### 1.1 Current State: No Tables

| Expected Table | Status | Notes |
|----------------|--------|-------|
| `projects` | **NOT FOUND** | Core project entity |
| `project_templates` | **NOT FOUND** | Template definitions |
| `project_custom_fields` | **NOT FOUND** | Dynamic field definitions |
| `project_members` | **NOT FOUND** | Staff assignments |
| `project_stages` | **NOT FOUND** | Status workflow |
| `project_activities` | **NOT FOUND** | Activity/audit log |

### 1.2 Current Mock Data Structure

From [api/project-management.js](../src/tools/project-management/api/project-management.js):

```javascript
// Mock Projects (not persisted)
{
  id: "proj_101",
  name: "Tech Corp HQ Solar",
  client: "Tech Corp",              // Plain text, NOT FK to contacts
  status: "active",                 // Hardcoded enum
  budget: 15000,
  template_id: "template_01",
  assigned_staff: [1, 5],           // Integer IDs, NOT UUIDs
  start_date: "2023-11-01",
  due_date: "2023-12-15",
  custom_data: {                    // JSONB-style dynamic fields
    panel_count: 50,
    roof_type: "Flat Concrete",
    inspection_passed: true,
    installation_progress: 75
  }
}

// Mock Templates (not persisted)
{
  id: "template_01",
  name: "Solar Installation",
  fields: [
    { key: "panel_count", label: "Number of Panels", type: "number" },
    { key: "roof_type", label: "Roof Type", type: "text" },
    { key: "inspection_passed", label: "Inspection Passed", type: "checkbox" },
    { key: "installation_progress", label: "Installation Progress", type: "progress" }
  ]
}
```

### 1.3 Required Database Schema (Recommendation)

Based on existing patterns from contacts, inventory, and sales modules:

```sql
-- Projects table (core entity)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  template_id UUID REFERENCES project_templates(id),

  -- Core fields
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- or FK to project_statuses

  -- Customer linking (KEY REQUIREMENT)
  customer_contact_id UUID REFERENCES contacts(id),

  -- Financial
  budget NUMERIC(12,2),
  actual_cost NUMERIC(12,2),

  -- Timeline
  start_date DATE,
  due_date DATE,
  completed_date DATE,

  -- Dynamic fields (per template)
  custom_data JSONB DEFAULT '{}',

  -- Progress tracking (KEY REQUIREMENT)
  progress_current INTEGER DEFAULT 0,
  progress_total INTEGER DEFAULT 0,
  progress_unit TEXT, -- e.g., "panels", "meters", "units"

  -- Visibility (KEY REQUIREMENT)
  visibility TEXT NOT NULL DEFAULT 'organization', -- 'organization', 'team', 'personal'
  owner_individual_id UUID REFERENCES individuals(id),

  -- Audit fields (standard pattern)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_individual_id UUID REFERENCES individuals(id),
  updated_by_individual_id UUID REFERENCES individuals(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by_individual_id UUID REFERENCES individuals(id)
);

-- Project templates
CREATE TABLE project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]', -- Array of field definitions
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project members (staff assignments)
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  individual_id UUID NOT NULL REFERENCES individuals(id),
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'manager', 'member'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, individual_id)
);

-- Project statuses (dynamic, like contact_stages)
CREATE TABLE project_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Part 2: Current File Structure

```
src/tools/project-management/
├── index.jsx                           # Main component (152 lines)
├── index.css                           # Styles
├── PROJECT_SETUP.md                    # Setup documentation
├── api/
│   └── project-management.js           # Mock API with MOCK_TEMPLATES, MOCK_PROJECTS (143 lines)
└── components/
    ├── DynamicFieldRenderer.jsx        # Renders dynamic fields (137 lines)
    ├── FilterPanel.jsx                 # Uses shared FilterPanel (97 lines) ✅
    ├── modals/
    │   ├── AddProjectModal.jsx         # 2-step wizard (252 lines)
    │   ├── ProjectDetailModal.jsx      # View/edit modal (219 lines)
    │   └── TemplateBuilderModal.jsx    # Template CRUD (200 lines)
    └── tabs/
        ├── DashboardTab.jsx            # Stats & activity feed (137 lines)
        ├── ProjectsTab.jsx             # Main list with 3 views (454 lines)
        ├── ScheduleTab.jsx             # Staff calendar (83 lines)
        └── TemplatesTab.jsx            # Template management (105 lines)
```

**Total Lines**: ~1,979 lines of frontend code

---

## Part 3: Current Features Inventory

| Feature | Status | Implementation | Notes |
|---------|--------|----------------|-------|
| **Views** | | | |
| Table View | Present | ProjectsTab.jsx:131-238 | Pagination, sorting working |
| Grid/Card View | Present | ProjectsTab.jsx:241-283 | Responsive grid |
| Kanban View | Present | ProjectsTab.jsx:285-343 | Hardcoded 3 columns (pending, active, completed) |
| Dashboard | Present | DashboardTab.jsx | Stats cards + mock activity feed |
| Schedule | Present | ScheduleTab.jsx | Staff calendar (mock data) |
| **CRUD** | | | |
| Create Project | Present | AddProjectModal.jsx | 2-step wizard: select template → fill form |
| View Project | Present | ProjectDetailModal.jsx | Full detail view |
| Edit Project | Present | ProjectDetailModal.jsx | Inline editing mode |
| Delete Project | **MISSING** | - | No delete functionality |
| **Templates** | | | |
| Create Template | Present | TemplateBuilderModal.jsx | Field builder with 4 types |
| Edit Template | Present | TemplateBuilderModal.jsx | Full edit support |
| Delete Template | **MISSING** | - | No delete functionality |
| **Filtering** | | | |
| Text Search | Present | ProjectsTab.jsx:48-56 | Name + client |
| Status Filter | Present | FilterPanel.jsx | Checkbox filter |
| Template Filter | Present | FilterPanel.jsx | Checkbox filter |
| Date Range Filter | Placeholder | FilterPanel.jsx:83-94 | Non-functional |
| **Sorting** | | | |
| Column Sorting | Present | ProjectsTab.jsx:93-99 | Ascending/descending |
| **Pagination** | | | |
| Page Controls | Present | ProjectsTab.jsx:195-236 | 10 items/page |
| **Dynamic Fields** | | | |
| Text Input | Present | DynamicFieldRenderer.jsx:45-53 | |
| Number Input | Present | DynamicFieldRenderer.jsx:55-66 | |
| Checkbox | Present | DynamicFieldRenderer.jsx:68-80 | |
| Progress Bar | Present | DynamicFieldRenderer.jsx:82-96 | Slider with % display |
| Read-Only View | Present | DynamicFieldRenderer.jsx:17-28 | |

### 3.1 Features That Do NOT Persist

Since there's no database, the following are ephemeral:
- All created projects (lost on refresh)
- All created templates (lost on refresh)
- All edits (lost on refresh)
- All filter/sort settings (lost on refresh)

---

## Part 4: Design Analysis (vs Contact Management)

### 4.1 Architecture Comparison

| Aspect | Contact Management | Project Management | Gap |
|--------|-------------------|-------------------|-----|
| **Database** | Full schema with FKs | None (mock only) | CRITICAL |
| **API Layer** | Real HTTP endpoints | Mock functions | CRITICAL |
| **Hooks** | 8 custom hooks | None | Need useProjects, useTemplates, etc. |
| **Real-time** | useRealtimeSync.js | None | Missing |
| **Audit Trail** | created_by, updated_by | None | Missing |
| **Multi-tenancy** | organization_id enforced | organizationSlug param only | Needs enforcement |

### 4.2 UI Component Comparison

| Component Type | Contact Management | Project Management | Shared Components Used |
|----------------|-------------------|-------------------|----------------------|
| Main Container | Tailwind + tabs | Tailwind + tabs | Similar pattern |
| List View | ContactListView.jsx | ProjectsTab.jsx | ❌ Should use shared patterns |
| Filter Panel | Uses shared FilterPanel | Uses shared FilterPanel | ✅ Already integrated |
| Form Dialog | ContactFormDialog.jsx | AddProjectModal.jsx | ❌ Different patterns |
| Detail View | ContactDetailSidebar | ProjectDetailModal | ❌ Sidebar vs Modal |
| Kanban | KanbanView.jsx | Inline in ProjectsTab | ❌ Should extract |
| Search | SearchBar.jsx | Inline input | ❌ Should use shared |
| Member Select | Uses MemberSelect | Hardcoded staff IDs | ❌ Need integration |

### 4.3 Design Token Usage

| Token | Contact Management | Project Management |
|-------|-------------------|-------------------|
| Primary Blue (blue-600) | ✅ Consistent | ✅ Consistent |
| Purple Accent | ❌ Not used | Used for templates (purple-600) |
| Border Radius | rounded-xl, rounded-lg | rounded-xl, rounded-lg ✅ |
| Shadow | shadow-sm | shadow-sm ✅ |
| Focus States | focus:ring-2 focus:ring-blue-500 | focus:ring-2 focus:ring-blue-500 ✅ |

### 4.4 Shared UI Components Analysis

| Shared Component | Location | Used in PM? | Should Use? |
|-----------------|----------|-------------|-------------|
| FilterPanel | components/ui/filter-panel/ | ✅ Yes | Already integrated |
| CheckboxFilter | components/ui/filters/ | ✅ Yes | Already integrated |
| DateRangeFilter | components/ui/filters/ | ✅ Yes | Already integrated |
| SearchableSelect | components/ui/searchable-select.jsx | ❌ No | Should use for customer/staff select |
| MemberSelect | components/ui/member-select.jsx | ❌ No | Should use for staff assignment |
| Pagination | components/ui/pagination.jsx | ❌ No | Should use instead of custom |
| ConfirmDialog | components/ui/confirm-dialog.jsx | ❌ No | Should use for delete confirmations |

---

## Part 5: Data Flow Analysis

### 5.1 Current Data Flow (Mock)

```
User Action
    ↓
Component State (useState)
    ↓
Mock API Function (500-800ms delay)
    ↓
Mutate MOCK_PROJECTS/MOCK_TEMPLATES arrays
    ↓
Return to Component
    ↓
Update Local State
```

### 5.2 Required Data Flow (Production)

```
User Action
    ↓
Component calls API hook
    ↓
Hook calls API endpoint (/api/projects)
    ↓
Backend validates organization_id
    ↓
Supabase query with RLS
    ↓
Response to frontend
    ↓
Update React state
    ↓
(Optional) Real-time sync via Supabase
```

---

## Part 6: Gaps Analysis for New Features

### 6.1 Kanban View / Table View

| Requirement | Current State | Gap | Priority |
|-------------|---------------|-----|----------|
| Toggle views | ✅ Present | None | - |
| Drag-and-drop Kanban | ❌ Missing | Need DnD library | HIGH |
| Dynamic columns | ❌ Hardcoded 3 statuses | Need project_statuses table | HIGH |
| Column customization | ❌ Missing | Need settings | MEDIUM |

### 6.2 Custom Fields for Different Industries

| Requirement | Current State | Gap | Priority |
|-------------|---------------|-----|----------|
| Template system | ✅ Present (mock) | Need database persistence | CRITICAL |
| 4 field types | ✅ text, number, checkbox, progress | May need more (date, select, etc.) | MEDIUM |
| Industry presets | ❌ Missing | Need seed templates | LOW |

### 6.3 Customer Linking

| Requirement | Current State | Gap | Priority |
|-------------|---------------|-----|----------|
| Customer field | ❌ Plain text "client" | Need FK to contacts | HIGH |
| Customer dropdown | ❌ Text input | Need CustomerSelect component | HIGH |
| Customer details view | ❌ Missing | Link to contact detail | MEDIUM |
| Filter by customer | ❌ Missing | Add to FilterPanel | MEDIUM |

**Contacts Table Structure (for reference)**:
```
contacts.id (UUID)
contacts.organization_id (UUID)
contacts.contact_type (customer, supplier, coi, internal)
contacts.first_name, last_name
contacts.company_name
contacts.phone_1, email
... (55+ columns)
```

### 6.4 Progress Tracking (e.g., 5/10 installed)

| Requirement | Current State | Gap | Priority |
|-------------|---------------|-----|----------|
| Progress field | ✅ custom_data.progress (%) | Need current/total integers | HIGH |
| Progress unit | ❌ Missing | Need "panels", "meters", etc. | HIGH |
| Progress display | ✅ Progress bar exists | Update to show "5/10 panels" | MEDIUM |
| Progress history | ❌ Missing | Need activity log table | LOW |

### 6.5 Company-wide vs Personal View

| Requirement | Current State | Gap | Priority |
|-------------|---------------|-----|----------|
| Visibility field | ❌ Missing | Need visibility column | HIGH |
| My Projects filter | ❌ Missing | Filter by assigned_to | HIGH |
| Team Projects filter | ❌ Missing | Filter by team membership | MEDIUM |
| All Projects (admin) | ✅ Current default | Need role check | HIGH |

### 6.6 Filtering Capabilities

| Requirement | Current State | Gap | Priority |
|-------------|---------------|-----|----------|
| Status filter | ✅ Present | Works | - |
| Template filter | ✅ Present | Works | - |
| Date range filter | ⚠️ Placeholder only | Not connected to data | MEDIUM |
| Customer filter | ❌ Missing | Need after customer linking | HIGH |
| Assigned staff filter | ❌ Missing | Need staff selection | HIGH |
| Progress range filter | ❌ Missing | Need NumberRangeFilter | LOW |

---

## Part 7: Critical Questions Answered

### Q1: Is organization_id properly enforced (multi-tenancy)?

**Answer**: **NO**

The mock API accepts `organizationSlug` as a parameter but doesn't use it:

```javascript
// api/project-management.js
async getProjects(organizationSlug, filters = {}) {
  await delay(600);
  console.log(`[API] Fetching projects for org: ${organizationSlug}`);
  let filtered = [...MOCK_PROJECTS]; // Returns ALL mock data
  // organizationSlug is NOT used for filtering
}
```

**Requirement**: Backend must enforce `organization_id` on all queries via RLS.

### Q2: Does projects table have customer_id FK to contacts?

**Answer**: **NO** - No table exists. Mock uses plain text `client` field.

### Q3: Are stages hardcoded or dynamic?

**Answer**: **Hardcoded** in frontend:

```javascript
// ProjectsTab.jsx:286-290
const columns = [
  { id: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { id: 'active', label: 'In Progress', color: 'bg-blue-500' },
  { id: 'completed', label: 'Completed', color: 'bg-green-500' },
];
```

### Q4: Any existing custom fields support?

**Answer**: **YES** (frontend only)

The template system and DynamicFieldRenderer support 4 field types:
- `text` - Text input
- `number` - Number input
- `checkbox` - Boolean toggle
- `progress` - Slider 0-100%

### Q5: Which shared components are NOT yet used but should be?

| Component | Should Use For |
|-----------|---------------|
| SearchableSelect | Customer dropdown, staff assignment |
| MemberSelect | Staff assignment in forms |
| Pagination | Replace custom pagination |
| ConfirmDialog | Delete confirmations |
| CustomerSelect (from sales) | Link to contacts |

---

## Part 8: Recommendations

### 8.1 Immediate Priorities (Database First)

1. **Create database schema** - No features can persist without this
2. **Implement API endpoints** - Both Koa and Vercel handlers
3. **Create React hooks** - useProjects, useTemplates, useProjectStatuses

### 8.2 Feature Roadmap

| Phase | Features | Effort |
|-------|----------|--------|
| Phase 1 | Database + API + Basic CRUD | 3-5 days |
| Phase 2 | Customer linking + MemberSelect | 2-3 days |
| Phase 3 | Dynamic statuses (like contact_stages) | 2-3 days |
| Phase 4 | Progress tracking UI | 1-2 days |
| Phase 5 | Visibility/permissions | 2-3 days |
| Phase 6 | Drag-and-drop Kanban | 2-3 days |

### 8.3 Design Standardization Needed

1. Replace purple accent with blue-600 for consistency
2. Use shared SearchableSelect for all dropdowns
3. Use shared Pagination component
4. Extract Kanban into reusable component
5. Use ConfirmDialog for delete operations

---

## Appendix A: File Line Counts

| File | Lines |
|------|-------|
| index.jsx | 152 |
| api/project-management.js | 143 |
| components/DynamicFieldRenderer.jsx | 137 |
| components/FilterPanel.jsx | 97 |
| components/modals/AddProjectModal.jsx | 252 |
| components/modals/ProjectDetailModal.jsx | 219 |
| components/modals/TemplateBuilderModal.jsx | 200 |
| components/tabs/DashboardTab.jsx | 137 |
| components/tabs/ProjectsTab.jsx | 454 |
| components/tabs/ScheduleTab.jsx | 83 |
| components/tabs/TemplatesTab.jsx | 105 |
| **Total** | **~1,979** |

## Appendix B: Contact Management Comparison Stats

| Metric | Contact Management | Project Management |
|--------|-------------------|-------------------|
| Total Files | 40 | 13 |
| Hooks | 8 | 0 |
| Database Tables | 5+ | 0 |
| API Endpoints | 15+ | 0 (mock only) |
| Production Ready | YES | NO |

---

*Document generated by Architecture Overseer analysis*
