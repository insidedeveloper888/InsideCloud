import React from 'react';
import ColorPicker from '../ui/ColorPicker';

export default function WatermarkEditor({ config, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Watermark Settings</h3>
        <p className="text-sm text-gray-600 mb-4">
          Add a watermark overlay (e.g., "DRAFT", "PAID", "CONFIDENTIAL")
        </p>
      </div>

      {/* Enable Watermark */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <input
          type="checkbox"
          id="watermark-enabled"
          checked={config.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <label htmlFor="watermark-enabled" className="text-sm font-medium text-gray-900">
          Enable Watermark
        </label>
      </div>

      {config.enabled && (
        <>
          {/* Watermark Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Watermark Text
            </label>
            <input
              type="text"
              value={config.text}
              onChange={(e) => onChange({ text: e.target.value })}
              placeholder="DRAFT"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            />
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Size
            </label>
            <input
              type="number"
              value={config.fontSize}
              onChange={(e) => onChange({ fontSize: parseInt(e.target.value) || 72 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="24"
              max="200"
            />
          </div>

          {/* Opacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opacity ({Math.round((config.opacity || 0.1) * 100)}%)
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.opacity || 0.1}
              onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Transparent</span>
              <span>Opaque</span>
            </div>
          </div>

          {/* Rotation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rotation ({config.rotation || -45}°)
            </label>
            <input
              type="range"
              min="-90"
              max="90"
              step="5"
              value={config.rotation || -45}
              onChange={(e) => onChange({ rotation: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>-90°</span>
              <span>0°</span>
              <span>90°</span>
            </div>
          </div>

          <ColorPicker
            color={config.color}
            onChange={(color) => onChange({ color: color })}
            label="Watermark Color"
          />

          {/* Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 relative overflow-hidden" style={{ height: '200px' }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="text-center font-bold"
                style={{
                  fontSize: `${(config.fontSize || 72) / 4}px`,
                  color: config.color || '#9CA3AF',
                  opacity: config.opacity || 0.1,
                  transform: `rotate(${config.rotation || -45}deg)`,
                  userSelect: 'none'
                }}
              >
                {config.text || 'DRAFT'}
              </div>
            </div>
            <div className="relative z-10 text-sm text-gray-700">
              <p>Sample Document Content</p>
              <p className="mt-2">The watermark appears behind the content.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
