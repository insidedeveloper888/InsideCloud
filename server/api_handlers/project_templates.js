/**
 * Project Templates API Handler for Vercel Serverless
 * Handles: /api/project-templates, /api/project-templates/:id
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
    // Extract template ID from path if present
    const pathParts = req.url.split('?')[0].split('/');
    const templateIdIndex = pathParts.indexOf('project-templates') + 1;
    const templateId = pathParts[templateIdIndex] && pathParts[templateIdIndex] !== '' ? pathParts[templateIdIndex] : null;

    if (method === 'GET') {
      if (templateId) {
        // GET /api/project-templates/:id - Single template
        const { data, error } = await supabase
          .from('project_templates')
          .select('*')
          .eq('id', templateId)
          .eq('organization_id', orgId)
          .single();

        if (error) throw error;
        if (!data) {
          return res.status(404).json({ error: 'Template not found' });
        }
        return res.status(200).json(data);
      } else {
        // GET /api/project-templates - All templates
        const { data, error } = await supabase
          .from('project_templates')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return res.status(200).json(data || []);
      }
    }

    if (method === 'POST') {
      // POST /api/project-templates - Create template
      const { individual_id, ...templateData } = body;

      const { data, error } = await supabase
        .from('project_templates')
        .insert({
          organization_id: orgId,
          name: templateData.name,
          description: templateData.description || null,
          fields: templateData.fields || [],
          default_status_id: templateData.default_status_id || null,
          created_by_individual_id: individual_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (method === 'PUT' && templateId) {
      // PUT /api/project-templates/:id - Update template
      const { individual_id, ...templateData } = body;

      const updateData = {
        updated_at: new Date().toISOString(),
        updated_by_individual_id: individual_id || null,
      };

      if (templateData.name !== undefined) updateData.name = templateData.name;
      if (templateData.description !== undefined) updateData.description = templateData.description;
      if (templateData.fields !== undefined) updateData.fields = templateData.fields;
      if (templateData.default_status_id !== undefined) updateData.default_status_id = templateData.default_status_id;

      const { data, error } = await supabase
        .from('project_templates')
        .update(updateData)
        .eq('id', templateId)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (method === 'DELETE' && templateId) {
      // DELETE /api/project-templates/:id - Delete template
      // Check if template is in use
      const { count } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('template_id', templateId)
        .eq('is_deleted', false);

      if (count > 0) {
        return res.status(400).json({
          error: 'Cannot delete template that is in use by projects',
          count,
        });
      }

      const { error } = await supabase
        .from('project_templates')
        .delete()
        .eq('id', templateId)
        .eq('organization_id', orgId);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Project Templates API error:', error);
    return res.status(500).json({ error: error.message });
  }
};
