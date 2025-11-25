import React from 'react';
import ColorPicker from '../ui/ColorPicker';

export default function TotalsEditor({ config, onChange, documentType }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Totals Settings</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure the totals section (subtotal, tax, grand total)
        </p>
      </div>

      {/* Enable Totals */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <input
          type="checkbox"
          id="totals-enabled"
          checked={config.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <label htmlFor="totals-enabled" className="text-sm font-medium text-gray-900">
          Enable Totals Section
        </label>
      </div>

      {config.enabled && (
        <>
          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position
            </label>
            <div className="flex gap-2">
              {['left', 'center', 'right'].map(pos => (
                <button
                  key={pos}
                  onClick={() => onChange({ position: pos })}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                    config.position === pos
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {pos.charAt(0).toUpperCase() + pos.slice(1)}
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
                onChange={(e) => onChange({ fontSize: parseInt(e.target.value) || 11 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="8"
                max="20"
              />
            </div>

            <ColorPicker
              color={config.fontColor}
              onChange={(color) => onChange({ fontColor: color })}
              label="Text Color"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ColorPicker
              color={config.labelColor}
              onChange={(color) => onChange({ labelColor: color })}
              label="Label Color"
            />

            <ColorPicker
              color={config.backgroundColor}
              onChange={(color) => onChange({ backgroundColor: color })}
              label="Background Color"
            />
          </div>

          {/* Grand Total Settings */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-medium text-gray-900 mb-4">Grand Total Styling</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grand Total Font Size
                </label>
                <input
                  type="number"
                  value={config.grandTotalFontSize}
                  onChange={(e) => onChange({ grandTotalFontSize: parseInt(e.target.value) || 14 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="10"
                  max="24"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grand Total Font Weight
                </label>
                <select
                  value={config.grandTotalFontWeight}
                  onChange={(e) => onChange({ grandTotalFontWeight: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <ColorPicker
                color={config.grandTotalBackgroundColor}
                onChange={(color) => onChange({ grandTotalBackgroundColor: color })}
                label="Grand Total Background Color"
              />
            </div>
          </div>

          {/* Field Configuration - Simplified */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              Totals field customization (subtotal, tax, discount, etc.) will be available in the full editor.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
