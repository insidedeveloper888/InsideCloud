/**
 * Contact List View - Clean Tailwind Design
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, Grid, List, Filter, Upload, FileText, ShoppingCart, Truck, Receipt } from 'lucide-react';
import ContactFormDialog from './ContactFormDialog';
import ContactAvatar from './ContactAvatar';
import FilterPanel from './FilterPanel';
import TagBadge from './TagBadge';
import ContactImportDialog from './ContactImportDialog';
import DataQualityAlerts from './DataQualityAlerts';
import StarRating from './StarRating';
import { useCurrentUser } from '../hooks/useCurrentUser';

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
  maxRatingScale = 10,
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [dataQualityFilter, setDataQualityFilter] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null }); // null, 'asc', 'desc'

  // Get current user for import
  const { individualId } = useCurrentUser();

  // Filter state
  const [filters, setFilters] = useState({
    contactTypes: [],
    stages: [],
    channels: [],
    tags: [],
    ratings: [],
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
    // Data quality filter (takes precedence)
    if (dataQualityFilter) {
      switch (dataQualityFilter) {
        case 'companies-no-name':
          if (contact.entity_type !== 'company' || contact.company_name?.trim()) {
            return false;
          }
          break;
        case 'companies-no-industry':
          if (contact.entity_type !== 'company' || contact.industry?.trim()) {
            return false;
          }
          break;
        case 'companies-incomplete-address':
          if (contact.entity_type !== 'company') {
            return false;
          }
          const hasCompleteAddress =
            contact.address_line_1?.trim() &&
            contact.address_line_2?.trim() &&
            contact.postal_code?.trim() &&
            contact.city?.trim() &&
            contact.state?.trim();
          if (hasCompleteAddress) {
            return false;
          }
          break;
        case 'customers-no-sales':
          if (contact.contact_type !== 'customer' || contact.assigned_to_individual_id) {
            return false;
          }
          break;
        case 'customers-no-service':
          if (contact.contact_type !== 'customer' || contact.assigned_department?.trim()) {
            return false;
          }
          break;
        case 'customers-no-channel':
          if (contact.contact_type !== 'customer' || contact.traffic_source_id) {
            return false;
          }
          break;
        default:
          break;
      }
    }

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

    // Rating filter - only applies to customers with ratings
    if (filters.ratings?.length > 0) {
      if (contact.contact_type !== 'customer' || !contact.rating) {
        return false;
      }

      // Define rating ranges (same logic as FilterPanel)
      const getRatingRange = (rating) => {
        const max = maxRatingScale;
        if (max <= 3) {
          if (rating === 1) return 'low';
          if (rating === 2) return 'medium';
          if (rating === 3) return 'high';
        } else if (max <= 5) {
          if (rating <= 2) return 'low';
          if (rating === 3) return 'medium';
          if (rating >= 4) return 'high';
        } else {
          const lowMax = Math.floor(max / 3);
          const mediumMax = Math.floor((2 * max) / 3);
          if (rating <= lowMax) return 'low';
          if (rating <= mediumMax) return 'medium';
          return 'high';
        }
        return null;
      };

      const contactRatingRange = getRatingRange(contact.rating);
      if (!filters.ratings.includes(contactRatingRange)) {
        return false;
      }
    }

    return true;
  });

  // Sorting logic
  const handleSort = (key) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.key !== key) {
        // New column - start with ascending
        return { key, direction: 'asc' };
      } else if (prevConfig.direction === 'asc') {
        // Second click - change to descending
        return { key, direction: 'desc' };
      } else if (prevConfig.direction === 'desc') {
        // Third click - remove sort
        return { key: null, direction: null };
      }
      return prevConfig;
    });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    if (sortConfig.direction === 'asc') return '↑';
    if (sortConfig.direction === 'desc') return '↓';
    return null;
  };

  // Apply sorting to filtered contacts
  const sortedContacts = React.useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return filteredContacts;
    }

    return [...filteredContacts].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'name':
          aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
          bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
          break;
        case 'type':
          aValue = a.contact_type || '';
          bValue = b.contact_type || '';
          break;
        case 'company':
          aValue = a.company_name?.toLowerCase() || '';
          bValue = b.company_name?.toLowerCase() || '';
          break;
        case 'stage':
          const stageA = stages.find(s => s.id === a.current_stage_id);
          const stageB = stages.find(s => s.id === b.current_stage_id);
          aValue = stageA?.name?.toLowerCase() || '';
          bValue = stageB?.name?.toLowerCase() || '';
          break;
        case 'source':
          const channelA = channels.find(c => c.id === a.traffic_source_id);
          const channelB = channels.find(c => c.id === b.traffic_source_id);
          aValue = channelA?.name?.toLowerCase() || '';
          bValue = channelB?.name?.toLowerCase() || '';
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredContacts, sortConfig, stages, channels]);

  // Pagination
  const totalPages = Math.ceil(sortedContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContacts = sortedContacts.slice(startIndex, endIndex);

  // Reset to page 1 when search changes or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(Number(newItemsPerPage));
  };

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

  // Quick Sales Actions - Navigate to sales_management with pre-filled customer
  const handleQuickQuote = (contactId) => {
    navigate(`/sales_management?dialog=quotation&customer_id=${contactId}`);
  };

  const handleQuickSalesOrder = (contactId) => {
    navigate(`/sales_management?dialog=sales_order&customer_id=${contactId}`);
  };

  const handleQuickDeliveryOrder = (contactId) => {
    navigate(`/sales_management?dialog=delivery_order&customer_id=${contactId}`);
  };

  const handleQuickInvoice = (contactId) => {
    navigate(`/sales_management?dialog=invoice&customer_id=${contactId}`);
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
        maxRatingScale={maxRatingScale}
      />

      <ContactImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        organizationSlug={organizationSlug}
        individualId={individualId}
        onSuccess={onRefresh}
      />

    <div className="flex h-full">
      {/* Filter Panel - Responsive: Drawer on mobile, sidebar on desktop */}
      <FilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        stages={stages}
        channels={channels}
        tags={tags}
        maxRatingScale={maxRatingScale}
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
      />

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Data Quality Alerts */}
        <DataQualityAlerts
          organizationSlug={organizationSlug}
          onAlertClick={(filterType) => {
            setDataQualityFilter(filterType);
            setCurrentPage(1);
          }}
        />

        {/* Active Data Quality Filter Badge */}
        {dataQualityFilter && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-900 font-medium">
                {dataQualityFilter === 'companies-no-name' && 'Missing Company Name'}
                {dataQualityFilter === 'companies-no-industry' && 'Missing Industry'}
                {dataQualityFilter === 'companies-incomplete-address' && 'Incomplete Address'}
                {dataQualityFilter === 'customers-no-sales' && 'No Sales Person'}
                {dataQualityFilter === 'customers-no-service' && 'No Customer Service'}
              </span>
              <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                {filteredContacts.length}
              </span>
            </div>
            <button
              onClick={() => setDataQualityFilter(null)}
              className="px-2 py-1 text-xs text-blue-700 hover:bg-blue-100 rounded transition-colors font-medium"
            >
              Clear
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* Contact Count and Toolbar Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Contact Count and Items Per Page Control */}
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm text-gray-600">
              {filteredContacts.length > 0
                ? `Found ${filteredContacts.length} contacts ${
                    totalPages > 1 ? `(Page ${currentPage} / ${totalPages})` : ''
                  }`
                : 'No contacts'}
            </p>

            {filteredContacts.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(e.target.value)}
                  className="text-xs px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span className="text-xs text-gray-500">per page</span>
              </div>
            )}
          </div>

          {/* Compact Toolbar Buttons - Full width on mobile, auto on desktop */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all flex-1 sm:flex-initial ${
                showFilters
                  ? 'bg-gray-900 border-gray-900 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }`}
              title="Toggle filters"
            >
              <Filter size={14} />
              <span className="hidden sm:inline">Filter</span>
              {(filters.contactTypes.length > 0 || filters.stages.length > 0 || filters.channels.length > 0 || filters.tags?.length > 0) && (
                <span className={`px-1.5 py-0.5 text-xs rounded-md font-semibold ${
                  showFilters ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
                }`}>
                  {filters.contactTypes.length + filters.stages.length + filters.channels.length + (filters.tags?.length || 0)}
                </span>
              )}
            </button>

            {/* View Mode Toggle */}
            <div className="inline-flex items-center bg-gray-100 rounded-md p-0.5 flex-1 sm:flex-initial">
              <button
                onClick={() => handleViewModeChange('table')}
                className={`inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded flex-1 ${
                  viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                } transition-all`}
                title="Table view"
              >
                <List size={14} />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => handleViewModeChange('card')}
                className={`inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded flex-1 ${
                  viewMode === 'card'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                } transition-all`}
                title="Card view"
              >
                <Grid size={14} />
                <span className="hidden sm:inline">Card</span>
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 hidden sm:block" />

            {/* Import Button */}
            <button
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all flex-1 sm:flex-initial"
              title="Import contacts"
            >
              <Upload size={14} />
              <span className="hidden sm:inline">Import</span>
            </button>

            {/* Add Button */}
            <button
              onClick={handleAddClick}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all shadow-sm flex-1 sm:flex-initial"
              title="Add contact"
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </div>
        </div>

      {/* Contact List - Table View */}
      {viewMode === 'table' && filteredContacts.length > 0 ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th
                    onClick={() => handleSort('name')}
                    className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-gray-700 tracking-wide cursor-pointer hover:bg-gray-200 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Name</span>
                      {getSortIndicator('name') && (
                        <span className="text-blue-600 font-bold">{getSortIndicator('name')}</span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('type')}
                    className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-gray-700 tracking-wide cursor-pointer hover:bg-gray-200 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Type</span>
                      {getSortIndicator('type') && (
                        <span className="text-blue-600 font-bold">{getSortIndicator('type')}</span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('company')}
                    className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-700 tracking-wide cursor-pointer hover:bg-gray-200 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Company</span>
                      {getSortIndicator('company') && (
                        <span className="text-blue-600 font-bold">{getSortIndicator('company')}</span>
                      )}
                    </div>
                  </th>
                  <th className="hidden md:table-cell px-3 md:px-4 py-3 text-left text-xs font-semibold text-gray-700 tracking-wide">
                    Contact
                  </th>
                  <th
                    onClick={() => handleSort('stage')}
                    className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-gray-700 tracking-wide cursor-pointer hover:bg-gray-200 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Stage</span>
                      {getSortIndicator('stage') && (
                        <span className="text-blue-600 font-bold">{getSortIndicator('stage')}</span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('source')}
                    className="hidden xl:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-700 tracking-wide cursor-pointer hover:bg-gray-200 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Source</span>
                      {getSortIndicator('source') && (
                        <span className="text-blue-600 font-bold">{getSortIndicator('source')}</span>
                      )}
                    </div>
                  </th>
                  <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-700 tracking-wide">
                    Tags
                  </th>
                  <th
                    onClick={() => handleSort('rating')}
                    className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-700 tracking-wide cursor-pointer hover:bg-gray-200 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Rating</span>
                      {getSortIndicator('rating') && (
                        <span className="text-blue-600 font-bold">{getSortIndicator('rating')}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-3 md:px-4 py-3 text-right text-xs font-semibold text-gray-700 tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedContacts.map((contact) => {
                  const stage = stages.find((s) => s.id === contact.current_stage_id);
                  const channel = channels.find((c) => c.id === contact.traffic_source_id);

                  return (
                    <tr key={contact.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-3 md:px-4 py-3">
                        <div className="flex items-center gap-2 md:gap-3">
                          <ContactAvatar
                            firstName={contact.first_name}
                            lastName={contact.last_name}
                            avatarUrl={contact.avatar_url}
                            avatarColor={contact.avatar_color}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 text-sm md:text-base truncate">
                              {contact.first_name} {contact.last_name}
                            </div>
                            {contact.nickname && (
                              <div className="text-gray-500 text-xs md:text-sm truncate">{contact.nickname}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3">
                        <span className="inline-flex items-center px-2 md:px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 whitespace-nowrap">
                          {getContactTypeLabel(contact.contact_type)}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3">
                        <span className="text-sm text-gray-900">{contact.company_name || '-'}</span>
                      </td>
                      <td className="hidden md:table-cell px-3 md:px-4 py-3">
                        <div className="text-xs md:text-sm text-gray-600 space-y-0.5">
                          {contact.phone_1 && <div className="truncate">📞 {contact.phone_1}</div>}
                          {contact.email && <div className="truncate">📧 {contact.email}</div>}
                          {!contact.phone_1 && !contact.email && <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3">
                        {stage ? (
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: stage.color }}
                            />
                            <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                              {stage.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="hidden xl:table-cell px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {channel ? channel.name : '-'}
                        </span>
                      </td>
                      <td className="hidden xl:table-cell px-4 py-3">
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
                      <td className="hidden lg:table-cell px-4 py-3">
                        {contact.contact_type === 'customer' && contact.rating ? (
                          <StarRating
                            rating={contact.rating}
                            maxRating={maxRatingScale}
                            size={16}
                            readonly={true}
                            showLabel={false}
                          />
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 md:px-4 py-3">
                        <div className="flex justify-end gap-1 md:gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Quick Sales Actions - Only show for customers */}
                          {contact.contact_type === 'customer' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickQuote(contact.id);
                                }}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Quick Quote"
                              >
                                <FileText size={16} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickSalesOrder(contact.id);
                                }}
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Quick Sales Order"
                              >
                                <ShoppingCart size={16} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickDeliveryOrder(contact.id);
                                }}
                                className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                title="Quick Delivery Order"
                              >
                                <Truck size={16} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickInvoice(contact.id);
                                }}
                                className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                title="Quick Invoice"
                              >
                                <Receipt size={16} />
                              </button>
                              <div className="w-px h-5 bg-gray-200 mx-0.5" />
                            </>
                          )}
                          <button
                            onClick={() => handleEditClick(contact)}
                            className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
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
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
        <div className="space-y-3 md:space-y-4">
          {paginatedContacts.map((contact) => {
            const stage = stages.find((s) => s.id === contact.current_stage_id);
            const channel = channels.find((c) => c.id === contact.traffic_source_id);

            return (
              <div
                key={contact.id}
                className="border border-gray-200 rounded-lg p-4 md:p-5 hover:shadow-md active:shadow-lg transition-all bg-white flex flex-col"
              >
                {/* Name and Badges */}
                <div className="flex items-start gap-3 mb-3">
                  <ContactAvatar
                    firstName={contact.first_name}
                    lastName={contact.last_name}
                    avatarUrl={contact.avatar_url}
                    avatarColor={contact.avatar_color}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 break-words">
                      {contact.first_name} {contact.last_name}
                    </h3>
                    {contact.nickname && (
                      <div className="text-gray-500 text-sm mt-1 break-words">{contact.nickname}</div>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap items-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        {getContactTypeLabel(contact.contact_type)}
                      </span>
                      {stage && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: stage.color }}
                          />
                          <span className="text-xs font-medium text-gray-700">
                            {stage.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Details with better touch targets */}
                <div className="space-y-2 md:space-y-2.5 text-sm md:text-base text-gray-600 mb-3">
                  {contact.phone_1 && (
                    <a
                      href={`tel:${contact.phone_1}`}
                      className="flex items-center gap-2.5 py-1 hover:text-blue-600 active:text-blue-700 transition-colors touch-manipulation"
                    >
                      <span className="text-lg">☎️</span>
                      <span className="break-all">{contact.phone_1}</span>
                    </a>
                  )}
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-2.5 py-1 hover:text-blue-600 active:text-blue-700 transition-colors touch-manipulation break-all"
                    >
                      <span className="text-lg shrink-0">📧</span>
                      <span className="break-all">{contact.email}</span>
                    </a>
                  )}
                  {channel && (
                    <div className="flex items-center gap-2.5 py-1">
                      <span className="text-lg">🌐</span>
                      <span>{channel.name}</span>
                    </div>
                  )}
                  {contact.company_name && (
                    <div className="flex items-center gap-2.5 py-1">
                      <span className="text-lg">🏢</span>
                      <span className="break-words">{contact.company_name}</span>
                    </div>
                  )}
                  {contact.contact_type === 'customer' && contact.rating && (
                    <div className="flex items-center gap-2.5 py-1">
                      <span className="text-lg">⭐</span>
                      <StarRating
                        rating={contact.rating}
                        maxRating={maxRatingScale}
                        size={18}
                        readonly={true}
                        showLabel={true}
                      />
                    </div>
                  )}
                </div>

                {/* Tags */}
                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-3 mb-3 border-b border-gray-100">
                    {contact.tags.map((tag) => (
                      <TagBadge key={tag.id} tag={tag} size="xs" />
                    ))}
                  </div>
                )}

                {/* Quick Sales Actions (only for customers) */}
                {contact.contact_type === 'customer' && (
                  <div className="grid grid-cols-4 gap-2 mt-auto pt-2 border-b border-gray-100 pb-3 mb-3">
                    <button
                      onClick={() => handleQuickQuote(contact.id)}
                      className="flex flex-col items-center justify-center gap-1 px-2 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 rounded-lg transition-all touch-manipulation text-xs font-medium"
                      title="Quick Quote"
                    >
                      <FileText size={18} />
                      <span>Quote</span>
                    </button>
                    <button
                      onClick={() => handleQuickSalesOrder(contact.id)}
                      className="flex flex-col items-center justify-center gap-1 px-2 py-2 text-green-600 bg-green-50 hover:bg-green-100 active:bg-green-200 rounded-lg transition-all touch-manipulation text-xs font-medium"
                      title="Quick Sales Order"
                    >
                      <ShoppingCart size={18} />
                      <span>SO</span>
                    </button>
                    <button
                      onClick={() => handleQuickDeliveryOrder(contact.id)}
                      className="flex flex-col items-center justify-center gap-1 px-2 py-2 text-orange-600 bg-orange-50 hover:bg-orange-100 active:bg-orange-200 rounded-lg transition-all touch-manipulation text-xs font-medium"
                      title="Quick Delivery Order"
                    >
                      <Truck size={18} />
                      <span>DO</span>
                    </button>
                    <button
                      onClick={() => handleQuickInvoice(contact.id)}
                      className="flex flex-col items-center justify-center gap-1 px-2 py-2 text-purple-600 bg-purple-50 hover:bg-purple-100 active:bg-purple-200 rounded-lg transition-all touch-manipulation text-xs font-medium"
                      title="Quick Invoice"
                    >
                      <Receipt size={18} />
                      <span>Invoice</span>
                    </button>
                  </div>
                )}

                {/* Action buttons at bottom - Full width on mobile, horizontal on desktop */}
                <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
                  <button
                    onClick={() => handleEditClick(contact)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 md:py-2 text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-300 rounded-lg transition-all touch-manipulation font-medium text-sm shadow-sm"
                  >
                    <Edit size={16} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('确定要删除此联系人吗？')) {
                        onDeleteContact(contact.id);
                      }
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 md:py-2 text-gray-600 bg-white hover:bg-gray-50 hover:text-red-600 active:bg-red-50 border border-gray-300 hover:border-red-300 rounded-lg transition-all touch-manipulation font-medium text-sm shadow-sm"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Pagination Controls */}
      {filteredContacts.length > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-2">
          {/* Mobile: Simplified pagination with prev/next and page number */}
          <div className="sm:hidden flex items-center gap-3 w-full justify-between">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
            >
              Previous
            </button>

            <span className="text-sm text-gray-600 font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
            >
              Next
            </button>
          </div>

          {/* Desktop: Full pagination with all page numbers */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
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
                    className={`min-w-[40px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
              Next
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredContacts.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
            <span className="text-3xl opacity-40">📇</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No contacts found</h3>
          <p className="text-sm text-gray-500 mb-6">Get started by adding your first contact</p>
          <button
            onClick={handleAddClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-sm hover:shadow-md"
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
