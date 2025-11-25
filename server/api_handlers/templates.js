/**
 * API Handler for Document Templates (Vercel Serverless)
 * Handles CRUD operations for PDF templates
 */

const templateController = require('../template_controller');
const organizationHelper = require('../organization_helper');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper to get an individual_id for the organization
async function getIndividualIdForOrg(organizationId) {
  try {
    // Try to get an individual from organization_members
    const { data, error } = await supabase
      .from('organization_members')
      .select('individual_id')
      .eq('organization_id', organizationId)
      .limit(1)
      .single();

    if (!error && data) {
      return data.individual_id;
    }

    // Fallback: Get ANY individual from the database
    const { data: individualData, error: individualError } = await supabase
      .from('individuals')
      .select('id')
      .limit(1)
      .single();

    if (!individualError && individualData) {
      return individualData.id;
    }

    console.error('[templates] Could not find any individual_id');
    return null;
  } catch (err) {
    console.error('[templates] Error getting individual_id:', err);
    return null;
  }
}

// CORS helper
function handleCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  try {
    const { organization_slug, document_type, template_id } = req.query;
    const method = req.method;

    // Validate organization
    if (!organization_slug) {
      return res.status(400).json({
        code: -1,
        message: 'Missing organization_slug parameter'
      });
    }

    const organization = await organizationHelper.getOrganizationBySlug(organization_slug);
    if (!organization) {
      return res.status(404).json({
        code: -1,
        message: 'Organization not found'
      });
    }

    const organizationId = organization.id;

    // Get an individual_id for template attribution
    const individualId = await getIndividualIdForOrg(organizationId);

    if (!individualId) {
      return res.status(500).json({
        code: -1,
        message: 'Could not find a valid individual_id for this organization'
      });
    }

    // Route to appropriate handler based on method
    switch (method) {
      case 'GET':
        if (template_id) {
          // Get single template
          const getResult = await templateController.getTemplate(template_id, organizationId);

          if (!getResult.success) {
            return res.status(500).json({
              code: -1,
              message: getResult.error
            });
          }

          return res.status(200).json({
            code: 0,
            data: getResult.data
          });
        } else {
          // Get all templates (optionally filtered by document_type)
          const listResult = await templateController.getTemplates(organizationId, document_type);

          if (!listResult.success) {
            return res.status(500).json({
              code: -1,
              message: listResult.error
            });
          }

          return res.status(200).json({
            code: 0,
            data: listResult.data
          });
        }

      case 'POST':
        const postAction = req.query.action;

        if (postAction === 'initialize') {
          // Initialize default templates
          const initResult = await templateController.initializeDefaultTemplates(organizationId, individualId);

          if (!initResult.success) {
            return res.status(500).json({
              code: -1,
              message: initResult.error
            });
          }

          return res.status(200).json({
            code: 0,
            message: initResult.message
          });
        } else if (postAction === 'duplicate' && template_id) {
          // Duplicate template
          const dupResult = await templateController.duplicateTemplate(template_id, organizationId, individualId);

          if (!dupResult.success) {
            return res.status(500).json({
              code: -1,
              message: dupResult.error
            });
          }

          return res.status(200).json({
            code: 0,
            data: dupResult.data
          });
        } else if (postAction === 'set-default' && template_id) {
          // Set as default
          const defaultResult = await templateController.setDefaultTemplate(template_id, organizationId);

          if (!defaultResult.success) {
            return res.status(500).json({
              code: -1,
              message: defaultResult.error
            });
          }

          return res.status(200).json({
            code: 0,
            data: defaultResult.data
          });
        } else {
          // Create new template
          const createResult = await templateController.createTemplate(req.body, organizationId, individualId);

          if (!createResult.success) {
            return res.status(500).json({
              code: -1,
              message: createResult.error
            });
          }

          return res.status(201).json({
            code: 0,
            data: createResult.data
          });
        }

      case 'PUT':
        if (!template_id) {
          return res.status(400).json({
            code: -1,
            message: 'Missing template_id parameter'
          });
        }

        // Update template
        const updateResult = await templateController.updateTemplate(
          template_id,
          req.body,
          organizationId,
          individualId
        );

        if (!updateResult.success) {
          return res.status(500).json({
            code: -1,
            message: updateResult.error
          });
        }

        return res.status(200).json({
          code: 0,
          data: updateResult.data
        });

      case 'DELETE':
        if (!template_id) {
          return res.status(400).json({
            code: -1,
            message: 'Missing template_id parameter'
          });
        }

        // Delete template
        const deleteResult = await templateController.deleteTemplate(template_id, organizationId);

        if (!deleteResult.success) {
          return res.status(500).json({
            code: -1,
            message: deleteResult.error
          });
        }

        return res.status(200).json({
          code: 0,
          message: deleteResult.message
        });

      default:
        return res.status(405).json({
          code: -1,
          message: `Method ${method} not allowed`
        });
    }
  } catch (error) {
    console.error('Error in templates handler:', error);
    return res.status(500).json({
      code: -1,
      message: error.message || 'Internal server error'
    });
  }
};
