/**
 * DocumentDetailsEditor - Edit Document Details Section
 */
import React from 'react';
import { FormCheckbox } from '../../ui/FormInput';

export function DocumentDetailsEditor({ config, onChange }) {
  const availableFields = [
    { value: 'documentNumber', label: 'Document Number' },
    { value: 'date', label: 'Date' },
    { value: 'customerName', label: 'Customer Name' },
    { value: 'customerAddress', label: 'Customer Address' },
    { value: 'validUntil', label: 'Valid Until' },
    { value: 'paymentTerms', label: 'Payment Terms' },
    { value: 'deliveryDate', label: 'Delivery Date' },
    { value: 'reference', label: 'Reference' }
  ];

  const toggleField = (fieldValue) => {
    const fields = config.fields || [];
    const exists = fields.includes(fieldValue);

    if (exists) {
      onChange({ ...config, fields: fields.filter(f => f !== fieldValue) });
    } else {
      onChange({ ...config, fields: [...fields, fieldValue] });
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-900">📋 Document Details Section</h4>

      <FormCheckbox
        label="Enable Document Details"
        checked={config.enabled !== false}
        onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
      />

      {config.enabled !== false && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Fields to Display
            </label>
            <div className="space-y-2">
              {availableFields.map((field) => (
                <FormCheckbox
                  key={field.value}
                  label={field.label}
                  checked={(config.fields || []).includes(field.value)}
                  onChange={() => toggleField(field.value)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Layout
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onChange({ ...config, layout: 'oneColumn' })}
                className={`
                  flex-1 px-4 py-2 rounded border text-sm font-medium
                  ${config.layout === 'oneColumn'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                One Column
              </button>
              <button
                onClick={() => onChange({ ...config, layout: 'twoColumn' })}
                className={`
                  flex-1 px-4 py-2 rounded border text-sm font-medium
                  ${config.layout === 'twoColumn' || !config.layout
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                Two Columns
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
