/**
 * API Client for Contact Management Tool
 * Handles all API communication with backend
 */

const API_BASE = '/api';

class ContactAPI {
  async getContacts(organizationSlug) {
    const response = await fetch(
      `${API_BASE}/contacts?organization_slug=${organizationSlug}`
    );
    if (!response.ok) throw new Error('Failed to fetch contacts');
    return response.json();
  }

  async createContact(organizationSlug, data, individualId = null) {
    const response = await fetch(`${API_BASE}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        organization_slug: organizationSlug,
        individual_id: individualId,
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Create contact failed:', response.status, errorText);
      throw new Error(`Failed to create contact: ${response.status} - ${errorText}`);
    }
    return response.json();
  }

  async updateContact(organizationSlug, contactId, data, individualId = null) {
    console.log('Updating contact:', contactId, data);
    const response = await fetch(`${API_BASE}/contacts/${contactId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        organization_slug: organizationSlug,
        individual_id: individualId,
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update contact failed:', response.status, errorText);
      throw new Error(`Failed to update contact: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    console.log('Update contact response:', result);
    return result;
  }

  async deleteContact(organizationSlug, contactId, individualId = null) {
    const params = new URLSearchParams({
      organization_slug: organizationSlug,
    });
    if (individualId) {
      params.append('individual_id', individualId);
    }
    const response = await fetch(
      `${API_BASE}/contacts/${contactId}?${params}`,
      { method: 'DELETE' }
    );
    if (!response.ok) throw new Error('Failed to delete contact');
    return response.json();
  }
}

class StageAPI {
  async getStages(organizationSlug) {
    const response = await fetch(
      `${API_BASE}/contact-stages?organization_slug=${organizationSlug}`
    );
    if (!response.ok) throw new Error('Failed to fetch stages');
    return response.json();
  }

  async createStage(organizationSlug, data) {
    const response = await fetch(`${API_BASE}/contact-stages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        organization_slug: organizationSlug,
      }),
    });
    if (!response.ok) throw new Error('Failed to create stage');
    return response.json();
  }

  async updateStage(organizationSlug, stageId, data) {
    const response = await fetch(`${API_BASE}/contact-stages/${stageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        organization_slug: organizationSlug,
      }),
    });
    if (!response.ok) throw new Error('Failed to update stage');
    return response.json();
  }

  async deleteStage(organizationSlug, stageId) {
    const response = await fetch(
      `${API_BASE}/contact-stages/${stageId}?organization_slug=${organizationSlug}`,
      { method: 'DELETE' }
    );
    if (!response.ok) throw new Error('Failed to delete stage');
    return response.json();
  }
}

class ChannelAPI {
  async getChannels(organizationSlug) {
    const response = await fetch(
      `${API_BASE}/traffic-channels?organization_slug=${organizationSlug}`
    );
    if (!response.ok) throw new Error('Failed to fetch channels');
    return response.json();
  }

  async createChannel(organizationSlug, data) {
    const response = await fetch(`${API_BASE}/traffic-channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        organization_slug: organizationSlug,
      }),
    });
    if (!response.ok) throw new Error('Failed to create channel');
    return response.json();
  }

  async updateChannel(organizationSlug, channelId, data) {
    const response = await fetch(`${API_BASE}/traffic-channels/${channelId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        organization_slug: organizationSlug,
      }),
    });
    if (!response.ok) throw new Error('Failed to update channel');
    return response.json();
  }

  async deleteChannel(organizationSlug, channelId) {
    const response = await fetch(
      `${API_BASE}/traffic-channels/${channelId}?organization_slug=${organizationSlug}`,
      { method: 'DELETE' }
    );
    if (!response.ok) throw new Error('Failed to delete channel');
    return response.json();
  }
}

class OrganizationAPI {
  async getMembers(organizationSlug) {
    const response = await fetch(
      `${API_BASE}/organization-members?organization_slug=${organizationSlug}`
    );
    if (!response.ok) throw new Error('Failed to fetch organization members');
    return response.json();
  }
}

class TagAPI {
  async getTags(organizationSlug) {
    const response = await fetch(
      `${API_BASE}/contact-tags?organization_slug=${organizationSlug}`
    );
    if (!response.ok) throw new Error('Failed to fetch tags');
    return response.json();
  }

  async createTag(organizationSlug, data) {
    const response = await fetch(`${API_BASE}/contact-tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        organization_slug: organizationSlug,
      }),
    });
    if (!response.ok) throw new Error('Failed to create tag');
    return response.json();
  }

  async updateTag(tagId, organizationSlug, data) {
    const response = await fetch(`${API_BASE}/contact-tags/${tagId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        organization_slug: organizationSlug,
      }),
    });
    if (!response.ok) throw new Error('Failed to update tag');
    return response.json();
  }

  async deleteTag(tagId, organizationSlug) {
    const response = await fetch(
      `${API_BASE}/contact-tags/${tagId}?organization_slug=${organizationSlug}`,
      { method: 'DELETE' }
    );
    if (!response.ok) throw new Error('Failed to delete tag');
    return response.json();
  }

  async getContactTags(contactId, organizationSlug) {
    const response = await fetch(
      `${API_BASE}/contacts/${contactId}/tags?organization_slug=${organizationSlug}`
    );
    if (!response.ok) throw new Error('Failed to fetch contact tags');
    return response.json();
  }

  async assignTagsToContact(contactId, tagIds) {
    const response = await fetch(`${API_BASE}/contacts/${contactId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag_ids: tagIds }),
    });
    if (!response.ok) throw new Error('Failed to assign tags to contact');
    return response.json();
  }
}

class ContactTypeAPI {
  async getContactTypes(organizationSlug) {
    const response = await fetch(
      `${API_BASE}/contact-types?organization_slug=${organizationSlug}`
    );
    if (!response.ok) throw new Error('Failed to fetch contact types');
    return response.json();
  }

  async createContactType(organizationSlug, data) {
    const response = await fetch(`${API_BASE}/contact-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        organization_slug: organizationSlug,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create contact type');
    }
    return response.json();
  }

  async updateContactType(organizationSlug, typeId, data) {
    const response = await fetch(`${API_BASE}/contact-types/${typeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        organization_slug: organizationSlug,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update contact type');
    }
    return response.json();
  }

  async deleteContactType(organizationSlug, typeId) {
    const response = await fetch(
      `${API_BASE}/contact-types/${typeId}?organization_slug=${organizationSlug}`,
      { method: 'DELETE' }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete contact type');
    }
    return response.json();
  }
}

// Export singleton instances
export const contactAPI = new ContactAPI();
export const stageAPI = new StageAPI();
export const channelAPI = new ChannelAPI();
export const organizationAPI = new OrganizationAPI();
export const tagAPI = new TagAPI();
export const contactTypeAPI = new ContactTypeAPI();
