/**
 * Projects Controller
 * Handles all business logic for project management
 * Routes for: projects, project_statuses, project_templates, project_members
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get organization ID from slug
 */
async function getOrganizationId(slug) {
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single();
  return org?.id;
}

// ============================================================================
// PROJECTS ENDPOINTS
// ============================================================================

/**
 * GET /api/projects
 * Fetch all projects for an organization
 */
async function getProjects(ctx) {
  try {
    const { organization_slug, status_id, customer_id, owner_id, visibility, template_id } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const orgId = await getOrganizationId(organization_slug);
    if (!orgId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    let query = supabase
      .from('projects')
      .select(`
        *,
        template:project_templates(id, name, fields),
        status:project_statuses(id, name, color),
        customer:contacts(id, first_name, last_name, company_name, phone_1, email),
        owner:individuals!projects_owner_individual_id_fkey(id, display_name, primary_email),
        created_by:individuals!projects_created_by_individual_id_fkey(id, display_name),
        members:project_members(
          id,
          role,
          individual:individuals!project_members_individual_id_fkey(id, display_name, primary_email)
        )
      `)
      .eq('organization_id', orgId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status_id) query = query.eq('status_id', status_id);
    if (customer_id) query = query.eq('customer_contact_id', customer_id);
    if (owner_id) query = query.eq('owner_individual_id', owner_id);
    if (visibility) query = query.eq('visibility', visibility);
    if (template_id) query = query.eq('template_id', template_id);

    const { data, error } = await query;

    if (error) throw error;

    ctx.body = data || [];
  } catch (error) {
    console.error('Error fetching projects:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * GET /api/projects/:id
 * Fetch a single project by ID
 */
async function getProject(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const orgId = await getOrganizationId(organization_slug);
    if (!orgId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        template:project_templates(id, name, fields),
        status:project_statuses(id, name, color),
        customer:contacts(id, first_name, last_name, company_name, phone_1, email),
        owner:individuals!projects_owner_individual_id_fkey(id, display_name, primary_email),
        created_by:individuals!projects_created_by_individual_id_fkey(id, display_name),
        updated_by:individuals!projects_updated_by_individual_id_fkey(id, display_name),
        members:project_members(
          id,
          role,
          individual:individuals!project_members_individual_id_fkey(id, display_name, primary_email)
        )
      `)
      .eq('id', id)
      .eq('organization_id', orgId)
      .eq('is_deleted', false)
      .single();

    if (error) throw error;
    if (!data) {
      return (ctx.status = 404), (ctx.body = { error: 'Project not found' });
    }

    ctx.body = data;
  } catch (error) {
    console.error('Error fetching project:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
async function createProject(ctx) {
  try {
    const { organization_slug, individual_id, members, ...projectData } = ctx.request.body;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const orgId = await getOrganizationId(organization_slug);
    if (!orgId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Prepare project data
    const projectToInsert = {
      organization_id: orgId,
      name: projectData.name,
      description: projectData.description || null,
      template_id: projectData.template_id || null,
      status_id: projectData.status_id || null,
      status: projectData.status || null,
      customer_contact_id: projectData.customer_contact_id || null,
      budget: projectData.budget || null,
      actual_cost: projectData.actual_cost || null,
      start_date: projectData.start_date || null,
      due_date: projectData.due_date || null,
      custom_data: projectData.custom_data || {},
      progress_current: projectData.progress_current || 0,
      progress_total: projectData.progress_total || 0,
      progress_unit: projectData.progress_unit || null,
      visibility: projectData.visibility || 'organization',
      owner_individual_id: projectData.owner_individual_id || individual_id || null,
      created_by_individual_id: individual_id || null,
      updated_by_individual_id: individual_id || null,
    };

    // If no status_id provided, get the default status
    if (!projectToInsert.status_id) {
      const { data: defaultStatus } = await supabase
        .from('project_statuses')
        .select('id')
        .eq('organization_id', orgId)
        .eq('is_default', true)
        .single();

      if (defaultStatus) {
        projectToInsert.status_id = defaultStatus.id;
      }
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert(projectToInsert)
      .select(`
        *,
        template:project_templates(id, name, fields),
        status:project_statuses(id, name, color),
        customer:contacts(id, first_name, last_name, company_name),
        owner:individuals!projects_owner_individual_id_fkey(id, display_name, primary_email)
      `)
      .single();

    if (error) throw error;

    // Add members if provided
    if (members && members.length > 0) {
      const memberInserts = members.map(m => ({
        project_id: project.id,
        individual_id: m.individual_id,
        role: m.role || 'member',
        created_by_individual_id: individual_id || null,
      }));

      await supabase.from('project_members').insert(memberInserts);
    }

    ctx.body = project;
  } catch (error) {
    console.error('Error creating project:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * PUT /api/projects/:id
 * Update a project
 */
async function updateProject(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug, individual_id, members, ...projectData } = ctx.request.body;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const orgId = await getOrganizationId(organization_slug);
    if (!orgId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString(),
      updated_by_individual_id: individual_id || null,
    };

    // Only include fields that are explicitly provided
    if (projectData.name !== undefined) updateData.name = projectData.name;
    if (projectData.description !== undefined) updateData.description = projectData.description;
    if (projectData.template_id !== undefined) updateData.template_id = projectData.template_id;
    if (projectData.status_id !== undefined) updateData.status_id = projectData.status_id;
    if (projectData.status !== undefined) updateData.status = projectData.status;
    if (projectData.customer_contact_id !== undefined) updateData.customer_contact_id = projectData.customer_contact_id;
    if (projectData.budget !== undefined) updateData.budget = projectData.budget;
    if (projectData.actual_cost !== undefined) updateData.actual_cost = projectData.actual_cost;
    if (projectData.start_date !== undefined) updateData.start_date = projectData.start_date;
    if (projectData.due_date !== undefined) updateData.due_date = projectData.due_date;
    if (projectData.completed_date !== undefined) updateData.completed_date = projectData.completed_date;
    if (projectData.custom_data !== undefined) updateData.custom_data = projectData.custom_data;
    if (projectData.progress_current !== undefined) updateData.progress_current = projectData.progress_current;
    if (projectData.progress_total !== undefined) updateData.progress_total = projectData.progress_total;
    if (projectData.progress_unit !== undefined) updateData.progress_unit = projectData.progress_unit;
    if (projectData.visibility !== undefined) updateData.visibility = projectData.visibility;
    if (projectData.owner_individual_id !== undefined) updateData.owner_individual_id = projectData.owner_individual_id;

    const { data: project, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', orgId)
      .eq('is_deleted', false)
      .select(`
        *,
        template:project_templates(id, name, fields),
        status:project_statuses(id, name, color),
        customer:contacts(id, first_name, last_name, company_name),
        owner:individuals!projects_owner_individual_id_fkey(id, display_name, primary_email),
        members:project_members(
          id,
          role,
          individual:individuals!project_members_individual_id_fkey(id, display_name, primary_email)
        )
      `)
      .single();

    if (error) throw error;
    if (!project) {
      return (ctx.status = 404), (ctx.body = { error: 'Project not found' });
    }

    // Update members if provided
    if (members !== undefined) {
      // Remove existing members
      await supabase.from('project_members').delete().eq('project_id', id);

      // Add new members
      if (members && members.length > 0) {
        const memberInserts = members.map(m => ({
          project_id: id,
          individual_id: m.individual_id,
          role: m.role || 'member',
          created_by_individual_id: individual_id || null,
        }));
        await supabase.from('project_members').insert(memberInserts);
      }
    }

    ctx.body = project;
  } catch (error) {
    console.error('Error updating project:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * DELETE /api/projects/:id
 * Soft delete a project
 */
async function deleteProject(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug, individual_id } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const orgId = await getOrganizationId(organization_slug);
    if (!orgId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    const { data, error } = await supabase
      .from('projects')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by_individual_id: individual_id || null,
      })
      .eq('id', id)
      .eq('organization_id', orgId)
      .select('id')
      .single();

    if (error) throw error;
    if (!data) {
      return (ctx.status = 404), (ctx.body = { error: 'Project not found' });
    }

    ctx.body = { success: true, id: data.id };
  } catch (error) {
    console.error('Error deleting project:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

// ============================================================================
// PROJECT STATUSES ENDPOINTS
// ============================================================================

/**
 * GET /api/project-statuses
 * Fetch all project statuses for an organization
 */
async function getProjectStatuses(ctx) {
  try {
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const orgId = await getOrganizationId(organization_slug);
    if (!orgId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    const { data, error } = await supabase
      .from('project_statuses')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    ctx.body = data || [];
  } catch (error) {
    console.error('Error fetching project statuses:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * POST /api/project-statuses
 * Create a new project status
 */
async function createProjectStatus(ctx) {
  try {
    const { organization_slug, ...statusData } = ctx.request.body;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const orgId = await getOrganizationId(organization_slug);
    if (!orgId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Get max sort_order
    const { data: maxOrder } = await supabase
      .from('project_statuses')
      .select('sort_order')
      .eq('organization_id', orgId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const { data, error } = await supabase
      .from('project_statuses')
      .insert({
        organization_id: orgId,
        name: statusData.name,
        color: statusData.color || '#3B82F6',
        sort_order: (maxOrder?.sort_order || 0) + 1,
        is_default: statusData.is_default || false,
      })
      .select()
      .single();

    if (error) throw error;

    ctx.body = data;
  } catch (error) {
    console.error('Error creating project status:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * PUT /api/project-statuses/:id
 * Update a project status
 */
async function updateProjectStatus(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug, ...statusData } = ctx.request.body;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const orgId = await getOrganizationId(organization_slug);
    if (!orgId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (statusData.name !== undefined) updateData.name = statusData.name;
    if (statusData.color !== undefined) updateData.color = statusData.color;
    if (statusData.sort_order !== undefined) updateData.sort_order = statusData.sort_order;
    if (statusData.is_default !== undefined) updateData.is_default = statusData.is_default;
    if (statusData.is_active !== undefined) updateData.is_active = statusData.is_active;

    const { data, error } = await supabase
      .from('project_statuses')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) throw error;

    ctx.body = data;
  } catch (error) {
    console.error('Error updating project status:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * DELETE /api/project-statuses/:id
 * Delete a project status (soft delete by setting is_active = false)
 */
async function deleteProjectStatus(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const orgId = await getOrganizationId(organization_slug);
    if (!orgId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    const { data, error } = await supabase
      .from('project_statuses')
      .update({ is_active: false })
      .eq('id', id)
      .eq('organization_id', orgId)
      .select('id')
      .single();

    if (error) throw error;

    ctx.body = { success: true, id: data.id };
  } catch (error) {
    console.error('Error deleting project status:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

// ============================================================================
// PROJECT TEMPLATES ENDPOINTS
// ============================================================================

/**
 * GET /api/project-templates
 * Fetch all project templates for an organization
 */
async function getProjectTemplates(ctx) {
  try {
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const orgId = await getOrganizationId(organization_slug);
    if (!orgId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    const { data, error } = await supabase
      .from('project_templates')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    ctx.body = data || [];
  } catch (error) {
    console.error('Error fetching project templates:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * POST /api/project-templates
 * Create a new project template
 */
async function createProjectTemplate(ctx) {
  try {
    const { organization_slug, individual_id, ...templateData } = ctx.request.body;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const orgId = await getOrganizationId(organization_slug);
    if (!orgId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    const { data, error } = await supabase
      .from('project_templates')
      .insert({
        organization_id: orgId,
        name: templateData.name,
        description: templateData.description || null,
        fields: templateData.fields || [],
        sort_order: templateData.sort_order || 0,
        created_by_individual_id: individual_id || null,
        updated_by_individual_id: individual_id || null,
      })
      .select()
      .single();

    if (error) throw error;

    ctx.body = data;
  } catch (error) {
    console.error('Error creating project template:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * PUT /api/project-templates/:id
 * Update a project template
 */
async function updateProjectTemplate(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug, individual_id, ...templateData } = ctx.request.body;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const orgId = await getOrganizationId(organization_slug);
    if (!orgId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    const updateData = {
      updated_at: new Date().toISOString(),
      updated_by_individual_id: individual_id || null,
    };

    if (templateData.name !== undefined) updateData.name = templateData.name;
    if (templateData.description !== undefined) updateData.description = templateData.description;
    if (templateData.fields !== undefined) updateData.fields = templateData.fields;
    if (templateData.sort_order !== undefined) updateData.sort_order = templateData.sort_order;
    if (templateData.is_active !== undefined) updateData.is_active = templateData.is_active;

    const { data, error } = await supabase
      .from('project_templates')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) throw error;

    ctx.body = data;
  } catch (error) {
    console.error('Error updating project template:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * DELETE /api/project-templates/:id
 * Delete a project template (soft delete by setting is_active = false)
 */
async function deleteProjectTemplate(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const orgId = await getOrganizationId(organization_slug);
    if (!orgId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    const { data, error } = await supabase
      .from('project_templates')
      .update({ is_active: false })
      .eq('id', id)
      .eq('organization_id', orgId)
      .select('id')
      .single();

    if (error) throw error;

    ctx.body = { success: true, id: data.id };
  } catch (error) {
    console.error('Error deleting project template:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

// ============================================================================
// PROJECT MEMBERS ENDPOINTS
// ============================================================================

/**
 * GET /api/projects/:id/members
 * Fetch all members for a project
 */
async function getProjectMembers(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const orgId = await getOrganizationId(organization_slug);
    if (!orgId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Verify project belongs to organization
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (!project) {
      return (ctx.status = 404), (ctx.body = { error: 'Project not found' });
    }

    const { data, error } = await supabase
      .from('project_members')
      .select(`
        *,
        individual:individuals!project_members_individual_id_fkey(id, display_name, primary_email)
      `)
      .eq('project_id', id);

    if (error) throw error;

    ctx.body = data || [];
  } catch (error) {
    console.error('Error fetching project members:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * POST /api/projects/:id/members
 * Add a member to a project
 */
async function addProjectMember(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug, individual_id, member_individual_id, role } = ctx.request.body;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const orgId = await getOrganizationId(organization_slug);
    if (!orgId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Verify project belongs to organization
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (!project) {
      return (ctx.status = 404), (ctx.body = { error: 'Project not found' });
    }

    const { data, error } = await supabase
      .from('project_members')
      .insert({
        project_id: id,
        individual_id: member_individual_id,
        role: role || 'member',
        created_by_individual_id: individual_id || null,
      })
      .select(`
        *,
        individual:individuals!project_members_individual_id_fkey(id, display_name, primary_email)
      `)
      .single();

    if (error) throw error;

    ctx.body = data;
  } catch (error) {
    console.error('Error adding project member:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * DELETE /api/projects/:id/members/:memberId
 * Remove a member from a project
 */
async function removeProjectMember(ctx) {
  try {
    const { id, memberId } = ctx.params;
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const orgId = await getOrganizationId(organization_slug);
    if (!orgId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Verify project belongs to organization
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (!project) {
      return (ctx.status = 404), (ctx.body = { error: 'Project not found' });
    }

    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('individual_id', memberId)  // Fixed: Use individual_id instead of id
      .eq('project_id', id);

    if (error) throw error;

    ctx.body = { success: true };
  } catch (error) {
    console.error('Error removing project member:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

module.exports = {
  // Projects
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  // Project Statuses
  getProjectStatuses,
  createProjectStatus,
  updateProjectStatus,
  deleteProjectStatus,
  // Project Templates
  getProjectTemplates,
  createProjectTemplate,
  updateProjectTemplate,
  deleteProjectTemplate,
  // Project Members
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
};
