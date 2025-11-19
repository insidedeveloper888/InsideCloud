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

    // Fetch tags for all contacts
    if (contacts && contacts.length > 0) {
      const contactIds = contacts.map(c => c.id);

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

      // Merge tags with contacts
      const contactsWithTags = contacts.map(contact => {
        const contactTags = tagAssignments
          ?.filter(assignment => assignment.contact_id === contact.id)
          ?.map(assignment => assignment.contact_tags)
          || [];

        return {
          ...contact,
          tags: contactTags
        };
      });

      ctx.body = contactsWithTags;
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
 * POST /api/contacts
 * Create a new contact
 */
async function createContact(ctx) {
  try {
    const { organization_slug, individual_id, ...contactData } = ctx.request.body;

    console.log('=== CREATE CONTACT DEBUG ===');
    console.log('Organization slug:', organization_slug);
    console.log('Individual ID from request:', individual_id);
    console.log('Contact data received:', JSON.stringify(contactData, null, 2));

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

    // Use individual_id from request body (passed from frontend)
    const individualId = individual_id || null;
    console.log('Individual ID for audit:', individualId);

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
      contact_type: contactData.contact_type || 'customer',
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
    console.log('=== END CREATE CONTACT DEBUG ===');

    ctx.body = contact;
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
    const { organization_slug, individual_id, ...contactData } = ctx.request.body;

    console.log('=== UPDATE CONTACT DEBUG ===');
    console.log('Contact ID:', id);
    console.log('Organization slug:', organization_slug);
    console.log('Raw contactData received:', JSON.stringify(contactData, null, 2));

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
      // Notes
      notes: contactData.notes || null,
      // Audit
      updated_by_individual_id: individualId,
    };

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
    console.log('=== END UPDATE CONTACT DEBUG ===');

    ctx.body = contact;
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

    // Fetch stages
    const { data: stages, error } = await supabase
      .from('contact_stages')
      .select('*')
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
 */
async function createContactStage(ctx) {
  try {
    const { organization_slug, ...stageData } = ctx.request.body;

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

    // Create stage
    const { data: stage, error } = await supabase
      .from('contact_stages')
      .insert([
        {
          ...stageData,
          organization_id: org.id,
          created_by_individual_id: userId,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    ctx.body = stage;
    ctx.status = 201;
  } catch (error) {
    console.error('Error creating stage:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * DELETE /api/contact-stages/:id
 * Delete a contact stage
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
  // Import
  getImportTemplate,
  validateImportData,
  executeImport,
};
