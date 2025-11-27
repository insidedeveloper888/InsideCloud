import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, Search, X, Plus, Loader2 } from 'lucide-react';
import { radius } from '../../lib/design-tokens';

/**
 * SearchableSelect - A flexible, accessible dropdown select component
 *
 * Features:
 * - Search/filter options
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Click outside to close
 * - Custom option rendering
 * - Create new items
 * - Loading and disabled states
 * - Accessible (ARIA)
 *
 * @example Basic usage
 * <SearchableSelect
 *   value={selectedId}
 *   onChange={setSelectedId}
 *   options={items}
 *   getOptionValue={(item) => item.id}
 *   getOptionLabel={(item) => item.name}
 * />
 *
 * @example With custom rendering
 * <SearchableSelect
 *   value={customerId}
 *   onChange={setCustomerId}
 *   options={customers}
 *   getOptionValue={(c) => c.id}
 *   getOptionLabel={(c) => c.name}
 *   renderOption={(customer) => (
 *     <div>
 *       <div className="font-medium">{customer.name}</div>
 *       <div className="text-xs text-gray-500">{customer.email}</div>
 *     </div>
 *   )}
 * />
 */
export function SearchableSelect({
  // Required
  value,
  onChange,
  options = [],

  // Value extraction
  getOptionValue = (option) => option?.id ?? option?.value ?? option,
  getOptionLabel = (option) => option?.name ?? option?.label ?? String(option),

  // Display
  placeholder = 'Select...',

  // Search
  searchable = true,
  searchPlaceholder = 'Search...',
  searchKeys = null, // Array of keys to search, e.g., ['name', 'email']
  filterFn = null, // Custom filter: (option, searchTerm) => boolean

  // Custom rendering
  renderOption = null, // (option, { isSelected, searchTerm }) => ReactNode
  renderSelected = null, // (option) => ReactNode
  renderEmpty = null, // (searchTerm) => ReactNode

  // Clear
  clearable = false,
  onClear = null,

  // Create new
  creatable = false,
  onCreate = null,
  createLabel = (input) => `+ Add "${input}"`,

  // Pre-filter options
  filterOptions = null, // (options) => filteredOptions

  // States
  loading = false,
  disabled = false,
  error = null,

  // Behavior
  closeOnSelect = true,
  closeOnClickOutside = true,
  closeOnEscape = true,
  autoFocusSearch = true,

  // Styling
  className = '',
  triggerClassName = '',
  dropdownClassName = '',
  inputClassName = '',
  optionClassName = '',
  minDropdownWidth = 300,
  maxDropdownHeight = 320,

  // Accessibility
  name = '',
  id = '',
  'aria-label': ariaLabel = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const optionsRef = useRef(null);

  // Get the selected option object
  const selectedOption = useMemo(() => {
    if (value === null || value === undefined || value === '') return null;
    return options.find(opt => getOptionValue(opt) === value) || null;
  }, [value, options, getOptionValue]);

  // Pre-filter options (e.g., filterConverted)
  const preFilteredOptions = useMemo(() => {
    if (!filterOptions) return options;
    return filterOptions(options);
  }, [options, filterOptions]);

  // Filter options by search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return preFilteredOptions;

    const term = searchTerm.toLowerCase().trim();

    // Custom filter function takes priority
    if (filterFn) {
      return preFilteredOptions.filter(opt => filterFn(opt, term));
    }

    // Search by specific keys
    if (searchKeys && searchKeys.length > 0) {
      return preFilteredOptions.filter(opt => {
        return searchKeys.some(key => {
          const val = opt[key];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(term);
        });
      });
    }

    // Default: search by label
    return preFilteredOptions.filter(opt => {
      const label = getOptionLabel(opt);
      return label.toLowerCase().includes(term);
    });
  }, [preFilteredOptions, searchTerm, filterFn, searchKeys, getOptionLabel]);

  // Click outside handler
  useEffect(() => {
    if (!isOpen || !closeOnClickOutside) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeOnClickOutside]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape]);

  // Auto-focus search input when opening
  useEffect(() => {
    if (isOpen && searchable && autoFocusSearch && searchInputRef.current) {
      // Small delay to ensure dropdown is rendered
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchable, autoFocusSearch]);

  // Reset highlighted index when options change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredOptions.length]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current) {
      const highlighted = optionsRef.current.children[highlightedIndex];
      if (highlighted) {
        highlighted.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex]);
        } else if (creatable && searchTerm.trim() && onCreate) {
          handleCreate();
        }
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchTerm('');
        break;
      default:
        break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, highlightedIndex, filteredOptions, creatable, searchTerm, onCreate]);

  // Handle option selection
  const handleSelect = useCallback((option) => {
    const optValue = getOptionValue(option);
    onChange(optValue);
    setSearchTerm('');
    setHighlightedIndex(-1);
    if (closeOnSelect) {
      setIsOpen(false);
    }
  }, [onChange, getOptionValue, closeOnSelect]);

  // Handle clear
  const handleClear = useCallback((event) => {
    event.stopPropagation();
    onChange(null);
    setSearchTerm('');
    if (onClear) onClear();
  }, [onChange, onClear]);

  // Handle create new
  const handleCreate = useCallback(() => {
    if (onCreate && searchTerm.trim()) {
      onCreate(searchTerm.trim());
      setSearchTerm('');
      setIsOpen(false);
    }
  }, [onCreate, searchTerm]);

  // Toggle dropdown
  const handleToggle = useCallback(() => {
    if (disabled) return;
    setIsOpen(prev => !prev);
    if (isOpen) {
      setSearchTerm('');
      setHighlightedIndex(-1);
    }
  }, [disabled, isOpen]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        name={name}
        aria-label={ariaLabel || placeholder}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={handleToggle}
        className={`
          w-full flex items-center justify-between gap-2
          px-3 py-2 text-left
          bg-white border ${error ? 'border-red-500' : 'border-gray-300'} ${radius.input}
          ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:border-gray-400 cursor-pointer'}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-colors
          ${triggerClassName}
        `}
      >
        <span className={`flex-1 truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
          {selectedOption
            ? (renderSelected ? renderSelected(selectedOption) : getOptionLabel(selectedOption))
            : placeholder
          }
        </span>

        <div className="flex items-center gap-1">
          {loading && (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          )}

          {clearable && selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-gray-100 rounded"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}

          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`
            absolute z-50 mt-1 w-full
            bg-white border border-gray-300 ${radius.card}
            shadow-lg overflow-hidden
            ${dropdownClassName}
          `}
          style={{
            minWidth: minDropdownWidth,
            maxHeight: maxDropdownHeight,
          }}
          role="listbox"
        >
          {/* Search Input */}
          {searchable && (
            <div className="p-2 border-b border-gray-100 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className={`
                    w-full pl-9 pr-3 py-2
                    border border-gray-200 ${radius.input}
                    text-sm placeholder-gray-400 text-gray-900 bg-white
                    focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                    ${inputClassName}
                  `}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div
            ref={optionsRef}
            className="overflow-y-auto p-1"
            style={{ maxHeight: maxDropdownHeight - (searchable ? 60 : 0) }}
          >
            {filteredOptions.length === 0 ? (
              // Empty state
              <div className="px-3 py-6 text-center text-gray-500 text-sm">
                {renderEmpty
                  ? renderEmpty(searchTerm)
                  : (searchTerm ? `No results for "${searchTerm}"` : 'No options available')
                }
              </div>
            ) : (
              // Options
              filteredOptions.map((option, index) => {
                const optValue = getOptionValue(option);
                const isSelected = optValue === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={optValue}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`
                      w-full px-3 py-2 text-left ${radius.button}
                      transition-colors
                      ${isSelected ? 'bg-blue-50 ring-1 ring-blue-200' : ''}
                      ${isHighlighted && !isSelected ? 'bg-gray-100' : ''}
                      ${!isSelected && !isHighlighted ? 'hover:bg-gray-50' : ''}
                      ${optionClassName}
                    `}
                  >
                    {renderOption
                      ? renderOption(option, { isSelected, isHighlighted, searchTerm })
                      : (
                        <span className="text-sm text-gray-900">
                          {getOptionLabel(option)}
                        </span>
                      )
                    }
                  </button>
                );
              })
            )}

            {/* Create new option */}
            {creatable && searchTerm.trim() && onCreate && (
              <button
                type="button"
                onClick={handleCreate}
                className={`
                  w-full px-3 py-2 text-left ${radius.button}
                  text-sm text-blue-600 hover:bg-blue-50
                  flex items-center gap-2
                  border-t border-gray-100 mt-1 pt-2
                `}
              >
                <Plus className="w-4 h-4" />
                {createLabel(searchTerm)}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;
