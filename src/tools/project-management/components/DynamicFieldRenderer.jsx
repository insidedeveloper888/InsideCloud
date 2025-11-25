import React from 'react';
import { Check } from 'lucide-react';

/**
 * Renders a single form field based on the field configuration.
 * 
 * @param {Object} props
 * @param {Object} props.fieldConfig - The field definition from the template (key, label, type)
 * @param {any} props.value - The current value of the field
 * @param {Function} props.onChange - Callback when value changes (value) => void
 * @param {boolean} props.readOnly - If true, renders in read-only mode
 */
export const DynamicFieldRenderer = ({ fieldConfig, value, onChange, readOnly = false }) => {
    const { key, label, type } = fieldConfig;

    // Handle Read-Only View
    if (readOnly) {
        return (
            <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    {label}
                </label>
                <div className="text-sm text-gray-900 font-medium">
                    {renderReadOnlyValue(type, value)}
                </div>
            </div>
        );
    }

    // Handle Edit/Input View
    return (
        <div className="mb-4">
            <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            {renderInput(type, key, value, onChange)}
        </div>
    );
};

// Helper to render the correct input widget
const renderInput = (type, key, value, onChange) => {
    switch (type) {
        case 'text':
            return (
                <input
                    type="text"
                    id={key}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
                    placeholder="Enter text..."
                />
            );

        case 'number':
            return (
                <input
                    type="number"
                    id={key}
                    value={value || ''}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
                    placeholder="0"
                />
            );

        case 'checkbox':
            return (
                <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                        type="checkbox"
                        id={key}
                        checked={!!value}
                        onChange={(e) => onChange(e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Yes, {key.replace(/_/g, ' ')}</span>
                </label>
            );

        case 'progress':
            return (
                <div className="flex items-center space-x-4">
                    <input
                        type="range"
                        id={key}
                        min="0"
                        max="100"
                        value={value || 0}
                        onChange={(e) => onChange(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="text-sm font-bold text-blue-600 w-12 text-right">{value || 0}%</span>
                </div>
            );

        default:
            return <div className="text-red-500 text-xs">Unknown field type: {type}</div>;
    }
};

// Helper to render read-only values nicely
const renderReadOnlyValue = (type, value) => {
    if (value === null || value === undefined) return <span className="text-gray-400">-</span>;

    switch (type) {
        case 'checkbox':
            return value ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Check className="w-3 h-3 mr-1" /> Yes
                </span>
            ) : (
                <span className="text-gray-500">No</span>
            );

        case 'progress':
            return (
                <div className="w-full max-w-xs">
                    <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${value}%` }}
                        ></div>
                    </div>
                </div>
            );

        default:
            return value;
    }
};
