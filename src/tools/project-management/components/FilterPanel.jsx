import React from 'react';
import { X, Filter, Calendar, Tag, Layers } from 'lucide-react';

const FilterPanel = ({
    isOpen,
    onClose,
    filters,
    onFilterChange,
    templates
}) => {
    if (!isOpen) return null;

    return (
        <div className="w-80 bg-white border-r border-gray-200 h-full flex flex-col shadow-xl fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center text-gray-800 font-semibold">
                    <Filter className="w-5 h-5 mr-2 text-blue-600" />
                    Filters
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Filter Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-8">

                {/* Status Filter */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
                        <Tag className="w-3 h-3 mr-1.5" />
                        Project Status
                    </h3>
                    <div className="space-y-2">
                        {['active', 'pending', 'completed', 'cancelled'].map(status => (
                            <label key={status} className="flex items-center group cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.status?.includes(status)}
                                    onChange={(e) => {
                                        const newStatus = e.target.checked
                                            ? [...(filters.status || []), status]
                                            : (filters.status || []).filter(s => s !== status);
                                        onFilterChange('status', newStatus);
                                    }}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all"
                                />
                                <span className="ml-3 text-sm text-gray-600 group-hover:text-gray-900 capitalize transition-colors">
                                    {status}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Template Filter */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
                        <Layers className="w-3 h-3 mr-1.5" />
                        Template Type
                    </h3>
                    <div className="space-y-2">
                        {templates.map(template => (
                            <label key={template.id} className="flex items-center group cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.templates?.includes(template.id)}
                                    onChange={(e) => {
                                        const newTemplates = e.target.checked
                                            ? [...(filters.templates || []), template.id]
                                            : (filters.templates || []).filter(t => t !== template.id);
                                        onFilterChange('templates', newTemplates);
                                    }}
                                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 transition-all"
                                />
                                <span className="ml-3 text-sm text-gray-600 group-hover:text-gray-900 transition-colors truncate">
                                    {template.name}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Date Range (Mock) */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
                        <Calendar className="w-3 h-3 mr-1.5" />
                        Due Date
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 w-8">From</span>
                            <input type="date" className="flex-1 text-xs border border-gray-300 rounded px-2 py-1.5" />
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 w-8">To</span>
                            <input type="date" className="flex-1 text-xs border border-gray-300 rounded px-2 py-1.5" />
                        </div>
                    </div>
                </div>

            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-gray-200 bg-gray-50">
                <button
                    onClick={() => onFilterChange('clear', null)}
                    className="w-full py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                    Reset All Filters
                </button>
            </div>
        </div>
    );
};

export default FilterPanel;
