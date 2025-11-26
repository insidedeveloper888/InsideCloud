/**
 * MemberSelect - Custom dropdown to display organization members with avatars
 *
 * A searchable dropdown component for selecting team members. Displays member
 * avatars and names, with support for "Not assigned" option.
 *
 * @component
 * @example
 * ```jsx
 * <MemberSelect
 *   value={selectedMemberId}
 *   onChange={(e) => setSelectedMemberId(e.target.value)}
 *   members={teamMembers}
 *   name="assigned_to"
 *   placeholder="Select team member"
 * />
 * ```
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * @typedef {Object} Member
 * @property {string} id - Unique identifier for the member
 * @property {string} display_name - Name to display for the member
 * @property {string} [avatar_url] - Optional URL to member's avatar image
 */

/**
 * @param {Object} props
 * @param {string} props.value - Currently selected member ID
 * @param {function} props.onChange - Callback when selection changes. Receives synthetic event: { target: { name, value } }
 * @param {Member[]} props.members - Array of member objects to display
 * @param {string} [props.placeholder="Not assigned"] - Placeholder text when no member is selected
 * @param {string} [props.name] - Form field name (passed to onChange event)
 */
export function MemberSelect({
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

// Default export for backwards compatibility
export default MemberSelect;
