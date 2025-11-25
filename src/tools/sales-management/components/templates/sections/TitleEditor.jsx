import React from 'react';
import ColorPicker from '../ui/ColorPicker';
import FontPicker from '../ui/FontPicker';

export default function TitleEditor({ config, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Title Settings</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure the document title appearance (e.g., "QUOTATION", "INVOICE")
        </p>
      </div>

      {/* Enable Title */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <input
          type="checkbox"
          id="title-enabled"
          checked={config.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <label htmlFor="title-enabled" className="text-sm font-medium text-gray-900">
          Enable Title Section
        </label>
      </div>

      {config.enabled && (
        <>
          {/* Title Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title Text
            </label>
            <input
              type="text"
              value={config.text}
              onChange={(e) => onChange({ text: e.target.value })}
              placeholder="QUOTATION"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Text Alignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alignment
            </label>
            <div className="flex gap-2">
              {['left', 'center', 'right'].map(align => (
                <button
                  key={align}
                  onClick={() => onChange({ alignment: align })}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                    config.alignment === align
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {align.charAt(0).toUpperCase() + align.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Font Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <input
                type="number"
                value={config.fontSize}
                onChange={(e) => onChange({ fontSize: parseInt(e.target.value) || 24 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="12"
                max="72"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Weight
              </label>
              <select
                value={config.fontWeight}
                onChange={(e) => onChange({ fontWeight: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
              </select>
            </div>
          </div>

          <FontPicker
            font={config.fontFamily}
            onChange={(font) => onChange({ fontFamily: font })}
            label="Font Family"
          />

          <div className="grid grid-cols-2 gap-4">
            <ColorPicker
              color={config.fontColor}
              onChange={(color) => onChange({ fontColor: color })}
              label="Text Color"
            />

            <ColorPicker
              color={config.backgroundColor}
              onChange={(color) => onChange({ backgroundColor: color })}
              label="Background Color"
            />
          </div>

          {/* Padding */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Padding (px)
            </label>
            <input
              type="number"
              value={config.padding}
              onChange={(e) => onChange({ padding: parseInt(e.target.value) || 20 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="100"
            />
          </div>
        </>
      )}
    </div>
  );
}
