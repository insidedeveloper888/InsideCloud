/**
 * FooterEditor - Edit Footer Section
 */
import React from 'react';
import { FormInput, FormCheckbox, ColorPicker } from '../../ui/FormInput';

export function FooterEditor({ config, onChange }) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-900">⬇️ Footer Section</h4>

      <FormCheckbox
        label="Enable Footer"
        checked={config.enabled !== false}
        onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
      />

      {config.enabled !== false && (
        <>
          <FormInput
            type="number"
            label="Height (px)"
            value={config.height || 50}
            min={30}
            max={200}
            onChange={(e) => onChange({ ...config, height: parseInt(e.target.value) || 50 })}
          />

          <ColorPicker
            label="Background Color"
            color={config.backgroundColor || '#f8f9fa'}
            onChange={(color) => onChange({ ...config, backgroundColor: color })}
          />

          <FormInput
            label="Footer Text"
            value={config.text || ''}
            onChange={(e) => onChange({ ...config, text: e.target.value })}
            placeholder="Company Address | Phone | Email"
          />

          <FormInput
            type="number"
            label="Font Size (px)"
            value={config.fontSize || 10}
            min={8}
            max={24}
            onChange={(e) => onChange({ ...config, fontSize: parseInt(e.target.value) || 10 })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Alignment
            </label>
            <div className="flex gap-2">
              {['left', 'center', 'right'].map((align) => (
                <button
                  key={align}
                  onClick={() => onChange({ ...config, textAlign: align })}
                  className={`
                    flex-1 px-4 py-2 rounded border text-sm font-medium capitalize
                    ${config.textAlign === align || (align === 'center' && !config.textAlign)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
