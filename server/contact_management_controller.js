/**
 * Contact Management Controller
 * Handles all business logic for contact management
 * Routes for: contacts, contact_stages, traffic_channels
 */

const { createClient } = require('@supabase/supabase-js');
const serverUtil = require('./server_util');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================================================
// CONTACTS ENDPOINTS
// ============================================================================

/**
 * GET /api/contacts
 * Fetch all contacts for an organization
 */
async function getContacts(ctx) {
  try {
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Fetch contacts
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', org.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch tags and contact_types for all contacts
    if (contacts && contacts.length > 0) {
      const contactIds = contacts.map(c => c.id);

      // Fetch tag assignments
      const { data: tagAssignments } = await supabase
        .from('contact_tag_assignments')
        .select(`
          contact_id,
          contact_tags (
            id,
            name,
            color
          )
        `)
        .in('contact_id', contactIds);

      // Fetch contact type assignments (many-to-many)
      const { data: typeAssignments } = await supabase
        .from('contact_contact_types')
        .select(`
          contact_id,
          contact_types (
            id,
            code,
            name,
            is_system,
            sort_order
          )
        `)
        .in('contact_id', contactIds);

      // Merge tags and contact_types with contacts
      const contactsWithRelations = contacts.map(contact => {
        // Get tags for this contact
        const contactTags = tagAssignments
          ?.filter(assignment => assignment.contact_id === contact.id)
          ?.map(assignment => assignment.contact_tags)
          || [];

        // Get contact_types for this contact (sorted by sort_order)
        const contactTypes = typeAssignments
          ?.filter(assignment => assignment.contact_id === contact.id)
          ?.map(assignment => assignment.contact_types)
          ?.filter(Boolean)
          ?.sort((a, b) => a.sort_order - b.sort_order)
          || [];

        return {
          ...contact,
          tags: contactTags,
          contact_types: contactTypes  // NEW: array of type objects
          // contact_type TEXT field is preserved for backward compatibility
        };
      });

      ctx.body = contactsWithRelations;
    } else {
      ctx.body = contacts || [];
    }
  } catch (error) {
    console.error('Error fetching contacts:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * Generates a random avatar color from a predefined palette
 */
function generateRandomAvatarColor() {
  const colors = [
    '#2196F3', // Blue
    '#4CAF50', // Green
    '#FF9800', // Orange
    '#9C27B0', // Purple
    '#F44336', // Red
    '#00BCD4', // Cyan
    '#FF5722', // Deep Orange
    '#3F51B5', // Indigo
    '#8BC34A', // Light Green
    '#E91E63', // Pink
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Helper function to fetch a single contact with all relationships (tags, contact_types)
 * Used by POST and PUT endpoints to return consistent data structure
 */
async function getContactWithRelationships(contactId) {
  // Fetch tag assignments
  const { data: tagAssignments } = await supabase
    .from('contact_tag_assignments')
    .select(`
      contact_id,
      contact_tags (
        id,
        name,
        color
      )
    `)
    .eq('contact_id', contactId);

  // Fetch contact type assignments (many-to-many)
  const { data: typeAssignments } = await supabase
    .from('contact_contact_types')
    .select(`
      contact_id,
      contact_types (
        id,
        code,
        name,
        is_system,
        sort_order
      )
    `)
    .eq('contact_id', contactId);

  // Get tags for this contact
  const tags = tagAssignments
    ?.map(assignment => assignment.contact_tags)
    ?.filter(Boolean)
    || [];

  // Get contact_types for this contact (sorted by sort_order)
  const contact_types = typeAssignments
    ?.map(assignment => assignment.contact_types)
    ?.filter(Boolean)
    ?.sort((a, b) => a.sort_order - b.sort_order)
    || [];

  return { tags, contact_types };
}

/**
 * POST /api/contacts
 * Create a new contact
 */
async function createContact(ctx) {
  try {
    const { organization_slug, individual_id, contact_type_ids, ...contactData } = ctx.request.body;

    console.log('=== CREATE CONTACT DEBUG ===');
    console.log('Organization slug:', organization_slug);
    console.log('Individual ID from request:', individual_id);
    console.log('Contact type IDs:', contact_type_ids);
    console.log('Contact data received:', JSON.stringify(contactData, null, 2));

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Validate contact_type_ids if provided (must have at least one)
    if (contact_type_ids !== undefined && Array.isArray(contact_type_ids) && contact_type_ids.length === 0) {
      return (ctx.status = 400), (ctx.body = { error: 'At least one contact type is required' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Use individual_id from request body (passed from frontend)
    const individualId = individual_id || null;
    console.log('Individual ID for audit:', individualId);

    // Determine the contact_type TEXT field value
    // If contact_type_ids provided, we'll update this after looking up the first type's code
    let contactTypeText = contactData.contact_type || 'customer';

    // Prepare contact data with defaults for required fields
    const contactToInsert = {
      organization_id: org.id,
      // Personal Information
      first_name: contactData.first_name || '',
      last_name: contactData.last_name || '',
      nickname: contactData.nickname || null,
      gender: contactData.gender || null,
      // Contact Information
      email: contactData.email || null,
      phone_1: contactData.phone_1 || '',
      phone_2: contactData.phone_2 || null,
      // Business Information
      company_name: contactData.company_name || null,
      industry: contactData.industry || null,
      entity_type: contactData.entity_type || 'individual',
      contact_type: contactTypeText,
      // Contact Person (for company entities)
      contact_person_name: contactData.contact_person_name || null,
      contact_person_phone: contactData.contact_person_phone || null,
      // Address Information
      address_line_1: contactData.address_line_1 || null,
      address_line_2: contactData.address_line_2 || null,
      postal_code: contactData.postal_code || null,
      city: contactData.city || null,
      state: contactData.state || null,
      // Source & Assignment
      traffic_source_id: contactData.traffic_source_id || null,
      sales_person_individual_id: contactData.sales_person_individual_id || null,
      customer_service_individual_id: contactData.customer_service_individual_id || null,
      // Referral System
      referred_by_contact_id: contactData.referred_by_contact_id || null,
      // Pipeline Status
      current_stage_id: contactData.current_stage_id || null,
      // Avatar
      avatar_url: contactData.avatar_url || null,
      avatar_color: generateRandomAvatarColor(), // Always generate random color
      // Rating (for customers only)
      rating: contactData.rating || null,
      // Notes
      notes: contactData.notes || null,
      // Audit
      created_by_individual_id: individualId,
    };

    console.log('Contact to insert:', JSON.stringify(contactToInsert, null, 2));

    // Create contact
    const { data: contact, error } = await supabase
      .from('contacts')
      .insert([contactToInsert])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error creating contact:', error);
      throw error;
    }

    console.log('✅ Contact created successfully:', contact.id);

    // === NEW: Write to contact_contact_types junction table ===
    let assignedTypeIds = [];

    if (contact_type_ids && Array.isArray(contact_type_ids) && contact_type_ids.length > 0) {
      // Frontend sent array of type IDs (new format)
      console.log('📝 Assigning contact types (new format):', contact_type_ids);

      // Verify all type_ids belong to this organization
      const { data: validTypes, error: typeError } = await supabase
        .from('contact_types')
        .select('id, code')
        .eq('organization_id', org.id)
        .in('id', contact_type_ids);

      if (typeError) {
        console.error('❌ Error validating contact types:', typeError);
        throw typeError;
      }

      if (!validTypes || validTypes.length !== contact_type_ids.length) {
        console.warn('⚠️ Some contact_type_ids are invalid');
      }

      if (validTypes && validTypes.length > 0) {
        // Insert junction records
        const junctionRecords = validTypes.map(type => ({
          contact_id: contact.id,
          contact_type_id: type.id
        }));

        const { error: junctionError } = await supabase
          .from('contact_contact_types')
          .insert(junctionRecords);

        if (junctionError) {
          console.error('❌ Error inserting contact types:', junctionError);
          throw junctionError;
        }

        assignedTypeIds = validTypes.map(t => t.id);

        // Update the contact_type TEXT field with first type's code (for backward compat)
        const firstTypeCode = validTypes[0].code;
        if (firstTypeCode && firstTypeCode !== contact.contact_type) {
          await supabase
            .from('contacts')
            .update({ contact_type: firstTypeCode })
            .eq('id', contact.id);
          contact.contact_type = firstTypeCode;
        }

        console.log('✅ Contact types assigned:', assignedTypeIds);
      }
    } else {
      // Fallback: lookup type by code for backward compatibility (old format)
      const typeCode = contactData.contact_type || 'customer';
      console.log('📝 Assigning contact type by code (old format):', typeCode);

      const { data: contactType, error: lookupError } = await supabase
        .from('contact_types')
        .select('id')
        .eq('organization_id', org.id)
        .eq('code', typeCode)
        .single();

      if (lookupError) {
        console.warn('⚠️ Could not find contact type by code:', typeCode, lookupError.message);
      }

      if (contactType) {
        const { error: junctionError } = await supabase
          .from('contact_contact_types')
          .insert({
            contact_id: contact.id,
            contact_type_id: contactType.id
          });

        if (junctionError) {
          console.error('❌ Error inserting contact type (fallback):', junctionError);
          // Don't throw - contact was created, just junction failed
        } else {
          assignedTypeIds = [contactType.id];
          console.log('✅ Contact type assigned (fallback):', contactType.id);
        }
      }
    }

    // Fetch relationships (tags and contact_types) to return complete contact object
    const relationships = await getContactWithRelationships(contact.id);

    // Merge relationships with contact
    const contactWithRelationships = {
      ...contact,
      tags: relationships.tags,
      contact_types: relationships.contact_types
    };

    console.log('✅ Returning contact with relationships:', JSON.stringify(contactWithRelationships, null, 2));
    console.log('=== END CREATE CONTACT DEBUG ===');

    ctx.body = contactWithRelationships;
    ctx.status = 201;
  } catch (error) {
    console.error('Error creating contact:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * PUT /api/contacts/:id
 * Update an existing contact
 */
async function updateContact(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug, individual_id, contact_type_ids, ...contactData } = ctx.request.body;

    console.log('=== UPDATE CONTACT DEBUG ===');
    console.log('Contact ID:', id);
    console.log('Organization slug:', organization_slug);
    console.log('Contact type IDs:', contact_type_ids);
    console.log('Raw contactData received:', JSON.stringify(contactData, null, 2));

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Validate contact_type_ids if provided (must have at least one)
    if (contact_type_ids !== undefined && Array.isArray(contact_type_ids) && contact_type_ids.length === 0) {
      return (ctx.status = 400), (ctx.body = { error: 'At least one contact type is required' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Use individual_id from request body (passed from frontend)
    const individualId = individual_id || null;

    console.log('Building updateData object...');

    // Prepare update data with all fields
    const updateData = {
      // Personal Information
      first_name: contactData.first_name,
      last_name: contactData.last_name,
      nickname: contactData.nickname || null,
      gender: contactData.gender || null,
      // Contact Information
      email: contactData.email || null,
      phone_1: contactData.phone_1 || '',
      phone_2: contactData.phone_2 || null,
      // Business Information
      company_name: contactData.company_name || null,
      industry: contactData.industry || null,
      entity_type: contactData.entity_type || 'individual',
      contact_type: contactData.contact_type || 'customer',
      // Contact Person
      contact_person_name: contactData.contact_person_name || null,
      contact_person_phone: contactData.contact_person_phone || null,
      // Address Information
      address_line_1: contactData.address_line_1 || null,
      address_line_2: contactData.address_line_2 || null,
      postal_code: contactData.postal_code || null,
      city: contactData.city || null,
      state: contactData.state || null,
      // Source & Assignment
      traffic_source_id: contactData.traffic_source_id || null,
      sales_person_individual_id: contactData.sales_person_individual_id || null,
      customer_service_individual_id: contactData.customer_service_individual_id || null,
      // Referral System
      referred_by_contact_id: contactData.referred_by_contact_id || null,
      // Pipeline Status
      current_stage_id: contactData.current_stage_id || null,
      // Avatar
      avatar_url: contactData.avatar_url || null,
      // Only update avatar_color if explicitly provided (don't regenerate on update)
      ...(contactData.avatar_color && { avatar_color: contactData.avatar_color }),
      // Rating (for customers only)
      rating: contactData.rating || null,
      // Notes
      notes: contactData.notes || null,
      // Audit
      updated_by_individual_id: individualId,
    };

    // === NEW: Handle contact_type_ids if provided ===
    if (contact_type_ids !== undefined && Array.isArray(contact_type_ids) && contact_type_ids.length > 0) {
      console.log('📝 Updating contact types (new format):', contact_type_ids);

      // Verify all type_ids belong to this organization
      const { data: validTypes, error: typeError } = await supabase
        .from('contact_types')
        .select('id, code')
        .eq('organization_id', org.id)
        .in('id', contact_type_ids);

      if (typeError) {
        console.error('❌ Error validating contact types:', typeError);
        throw typeError;
      }

      if (!validTypes || validTypes.length === 0) {
        return (ctx.status = 400), (ctx.body = { error: 'Invalid contact type IDs' });
      }

      // Delete existing assignments
      const { error: deleteError } = await supabase
        .from('contact_contact_types')
        .delete()
        .eq('contact_id', id);

      if (deleteError) {
        console.error('❌ Error deleting old contact types:', deleteError);
        throw deleteError;
      }

      // Insert new assignments
      const junctionRecords = validTypes.map(type => ({
        contact_id: id,
        contact_type_id: type.id
      }));

      const { error: insertError } = await supabase
        .from('contact_contact_types')
        .insert(junctionRecords);

      if (insertError) {
        console.error('❌ Error inserting new contact types:', insertError);
        throw insertError;
      }

      // Update the contact_type TEXT field with first type's code (for backward compat)
      const firstTypeCode = validTypes[0].code;
      if (firstTypeCode) {
        updateData.contact_type = firstTypeCode;
      }

      console.log('✅ Contact types updated:', validTypes.map(t => t.id));
    }

    console.log('Individual ID for audit (update):', individualId);
    console.log('updateData to send to Supabase:', JSON.stringify(updateData, null, 2));

    // Update contact
    const { data: contact, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', org.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error updating contact:', error);
      throw error;
    }

    console.log('✅ Contact updated successfully:', JSON.stringify(contact, null, 2));

    // Fetch relationships (tags and contact_types) to return complete contact object
    const relationships = await getContactWithRelationships(contact.id);

    // Merge relationships with contact
    const contactWithRelationships = {
      ...contact,
      tags: relationships.tags,
      contact_types: relationships.contact_types
    };

    console.log('✅ Returning contact with relationships:', JSON.stringify(contactWithRelationships, null, 2));
    console.log('=== END UPDATE CONTACT DEBUG ===');

    ctx.body = contactWithRelationships;
  } catch (error) {
    console.error('Error updating contact:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * DELETE /api/contacts/:id
 * Soft delete a contact
 */
async function deleteContact(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug, individual_id } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Use individual_id from query params (passed from frontend)
    const individualId = individual_id || null;

    // Soft delete
    const { data: contact, error} = await supabase
      .from('contacts')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by_individual_id: individualId,
      })
      .eq('id', id)
      .eq('organization_id', org.id)
      .select()
      .single();

    if (error) throw error;

    ctx.body = { message: 'Contact deleted', contact };
  } catch (error) {
    console.error('Error deleting contact:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

// ============================================================================
// CONTACT STAGES ENDPOINTS
// ============================================================================

/**
 * GET /api/contact-stages
 * Fetch all custom stages for an organization
 * UPDATED: Include stage_type and is_system fields
 */
async function getContactStages(ctx) {
  try {
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Fetch stages - Include stage_type and is_system
    const { data: stages, error } = await supabase
      .from('contact_stages')
      .select('id, organization_id, name, color, order_index, stage_type, is_system, created_at, updated_at, created_by_individual_id')
      .eq('organization_id', org.id)
      .order('order_index', { ascending: true });

    if (error) throw error;

    ctx.body = stages || [];
  } catch (error) {
    console.error('Error fetching stages:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * POST /api/contact-stages
 * Create a new contact stage
 * UPDATED: Validate system stage constraints
 */
async function createContactStage(ctx) {
  try {
    const { organization_slug, stage_type, is_system, ...stageData } = ctx.request.body;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // VALIDATION: Prevent creating duplicate system stages
    if (is_system && stage_type) {
      // Check if this organization already has a system stage of this type
      const { data: existingSystemStage } = await supabase
        .from('contact_stages')
        .select('id, name')
        .eq('organization_id', org.id)
        .eq('is_system', true)
        .eq('stage_type', stage_type)
        .maybeSingle();

      if (existingSystemStage) {
        return (ctx.status = 409), (ctx.body = {
          error: `System stage of type "${stage_type}" already exists: "${existingSystemStage.name}". Each organization can only have one system stage per type.`
        });
      }
    }

    // VALIDATION: Custom stages (non-system) cannot have stage_type
    if (!is_system && stage_type) {
      return (ctx.status = 400), (ctx.body = {
        error: 'Custom stages (is_system=false) cannot have a stage_type. Only system stages can have a stage_type.'
      });
    }

    // Get current user
    const userId = ctx.session?.user?.id;

    // Prepare stage data
    const newStageData = {
      ...stageData,
      organization_id: org.id,
      created_by_individual_id: userId,
      is_system: is_system || false, // Default to false (custom stage)
      stage_type: is_system && stage_type ? stage_type : null, // Only set if system stage
    };

    // Create stage
    const { data: stage, error } = await supabase
      .from('contact_stages')
      .insert([newStageData])
      .select()
      .single();

    if (error) {
      // Handle unique constraint violations
      if (error.code === '23505' && error.message.includes('idx_contact_stages_unique_system_type')) {
        return (ctx.status = 409), (ctx.body = {
          error: `A system stage with type "${stage_type}" already exists for this organization.`
        });
      }
      throw error;
    }

    ctx.body = stage;
    ctx.status = 201;
  } catch (error) {
    console.error('Error creating stage:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * PUT /api/contact-stages/:id
 * Update a contact stage
 * UPDATED: Prevent modifying system stage types
 */
async function updateContactStage(ctx) {
  serverUtil.configAccessControl(ctx);
  try {
    const { id } = ctx.params;
    const { organization_slug, stage_type, is_system, ...updateData } = ctx.request.body;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Fetch existing stage to check is_system status
    const { data: existingStage, error: fetchError } = await supabase
      .from('contact_stages')
      .select('id, name, is_system, stage_type')
      .eq('id', id)
      .eq('organization_id', org.id)
      .single();

    if (fetchError || !existingStage) {
      return (ctx.status = 404), (ctx.body = { error: 'Stage not found' });
    }

    // PROTECTION: Cannot change stage_type of system stages
    if (existingStage.is_system && stage_type && stage_type !== existingStage.stage_type) {
      return (ctx.status = 403), (ctx.body = {
        error: `Cannot modify stage_type of system stage. System stages (Lead, Won, Lost) must maintain their purpose.`
      });
    }

    // PROTECTION: Cannot change is_system flag
    if (is_system !== undefined && is_system !== existingStage.is_system) {
      return (ctx.status = 403), (ctx.body = {
        error: `Cannot change is_system flag. System stages cannot be converted to custom stages and vice versa.`
      });
    }

    // PROTECTION: System stages can only update name, color, order_index
    // Custom stages can update any field
    const allowedUpdateData = { ...updateData };

    if (existingStage.is_system) {
      // For system stages, only allow updating display properties
      const safeKeys = ['name', 'color', 'order_index'];
      Object.keys(allowedUpdateData).forEach(key => {
        if (!safeKeys.includes(key)) {
          delete allowedUpdateData[key];
        }
      });
    }

    // Update stage
    const { data: stage, error } = await supabase
      .from('contact_stages')
      .update({
        ...allowedUpdateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', org.id)
      .select()
      .single();

    if (error) throw error;

    ctx.body = stage;
  } catch (error) {
    console.error('Error updating stage:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * DELETE /api/contact-stages/:id
 * Delete a contact stage
 * UPDATED: Block deletion of system stages
 */
async function deleteContactStage(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Fetch existing stage to check is_system status
    const { data: existingStage, error: fetchError } = await supabase
      .from('contact_stages')
      .select('id, name, is_system, stage_type')
      .eq('id', id)
      .eq('organization_id', org.id)
      .single();

    if (fetchError || !existingStage) {
      return (ctx.status = 404), (ctx.body = { error: 'Stage not found' });
    }

    // PROTECTION: Cannot delete system stages
    if (existingStage.is_system) {
      return (ctx.status = 403), (ctx.body = {
        error: `Cannot delete system stage "${existingStage.name}". System stages (Lead, Won, Lost) are required for analytics and cannot be removed.`,
        stage_type: existingStage.stage_type
      });
    }

    // Delete stage
    const { error } = await supabase
      .from('contact_stages')
      .delete()
      .eq('id', id)
      .eq('organization_id', org.id);

    if (error) throw error;

    ctx.body = { message: 'Stage deleted' };
  } catch (error) {
    console.error('Error deleting stage:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

// ============================================================================
// TRAFFIC CHANNELS ENDPOINTS
// ============================================================================

/**
 * GET /api/traffic-channels
 * Fetch all traffic channels for an organization
 */
async function getTrafficChannels(ctx) {
  try {
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Fetch channels
    const { data: channels, error } = await supabase
      .from('traffic_channels')
      .select('*')
      .eq('organization_id', org.id)
      .eq('is_enabled', true);

    if (error) throw error;

    ctx.body = channels || [];
  } catch (error) {
    console.error('Error fetching channels:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * POST /api/traffic-channels
 * Create a new traffic channel
 */
async function createTrafficChannel(ctx) {
  try {
    const { organization_slug, ...channelData } = ctx.request.body;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Get current user
    const userId = ctx.session?.user?.id;

    // Create channel
    const { data: channel, error } = await supabase
      .from('traffic_channels')
      .insert([
        {
          ...channelData,
          organization_id: org.id,
          created_by_individual_id: userId,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    ctx.body = channel;
    ctx.status = 201;
  } catch (error) {
    console.error('Error creating channel:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * DELETE /api/traffic-channels/:id
 * Delete a traffic channel
 */
async function deleteTrafficChannel(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Delete channel (soft delete by setting is_enabled to false)
    const { error } = await supabase
      .from('traffic_channels')
      .update({ is_enabled: false })
      .eq('id', id)
      .eq('organization_id', org.id);

    if (error) throw error;

    ctx.body = { message: 'Channel deleted' };
  } catch (error) {
    console.error('Error deleting channel:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

// ============================================================================
// ORGANIZATION MEMBERS ENDPOINTS
// ============================================================================

/**
 * GET /api/organization-members
 * Fetch all active members (individuals) for an organization
 */
async function getOrganizationMembers(ctx) {
  try {
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Fetch organization members with individual details
    // Use individuals!individual_id to specify which foreign key relationship to use
    const { data: members, error } = await supabase
      .from('organization_members')
      .select(`
        individual_id,
        role_code,
        individuals!individual_id(
          id,
          display_name,
          avatar_url,
          primary_email
        )
      `)
      .eq('organization_id', org.id);

    if (error) throw error;

    // Transform to flat structure for easier frontend consumption
    const individuals = members.map((member) => ({
      id: member.individuals.id,
      display_name: member.individuals.display_name,
      avatar_url: member.individuals.avatar_url,
      primary_email: member.individuals.primary_email,
      role_code: member.role_code,
    }));

    ctx.body = individuals || [];
  } catch (error) {
    console.error('Error fetching organization members:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

// ============================================================================
// TAGS ENDPOINTS
// ============================================================================

/**
 * GET /api/contact-tags
 * Fetch all tags for an organization
 */
async function getContactTags(ctx) {
  try {
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Fetch tags
    const { data: tags, error } = await supabase
      .from('contact_tags')
      .select('*')
      .eq('organization_id', org.id)
      .order('name', { ascending: true });

    if (error) throw error;

    ctx.body = tags || [];
  } catch (error) {
    console.error('Error fetching tags:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * POST /api/contact-tags
 * Create a new tag
 */
async function createContactTag(ctx) {
  try {
    const { organization_slug, name, color } = ctx.request.body;

    if (!organization_slug || !name) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing required fields' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Normalize tag name
    const normalizedName = name.trim();

    // Check if tag already exists (case-insensitive)
    const { data: existingTag } = await supabase
      .from('contact_tags')
      .select('*')
      .eq('organization_id', org.id)
      .ilike('name', normalizedName)
      .maybeSingle();

    if (existingTag) {
      // Return existing tag instead of creating duplicate
      return (ctx.body = existingTag);
    }

    // Create new tag
    const { data: tag, error } = await supabase
      .from('contact_tags')
      .insert({
        organization_id: org.id,
        name: normalizedName,
        color: color || '#3B82F6', // Default blue
      })
      .select()
      .single();

    if (error) throw error;

    ctx.body = tag;
  } catch (error) {
    console.error('Error creating tag:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * PUT /api/contact-tags/:id
 * Update a tag
 */
async function updateContactTag(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug, name, color } = ctx.request.body;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Build update data
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (color) updateData.color = color;

    // Update tag
    const { data: tag, error } = await supabase
      .from('contact_tags')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', org.id)
      .select()
      .single();

    if (error) throw error;

    ctx.body = tag;
  } catch (error) {
    console.error('Error updating tag:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * DELETE /api/contact-tags/:id
 * Delete a tag and all its assignments
 */
async function deleteContactTag(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Delete tag (cascade will remove assignments)
    const { error } = await supabase
      .from('contact_tags')
      .delete()
      .eq('id', id)
      .eq('organization_id', org.id);

    if (error) throw error;

    ctx.body = { success: true };
  } catch (error) {
    console.error('Error deleting tag:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * GET /api/contacts/:id/tags
 * Get tags for a specific contact
 */
async function getContactTagsForContact(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Get tags with JOIN
    const { data: assignments, error } = await supabase
      .from('contact_tag_assignments')
      .select(`
        tag_id,
        contact_tags (
          id,
          name,
          color
        )
      `)
      .eq('contact_id', id);

    if (error) throw error;

    // Flatten the result
    const tags = assignments.map((a) => a.contact_tags);

    ctx.body = tags || [];
  } catch (error) {
    console.error('Error fetching contact tags:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * POST /api/contacts/:id/tags
 * Assign tags to a contact
 * Body: { tag_ids: ['uuid1', 'uuid2', ...] }
 */
async function assignTagsToContact(ctx) {
  try {
    const { id } = ctx.params;
    const { tag_ids } = ctx.request.body;

    // Remove all existing assignments
    await supabase
      .from('contact_tag_assignments')
      .delete()
      .eq('contact_id', id);

    // Add new assignments
    if (tag_ids && tag_ids.length > 0) {
      const assignments = tag_ids.map((tag_id) => ({
        contact_id: id,
        tag_id: tag_id,
      }));

      const { error } = await supabase
        .from('contact_tag_assignments')
        .insert(assignments);

      if (error) throw error;
    }

    ctx.body = { success: true };
  } catch (error) {
    console.error('Error assigning tags to contact:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

// ============================================================================
// DATA QUALITY ENDPOINTS
// ============================================================================

/**
 * GET /api/contacts/data-quality
 * Get data quality metrics for contact housekeeping
 */
async function getDataQualityMetrics(ctx) {
  serverUtil.configAccessControl(ctx);
  try {
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Fetch all contacts for analysis
    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', org.id)
      .eq('is_deleted', false);

    if (!contacts) {
      return ctx.body = {
        companiesWithoutName: 0,
        companiesWithoutIndustry: 0,
        companiesWithIncompleteAddress: 0,
        customersWithoutSalesPerson: 0,
        customersWithoutCustomerService: 0,
        customersWithoutTrafficSource: 0,
      };
    }

    // Calculate metrics
    const metrics = {
      companiesWithoutName: 0,
      companiesWithoutIndustry: 0,
      companiesWithIncompleteAddress: 0,
      customersWithoutSalesPerson: 0,
      customersWithoutCustomerService: 0,
      customersWithoutTrafficSource: 0,
    };

    contacts.forEach(contact => {
      // 1. Companies without company name
      if (contact.entity_type === 'company' && !contact.company_name?.trim()) {
        metrics.companiesWithoutName++;
      }

      // 2. Companies without industry
      if (contact.entity_type === 'company' && !contact.industry?.trim()) {
        metrics.companiesWithoutIndustry++;
      }

      // 3. Companies without complete address (any field missing)
      if (contact.entity_type === 'company') {
        const hasCompleteAddress =
          contact.address_line_1?.trim() &&
          contact.address_line_2?.trim() &&
          contact.postal_code?.trim() &&
          contact.city?.trim() &&
          contact.state?.trim();

        if (!hasCompleteAddress) {
          metrics.companiesWithIncompleteAddress++;
        }
      }

      // 4. Customers without sales person assigned
      // Note: Assuming assigned_to_individual_id represents sales person
      if (contact.contact_type === 'customer' && !contact.assigned_to_individual_id) {
        metrics.customersWithoutSalesPerson++;
      }

      // 5. Customers without customer service assigned
      // Note: Using assigned_department for customer service
      if (contact.contact_type === 'customer' && !contact.assigned_department?.trim()) {
        metrics.customersWithoutCustomerService++;
      }

      // 6. Customers without traffic source
      if (contact.contact_type === 'customer' && !contact.traffic_source_id) {
        metrics.customersWithoutTrafficSource++;
      }
    });

    ctx.body = metrics;
  } catch (error) {
    console.error('Error fetching data quality metrics:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

// ============================================================================
// IMPORT ENDPOINTS
// ============================================================================

/**
 * GET /api/contacts/import/template
 * Generate CSV template with current stages/channels as examples
 */
async function getImportTemplate(ctx) {
  serverUtil.configAccessControl(ctx);
  console.log('🔧 [getImportTemplate] START - organization_slug:', ctx.query.organization_slug);
  try {
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      console.log('❌ [getImportTemplate] Missing organization_slug');
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    console.log('🔍 [getImportTemplate] Fetching organization...');
    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    console.log('📊 [getImportTemplate] Organization result:', org);

    if (!org) {
      console.log('❌ [getImportTemplate] Organization not found');
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Fetch stages and channels for examples
    const { data: stages } = await supabase
      .from('contact_stages')
      .select('name')
      .eq('organization_id', org.id)
      .order('name', { ascending: true })
      .limit(3);

    const { data: channels } = await supabase
      .from('traffic_channels')
      .select('name')
      .eq('organization_id', org.id)
      .order('name', { ascending: true })
      .limit(3);

    const { data: tags } = await supabase
      .from('contact_tags')
      .select('name')
      .eq('organization_id', org.id)
      .order('name', { ascending: true })
      .limit(3);

    // Generate CSV template
    const headers = [
      'First Name*',
      'Last Name*',
      'Phone 1*',
      'Email',
      'Phone 2',
      'Company Name',
      'Entity Type*',
      'Contact Type*',
      'Stage',
      'Channel',
      'Tags',
      'Notes'
    ];

    // Example rows
    const exampleRows = [
      [
        'John',
        'Doe',
        '123-456-7890',
        'john@example.com',
        '',
        'Acme Corp',
        'individual',
        'customer',
        stages?.[0]?.name || 'Lead',
        channels?.[0]?.name || 'Website',
        tags?.map(t => t.name).join(', ') || 'VIP, Enterprise',
        'Important client'
      ],
      [
        'Jane',
        'Smith',
        '987-654-3210',
        'jane@example.com',
        '',
        'Tech Inc',
        'company',
        'supplier',
        stages?.[1]?.name || 'Qualified',
        channels?.[1]?.name || 'Referral',
        'Partner',
        'Preferred supplier'
      ]
    ];

    // Build CSV
    const csvRows = [headers, ...exampleRows];
    const csv = csvRows.map(row =>
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma/quote/newline
        const escaped = String(cell).replace(/"/g, '""');
        return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
      }).join(',')
    ).join('\n');

    // Set headers for file download
    ctx.set('Content-Type', 'text/csv');
    ctx.set('Content-Disposition', `attachment; filename="contact_import_template_${Date.now()}.csv"`);
    ctx.body = csv;
  } catch (error) {
    console.error('Error generating import template:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * POST /api/contacts/import/validate
 * Validate imported contact data
 */
async function validateImportData(ctx) {
  serverUtil.configAccessControl(ctx);
  try {
    const { organization_slug, rows } = ctx.request.body;

    if (!organization_slug || !rows || !Array.isArray(rows)) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug or rows' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Fetch existing stages, channels, tags
    const { data: stages } = await supabase
      .from('contact_stages')
      .select('id, name')
      .eq('organization_id', org.id);

    const { data: channels } = await supabase
      .from('traffic_channels')
      .select('id, name')
      .eq('organization_id', org.id);

    const { data: tags } = await supabase
      .from('contact_tags')
      .select('id, name')
      .eq('organization_id', org.id);

    // Fetch existing contacts (for duplicate detection by email)
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('email')
      .eq('organization_id', org.id)
      .eq('is_deleted', false);

    const existingEmails = new Set(
      existingContacts?.map(c => c.email?.toLowerCase().trim()).filter(Boolean) || []
    );

    // Validate each row
    const validatedRows = rows.map((row, index) => {
      const errors = [];
      const warnings = [];
      const toCreate = {
        stages: [],
        channels: [],
        tags: []
      };

      // Required fields validation
      if (!row.firstName?.trim()) {
        errors.push('First Name is required');
      }
      if (!row.lastName?.trim()) {
        errors.push('Last Name is required');
      }
      if (!row.phone1?.trim()) {
        errors.push('Phone 1 is required');
      }
      if (!row.entityType?.trim()) {
        errors.push('Entity Type is required');
      } else {
        const validEntityTypes = ['company', 'individual'];
        if (!validEntityTypes.includes(row.entityType.toLowerCase())) {
          errors.push(`Invalid Entity Type. Must be one of: ${validEntityTypes.join(', ')}`);
        }
      }
      if (!row.contactType?.trim()) {
        errors.push('Contact Type is required');
      } else {
        const validTypes = ['customer', 'supplier', 'coi', 'internal'];
        if (!validTypes.includes(row.contactType.toLowerCase())) {
          errors.push(`Invalid Contact Type. Must be one of: ${validTypes.join(', ')}`);
        }
      }

      // Email duplicate check
      if (row.email?.trim()) {
        const emailLower = row.email.toLowerCase().trim();
        if (existingEmails.has(emailLower)) {
          warnings.push('Email already exists - contact will be skipped');
        }
      }

      // Stage validation (optional field)
      if (row.stage?.trim()) {
        const normalizedStage = row.stage.toLowerCase().trim();
        const matchedStage = stages?.find(s => s.name.toLowerCase().trim() === normalizedStage);
        if (!matchedStage) {
          toCreate.stages.push(row.stage.trim());
          warnings.push(`Stage "${row.stage}" will be auto-created`);
        }
      }

      // Channel validation (optional field)
      if (row.channel?.trim()) {
        const normalizedChannel = row.channel.toLowerCase().trim();
        const matchedChannel = channels?.find(c => c.name.toLowerCase().trim() === normalizedChannel);
        if (!matchedChannel) {
          toCreate.channels.push(row.channel.trim());
          warnings.push(`Channel "${row.channel}" will be auto-created`);
        }
      }

      // Tags validation (optional field)
      if (row.tags?.trim()) {
        const tagNames = row.tags.split(',').map(t => t.trim()).filter(Boolean);
        tagNames.forEach(tagName => {
          const normalizedTag = tagName.toLowerCase().trim();
          const matchedTag = tags?.find(t => t.name.toLowerCase().trim() === normalizedTag);
          if (!matchedTag) {
            toCreate.tags.push(tagName);
            warnings.push(`Tag "${tagName}" will be auto-created`);
          }
        });
      }

      return {
        rowIndex: index,
        data: row,
        valid: errors.length === 0,
        errors,
        warnings,
        toCreate
      };
    });

    // Summary
    const summary = {
      total: validatedRows.length,
      valid: validatedRows.filter(r => r.valid && r.warnings.length === 0).length,
      validWithWarnings: validatedRows.filter(r => r.valid && r.warnings.length > 0).length,
      invalid: validatedRows.filter(r => !r.valid).length,
      duplicates: validatedRows.filter(r => r.warnings.some(w => w.includes('already exists'))).length
    };

    ctx.body = {
      validatedRows,
      summary
    };
  } catch (error) {
    console.error('Error validating import data:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * POST /api/contacts/import/execute
 * Execute bulk contact import
 */
async function executeImport(ctx) {
  serverUtil.configAccessControl(ctx);
  try {
    const { organization_slug, rows, individual_id } = ctx.request.body;

    if (!organization_slug || !rows || !Array.isArray(rows)) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing required fields' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    const results = {
      total: rows.length,
      success: 0,
      failed: 0,
      errors: []
    };

    // Fetch existing data for matching
    const { data: stages } = await supabase
      .from('contact_stages')
      .select('id, name')
      .eq('organization_id', org.id);

    const { data: channels } = await supabase
      .from('traffic_channels')
      .select('id, name')
      .eq('organization_id', org.id);

    const { data: tags } = await supabase
      .from('contact_tags')
      .select('id, name')
      .eq('organization_id', org.id);

    // Track created items to reuse within this import batch
    const createdStages = new Map();
    const createdChannels = new Map();
    const createdTags = new Map();

    // Helper: Get or create stage
    async function getOrCreateStage(stageName) {
      if (!stageName) return null;
      const normalized = stageName.toLowerCase().trim();

      // Check existing
      const existing = stages?.find(s => s.name.toLowerCase().trim() === normalized);
      if (existing) return existing.id;

      // Check already created in this batch
      if (createdStages.has(normalized)) return createdStages.get(normalized);

      // Create new
      const { data, error } = await supabase
        .from('contact_stages')
        .insert({
          organization_id: org.id,
          name: stageName.trim(),
          color: '#3B82F6',
          order_index: 0
        })
        .select('id')
        .single();

      if (error) throw error;
      createdStages.set(normalized, data.id);
      return data.id;
    }

    // Helper: Get or create channel
    async function getOrCreateChannel(channelName) {
      if (!channelName) return null;
      const normalized = channelName.toLowerCase().trim();

      const existing = channels?.find(c => c.name.toLowerCase().trim() === normalized);
      if (existing) return existing.id;

      if (createdChannels.has(normalized)) return createdChannels.get(normalized);

      const { data, error } = await supabase
        .from('traffic_channels')
        .insert({
          organization_id: org.id,
          name: channelName.trim()
        })
        .select('id')
        .single();

      if (error) throw error;
      createdChannels.set(normalized, data.id);
      return data.id;
    }

    // Helper: Get or create tag
    async function getOrCreateTag(tagName) {
      if (!tagName) return null;
      const normalized = tagName.toLowerCase().trim();

      const existing = tags?.find(t => t.name.toLowerCase().trim() === normalized);
      if (existing) return existing.id;

      if (createdTags.has(normalized)) return createdTags.get(normalized);

      const { data, error } = await supabase
        .from('contact_tags')
        .insert({
          organization_id: org.id,
          name: tagName.trim(),
          color: '#3B82F6'
        })
        .select('id')
        .single();

      if (error) throw error;
      createdTags.set(normalized, data.id);
      return data.id;
    }

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        // Skip if invalid - check all required fields
        if (!row.firstName?.trim() || !row.lastName?.trim() || !row.phone1?.trim() ||
            !row.entityType?.trim() || !row.contactType?.trim()) {
          results.failed++;
          results.errors.push({ row: i + 1, error: 'Missing required fields (First Name, Last Name, Phone 1, Entity Type, Contact Type)' });
          continue;
        }

        // Validate entity_type
        const validEntityTypes = ['company', 'individual'];
        if (!validEntityTypes.includes(row.entityType.toLowerCase())) {
          results.failed++;
          results.errors.push({ row: i + 1, error: 'Invalid Entity Type. Must be: company or individual' });
          continue;
        }

        // Resolve foreign keys
        const stageId = await getOrCreateStage(row.stage);
        const channelId = await getOrCreateChannel(row.channel);

        // Create contact
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            organization_id: org.id,
            first_name: row.firstName.trim(),
            last_name: row.lastName.trim(),
            phone_1: row.phone1.trim(),
            email: row.email?.trim() || null,
            phone_2: row.phone2?.trim() || null,
            company_name: row.companyName?.trim() || null,
            entity_type: row.entityType.toLowerCase().trim(),
            contact_type: row.contactType.toLowerCase().trim(),
            current_stage_id: stageId,
            traffic_source_id: channelId,
            notes: row.notes?.trim() || null,
            avatar_color: generateRandomAvatarColor(),
            created_by_individual_id: individual_id || null,
            updated_by_individual_id: individual_id || null
          })
          .select('id')
          .single();

        if (contactError) {
          // Check for duplicate email
          if (contactError.code === '23505') {
            results.failed++;
            results.errors.push({ row: i + 1, error: 'Duplicate email' });
            continue;
          }
          throw contactError;
        }

        // Assign tags if provided
        if (row.tags?.trim() && contact?.id) {
          const tagNames = row.tags.split(',').map(t => t.trim()).filter(Boolean);
          const tagIds = [];

          for (const tagName of tagNames) {
            const tagId = await getOrCreateTag(tagName);
            if (tagId) tagIds.push(tagId);
          }

          if (tagIds.length > 0) {
            const assignments = tagIds.map(tagId => ({
              contact_id: contact.id,
              tag_id: tagId
            }));

            await supabase
              .from('contact_tag_assignments')
              .insert(assignments);
          }
        }

        results.success++;
      } catch (error) {
        console.error(`Error importing row ${i + 1}:`, error);
        results.failed++;
        results.errors.push({ row: i + 1, error: error.message });
      }
    }

    ctx.body = results;
  } catch (error) {
    console.error('Error executing import:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

// ============================================================================
// CONTACT SETTINGS ENDPOINTS
// ============================================================================

/**
 * GET /api/contact-settings
 * Fetch contact management settings for an organization
 */
async function getContactSettings(ctx) {
  try {
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Fetch settings
    let { data: settings, error } = await supabase
      .from('contact_settings')
      .select('*')
      .eq('organization_id', org.id)
      .single();

    // If settings don't exist, create default settings
    if (!settings) {
      const { data: newSettings, error: createError } = await supabase
        .from('contact_settings')
        .insert([{
          organization_id: org.id,
          max_rating_scale: 10, // Default to 10-star rating
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating default settings:', createError);
        throw createError;
      }

      settings = newSettings;
    }

    ctx.body = settings;
  } catch (error) {
    console.error('Error fetching contact settings:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * PUT /api/contact-settings
 * Update contact management settings
 */
async function updateContactSettings(ctx) {
  try {
    const { organization_slug, max_rating_scale } = ctx.request.body;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Validate max_rating_scale
    if (max_rating_scale && (max_rating_scale < 3 || max_rating_scale > 10)) {
      return (ctx.status = 400), (ctx.body = { error: 'max_rating_scale must be between 3 and 10' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Update or insert settings
    const { data: settings, error } = await supabase
      .from('contact_settings')
      .upsert({
        organization_id: org.id,
        max_rating_scale: max_rating_scale || 10,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'organization_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating contact settings:', error);
      throw error;
    }

    ctx.body = settings;
  } catch (error) {
    console.error('Error updating contact settings:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

// ============================================================================
// CONTACT TYPES ENDPOINTS (Many-to-Many)
// ============================================================================

/**
 * GET /api/contact-types
 * Fetch all contact types for an organization (ordered by sort_order)
 */
async function getContactTypes(ctx) {
  try {
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Fetch contact types ordered by sort_order
    const { data: contactTypes, error } = await supabase
      .from('contact_types')
      .select('*')
      .eq('organization_id', org.id)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    ctx.body = contactTypes || [];
  } catch (error) {
    console.error('Error fetching contact types:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * POST /api/contact-types
 * Create a new custom contact type (is_system forced to false)
 */
async function createContactType(ctx) {
  try {
    const { organization_slug, code, name, description, sort_order } = ctx.request.body;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    if (!code || !name) {
      return (ctx.status = 400), (ctx.body = { error: 'Code and name are required' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Sanitize code: lowercase, no spaces, alphanumeric + underscore only
    const sanitizedCode = code.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    if (!sanitizedCode) {
      return (ctx.status = 400), (ctx.body = { error: 'Invalid code format' });
    }

    // Check if code already exists for this organization
    const { data: existingType } = await supabase
      .from('contact_types')
      .select('id')
      .eq('organization_id', org.id)
      .eq('code', sanitizedCode)
      .maybeSingle();

    if (existingType) {
      return (ctx.status = 400), (ctx.body = { error: `Contact type with code "${sanitizedCode}" already exists` });
    }

    // Create contact type (is_system forced to false for user-created types)
    const { data: contactType, error } = await supabase
      .from('contact_types')
      .insert([
        {
          organization_id: org.id,
          code: sanitizedCode,
          name: name.trim(),
          description: description?.trim() || null,
          is_system: false, // Users cannot create system types
          sort_order: sort_order || 99, // Default to end of list
        },
      ])
      .select()
      .single();

    if (error) throw error;

    ctx.body = contactType;
    ctx.status = 201;
  } catch (error) {
    console.error('Error creating contact type:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * PUT /api/contact-types/:id
 * Update a contact type (protect system types: cannot change code)
 */
async function updateContactType(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug, code, name, description, sort_order } = ctx.request.body;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Fetch existing type to check is_system
    const { data: existingType, error: fetchError } = await supabase
      .from('contact_types')
      .select('*')
      .eq('id', id)
      .eq('organization_id', org.id)
      .single();

    if (fetchError || !existingType) {
      return (ctx.status = 404), (ctx.body = { error: 'Contact type not found' });
    }

    // Build update data
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    // System types: only allow name, description, sort_order changes
    if (existingType.is_system) {
      if (code && code !== existingType.code) {
        return (ctx.status = 400), (ctx.body = { error: 'Cannot change code of system type' });
      }
      // Allow updating name, description, sort_order for system types
      if (name) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (sort_order !== undefined) updateData.sort_order = sort_order;
    } else {
      // Non-system types: allow all changes including code
      if (code) {
        const sanitizedCode = code.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        if (sanitizedCode && sanitizedCode !== existingType.code) {
          // Check if new code already exists
          const { data: duplicateType } = await supabase
            .from('contact_types')
            .select('id')
            .eq('organization_id', org.id)
            .eq('code', sanitizedCode)
            .neq('id', id)
            .maybeSingle();

          if (duplicateType) {
            return (ctx.status = 400), (ctx.body = { error: `Contact type with code "${sanitizedCode}" already exists` });
          }
          updateData.code = sanitizedCode;
        }
      }
      if (name) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (sort_order !== undefined) updateData.sort_order = sort_order;
    }

    // Update contact type
    const { data: contactType, error } = await supabase
      .from('contact_types')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', org.id)
      .select()
      .single();

    if (error) throw error;

    ctx.body = contactType;
  } catch (error) {
    console.error('Error updating contact type:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * DELETE /api/contact-types/:id
 * Delete a contact type (block if is_system=true OR if contacts are using it)
 */
async function deleteContactType(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Fetch existing type to check is_system
    const { data: existingType, error: fetchError } = await supabase
      .from('contact_types')
      .select('*')
      .eq('id', id)
      .eq('organization_id', org.id)
      .single();

    if (fetchError || !existingType) {
      return (ctx.status = 404), (ctx.body = { error: 'Contact type not found' });
    }

    // Block deletion of system types
    if (existingType.is_system) {
      return (ctx.status = 400), (ctx.body = { error: 'Cannot delete system type. System types (Customer, Supplier) are required.' });
    }

    // Check if any contacts are using this type
    const { count, error: countError } = await supabase
      .from('contact_contact_types')
      .select('*', { count: 'exact', head: true })
      .eq('contact_type_id', id);

    if (countError) throw countError;

    if (count > 0) {
      return (ctx.status = 400), (ctx.body = {
        error: `Cannot delete: ${count} contact(s) are using this type. Please reassign them first.`,
        contacts_using: count
      });
    }

    // Delete contact type
    const { error } = await supabase
      .from('contact_types')
      .delete()
      .eq('id', id)
      .eq('organization_id', org.id);

    if (error) throw error;

    ctx.body = { message: 'Contact type deleted successfully' };
  } catch (error) {
    console.error('Error deleting contact type:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * GET /api/contacts/:id/types
 * Get all types assigned to a contact
 */
async function getContactTypesForContact(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Get types with JOIN
    const { data: assignments, error } = await supabase
      .from('contact_contact_types')
      .select(`
        contact_type_id,
        contact_types (
          id,
          code,
          name,
          description,
          is_system,
          sort_order
        )
      `)
      .eq('contact_id', id);

    if (error) throw error;

    // Flatten the result and sort by sort_order
    const types = assignments
      .map((a) => a.contact_types)
      .filter(Boolean)
      .sort((a, b) => a.sort_order - b.sort_order);

    ctx.body = types || [];
  } catch (error) {
    console.error('Error fetching contact types for contact:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * POST /api/contacts/:id/types
 * Assign types to a contact (replaces all existing assignments)
 * Body: { type_ids: ['uuid1', 'uuid2', ...] }
 */
async function assignTypesToContact(ctx) {
  try {
    const { id } = ctx.params;
    const { type_ids, organization_slug } = ctx.request.body;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    // Validate type_ids array
    if (!type_ids || !Array.isArray(type_ids)) {
      return (ctx.status = 400), (ctx.body = { error: 'type_ids must be an array' });
    }

    if (type_ids.length === 0) {
      return (ctx.status = 400), (ctx.body = { error: 'At least one type must be assigned to a contact' });
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Verify the contact exists and belongs to this organization
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', id)
      .eq('organization_id', org.id)
      .single();

    if (contactError || !contact) {
      return (ctx.status = 404), (ctx.body = { error: 'Contact not found' });
    }

    // Verify all type_ids belong to this organization
    const { data: validTypes, error: typeError } = await supabase
      .from('contact_types')
      .select('id')
      .eq('organization_id', org.id)
      .in('id', type_ids);

    if (typeError) throw typeError;

    if (!validTypes || validTypes.length !== type_ids.length) {
      return (ctx.status = 400), (ctx.body = { error: 'One or more type_ids are invalid' });
    }

    // Remove all existing assignments for this contact
    const { error: deleteError } = await supabase
      .from('contact_contact_types')
      .delete()
      .eq('contact_id', id);

    if (deleteError) throw deleteError;

    // Add new assignments
    const assignments = type_ids.map((type_id) => ({
      contact_id: id,
      contact_type_id: type_id,
    }));

    const { error: insertError } = await supabase
      .from('contact_contact_types')
      .insert(assignments);

    if (insertError) throw insertError;

    ctx.body = { success: true, assigned_types: type_ids.length };
  } catch (error) {
    console.error('Error assigning types to contact:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Contacts
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  // Contact Stages
  getContactStages,
  createContactStage,
  updateContactStage,
  deleteContactStage,
  // Traffic Channels
  getTrafficChannels,
  createTrafficChannel,
  deleteTrafficChannel,
  // Organization Members
  getOrganizationMembers,
  // Tags
  getContactTags,
  createContactTag,
  updateContactTag,
  deleteContactTag,
  getContactTagsForContact,
  assignTagsToContact,
  // Contact Types (Many-to-Many)
  getContactTypes,
  createContactType,
  updateContactType,
  deleteContactType,
  getContactTypesForContact,
  assignTypesToContact,
  // Data Quality
  getDataQualityMetrics,
  // Import
  getImportTemplate,
  validateImportData,
  executeImport,
  // Contact Settings
  getContactSettings,
  updateContactSettings,
};
