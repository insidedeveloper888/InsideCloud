/**
 * ItemsTableEditor - Edit Items Table Section
 */
import React from 'react';
import { FormCheckbox, ColorPicker } from '../../ui/FormInput';

export function ItemsTableEditor({ config, onChange }) {
  const availableColumns = [
    { value: 'item', label: 'Item/Product Name' },
    { value: 'description', label: 'Description' },
    { value: 'quantity', label: 'Quantity' },
    { value: 'unitPrice', label: 'Unit Price' },
    { value: 'amount', label: 'Amount' },
    { value: 'discount', label: 'Discount' },
    { value: 'tax', label: 'Tax' }
  ];

  const toggleColumn = (columnValue) => {
    const columns = config.columns || [];
    const exists = columns.includes(columnValue);

    if (exists) {
      onChange({ ...config, columns: columns.filter(c => c !== columnValue) });
    } else {
      onChange({ ...config, columns: [...columns, columnValue] });
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-900">📊 Items Table Section</h4>

      <FormCheckbox
        label="Enable Items Table"
        checked={config.enabled !== false}
        onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
      />

      {config.enabled !== false && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Columns to Display
            </label>
            <div className="space-y-2">
              {availableColumns.map((column) => (
                <FormCheckbox
                  key={column.value}
                  label={column.label}
                  checked={(config.columns || []).includes(column.value)}
                  onChange={() => toggleColumn(column.value)}
                />
              ))}
            </div>
          </div>

          <FormCheckbox
            label="Show Table Borders"
            checked={config.showBorders !== false}
            onChange={(e) => onChange({ ...config, showBorders: e.target.checked })}
          />

          <ColorPicker
            label="Header Background Color"
            color={config.headerBackgroundColor || '#f8f9fa'}
            onChange={(color) => onChange({ ...config, headerBackgroundColor: color })}
          />
        </>
      )}
    </div>
  );
}
