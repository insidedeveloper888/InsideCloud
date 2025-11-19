/**
 * TagInput Component
 *
 * A multi-select tag input with autocomplete (like Bootstrap Select2)
 * Features:
 * - Type to filter existing tags
 * - Press Enter to create new tags
 * - Smart matching (case-insensitive, whitespace-insensitive)
 * - Display selected tags as removable badges
 * - Dropdown with filtered options
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Tag as TagIcon } from 'lucide-react';

export default function TagInput({
  selectedTags = [], // Array of tag objects { id, name, color }
  availableTags = [], // Array of all tags in organization
  onChange, // Callback when selection changes
  onCreateTag, // Callback to create a new tag
  placeholder = 'Type to add tags...',
}) {
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Smart filter: case-insensitive, whitespace-insensitive
  const normalizeString = (str) => {
    return str.toLowerCase().replace(/\s+/g, '');
  };

  // Filter available tags based on input
  const filteredTags = availableTags.filter((tag) => {
    // Don't show already selected tags
    if (selectedTags.some((t) => t.id === tag.id)) {
      return false;
    }

    // Filter by input (smart matching)
    if (inputValue.trim()) {
      const normalizedInput = normalizeString(inputValue);
      const normalizedTagName = normalizeString(tag.name);
      return normalizedTagName.includes(normalizedInput);
    }

    return true;
  });

  // Handle tag selection
  const handleSelectTag = (tag) => {
    onChange([...selectedTags, tag]);
    setInputValue('');
    setIsDropdownOpen(false);
    setHighlightedIndex(0);
    inputRef.current?.focus();
  };

  // Handle tag removal
  const handleRemoveTag = (tagToRemove) => {
    onChange(selectedTags.filter((tag) => tag.id !== tagToRemove.id));
  };

  // Handle Enter key (create new tag or select highlighted)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();

      // If there are filtered results, select the highlighted one
      if (filteredTags.length > 0 && isDropdownOpen) {
        handleSelectTag(filteredTags[highlightedIndex]);
        return;
      }

      // Otherwise, create a new tag
      handleCreateNewTag();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredTags.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      // Remove last tag if input is empty
      handleRemoveTag(selectedTags[selectedTags.length - 1]);
    }
  };

  // Create a new tag
  const handleCreateNewTag = async () => {
    const tagName = inputValue.trim();
    if (!tagName) return;

    // Check if tag already exists (case-insensitive)
    const existingTag = availableTags.find(
      (tag) => normalizeString(tag.name) === normalizeString(tagName)
    );

    if (existingTag) {
      // Tag already exists, just select it
      handleSelectTag(existingTag);
    } else {
      // Create new tag
      const newTag = await onCreateTag(tagName);
      if (newTag) {
        handleSelectTag(newTag);
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current?.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when filtered tags change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [inputValue]);

  return (
    <div className="relative">
      {/* Input container with selected tags */}
      <div
        className="w-full min-h-[42px] px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent bg-white cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Selected tags */}
        <div className="flex flex-wrap gap-2 items-center">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-white"
              style={{ backgroundColor: tag.color || '#3B82F6' }}
            >
              {tag.name}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(tag);
                }}
                className="hover:bg-white/20 rounded-sm p-0.5 transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          ))}

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedTags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] outline-none text-sm text-gray-900 placeholder:text-gray-400 bg-transparent"
          />
        </div>
      </div>

      {/* Dropdown */}
      {isDropdownOpen && (inputValue || filteredTags.length > 0) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {/* Existing tags */}
          {filteredTags.length > 0 && (
            <div className="py-1">
              {filteredTags.map((tag, index) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleSelectTag(tag)}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                    index === highlightedIndex
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color || '#3B82F6' }}
                  />
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          {/* Create new tag option */}
          {inputValue.trim() &&
            !availableTags.some(
              (tag) => normalizeString(tag.name) === normalizeString(inputValue)
            ) && (
              <div className="border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCreateNewTag}
                  className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  Create tag: <span className="font-medium">"{inputValue.trim()}"</span>
                </button>
              </div>
            )}

          {/* No results */}
          {filteredTags.length === 0 &&
            !inputValue.trim() &&
            selectedTags.length < availableTags.length && (
              <div className="px-3 py-2 text-sm text-gray-500">
                All tags are already selected
              </div>
            )}
        </div>
      )}
    </div>
  );
}
