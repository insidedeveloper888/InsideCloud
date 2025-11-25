/**
 * TitleEditor - Edit Title Section
 */
import React from 'react';
import { FormInput, FormCheckbox, ColorPicker } from '../../ui/FormInput';

export function TitleEditor({ config, onChange }) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-900">📝 Title Section</h4>

      <FormCheckbox
        label="Enable Title"
        checked={config.enabled !== false}
        onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
      />

      {config.enabled !== false && (
        <>
          <FormInput
            label="Title Text"
            value={config.text || 'QUOTATION'}
            onChange={(e) => onChange({ ...config, text: e.target.value })}
            placeholder="QUOTATION"
          />

          <FormInput
            type="number"
            label="Font Size (px)"
            value={config.fontSize || 24}
            min={12}
            max={72}
            onChange={(e) => onChange({ ...config, fontSize: parseInt(e.target.value) || 24 })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Weight
            </label>
            <select
              value={config.fontWeight || 'bold'}
              onChange={(e) => onChange({ ...config, fontWeight: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
              <option value="bolder">Bolder</option>
            </select>
          </div>

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

          <ColorPicker
            label="Text Color"
            color={config.color || '#000000'}
            onChange={(color) => onChange({ ...config, color })}
          />
        </>
      )}
    </div>
  );
}
