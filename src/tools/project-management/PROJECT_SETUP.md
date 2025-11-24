# Project Management Module - Development Guide

## 🎯 Overview
This document provides comprehensive instructions for developing the Project Management module for InsideCloud. The frontend will be developed using Gemini Pro AI (Antigravity IDE), while the backend will be completed by Claude.

---

## 📁 Project Structure

The project-management module follows the same architecture as the inventory module:

```
src/tools/project-management/
├── index.jsx                 # Main container component (imports & orchestrates)
├── index.css                 # Module-specific styles
├── api/
│   └── project-management.js # Frontend API client
├── components/
│   ├── tabs/                 # Tab components
│   │   ├── ProjectsTab.jsx
│   │   ├── TasksTab.jsx
│   │   ├── GanttTab.jsx
│   │   └── TeamTab.jsx
│   ├── modals/              # Modal dialogs
│   │   ├── AddProjectModal.jsx
│   │   ├── AddTaskModal.jsx
│   │   └── ProjectDetailModal.jsx
│   ├── FilterPanel.jsx      # Sidebar filter component
│   ├── Pagination.jsx       # Reusable pagination
│   ├── SearchableSelect.jsx # Searchable dropdown
│   └── Modal.jsx            # Base modal wrapper
├── hooks/                   # Custom React hooks (if needed)
│   └── useProjectData.js
└── utils/                   # Utility functions
    ├── filtering.js         # Filter logic
    ├── sorting.js           # Sort logic
    └── helpers.js           # Helper functions

server/
├── api_handlers/
│   └── project_management.js    # Backend API routes handler
└── project_management_controller.js # Business logic controller
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18.2.0
- **Styling**: Tailwind CSS 3.4.18
- **Icons**: Lucide React 0.548.0
- **Charts**: Recharts 3.3.0 (for Gantt charts)
- **Date Handling**: date-fns 4.1.0
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Routing**: React Router DOM 6.6.2

### Backend
- **Server**: Koa 2.14.1
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT (jsonwebtoken 9.0.0)
- **API Pattern**: RESTful with action-based routing

---

## 🎨 Component Architecture

### 1. **index.jsx** (Main Container)
**Purpose**: Orchestrates the entire module
**Responsibilities**:
- Import all child components
- Manage global state (projects, tasks, filters, pagination)
- Handle data fetching
- Pass props to child components
- NO inline UI code - only imports and state management

```jsx
// Example structure
import React, { useState, useEffect } from 'react';
import ProjectsTab from './components/tabs/ProjectsTab';
import FilterPanel from './components/FilterPanel';
import { ProjectManagementAPI } from './api/project-management';

const ProjectManagement = ({ organizationSlug }) => {
  // State management
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({});
  const [activeTab, setActiveTab] = useState('projects');

  // Data fetching
  useEffect(() => {
    // Fetch data logic
  }, []);

  return (
    <div>
      {/* Render child components */}
      <FilterPanel filters={filters} onFiltersChange={setFilters} />
      <ProjectsTab projects={projects} filters={filters} />
    </div>
  );
};
```

### 2. **api/project-management.js** (Frontend API Client)
**Purpose**: All API calls to backend
**Pattern**: Follow inventory module pattern

```js
const API_BASE = process.env.REACT_APP_API_BASE || '';

export const ProjectManagementAPI = {
  async getProjects(organizationSlug, filters = {}) {
    const params = new URLSearchParams({
      organization_slug: organizationSlug,
      type: 'projects',
      ...filters
    });

    const response = await fetch(`${API_BASE}/api/project-management?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    return response.json();
  },

  async createProject(organizationSlug, projectData) {
    const response = await fetch(`${API_BASE}/api/project-management`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_slug: organizationSlug,
        action: 'create-project',
        data: projectData
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create project: ${response.statusText}`);
    }

    return response.json();
  },

  // Add more methods: updateProject, deleteProject, getTasks, etc.
};
```

### 3. **components/tabs/** (Tab Components)
**Purpose**: Separate UI for each tab (Projects, Tasks, Gantt, Team)
**Pattern**: Each tab is a separate component file

```jsx
// Example: ProjectsTab.jsx
import React from 'react';

const ProjectsTab = ({ projects, filters, onProjectSelect }) => {
  return (
    <div className="p-6">
      {/* Table or card view of projects */}
      <table className="w-full">
        <thead>
          <tr>
            <th>Project Name</th>
            <th>Status</th>
            <th>Progress</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map(project => (
            <tr key={project.id}>
              <td>{project.name}</td>
              <td>{project.status}</td>
              <td>{project.progress}%</td>
              <td>
                <button onClick={() => onProjectSelect(project)}>
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectsTab;
```

### 4. **components/modals/** (Modal Dialogs)
**Purpose**: Forms for creating/editing entities
**Pattern**: Reusable modal components

```jsx
// Example: AddProjectModal.jsx
import React, { useState } from 'react';
import Modal from '../Modal';

const AddProjectModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'planning'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Project">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Project Name"
        />
        {/* More form fields */}
        <button type="submit">Save</button>
      </form>
    </Modal>
  );
};

export default AddProjectModal;
```

### 5. **components/FilterPanel.jsx** (Sidebar Filters)
**Purpose**: Collapsible filter sidebar
**Pattern**: Same as inventory FilterPanel

```jsx
const FilterPanel = ({ filters, onFiltersChange, currentTab }) => {
  return (
    <div className="w-64 bg-white border-r">
      {/* Filter sections based on currentTab */}
      {currentTab === 'projects' && (
        <>
          {/* Project Status Filter */}
          <div className="border-b">
            <h3>Project Status</h3>
            <label>
              <input
                type="checkbox"
                checked={filters.statuses?.includes('active')}
                onChange={() => {/* toggle logic */}}
              />
              Active
            </label>
          </div>
        </>
      )}
    </div>
  );
};
```

### 6. **utils/** (Utility Functions)
**Purpose**: Reusable logic separated from components

```js
// utils/filtering.js
export const filterProjects = (projects, filters) => {
  return projects.filter(project => {
    if (filters.statuses?.length > 0 && !filters.statuses.includes(project.status)) {
      return false;
    }
    if (filters.search && !project.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });
};

// utils/sorting.js
export const sortProjects = (projects, sortBy, direction) => {
  return [...projects].sort((a, b) => {
    const aVal = a[sortBy] || '';
    const bVal = b[sortBy] || '';
    const cmp = String(aVal).localeCompare(String(bVal));
    return direction === 'asc' ? cmp : -cmp;
  });
};

// utils/helpers.js
export const formatDate = (dateString) => {
  // Use date-fns
  return format(new Date(dateString), 'MMM dd, yyyy');
};

export const calculateProgress = (tasks) => {
  const completed = tasks.filter(t => t.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
};
```

---

## 🔌 Backend API Structure

### 1. **server/api_handlers/project_management.js**
**Purpose**: Handle HTTP requests and route to controller

```js
const ProjectManagementController = require('../project_management_controller');
const { okResponse, errorResponse } = require('../server_util');

async function handleProjectManagement(ctx) {
  const controller = new ProjectManagementController();
  const { action, organization_slug } = ctx.request.body;

  try {
    switch (action) {
      case 'create-project':
        const result = await controller.createProject(
          organization_slug,
          ctx.request.body.data
        );
        ctx.body = okResponse(result);
        break;

      case 'get-projects':
        const projects = await controller.getProjects(
          organization_slug,
          ctx.query
        );
        ctx.body = okResponse(projects);
        break;

      // More actions...
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = errorResponse(error.message);
  }
}

module.exports = { handleProjectManagement };
```

### 2. **server/project_management_controller.js**
**Purpose**: Business logic and database operations

```js
const { createClient } = require('@supabase/supabase-js');
const { getOrganizationInfo } = require('./organization_helper');

class ProjectManagementController {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  async getProjects(organizationSlug, filters = {}) {
    const org = await getOrganizationInfo(organizationSlug);
    if (!org) throw new Error('Organization not found');

    let query = this.supabase
      .from('project_management_projects')
      .select('*')
      .eq('organization_id', org.id);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data };
  }

  async createProject(organizationSlug, projectData) {
    const org = await getOrganizationInfo(organizationSlug);
    if (!org) throw new Error('Organization not found');

    const { data, error } = await this.supabase
      .from('project_management_projects')
      .insert({
        ...projectData,
        organization_id: org.id
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  }

  // More methods: updateProject, deleteProject, getTasks, etc.
}

module.exports = ProjectManagementController;
```

---

## 🗄️ Database Schema

### Expected Supabase Tables:

#### `project_management_projects`
```sql
CREATE TABLE project_management_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning',
    -- 'planning', 'active', 'on_hold', 'completed', 'cancelled'
  start_date DATE,
  end_date DATE,
  progress INTEGER DEFAULT 0,
  budget DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  project_manager_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `project_management_tasks`
```sql
CREATE TABLE project_management_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES project_management_projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'to_do',
    -- 'to_do', 'in_progress', 'review', 'completed', 'blocked'
  priority TEXT DEFAULT 'medium',
    -- 'low', 'medium', 'high', 'urgent'
  assigned_to UUID REFERENCES users(id),
  start_date DATE,
  due_date DATE,
  estimated_hours DECIMAL(8,2),
  actual_hours DECIMAL(8,2),
  parent_task_id UUID REFERENCES project_management_tasks(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `project_management_milestones`
```sql
CREATE TABLE project_management_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES project_management_projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
    -- 'pending', 'achieved', 'missed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `project_management_team_members`
```sql
CREATE TABLE project_management_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES project_management_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  role TEXT NOT NULL,
    -- 'project_manager', 'team_lead', 'developer', 'designer', 'tester', 'stakeholder'
  hourly_rate DECIMAL(8,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);
```

---

## 🎨 Styling Guidelines

### Tailwind CSS Patterns
Follow the inventory module's styling patterns:

```jsx
// Card/Container
className="bg-white rounded-lg shadow-sm p-6"

// Buttons
className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"

// Input Fields
className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"

// Table
className="w-full divide-y divide-gray-200"

// Badge/Status
className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700"

// Filter Panel
className="w-64 bg-white border-r border-gray-200"
```

### Color Scheme
- **Primary**: Blue (bg-blue-600, text-blue-600)
- **Success**: Green (bg-green-600)
- **Warning**: Yellow (bg-yellow-600)
- **Danger**: Red (bg-red-600)
- **Neutral**: Gray (bg-gray-100, text-gray-600)

---

## 📋 Feature Checklist

### Frontend (Gemini Pro - Antigravity IDE)

#### Core Components
- [ ] index.jsx - Main container with state management
- [ ] index.css - Module-specific styles
- [ ] api/project-management.js - API client with all methods

#### Tab Components
- [ ] components/tabs/ProjectsTab.jsx - Projects list/table
- [ ] components/tabs/TasksTab.jsx - Tasks Kanban board
- [ ] components/tabs/GanttTab.jsx - Gantt chart view
- [ ] components/tabs/TeamTab.jsx - Team members view

#### Modal Components
- [ ] components/modals/AddProjectModal.jsx
- [ ] components/modals/EditProjectModal.jsx
- [ ] components/modals/AddTaskModal.jsx
- [ ] components/modals/ProjectDetailModal.jsx
- [ ] components/modals/AddMilestoneModal.jsx

#### Shared Components
- [ ] components/FilterPanel.jsx - Sidebar filters
- [ ] components/Pagination.jsx - Reusable pagination
- [ ] components/Modal.jsx - Base modal wrapper
- [ ] components/SearchableSelect.jsx - Searchable dropdown

#### Utility Files
- [ ] utils/filtering.js - Filter logic
- [ ] utils/sorting.js - Sort logic
- [ ] utils/helpers.js - Helper functions (date formatting, progress calculation)

#### Features
- [ ] Project CRUD operations
- [ ] Task management with drag-drop Kanban
- [ ] Gantt chart with timeline
- [ ] Team member assignment
- [ ] Filter by status, date range, team member
- [ ] Search functionality
- [ ] Pagination
- [ ] Responsive design (mobile/desktop)

### Backend (Claude)

#### API Handler
- [ ] server/api_handlers/project_management.js
  - [ ] GET /api/project-management?type=projects
  - [ ] GET /api/project-management?type=tasks
  - [ ] POST /api/project-management (action: create-project)
  - [ ] POST /api/project-management (action: update-project)
  - [ ] POST /api/project-management (action: delete-project)
  - [ ] POST /api/project-management (action: create-task)
  - [ ] POST /api/project-management (action: update-task)
  - [ ] POST /api/project-management (action: assign-team-member)

#### Controller
- [ ] server/project_management_controller.js
  - [ ] getProjects() with filters
  - [ ] getProjectById()
  - [ ] createProject()
  - [ ] updateProject()
  - [ ] deleteProject()
  - [ ] getTasks() with filters
  - [ ] createTask()
  - [ ] updateTask()
  - [ ] deleteTask()
  - [ ] getTeamMembers()
  - [ ] addTeamMember()
  - [ ] removeTeamMember()
  - [ ] getMilestones()
  - [ ] createMilestone()

#### Database
- [ ] Create Supabase tables (see schema above)
- [ ] Set up RLS (Row Level Security) policies
- [ ] Create indexes for performance

---

## 🚀 Development Workflow

### Phase 1: Frontend Setup (Gemini Pro)
1. Create folder structure
2. Build index.jsx with basic layout
3. Create API client (api/project-management.js)
4. Build FilterPanel component
5. Build ProjectsTab component
6. Build modals (AddProjectModal, etc.)
7. Add styling with Tailwind CSS
8. Test with mock data

### Phase 2: Backend Setup (Claude)
1. Create database tables in Supabase
2. Create project_management_controller.js
3. Create api_handlers/project_management.js
4. Register routes in server.js
5. Test API endpoints
6. Connect frontend to backend

### Phase 3: Advanced Features
1. Implement Gantt chart (recharts)
2. Add drag-drop Kanban board
3. Implement file attachments
4. Add real-time updates (Supabase subscriptions)
5. Add notifications

---

## 🔧 Key Implementation Notes

### Multi-tenancy
- All queries MUST filter by `organization_id`
- Use `getOrganizationInfo(organizationSlug)` helper
- Never expose data from other organizations

### State Management
- Use React hooks (useState, useEffect, useCallback)
- Keep state in index.jsx and pass down as props
- Avoid prop drilling - use callback functions

### Error Handling
```jsx
// Frontend
try {
  const result = await ProjectManagementAPI.createProject(slug, data);
  setProjects([...projects, result.data]);
} catch (error) {
  setError(error.message);
}

// Backend
try {
  const result = await controller.createProject(slug, data);
  ctx.body = okResponse(result);
} catch (error) {
  console.error('Error creating project:', error);
  ctx.status = 500;
  ctx.body = errorResponse(error.message);
}
```

### Performance
- Use pagination for large datasets
- Implement debounced search
- Use React.memo for expensive components
- Add loading states

---

## 📚 Reference Files

Study these files from the inventory module:

### Frontend
- `src/tools/inventory/index.jsx` - Main container pattern
- `src/tools/inventory/api/inventory.js` - API client pattern
- `src/tools/inventory/components/FilterPanel.jsx` - Filter UI pattern
- `src/tools/inventory/components/tabs/ProductsTab.jsx` - Tab component pattern
- `src/tools/inventory/utils/filtering.js` - Filter logic pattern

### Backend
- `server/api_handlers/inventory.js` - API handler pattern
- `server/inventory_controller.js` - Controller pattern
- `server/organization_helper.js` - Organization lookup

---

## 🎯 Success Criteria

### Frontend
✅ All components are separated into individual files
✅ No inline UI code in index.jsx
✅ API client has all CRUD methods
✅ Filters work correctly
✅ Responsive design (mobile + desktop)
✅ Loading states and error handling
✅ Clean Tailwind CSS styling

### Backend
✅ All API endpoints work correctly
✅ Proper multi-tenant filtering
✅ RLS policies enforce security
✅ Error handling and logging
✅ Returns consistent response format

---

## 📞 Contact & Questions

- Frontend Development: Gemini Pro (Antigravity IDE)
- Backend Development: Claude
- Architecture Questions: Refer to inventory module

---

**Last Updated**: November 24, 2025
**Version**: 1.0.0
