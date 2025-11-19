/**
 * FilterPanel Component
 * Advanced filter options for contacts
 * Styled with Tailwind CSS
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import TagBadge from './TagBadge';

const CONTACT_TYPES = [
  { id: 'customer', label: 'Customer' },
  { id: 'supplier', label: 'Supplier' },
  { id: 'coi', label: 'COI' },
  { id: 'internal', label: 'Internal' },
];

export default function FilterPanel({ filters, onFiltersChange, stages = [], channels = [], tags = [] }) {
  const [expandedSections, setExpandedSections] = useState({
    contactType: true,
    stage: true,
    channel: true,
    tags: true,
  });

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

  const handleClearFilters = () => {
    onFiltersChange({
      contactTypes: [],
      stages: [],
      channels: [],
      tags: [],
    });
  };

  const hasActiveFilters =
    filters.contactTypes.length > 0 ||
    filters.stages.length > 0 ||
    filters.channels.length > 0 ||
    filters.tags?.length > 0;

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all
            </button>
          )}
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
  );
}
