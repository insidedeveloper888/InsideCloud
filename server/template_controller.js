/**
 * Template Controller
 * Handles document template CRUD operations for PDF generation
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Get all templates for organization (optionally filtered by document_type)
 */
async function getTemplates(organizationId, documentType = null) {
  try {
    let query = supabase
      .from('document_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (documentType) {
      query = query.eq('document_type', documentType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching templates:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get single template by ID
 */
async function getTemplate(templateId, organizationId) {
  try {
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .eq('id', templateId)
      .eq('organization_id', organizationId)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching template:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create new template
 */
async function createTemplate(templateData, organizationId, createdByIndividualId) {
  try {
    const { name, document_type, config, is_default = false, preview_image_url } = templateData;

    // Validate required fields
    if (!name || !document_type || !config) {
      throw new Error('Missing required fields: name, document_type, config');
    }

    // Validate document_type
    const validTypes = ['quotation', 'sales_order', 'delivery_order', 'invoice'];
    if (!validTypes.includes(document_type)) {
      throw new Error(`Invalid document_type. Must be one of: ${validTypes.join(', ')}`);
    }

    // If setting as default, unset current default for this document type
    if (is_default) {
      await supabase
        .from('document_templates')
        .update({ is_default: false })
        .eq('organization_id', organizationId)
        .eq('document_type', document_type)
        .eq('is_default', true);
    }

    // Insert new template
    const { data, error } = await supabase
      .from('document_templates')
      .insert({
        organization_id: organizationId,
        name,
        document_type,
        config,
        is_default,
        preview_image_url: preview_image_url || null,
        created_by_individual_id: createdByIndividualId,
        updated_by_individual_id: createdByIndividualId
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error creating template:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update template
 */
async function updateTemplate(templateId, updates, organizationId, updatedByIndividualId) {
  try {
    const { name, config, is_default, is_active, preview_image_url } = updates;

    // Verify template belongs to organization
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('document_templates')
      .select('document_type')
      .eq('id', templateId)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError) throw fetchError;

    // If setting as default, unset current default for this document type
    if (is_default === true) {
      await supabase
        .from('document_templates')
        .update({ is_default: false })
        .eq('organization_id', organizationId)
        .eq('document_type', existingTemplate.document_type)
        .eq('is_default', true);
    }

    // Build update object with only provided fields
    const updateData = {
      updated_by_individual_id: updatedByIndividualId,
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (config !== undefined) updateData.config = config;
    if (is_default !== undefined) updateData.is_default = is_default;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (preview_image_url !== undefined) updateData.preview_image_url = preview_image_url;

    // Update template
    const { data, error } = await supabase
      .from('document_templates')
      .update(updateData)
      .eq('id', templateId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error updating template:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete template (only if not default)
 */
async function deleteTemplate(templateId, organizationId) {
  try {
    // Check if template is default
    const { data: template, error: fetchError } = await supabase
      .from('document_templates')
      .select('is_default, name')
      .eq('id', templateId)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError) throw fetchError;

    if (template.is_default) {
      throw new Error('Cannot delete default template. Set another template as default first.');
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('document_templates')
      .update({ is_active: false })
      .eq('id', templateId)
      .eq('organization_id', organizationId);

    if (error) throw error;

    return { success: true, message: 'Template deleted successfully' };
  } catch (error) {
    console.error('Error deleting template:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Set template as default for its document type
 */
async function setDefaultTemplate(templateId, organizationId) {
  try {
    // Get template document type
    const { data: template, error: fetchError } = await supabase
      .from('document_templates')
      .select('document_type')
      .eq('id', templateId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (fetchError) throw fetchError;

    // Unset current default
    await supabase
      .from('document_templates')
      .update({ is_default: false })
      .eq('organization_id', organizationId)
      .eq('document_type', template.document_type)
      .eq('is_default', true);

    // Set new default
    const { data, error } = await supabase
      .from('document_templates')
      .update({ is_default: true })
      .eq('id', templateId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error setting default template:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Duplicate template with new name
 */
async function duplicateTemplate(templateId, organizationId, createdByIndividualId) {
  try {
    // Get original template
    const { data: original, error: fetchError } = await supabase
      .from('document_templates')
      .select('*')
      .eq('id', templateId)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError) throw fetchError;

    // Create new template with copied config
    const { data, error } = await supabase
      .from('document_templates')
      .insert({
        organization_id: organizationId,
        name: `${original.name} (Copy)`,
        document_type: original.document_type,
        config: original.config,
        is_default: false, // Copy is never default
        preview_image_url: original.preview_image_url,
        created_by_individual_id: createdByIndividualId,
        updated_by_individual_id: createdByIndividualId
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error duplicating template:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get default template for a document type
 */
async function getDefaultTemplate(organizationId, documentType) {
  try {
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('document_type', documentType)
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (error) {
      // If no default template found, return null instead of throwing
      if (error.code === 'PGRST116') {
        return { success: true, data: null };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching default template:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Initialize default templates for an organization
 */
async function initializeDefaultTemplates(organizationId, createdByIndividualId) {
  console.log('[templateController] initializeDefaultTemplates called');
  console.log('[templateController] organizationId:', organizationId);
  console.log('[templateController] createdByIndividualId:', createdByIndividualId);

  try {
    // Call the database function to create default templates
    console.log('[templateController] Calling Supabase RPC: create_default_document_templates');
    const { data, error } = await supabase.rpc('create_default_document_templates', {
      p_organization_id: organizationId,
      p_created_by_individual_id: createdByIndividualId
    });

    console.log('[templateController] RPC response - data:', data);
    console.log('[templateController] RPC response - error:', error);

    if (error) {
      console.error('[templateController] RPC returned error:', error);
      throw error;
    }

    console.log('[templateController] Templates initialized successfully');
    return { success: true, message: 'Default templates initialized successfully' };
  } catch (error) {
    console.error('[templateController] Error initializing default templates:', error);
    console.error('[templateController] Error message:', error.message);
    console.error('[templateController] Error details:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
  duplicateTemplate,
  getDefaultTemplate,
  initializeDefaultTemplates
};
