/**
 * Contact List View - Clean Tailwind Design
 */

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Grid, List, Filter, Upload } from 'lucide-react';
import ContactFormDialog from './ContactFormDialog';
import ContactAvatar from './ContactAvatar';
import FilterPanel from './FilterPanel';
import TagBadge from './TagBadge';
import ContactImportDialog from './ContactImportDialog';
import { useCurrentUser } from '../hooks/useCurrentUser';

const ITEMS_PER_PAGE = 10;

export default function ContactListView({
  contacts = [],
  stages = [],
  channels = [],
  tags = [],
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onRefresh,
  onCreateTag,
  organizationSlug,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Get current user for import
  const { individualId } = useCurrentUser();

  // Filter state
  const [filters, setFilters] = useState({
    contactTypes: [],
    stages: [],
    channels: [],
    tags: [],
  });

  // View mode: 'card' or 'table'
  const [viewMode, setViewMode] = useState(() => {
    // Default based on screen size
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 ? 'table' : 'card';
    }
    return 'table';
  });

  // Update view mode on window resize
  useEffect(() => {
    const handleResize = () => {
      // Only auto-switch if user hasn't manually changed it
      const userPreference = localStorage.getItem('contactViewMode');
      if (!userPreference) {
        setViewMode(window.innerWidth >= 768 ? 'table' : 'card');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('contactViewMode', mode);
  };

  const filteredContacts = contacts.filter((contact) => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.phone_1?.includes(query) ||
        contact.company_name?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Contact type filter
    if (filters.contactTypes.length > 0) {
      if (!filters.contactTypes.includes(contact.contact_type)) return false;
    }

    // Stage filter
    if (filters.stages.length > 0) {
      if (!filters.stages.includes(contact.current_stage_id)) return false;
    }

    // Channel filter
    if (filters.channels.length > 0) {
      if (!filters.channels.includes(contact.traffic_source_id)) return false;
    }

    // Tag filter - contact must have at least one selected tag
    if (filters.tags?.length > 0) {
      const hasSelectedTag = contact.tags?.some(tag => filters.tags.includes(tag.id));
      if (!hasSelectedTag) return false;
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredContacts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const getContactTypeLabel = (type) => {
    switch (type) {
      case 'customer':
        return 'Customer';
      case 'supplier':
        return 'Supplier';
      case 'coi':
        return 'COI';
      case 'internal':
        return 'Internal';
      default:
        return type;
    }
  };

  const handleAddClick = () => {
    setEditingContact(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (contact) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  };

  const handleSaveContact = async (formData) => {
    console.log('handleSaveContact called with:', formData);
    console.log('editingContact:', editingContact);
    try {
      if (editingContact) {
        // Update existing contact
        console.log('Calling onUpdateContact with id:', editingContact.id);
        await onUpdateContact(editingContact.id, formData);
      } else {
        // Add new contact
        console.log('Calling onAddContact');
        await onAddContact(formData);
      }
    } catch (error) {
      console.error('handleSaveContact error:', error);
      throw error;
    }
  };

  return (
    <>
      <ContactFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveContact}
        onRefresh={onRefresh}
        contact={editingContact}
        contacts={contacts}
        stages={stages}
        channels={channels}
        availableTags={tags}
        onCreateTag={onCreateTag}
        organizationSlug={organizationSlug}
      />

      <ContactImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        organizationSlug={organizationSlug}
        individualId={individualId}
        onSuccess={onRefresh}
      />

    <div className="flex h-full">
      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          stages={stages}
          channels={channels}
          tags={tags}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Search Bar and Actions */}
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 font-medium transition-colors ${
              showFilters
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter size={18} />
            <span>Filters</span>
            {(filters.contactTypes.length > 0 || filters.stages.length > 0 || filters.channels.length > 0 || filters.tags?.length > 0) && (
              <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {filters.contactTypes.length + filters.stages.length + filters.channels.length + (filters.tags?.length || 0)}
              </span>
            )}
          </button>

          {/* View Mode Toggle */}
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => handleViewModeChange('table')}
            className={`p-2 ${
              viewMode === 'table'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            } transition-colors`}
            title="List view"
          >
            <List size={20} />
          </button>
          <button
            onClick={() => handleViewModeChange('card')}
            className={`p-2 border-l border-gray-300 ${
              viewMode === 'card'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            } transition-colors`}
            title="Card view"
          >
            <Grid size={20} />
          </button>
        </div>

        <button
          onClick={() => setIsImportOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Upload size={20} />
          <span>Import</span>
        </button>

        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={20} />
          <span>Add contact</span>
        </button>
      </div>

      {/* Contact Count and Pagination Info */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {filteredContacts.length > 0
            ? `Found ${filteredContacts.length} contacts ${
                totalPages > 1 ? `(Page ${currentPage} / ${totalPages})` : ''
              }`
            : 'No contacts'}
        </p>
      </div>

      {/* Contact List - Table View */}
      {viewMode === 'table' && filteredContacts.length > 0 ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Contact information
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedContacts.map((contact) => {
                  const stage = stages.find((s) => s.id === contact.current_stage_id);
                  const channel = channels.find((c) => c.id === contact.traffic_source_id);

                  return (
                    <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ContactAvatar
                            firstName={contact.first_name}
                            lastName={contact.last_name}
                            avatarUrl={contact.avatar_url}
                            avatarColor={contact.avatar_color}
                            size="sm"
                          />
                          <div>
                            <div className="font-medium text-gray-900">
                              {contact.first_name} {contact.last_name}
                            </div>
                            {contact.nickname && (
                              <div className="text-gray-500 text-sm">{contact.nickname}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          {getContactTypeLabel(contact.contact_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">{contact.company_name || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600 space-y-0.5">
                          {contact.phone_1 && <div>📞 {contact.phone_1}</div>}
                          {contact.email && <div>📧 {contact.email}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {stage ? (
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border"
                            style={{
                              backgroundColor: `${stage.color}20`,
                              color: stage.color,
                              borderColor: stage.color,
                            }}
                          >
                            {stage.name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {channel ? channel.name : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {contact.tags && contact.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {contact.tags.slice(0, 2).map((tag) => (
                              <TagBadge key={tag.id} tag={tag} size="xs" />
                            ))}
                            {contact.tags.length > 2 && (
                              <span className="text-xs text-gray-500 px-1">
                                +{contact.tags.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(contact)}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this contact?')) {
                                onDeleteContact(contact.id);
                              }
                            }}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Contact List - Card View */}
      {viewMode === 'card' && filteredContacts.length > 0 ? (
        <div className="space-y-3">
          {paginatedContacts.map((contact) => {
            const stage = stages.find((s) => s.id === contact.current_stage_id);
            const channel = channels.find((c) => c.id === contact.traffic_source_id);

            return (
              <div
                key={contact.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
              >
                <div className="space-y-3">
                  {/* Name and Actions */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 flex-1">
                      <ContactAvatar
                        firstName={contact.first_name}
                        lastName={contact.last_name}
                        avatarUrl={contact.avatar_url}
                        avatarColor={contact.avatar_color}
                        size="md"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {contact.first_name} {contact.last_name}
                        </h3>
                        {contact.nickname && (
                          <div className="text-gray-500 text-sm mt-1">{contact.nickname}</div>
                        )}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          {getContactTypeLabel(contact.contact_type)}
                        </span>
                        {stage && (
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border"
                            style={{
                              backgroundColor: `${stage.color}20`,
                              color: stage.color,
                              borderColor: stage.color,
                            }}
                          >
                            {stage.name}
                          </span>
                        )}
                      </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditClick(contact)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('确定要删除此联系人吗？')) {
                            onDeleteContact(contact.id);
                          }
                        }}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-1.5 text-sm text-gray-600">
                    {contact.phone_1 && (
                      <div className="flex items-center gap-2">
                        <span>☎️</span>
                        <span>{contact.phone_1}</span>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <span>📧</span>
                        <span>{contact.email}</span>
                      </div>
                    )}
                    {channel && (
                      <div className="flex items-center gap-2">
                        <span>🌐</span>
                        <span>{channel.name}</span>
                      </div>
                    )}
                    {contact.company_name && (
                      <div className="flex items-center gap-2">
                        <span>🏢</span>
                        <span>{contact.company_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {contact.tags && contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                      {contact.tags.map((tag) => (
                        <TagBadge key={tag.id} tag={tag} size="xs" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Pagination Controls */}
      {filteredContacts.length > 0 && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous page
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first, last, current, and adjacent pages
              const showPage =
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1;

              if (!showPage && page === 2) {
                return <span key={page} className="px-2 py-2 text-gray-400">...</span>;
              }
              if (!showPage && page === totalPages - 1) {
                return <span key={page} className="px-2 py-2 text-gray-400">...</span>;
              }
              if (!showPage) return null;

              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next page
          </button>
        </div>
      )}

      {/* Empty State */}
      {filteredContacts.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <span className="text-3xl">📇</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No contacts</h3>
          <p className="text-gray-600 mb-6">Start adding your first contact</p>
          <button
            onClick={handleAddClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={20} />
            <span>Add contact</span>
          </button>
        </div>
      )}
      </div>
    </div>
    </>
  );
}
