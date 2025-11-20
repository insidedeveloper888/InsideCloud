/**
 * FilterPanel Component
 * Advanced filter options for contacts
 * Styled with Tailwind CSS
 * Responsive: Drawer on mobile, sidebar on desktop
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import TagBadge from './TagBadge';

const CONTACT_TYPES = [
  { id: 'customer', label: 'Customer' },
  { id: 'supplier', label: 'Supplier' },
  { id: 'coi', label: 'COI' },
  { id: 'internal', label: 'Internal' },
];

export default function FilterPanel({
  filters,
  onFiltersChange,
  stages = [],
  channels = [],
  tags = [],
  maxRatingScale = 10,
  isOpen = true,
  onClose = () => {}
}) {
  const [expandedSections, setExpandedSections] = useState({
    contactType: true,
    stage: true,
    channel: true,
    tags: true,
    rating: true,
  });

  // Generate rating ranges dynamically based on maxRatingScale
  const getRatingRanges = () => {
    const max = maxRatingScale;
    if (max <= 3) {
      return [
        { id: 'low', label: 'Low (1)', min: 1, max: 1 },
        { id: 'medium', label: 'Medium (2)', min: 2, max: 2 },
        { id: 'high', label: 'High (3)', min: 3, max: 3 },
      ];
    } else if (max <= 5) {
      return [
        { id: 'low', label: 'Low (1-2)', min: 1, max: 2 },
        { id: 'medium', label: 'Medium (3)', min: 3, max: 3 },
        { id: 'high', label: 'High (4-5)', min: 4, max: 5 },
      ];
    } else {
      // For 6-10 stars, divide into thirds
      const lowMax = Math.floor(max / 3);
      const mediumMax = Math.floor((2 * max) / 3);
      return [
        { id: 'low', label: `Low (1-${lowMax})`, min: 1, max: lowMax },
        { id: 'medium', label: `Medium (${lowMax + 1}-${mediumMax})`, min: lowMax + 1, max: mediumMax },
        { id: 'high', label: `High (${mediumMax + 1}-${max})`, min: mediumMax + 1, max: max },
      ];
    }
  };

  const ratingRanges = getRatingRanges();

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleToggleFilter = (type, value) => {
    const newFilters = {
      ...filters,
      [type]: filters[type].includes(value)
        ? filters[type].filter((v) => v !== value)
        : [...filters[type], value],
    };
    onFiltersChange(newFilters);
  };

  const handleToggleRatingFilter = (rangeId) => {
    const newRatings = filters.ratings?.includes(rangeId)
      ? filters.ratings.filter((r) => r !== rangeId)
      : [...(filters.ratings || []), rangeId];

    onFiltersChange({
      ...filters,
      ratings: newRatings,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      contactTypes: [],
      stages: [],
      channels: [],
      tags: [],
      ratings: [],
    });
  };

  const hasActiveFilters =
    filters.contactTypes.length > 0 ||
    filters.stages.length > 0 ||
    filters.channels.length > 0 ||
    filters.tags?.length > 0 ||
    filters.ratings?.length > 0;

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Don't render if not open on mobile
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile: Overlay backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Filter Panel - Mobile: Drawer, Desktop: Sidebar */}
      <div
        className={`
          fixed md:relative top-0 right-0 h-full w-[85%] max-w-sm md:max-w-none md:w-64
          bg-white md:border-r border-gray-200 flex flex-col
          z-50 md:z-auto
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
          shadow-2xl md:shadow-none
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all
                </button>
              )}
              {/* Close button - Mobile only */}
              <button
                onClick={onClose}
                className="md:hidden p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

      {/* Filter Sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Contact Type Filter */}
        <div className="border-b border-gray-200">
          <button
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection('contactType')}
          >
            <span className="text-sm font-medium text-gray-900">Contact Type</span>
            {expandedSections.contactType ? (
              <ChevronDown size={16} className="text-gray-500" />
            ) : (
              <ChevronRight size={16} className="text-gray-500" />
            )}
          </button>
          {expandedSections.contactType && (
            <div className="px-4 pb-3 space-y-2">
              {CONTACT_TYPES.map((type) => (
                <label key={type.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.contactTypes.includes(type.id)}
                    onChange={() => handleToggleFilter('contactTypes', type.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Stage Filter */}
        {stages.length > 0 && (
          <div className="border-b border-gray-200">
            <button
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection('stage')}
            >
              <span className="text-sm font-medium text-gray-900">Stage</span>
              {expandedSections.stage ? (
                <ChevronDown size={16} className="text-gray-500" />
              ) : (
                <ChevronRight size={16} className="text-gray-500" />
              )}
            </button>
            {expandedSections.stage && (
              <div className="px-4 pb-3 space-y-2">
                {stages.map((stage) => (
                  <label key={stage.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.stages.includes(stage.id)}
                      onChange={() => handleToggleFilter('stages', stage.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color || '#9CA3AF' }}
                      />
                      <span className="text-sm text-gray-700">{stage.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Channel Filter */}
        {channels.length > 0 && (
          <div className="border-b border-gray-200">
            <button
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection('channel')}
            >
              <span className="text-sm font-medium text-gray-900">Traffic Source</span>
              {expandedSections.channel ? (
                <ChevronDown size={16} className="text-gray-500" />
              ) : (
                <ChevronRight size={16} className="text-gray-500" />
              )}
            </button>
            {expandedSections.channel && (
              <div className="px-4 pb-3 space-y-2">
                {channels.map((channel) => (
                  <label key={channel.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.channels.includes(channel.id)}
                      onChange={() => handleToggleFilter('channels', channel.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{channel.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rating Filter - Only for customers */}
        <div className="border-b border-gray-200">
          <button
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection('rating')}
          >
            <span className="text-sm font-medium text-gray-900">Customer Rating</span>
            {expandedSections.rating ? (
              <ChevronDown size={16} className="text-gray-500" />
            ) : (
              <ChevronRight size={16} className="text-gray-500" />
            )}
          </button>
          {expandedSections.rating && (
            <div className="px-4 pb-3 space-y-2">
              <p className="text-xs text-gray-500 mb-2">
                Filter customers by conversion probability rating
              </p>
              {ratingRanges.map((range) => (
                <label key={range.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.ratings?.includes(range.id)}
                    onChange={() => handleToggleRatingFilter(range.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <span
                      className="text-lg"
                      title={`${range.min}-${range.max} stars`}
                    >
                      ⭐
                    </span>
                    <span className="text-sm text-gray-700">{range.label}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Tags Filter */}
        {tags.length > 0 && (
          <div className="border-b border-gray-200">
            <button
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection('tags')}
            >
              <span className="text-sm font-medium text-gray-900">Tags</span>
              {expandedSections.tags ? (
                <ChevronDown size={16} className="text-gray-500" />
              ) : (
                <ChevronRight size={16} className="text-gray-500" />
              )}
            </button>
            {expandedSections.tags && (
              <div className="px-4 pb-3 space-y-2">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.tags?.includes(tag.id)}
                      onChange={() => handleToggleFilter('tags', tag.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <TagBadge tag={tag} size="xs" />
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
