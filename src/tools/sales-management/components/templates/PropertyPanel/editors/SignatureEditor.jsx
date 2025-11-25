/**
 * SignatureEditor - Edit Signature Section
 *
 * Configure signature boxes with labels, dates, and layout.
 */
import React from 'react';
import { FormInput, FormCheckbox, ColorPicker } from '../../ui/FormInput';

export function SignatureEditor({ config, onChange }) {
  const handleSignatureChange = (index, field, value) => {
    const signatures = [...(config.signatures || [])];
    signatures[index] = {
      ...signatures[index],
      [field]: value
    };
    onChange({ ...config, signatures });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-900">✍️ Signatures Section</h4>

      {/* Enable/Disable */}
      <FormCheckbox
        label="Enable Signatures"
        checked={config.enabled !== false}
        onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
      />

      {config.enabled !== false && (
        <>
          {/* Number of signature boxes */}
          <FormInput
            type="number"
            label="Number of Signature Boxes"
            value={config.signatureCount || 1}
            min={1}
            max={4}
            onChange={(e) => {
              const count = parseInt(e.target.value) || 1;
              const signatures = Array.from({ length: count }, (_, i) =>
                config.signatures?.[i] || { label: 'Authorized By', includeDate: true }
              );
              onChange({ ...config, signatureCount: count, signatures });
            }}
          />

          {/* Signature fields */}
          <div className="space-y-3">
            {Array.from({ length: config.signatureCount || 1 }).map((_, index) => (
              <div key={index} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <h5 className="font-medium text-sm text-gray-900 mb-3">
                  Signature {index + 1}
                </h5>

                <FormInput
                  label="Label"
                  value={config.signatures?.[index]?.label || 'Authorized By'}
                  onChange={(e) => handleSignatureChange(index, 'label', e.target.value)}
                  placeholder="e.g., Authorized By, Prepared By"
                />

                <FormCheckbox
                  label="Include Date Field"
                  checked={config.signatures?.[index]?.includeDate !== false}
                  onChange={(e) => handleSignatureChange(index, 'includeDate', e.target.checked)}
                />
              </div>
            ))}
          </div>

          {/* Layout */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Layout
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onChange({ ...config, layout: 'horizontal' })}
                className={`
                  flex-1 px-4 py-2 rounded border text-sm font-medium
                  ${config.layout === 'horizontal' || !config.layout
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                Horizontal
              </button>
              <button
                onClick={() => onChange({ ...config, layout: 'vertical' })}
                className={`
                  flex-1 px-4 py-2 rounded border text-sm font-medium
                  ${config.layout === 'vertical'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                Vertical
              </button>
            </div>
          </div>

          {/* Styling */}
          <FormInput
            type="number"
            label="Line Height (px)"
            value={config.lineHeight || 60}
            min={30}
            max={150}
            onChange={(e) => onChange({ ...config, lineHeight: parseInt(e.target.value) || 60 })}
          />

          <ColorPicker
            label="Line Color"
            color={config.lineColor || '#000000'}
            onChange={(color) => onChange({ ...config, lineColor: color })}
          />
        </>
      )}
    </div>
  );
}
