import React from 'react';
import ColorPicker from '../ui/ColorPicker';

export default function NotesEditor({ config, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes Settings</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure the notes/terms section (e.g., "Terms & Conditions", "Delivery Notes")
        </p>
      </div>

      {/* Enable Notes */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <input
          type="checkbox"
          id="notes-enabled"
          checked={config.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <label htmlFor="notes-enabled" className="text-sm font-medium text-gray-900">
          Enable Notes Section
        </label>
      </div>

      {config.enabled && (
        <>
          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section Label
            </label>
            <input
              type="text"
              value={config.label}
              onChange={(e) => onChange({ label: e.target.value })}
              placeholder="Terms & Conditions"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
                onChange={(e) => onChange({ fontSize: parseInt(e.target.value) || 9 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="6"
                max="18"
              />
            </div>

            <ColorPicker
              color={config.fontColor}
              onChange={(color) => onChange({ fontColor: color })}
              label="Text Color"
            />
          </div>
        </>
      )}
    </div>
  );
}
