/**
 * MemberSelect - Custom dropdown to display members with avatars
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function MemberSelect({
  value,
  onChange,
  members = [],
  placeholder = "Not assigned",
  name
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Find selected member
  const selectedMember = members.find(m => m.id === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (memberId) => {
    onChange({ target: { name, value: memberId } });
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          {selectedMember ? (
            <>
              {selectedMember.avatar_url ? (
                <img
                  src={selectedMember.avatar_url}
                  alt={selectedMember.display_name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                  {selectedMember.display_name?.charAt(0).toUpperCase()}
                </div>
              )}
              <span>{selectedMember.display_name}</span>
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={18} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {/* "Not assigned" option */}
          <button
            type="button"
            onClick={() => handleSelect('')}
            className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${
              !value ? 'bg-blue-50' : ''
            }`}
          >
            <span className="text-gray-400">{placeholder}</span>
          </button>

          {/* Member options */}
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => handleSelect(member.id)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${
                value === member.id ? 'bg-blue-50' : ''
              }`}
            >
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.display_name}
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white flex-shrink-0">
                  {member.display_name?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-gray-900">{member.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
