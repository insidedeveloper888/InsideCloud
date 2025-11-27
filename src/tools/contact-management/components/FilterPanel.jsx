/**
 * Contact FilterPanel - Uses shared FilterPanel components
 * Maintains backward compatibility with existing onFiltersChange(filters) API
 *
 * Features:
 * - Dynamic rating ranges based on maxRatingScale setting
 * - Stage color dots via custom renderOption
 * - TagBadge component for tag pills
 */

import React, { useMemo } from 'react';
import { FilterPanel, FilterSection } from '../../../components/ui/filter-panel';
import { CheckboxFilter } from '../../../components/ui/filters';
import TagBadge from './TagBadge';

// Static contact types
const CONTACT_TYPES = [
  { id: 'customer', label: 'Customer' },
  { id: 'supplier', label: 'Supplier' },
  { id: 'coi', label: 'COI' },
  { id: 'internal', label: 'Internal' },
];

export default function ContactFilterPanel({
  filters,
  onFiltersChange,
  stages = [],
  channels = [],
  tags = [],
  maxRatingScale = 10,
  isOpen = true,
  onClose = () => {},
}) {
  // Generate rating ranges dynamically based on maxRatingScale
  const ratingRanges = useMemo(() => {
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
  }, [maxRatingScale]);

  // Check if any filters are active
  const hasActiveFilters =
    (filters.contactTypes?.length > 0) ||
    (filters.stages?.length > 0) ||
    (filters.channels?.length > 0) ||
    (filters.tags?.length > 0) ||
    (filters.ratings?.length > 0);

  // Clear all filters
  const handleClearAll = () => {
    onFiltersChange({
      contactTypes: [],
      stages: [],
      channels: [],
      tags: [],
      ratings: [],
    });
  };

  return (
    <FilterPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Filters"
      position="left"
      width={256}
      hasActiveFilters={hasActiveFilters}
      onClearAll={handleClearAll}
      showCloseButton={false}
    >
      {/* Contact Type */}
      <FilterSection
        title="Contact Type"
        defaultExpanded={true}
        activeCount={filters.contactTypes?.length || 0}
      >
        <CheckboxFilter
          options={CONTACT_TYPES}
          selected={filters.contactTypes || []}
          onChange={(selected) => onFiltersChange({ ...filters, contactTypes: selected })}
        />
      </FilterSection>

      {/* Stage */}
      {stages.length > 0 && (
        <FilterSection
          title="Stage"
          defaultExpanded={true}
          activeCount={filters.stages?.length || 0}
        >
          <CheckboxFilter
            options={stages}
            selected={filters.stages || []}
            onChange={(selected) => onFiltersChange({ ...filters, stages: selected })}
            renderOption={(stage) => (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: stage.color || '#9CA3AF' }}
                />
                <span className="text-sm text-gray-700">{stage.name}</span>
              </div>
            )}
            maxHeight="192px"
          />
        </FilterSection>
      )}

      {/* Traffic Source */}
      {channels.length > 0 && (
        <FilterSection
          title="Traffic Source"
          defaultExpanded={true}
          activeCount={filters.channels?.length || 0}
        >
          <CheckboxFilter
            options={channels}
            selected={filters.channels || []}
            onChange={(selected) => onFiltersChange({ ...filters, channels: selected })}
            labelKey="name"
            maxHeight="192px"
          />
        </FilterSection>
      )}

      {/* Customer Rating */}
      <FilterSection
        title="Customer Rating"
        defaultExpanded={true}
        activeCount={filters.ratings?.length || 0}
      >
        <p className="text-xs text-gray-500 mb-2">
          Filter customers by conversion probability rating
        </p>
        <CheckboxFilter
          options={ratingRanges}
          selected={filters.ratings || []}
          onChange={(selected) => onFiltersChange({ ...filters, ratings: selected })}
        />
      </FilterSection>

      {/* Tags */}
      {tags.length > 0 && (
        <FilterSection
          title="Tags"
          defaultExpanded={true}
          activeCount={filters.tags?.length || 0}
        >
          <CheckboxFilter
            options={tags}
            selected={filters.tags || []}
            onChange={(selected) => onFiltersChange({ ...filters, tags: selected })}
            renderOption={(tag) => <TagBadge tag={tag} size="xs" />}
            maxHeight="192px"
          />
        </FilterSection>
      )}
    </FilterPanel>
  );
}
