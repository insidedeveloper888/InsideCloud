import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function StatusSelect({
    value,
    onChange,
    statuses = [],
    placeholder = "Select Status...",
    className = ""
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Find selected status
    const selectedStatus = statuses.find(s => s.status_key === value);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (statusKey) => {
        onChange({ target: { value: statusKey } });
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 text-left border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white flex items-center justify-between shadow-sm min-h-[38px]"
            >
                <div className="flex-1 truncate mr-2">
                    {selectedStatus ? (
                        <span className="text-gray-900 block truncate">
                            {selectedStatus.status_label}
                        </span>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col left-0">
                    {/* Status List */}
                    <div className="overflow-y-auto flex-1 p-1">
                        {statuses.length > 0 ? (
                            statuses.map((status) => (
                                <button
                                    key={status.status_key}
                                    type="button"
                                    onClick={() => handleSelect(status.status_key)}
                                    className={`w-full px-3 py-2 text-left hover:bg-blue-50 rounded-md transition-colors ${value === status.status_key ? 'bg-blue-50 ring-1 ring-blue-200' : ''
                                        }`}
                                >
                                    <span className="text-sm font-medium text-gray-900">
                                        {status.status_label}
                                    </span>
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                No statuses available
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
