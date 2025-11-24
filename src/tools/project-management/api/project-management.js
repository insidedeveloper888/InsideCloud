// Mock Data
const MOCK_TEMPLATES = [
  {
    id: "template_01",
    name: "Solar Installation",
    fields: [
      { key: "panel_count", label: "Number of Panels", type: "number" },
      { key: "roof_type", label: "Roof Type", type: "text" },
      { key: "inspection_passed", label: "Inspection Passed", type: "checkbox" },
      { key: "installation_progress", label: "Installation Progress", type: "progress" }
    ]
  },
  {
    id: "template_02",
    name: "Network Cabling",
    fields: [
      { key: "cable_length", label: "Meters of Cable", type: "number" },
      { key: "switch_port", label: "Switch Port ID", type: "text" },
      { key: "signal_test", label: "Signal Test Passed", type: "checkbox" }
    ]
  }
];

const MOCK_PROJECTS = [
  {
    id: "proj_101",
    name: "Tech Corp HQ Solar",
    client: "Tech Corp",
    status: "active",
    budget: 15000,
    template_id: "template_01",
    assigned_staff: [1, 5],
    start_date: "2023-11-01",
    due_date: "2023-12-15",
    custom_data: {
      panel_count: 50,
      roof_type: "Flat Concrete",
      inspection_passed: true,
      installation_progress: 75
    }
  },
  {
    id: "proj_102",
    name: "Downtown Office Cabling",
    client: "Law Firm LLC",
    status: "pending",
    budget: 5000,
    template_id: "template_02",
    assigned_staff: [2],
    start_date: "2023-11-20",
    due_date: "2023-11-25",
    custom_data: {
      cable_length: 120,
      switch_port: "SW-01-24",
      signal_test: false
    }
  },
  {
    id: "proj_103",
    name: "Residential Solar Upgrade",
    client: "John Doe",
    status: "completed",
    budget: 8500,
    template_id: "template_01",
    assigned_staff: [3, 4],
    start_date: "2023-10-01",
    due_date: "2023-10-15",
    custom_data: {
      panel_count: 12,
      roof_type: "Shingle",
      inspection_passed: true,
      installation_progress: 100
    }
  }
];

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const ProjectManagementAPI = {
  async getTemplates(organizationSlug) {
    await delay(500);
    console.log(`[API] Fetching templates for org: ${organizationSlug}`);
    return [...MOCK_TEMPLATES];
  },

  async getProjects(organizationSlug, filters = {}) {
    await delay(600);
    console.log(`[API] Fetching projects for org: ${organizationSlug}`);
    let filtered = [...MOCK_PROJECTS];

    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    if (filters.template_id) {
      filtered = filtered.filter(p => p.template_id === filters.template_id);
    }

    return filtered;
  },

  async createTemplate(organizationSlug, templateData) {
    await delay(800);
    console.log(`[API] Creating template for org: ${organizationSlug}`);
    const newTemplate = {
      ...templateData,
      id: `template_${Date.now()}`
    };
    MOCK_TEMPLATES.push(newTemplate);
    return newTemplate;
  },

  async createProject(organizationSlug, projectData) {
    await delay(800);
    console.log(`[API] Creating project for org: ${organizationSlug}`);
    const newProject = {
      ...projectData,
      id: `proj_${Date.now()}`,
      status: 'active', // Default status
      created_at: new Date().toISOString()
    };
    MOCK_PROJECTS.push(newProject);
    return newProject;
  },

  async updateProject(projectId, updates) {
    await delay(500);
    const index = MOCK_PROJECTS.findIndex(p => p.id === projectId);
    if (index === -1) throw new Error("Project not found");

    MOCK_PROJECTS[index] = { ...MOCK_PROJECTS[index], ...updates };
    return MOCK_PROJECTS[index];
  },

  async getStaffStats() {
    await delay(400);
    return {
      total_staff: 12,
      avg_efficiency: 87, // %
      active_tasks: 45
    };
  }
};
