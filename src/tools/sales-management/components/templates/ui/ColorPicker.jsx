import React, { useState, useRef, useEffect } from 'react';
import { Pipette } from 'lucide-react';

/**
 * ColorPicker - Simple color selection component
 * Supports preset colors + custom color input
 */
export default function ColorPicker({ color, onChange, label = 'Color' }) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  const presetColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6B7280', // Gray
    '#1F2937', // Dark Gray
    '#FFFFFF', // White
    '#000000', // Black
    '#F3F4F6', // Light Gray
    '#E5E7EB', // Border Gray
  ];

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  return (
    <div className="relative" ref={pickerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Color Display Button */}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-3 w-full px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors bg-white"
      >
        <div
          className="w-8 h-8 rounded border-2 border-gray-300 flex-shrink-0"
          style={{ backgroundColor: color || '#FFFFFF' }}
        />
        <span className="text-sm text-gray-700 font-mono flex-1 text-left">
          {color || 'None'}
        </span>
        <Pipette size={16} className="text-gray-400" />
      </button>

      {/* Color Picker Dropdown */}
      {showPicker && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-xl p-4">
          {/* Preset Colors Grid */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Preset Colors
            </label>
            <div className="grid grid-cols-6 gap-2">
              {presetColors.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => {
                    onChange(presetColor);
                    setShowPicker(false);
                  }}
                  className={`w-10 h-10 rounded border-2 hover:scale-110 transition-transform ${
                    color === presetColor ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: presetColor }}
                  title={presetColor}
                />
              ))}
            </div>
          </div>

          {/* Custom Color Input */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Custom Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color || '#FFFFFF'}
                onChange={(e) => onChange(e.target.value)}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={color || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#000000"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Clear Button */}
          <button
            type="button"
            onClick={() => {
              onChange('');
              setShowPicker(false);
            }}
            className="w-full mt-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Clear Color
          </button>
        </div>
      )}
    </div>
  );
}
