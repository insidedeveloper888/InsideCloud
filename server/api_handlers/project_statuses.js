/**
 * Project Statuses API Handler for Vercel Serverless
 * Handles: /api/project-statuses, /api/project-statuses/:id
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
    // Extract status ID from path if present
    const pathParts = req.url.split('?')[0].split('/');
    const statusIdIndex = pathParts.indexOf('project-statuses') + 1;
    const statusId = pathParts[statusIdIndex] && pathParts[statusIdIndex] !== '' ? pathParts[statusIdIndex] : null;

    if (method === 'GET') {
      if (statusId) {
        // GET /api/project-statuses/:id - Single status
        const { data, error } = await supabase
          .from('project_statuses')
          .select('*')
          .eq('id', statusId)
          .eq('organization_id', orgId)
          .single();

        if (error) throw error;
        if (!data) {
          return res.status(404).json({ error: 'Status not found' });
        }
        return res.status(200).json(data);
      } else {
        // GET /api/project-statuses - All statuses
        const { data, error } = await supabase
          .from('project_statuses')
          .select('*')
          .eq('organization_id', orgId)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        return res.status(200).json(data || []);
      }
    }

    if (method === 'POST') {
      // POST /api/project-statuses - Create status
      const { individual_id, ...statusData } = body;

      // Get max sort_order
      const { data: maxSortData } = await supabase
        .from('project_statuses')
        .select('sort_order')
        .eq('organization_id', orgId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      const nextSortOrder = (maxSortData?.sort_order || 0) + 1;

      const { data, error } = await supabase
        .from('project_statuses')
        .insert({
          organization_id: orgId,
          name: statusData.name,
          color: statusData.color || '#6B7280',
          sort_order: statusData.sort_order ?? nextSortOrder,
          is_default: statusData.is_default || false,
          is_completed: statusData.is_completed || false,
          created_by_individual_id: individual_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (method === 'PUT' && statusId) {
      // PUT /api/project-statuses/:id - Update status
      const { individual_id, ...statusData } = body;

      const updateData = {
        updated_at: new Date().toISOString(),
        updated_by_individual_id: individual_id || null,
      };

      if (statusData.name !== undefined) updateData.name = statusData.name;
      if (statusData.color !== undefined) updateData.color = statusData.color;
      if (statusData.sort_order !== undefined) updateData.sort_order = statusData.sort_order;
      if (statusData.is_default !== undefined) updateData.is_default = statusData.is_default;
      if (statusData.is_completed !== undefined) updateData.is_completed = statusData.is_completed;

      // If setting as default, unset other defaults first
      if (statusData.is_default === true) {
        await supabase
          .from('project_statuses')
          .update({ is_default: false })
          .eq('organization_id', orgId)
          .neq('id', statusId);
      }

      const { data, error } = await supabase
        .from('project_statuses')
        .update(updateData)
        .eq('id', statusId)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (method === 'DELETE' && statusId) {
      // DELETE /api/project-statuses/:id - Delete status
      // Check if status is in use
      const { count } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('status_id', statusId)
        .eq('is_deleted', false);

      if (count > 0) {
        return res.status(400).json({
          error: 'Cannot delete status that is in use by projects',
          count,
        });
      }

      const { error } = await supabase
        .from('project_statuses')
        .delete()
        .eq('id', statusId)
        .eq('organization_id', orgId);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Project Statuses API error:', error);
    return res.status(500).json({ error: error.message });
  }
};
