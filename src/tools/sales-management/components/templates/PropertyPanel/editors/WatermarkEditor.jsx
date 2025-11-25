/**
 * WatermarkEditor - Edit Watermark Section
 */
import React from 'react';
import { FormInput, FormCheckbox } from '../../ui/FormInput';

export function WatermarkEditor({ config, onChange }) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-900">💧 Watermark Section</h4>

      <FormCheckbox
        label="Enable Watermark"
        checked={config.enabled === true}
        onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
      />

      {config.enabled === true && (
        <>
          <FormInput
            label="Watermark Text"
            value={config.text || 'DRAFT'}
            onChange={(e) => onChange({ ...config, text: e.target.value })}
            placeholder="DRAFT, CONFIDENTIAL, etc."
          />

          <FormInput
            type="number"
            label="Opacity"
            value={config.opacity || 0.1}
            min={0}
            max={1}
            step={0.05}
            onChange={(e) => onChange({ ...config, opacity: parseFloat(e.target.value) || 0.1 })}
          />

          <FormInput
            type="number"
            label="Font Size (px)"
            value={config.fontSize || 72}
            min={24}
            max={200}
            onChange={(e) => onChange({ ...config, fontSize: parseInt(e.target.value) || 72 })}
          />

          <FormInput
            type="number"
            label="Rotation (degrees)"
            value={config.rotation || -45}
            min={-180}
            max={180}
            onChange={(e) => onChange({ ...config, rotation: parseInt(e.target.value) || -45 })}
          />
        </>
      )}
    </div>
  );
}
