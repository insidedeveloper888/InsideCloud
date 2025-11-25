/**
 * TotalsEditor - Edit Totals Section
 */
import React from 'react';
import { FormInput, FormCheckbox } from '../../ui/FormInput';

export function TotalsEditor({ config, onChange }) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-900">💰 Totals Section</h4>

      <FormCheckbox
        label="Enable Totals"
        checked={config.enabled !== false}
        onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
      />

      {config.enabled !== false && (
        <>
          <FormCheckbox
            label="Show Subtotal"
            checked={config.showSubtotal !== false}
            onChange={(e) => onChange({ ...config, showSubtotal: e.target.checked })}
          />

          <FormCheckbox
            label="Show Tax"
            checked={config.showTax !== false}
            onChange={(e) => onChange({ ...config, showTax: e.target.checked })}
          />

          {config.showTax !== false && (
            <FormInput
              type="number"
              label="Default Tax Rate (%)"
              value={config.taxRate || 0}
              min={0}
              max={100}
              step={0.01}
              onChange={(e) => onChange({ ...config, taxRate: parseFloat(e.target.value) || 0 })}
            />
          )}

          <FormCheckbox
            label="Show Discount"
            checked={config.showDiscount !== false}
            onChange={(e) => onChange({ ...config, showDiscount: e.target.checked })}
          />

          {config.showDiscount !== false && (
            <FormInput
              type="number"
              label="Default Discount Rate (%)"
              value={config.discountRate || 0}
              min={0}
              max={100}
              step={0.01}
              onChange={(e) => onChange({ ...config, discountRate: parseFloat(e.target.value) || 0 })}
            />
          )}

          <FormCheckbox
            label="Show Total"
            checked={config.showTotal !== false}
            onChange={(e) => onChange({ ...config, showTotal: e.target.checked })}
          />
        </>
      )}
    </div>
  );
}
