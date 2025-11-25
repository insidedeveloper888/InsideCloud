import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export default function ProductSelect({
    value,
    onChange,
    products = [],
    placeholder = "Select Product...",
    className = ""
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // Find selected product
    const selectedProduct = products.find(p => p.id === value);

    // Filter products based on search
    const filteredProducts = products.filter(product => {
        const searchLower = searchTerm.toLowerCase();
        const name = (product.name || product.product_name || '').toLowerCase();
        const sku = (product.sku || '').toLowerCase();
        return name.includes(searchLower) || sku.includes(searchLower);
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

    const handleSelect = (productId) => {
        onChange({ target: { value: productId } });
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
                className="w-full px-3 py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white flex items-center justify-between shadow-sm min-h-[38px]"
            >
                <div className="flex-1 truncate mr-2">
                    {selectedProduct ? (
                        <span className="text-gray-900 block truncate" title={selectedProduct.name || selectedProduct.product_name}>
                            {selectedProduct.name || selectedProduct.product_name}
                            {selectedProduct.sku && <span className="text-gray-500 ml-1 text-xs">({selectedProduct.sku})</span>}
                        </span>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {selectedProduct && (
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
                <div className="absolute z-50 mt-1 w-[400px] bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-hidden flex flex-col left-0">
                    {/* Search Header */}
                    <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name or SKU..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Product List */}
                    <div className="overflow-y-auto flex-1 p-1">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                                <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => handleSelect(product.id)}
                                    className={`w-full px-3 py-2 text-left hover:bg-blue-50 rounded-md flex flex-col gap-0.5 transition-colors ${value === product.id ? 'bg-blue-50 ring-1 ring-blue-200' : ''
                                        }`}
                                >
                                    <span className="text-sm font-medium text-gray-900 break-words leading-snug">
                                        {product.name || product.product_name}
                                    </span>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>{product.sku || 'No SKU'}</span>
                                        <span>RM {(product.unit_price || product.price || 0).toFixed(2)}</span>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                No products found matching "{searchTerm}"
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
