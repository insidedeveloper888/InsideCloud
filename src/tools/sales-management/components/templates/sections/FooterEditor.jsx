import React from 'react';
import ColorPicker from '../ui/ColorPicker';

export default function FooterEditor({ config, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Footer Settings</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure the footer section with text and page numbers
        </p>
      </div>

      {/* Enable Footer */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <input
          type="checkbox"
          id="footer-enabled"
          checked={config.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <label htmlFor="footer-enabled" className="text-sm font-medium text-gray-900">
          Enable Footer Section
        </label>
      </div>

      {config.enabled && (
        <>
          {/* Footer Height */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Footer Height (px)
            </label>
            <input
              type="number"
              value={config.height}
              onChange={(e) => onChange({ height: parseInt(e.target.value) || 50 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="30"
              max="200"
            />
          </div>

          <ColorPicker
            color={config.backgroundColor}
            onChange={(color) => onChange({ backgroundColor: color })}
            label="Background Color"
          />

          {/* Footer Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Footer Text
            </label>
            <textarea
              value={config.text}
              onChange={(e) => onChange({ text: e.target.value })}
              placeholder="Thank you for your business!"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Text Alignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Alignment
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
                onChange={(e) => onChange({ fontSize: parseInt(e.target.value) || 10 })}
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

          {/* Page Numbers */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-medium text-gray-900 mb-4">Page Numbers</h4>

            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="page-numbers-enabled"
                checked={config.showPageNumbers}
                onChange={(e) => onChange({ showPageNumbers: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="page-numbers-enabled" className="text-sm font-medium text-gray-900">
                Show Page Numbers
              </label>
            </div>

            {config.showPageNumbers && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Number Format
                </label>
                <input
                  type="text"
                  value={config.pageNumberFormat}
                  onChange={(e) => onChange({ pageNumberFormat: e.target.value })}
                  placeholder="Page {current} of {total}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {'{current}'} and {'{total}'} as placeholders
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
