import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Searchable Select Component with Add New option
 * Allows users to search and select from a list of options
 * Optionally allows adding new items via search
 */
const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  allowAddNew = false,
  onAddNew = null,
  addNewLabel = '+ Add New...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddNew = () => {
    const newValue = search.trim();
    if (newValue && onAddNew) {
      onAddNew(newValue); // Pass search value to parent
      // Don't call onChange here - let onAddNew handle the state update
      setIsOpen(false);
      setSearch('');
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl bg-white text-left flex items-center justify-between text-sm text-gray-900 hover:border-gray-300 transition-all"
      >
        <span className={selectedOption || value ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption ? selectedOption.label : (value || placeholder)}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-[9999] mt-1 w-full bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-visible">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search..."
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
          </div>
          <div className="max-h-40 overflow-y-auto bg-white">
            {filteredOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 transition-colors ${
                  opt.value === value ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
            {filteredOptions.length === 0 && !allowAddNew && (
              <div className="px-3 py-2 text-sm text-gray-400">No results</div>
            )}
            {allowAddNew && (
              <button
                type="button"
                onClick={handleAddNew}
                className="w-full px-3 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 font-medium border-t border-gray-100"
              >
                {search.trim() ? `+ Add "${search.trim()}"` : addNewLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
