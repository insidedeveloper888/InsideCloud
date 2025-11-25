import React from 'react';

/**
 * FontPicker - Font family selection dropdown
 * Common PDF-safe fonts
 */
export default function FontPicker({ font, onChange, label = 'Font Family' }) {
  const fonts = [
    { value: 'Helvetica', label: 'Helvetica', category: 'Sans-serif' },
    { value: 'Arial', label: 'Arial', category: 'Sans-serif' },
    { value: 'Courier', label: 'Courier', category: 'Monospace' },
    { value: 'Times-Roman', label: 'Times Roman', category: 'Serif' },
    { value: 'Georgia', label: 'Georgia', category: 'Serif' },
    { value: 'Verdana', label: 'Verdana', category: 'Sans-serif' },
    { value: 'Trebuchet', label: 'Trebuchet', category: 'Sans-serif' },
    { value: 'Palatino', label: 'Palatino', category: 'Serif' },
  ];

  // Group fonts by category
  const groupedFonts = fonts.reduce((acc, font) => {
    if (!acc[font.category]) {
      acc[font.category] = [];
    }
    acc[font.category].push(font);
    return acc;
  }, {});

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <select
        value={font || 'Helvetica'}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        style={{ fontFamily: font || 'Helvetica' }}
      >
        {Object.entries(groupedFonts).map(([category, fonts]) => (
          <optgroup key={category} label={category}>
            {fonts.map((f) => (
              <option
                key={f.value}
                value={f.value}
                style={{ fontFamily: f.value }}
              >
                {f.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* Preview Text */}
      <div
        className="mt-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm"
        style={{ fontFamily: font || 'Helvetica' }}
      >
        The quick brown fox jumps over the lazy dog. 0123456789
      </div>
    </div>
  );
}
