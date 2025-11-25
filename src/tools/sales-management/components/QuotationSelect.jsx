import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export default function QuotationSelect({
    value,
    onChange,
    quotations = [],
    placeholder = "Select Quotation...",
    className = "",
    filterConverted = true, // Filter out already-converted quotations by default
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // Find selected quotation
    const selectedQuotation = quotations.find(q => q.id === value);

    // Filter quotations based on search and conversion status
    const filteredQuotations = quotations.filter(quotation => {
        // Filter out converted quotations if enabled
        if (filterConverted && (quotation.converted_to_sales_order_id || quotation.status === 'cancelled')) {
            return false;
        }

        // Apply search filter
        const searchLower = searchTerm.toLowerCase();
        const code = (quotation.quotation_code || '').toLowerCase();
        const customerName = (quotation.customer_name || quotation.customer?.company_name || '').toLowerCase();
        return code.includes(searchLower) || customerName.includes(searchLower);
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Focus search input when opening
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (quotationId) => {
        onChange({ target: { value: quotationId } });
        setIsOpen(false);
        setSearchTerm('');
    };

    const clearSelection = (e) => {
        e.stopPropagation();
        onChange({ target: { value: '' } });
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
                    {selectedQuotation ? (
                        <span className="text-gray-900 block truncate" title={`${selectedQuotation.quotation_code} - ${selectedQuotation.customer_name || ''}`}>
                            <span className="font-medium">{selectedQuotation.quotation_code}</span>
                            {selectedQuotation.customer_name && <span className="text-gray-500 ml-2 text-sm">({selectedQuotation.customer_name})</span>}
                        </span>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {selectedQuotation && (
                        <div
                            onClick={clearSelection}
                            className="p-0.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={14} />
                        </div>
                    )}
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full min-w-[400px] bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-hidden flex flex-col left-0">
                    {/* Search Header */}
                    <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by code or customer..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Quotation List */}
                    <div className="overflow-y-auto flex-1 p-1">
                        {filteredQuotations.length > 0 ? (
                            filteredQuotations.map((quotation) => (
                                <button
                                    key={quotation.id}
                                    type="button"
                                    onClick={() => handleSelect(quotation.id)}
                                    className={`w-full px-3 py-2 text-left hover:bg-blue-50 rounded-md flex flex-col gap-0.5 transition-colors ${value === quotation.id ? 'bg-blue-50 ring-1 ring-blue-200' : ''
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-900">
                                            {quotation.quotation_code}
                                        </span>
                                        <span className="text-sm font-semibold text-blue-600">
                                            RM {(quotation.total_amount || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>{quotation.customer_name || 'No customer'}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                                            quotation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                            quotation.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                            quotation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {quotation.status}
                                        </span>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                {searchTerm ? `No quotations found matching "${searchTerm}"` : 'No available quotations'}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
