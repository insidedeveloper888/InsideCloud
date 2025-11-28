/**
 * Projects API Handler for Vercel Serverless
 * Handles: /api/projects, /api/projects/:id
 */

const { handleCors } = require('../../api/_utils');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  const { method, query, body } = req;
  const { organization_slug } = query;

  if (!organization_slug) {
    return res.status(400).json({ error: 'Missing organization_slug' });
  }

  const orgId = await getOrganizationId(organization_slug);
  if (!orgId) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  try {
    // Extract project ID from path if present
    const pathParts = req.url.split('?')[0].split('/');
    const projectIdIndex = pathParts.indexOf('projects') + 1;
    const projectId = pathParts[projectIdIndex] && pathParts[projectIdIndex] !== '' ? pathParts[projectIdIndex] : null;

    // Check if this is a members endpoint
    const isMembersEndpoint = pathParts.includes('members');
    const memberIdIndex = pathParts.indexOf('members') + 1;
    const memberId = isMembersEndpoint && pathParts[memberIdIndex] ? pathParts[memberIdIndex] : null;

    // Handle members endpoints
    if (isMembersEndpoint && projectId) {
      if (method === 'GET') {
        // GET /api/projects/:id/members
        const { data, error } = await supabase
          .from('project_members')
          .select(`
            *,
            individual:individuals!project_members_individual_id_fkey(id, display_name, primary_email)
          `)
          .eq('project_id', projectId);

        if (error) throw error;
        return res.status(200).json(data || []);
      }

      if (method === 'POST') {
        // POST /api/projects/:id/members
        const { individual_id, member_individual_id, role } = body;
        const { data, error } = await supabase
          .from('project_members')
          .insert({
            project_id: projectId,
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
        return res.status(200).json(data);
      }

      if (method === 'DELETE' && memberId) {
        // DELETE /api/projects/:id/members/:memberId
        const { error } = await supabase
          .from('project_members')
          .delete()
          .eq('individual_id', memberId)  // Fixed: Use individual_id instead of id
          .eq('project_id', projectId);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }
    }

    // Handle project CRUD
    if (method === 'GET') {
      if (projectId) {
        // GET /api/projects/:id - Single project
        const { data, error } = await supabase
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
          .eq('id', projectId)
          .eq('organization_id', orgId)
          .eq('is_deleted', false)
          .single();

        if (error) throw error;
        if (!data) {
          return res.status(404).json({ error: 'Project not found' });
        }
        return res.status(200).json(data);
      } else {
        // GET /api/projects - All projects
        const { status_id, customer_id, owner_id, visibility, template_id } = query;

        let queryBuilder = supabase
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

        if (status_id) queryBuilder = queryBuilder.eq('status_id', status_id);
        if (customer_id) queryBuilder = queryBuilder.eq('customer_contact_id', customer_id);
        if (owner_id) queryBuilder = queryBuilder.eq('owner_individual_id', owner_id);
        if (visibility) queryBuilder = queryBuilder.eq('visibility', visibility);
        if (template_id) queryBuilder = queryBuilder.eq('template_id', template_id);

        const { data, error } = await queryBuilder;

        if (error) throw error;
        return res.status(200).json(data || []);
      }
    }

    if (method === 'POST') {
      // POST /api/projects - Create project
      const { individual_id, members, ...projectData } = body;

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

      // Get default status if not provided
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
          customer:contacts(id, first_name, last_name, company_name)
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

      return res.status(200).json(project);
    }

    if (method === 'PUT' && projectId) {
      // PUT /api/projects/:id - Update project
      const { individual_id, members, ...projectData } = body;

      const updateData = {
        updated_at: new Date().toISOString(),
        updated_by_individual_id: individual_id || null,
      };

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
        .eq('id', projectId)
        .eq('organization_id', orgId)
        .eq('is_deleted', false)
        .select(`
          *,
          template:project_templates(id, name, fields),
          status:project_statuses(id, name, color),
          customer:contacts(id, first_name, last_name, company_name),
          members:project_members(
            id,
            role,
            individual:individuals!project_members_individual_id_fkey(id, display_name, primary_email)
          )
        `)
        .single();

      if (error) throw error;

      // Update members if provided
      if (members !== undefined) {
        await supabase.from('project_members').delete().eq('project_id', projectId);
        if (members && members.length > 0) {
          const memberInserts = members.map(m => ({
            project_id: projectId,
            individual_id: m.individual_id,
            role: m.role || 'member',
            created_by_individual_id: individual_id || null,
          }));
          await supabase.from('project_members').insert(memberInserts);
        }
      }

      return res.status(200).json(project);
    }

    if (method === 'DELETE' && projectId) {
      // DELETE /api/projects/:id - Soft delete
      const { individual_id } = query;

      const { data, error } = await supabase
        .from('projects')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by_individual_id: individual_id || null,
        })
        .eq('id', projectId)
        .eq('organization_id', orgId)
        .select('id')
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, id: data.id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Projects API error:', error);
    return res.status(500).json({ error: error.message });
  }
};
