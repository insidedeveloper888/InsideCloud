/**
 * ComponentPropertyPanel - Edit component properties with data mapping
 */
import React, { useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { FormInput, ColorPicker } from '../ui/FormInput';

// Data keys available for each document type
const getAvailableDataKeys = (documentType) => {
  const common = [
    { key: 'document_number', label: 'Document Number', type: 'text' },
    { key: 'document_date', label: 'Document Date', type: 'date' },
    { key: 'customer_name', label: 'Customer Name', type: 'text' },
    { key: 'customer_address', label: 'Customer Address', type: 'multiline' },
    { key: 'customer_email', label: 'Customer Email', type: 'text' },
    { key: 'customer_phone', label: 'Customer Phone', type: 'text' },
    { key: 'salesperson_name', label: 'Salesperson Name', type: 'text' },
    { key: 'subtotal', label: 'Subtotal', type: 'number' },
    { key: 'tax', label: 'Tax', type: 'number' },
    { key: 'tax_rate', label: 'Tax Rate', type: 'number' },
    { key: 'discount', label: 'Discount', type: 'number' },
    { key: 'total', label: 'Total', type: 'number' },
    { key: 'notes', label: 'Notes', type: 'multiline' },
    { key: 'terms_and_conditions', label: 'Terms & Conditions', type: 'multiline' },
    { key: 'items', label: 'Line Items', type: 'table' },
    { key: 'company_logo', label: 'Company Logo', type: 'image' },
    { key: 'qr_code_url', label: 'QR Code URL', type: 'qrcode' }
  ];

  return common;
};

export function ComponentPropertyPanel({ component, onUpdateComponent, onClose, documentType }) {
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      onUpdateComponent({
        ...component,
        config: { ...component.config, logoUrl: reader.result }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    onUpdateComponent({
      ...component,
      config: { ...component.config, logoUrl: '' }
    });
  };

  if (!component) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="mb-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
            <span className="text-3xl">✏️</span>
          </div>
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          No Component Selected
        </h3>
        <p className="text-xs text-gray-500">
          Click any component on the canvas to edit its properties.
        </p>
      </div>
    );
  }

  const availableDataKeys = getAvailableDataKeys(documentType);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-sm font-semibold text-gray-900">
          Edit {component.type.charAt(0).toUpperCase() + component.type.slice(1)}
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-gray-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Properties */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Position & Size */}
        <div className="pb-4 border-b">
          <h4 className="text-xs font-semibold text-gray-700 uppercase mb-3">Position & Size</h4>

          <div className="grid grid-cols-2 gap-3">
            <FormInput
              type="number"
              label="X (px)"
              value={component.x}
              onChange={(e) => onUpdateComponent({ ...component, x: parseInt(e.target.value) || 0 })}
            />
            <FormInput
              type="number"
              label="Y (px)"
              value={component.y}
              onChange={(e) => onUpdateComponent({ ...component, y: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormInput
              type="number"
              label="Width (px)"
              value={component.width}
              min={20}
              onChange={(e) => onUpdateComponent({ ...component, width: parseInt(e.target.value) || 20 })}
            />
            <FormInput
              type="number"
              label="Height (px)"
              value={component.height}
              min={10}
              onChange={(e) => onUpdateComponent({ ...component, height: parseInt(e.target.value) || 10 })}
            />
          </div>
        </div>

        {/* Data Mapping */}
        <div className="pb-4 border-b">
          <h4 className="text-xs font-semibold text-gray-700 uppercase mb-3">Data Mapping</h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Key
            </label>
            <select
              value={component.dataKey || ''}
              onChange={(e) => onUpdateComponent({ ...component, dataKey: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- No Data --</option>
              {availableDataKeys
                .filter(dk => !dk.type || dk.type === component.type || component.type === 'text')
                .map(dataKey => (
                  <option key={dataKey.key} value={dataKey.key}>
                    {dataKey.label} ({dataKey.key})
                  </option>
                ))}
            </select>
            {component.dataKey && (
              <p className="mt-1 text-xs text-gray-500">
                Preview: <code className="bg-gray-100 px-1 rounded">{`{${component.dataKey}}`}</code>
              </p>
            )}
          </div>
        </div>

        {/* Type-Specific Config */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase mb-3">Styling</h4>

          {(component.type === 'text' || component.type === 'multiline') && (
            <>
              <FormInput
                type="number"
                label="Font Size (px)"
                value={component.config?.fontSize || 14}
                min={8}
                max={72}
                onChange={(e) => onUpdateComponent({
                  ...component,
                  config: { ...component.config, fontSize: parseInt(e.target.value) || 14 }
                })}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Weight
                </label>
                <select
                  value={component.config?.fontWeight || 'normal'}
                  onChange={(e) => onUpdateComponent({
                    ...component,
                    config: { ...component.config, fontWeight: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                  <option value="600">Semi-Bold</option>
                </select>
              </div>

              {component.type === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Align
                  </label>
                  <div className="flex gap-2">
                    {['left', 'center', 'right'].map(align => (
                      <button
                        key={align}
                        onClick={() => onUpdateComponent({
                          ...component,
                          config: { ...component.config, textAlign: align }
                        })}
                        className={`flex-1 px-3 py-2 text-sm rounded border ${
                          (component.config?.textAlign || 'left') === align
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300'
                        }`}
                      >
                        {align.charAt(0).toUpperCase() + align.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <ColorPicker
                label="Text Color"
                color={component.config?.color || '#000000'}
                onChange={(color) => onUpdateComponent({
                  ...component,
                  config: { ...component.config, color }
                })}
              />
            </>
          )}

          {component.type === 'number' && (
            <>
              <FormInput
                type="number"
                label="Font Size (px)"
                value={component.config?.fontSize || 14}
                min={8}
                max={72}
                onChange={(e) => onUpdateComponent({
                  ...component,
                  config: { ...component.config, fontSize: parseInt(e.target.value) || 14 }
                })}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <select
                  value={component.config?.format || 'number'}
                  onChange={(e) => onUpdateComponent({
                    ...component,
                    config: { ...component.config, format: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
                >
                  <option value="number">Number</option>
                  <option value="currency">Currency</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>

              <FormInput
                type="number"
                label="Decimal Places"
                value={component.config?.decimals || 2}
                min={0}
                max={4}
                onChange={(e) => onUpdateComponent({
                  ...component,
                  config: { ...component.config, decimals: parseInt(e.target.value) || 2 }
                })}
              />
            </>
          )}

          {component.type === 'date' && (
            <>
              <FormInput
                type="number"
                label="Font Size (px)"
                value={component.config?.fontSize || 12}
                min={8}
                max={72}
                onChange={(e) => onUpdateComponent({
                  ...component,
                  config: { ...component.config, fontSize: parseInt(e.target.value) || 12 }
                })}
              />

              <FormInput
                label="Date Format"
                value={component.config?.format || 'YYYY-MM-DD'}
                onChange={(e) => onUpdateComponent({
                  ...component,
                  config: { ...component.config, format: e.target.value }
                })}
                placeholder="YYYY-MM-DD"
              />
              <p className="text-xs text-gray-500 mt-1">
                Examples: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
              </p>
            </>
          )}

          {component.type === 'image' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Image
                </label>

                {component.config?.logoUrl ? (
                  <div className="space-y-2">
                    <div className="relative border border-gray-300 rounded-lg p-4 bg-gray-50">
                      <img
                        src={component.config.logoUrl}
                        alt="Preview"
                        className="max-h-32 mx-auto"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <button
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Change Image
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center gap-2"
                  >
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-sm text-gray-600">Click to upload</span>
                    <span className="text-xs text-gray-500">PNG, JPG, SVG</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image Fit
                </label>
                <select
                  value={component.config?.fit || 'contain'}
                  onChange={(e) => onUpdateComponent({
                    ...component,
                    config: { ...component.config, fit: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
                >
                  <option value="contain">Contain (fit inside)</option>
                  <option value="cover">Cover (fill area)</option>
                  <option value="fill">Fill (stretch)</option>
                </select>
              </div>
            </>
          )}

          {component.type === 'signature' && (
            <>
              <ColorPicker
                label="Line Color"
                color={component.config?.lineColor || '#000000'}
                onChange={(color) => onUpdateComponent({
                  ...component,
                  config: { ...component.config, lineColor: color }
                })}
              />

              <FormInput
                label="Label"
                value={component.config?.label || 'Signature'}
                onChange={(e) => onUpdateComponent({
                  ...component,
                  config: { ...component.config, label: e.target.value }
                })}
              />
            </>
          )}

          {component.type === 'label' && (
            <>
              <FormInput
                label="Label Text"
                value={component.config?.text || ''}
                onChange={(e) => onUpdateComponent({
                  ...component,
                  config: { ...component.config, text: e.target.value }
                })}
                placeholder="Enter fixed text..."
              />

              <FormInput
                type="number"
                label="Font Size (px)"
                value={component.config?.fontSize || 14}
                min={8}
                max={72}
                onChange={(e) => onUpdateComponent({
                  ...component,
                  config: { ...component.config, fontSize: parseInt(e.target.value) || 14 }
                })}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Weight
                </label>
                <select
                  value={component.config?.fontWeight || 'normal'}
                  onChange={(e) => onUpdateComponent({
                    ...component,
                    config: { ...component.config, fontWeight: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Align
                </label>
                <div className="flex gap-2">
                  {['left', 'center', 'right'].map(align => (
                    <button
                      key={align}
                      onClick={() => onUpdateComponent({
                        ...component,
                        config: { ...component.config, textAlign: align }
                      })}
                      className={`flex-1 px-3 py-2 text-sm rounded border ${
                        (component.config?.textAlign || 'left') === align
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300'
                      }`}
                    >
                      {align.charAt(0).toUpperCase() + align.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <ColorPicker
                label="Text Color"
                color={component.config?.color || '#000000'}
                onChange={(color) => onUpdateComponent({
                  ...component,
                  config: { ...component.config, color }
                })}
              />
            </>
          )}

          {component.type === 'table' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Columns
                </label>

                {/* Column List */}
                <div className="space-y-2 mb-2">
                  {(component.config?.columns || []).map((column, index) => (
                    <div key={index} className="flex gap-2 items-start p-2 border rounded bg-gray-50">
                      <div className="flex-1 space-y-2">
                        {/* Field Selection */}
                        <select
                          value={column.field || ''}
                          onChange={(e) => {
                            const newColumns = [...(component.config?.columns || [])];
                            const fieldValue = e.target.value;
                            const fieldLabel = e.target.options[e.target.selectedIndex].text;
                            newColumns[index] = { ...column, field: fieldValue, label: fieldLabel };
                            onUpdateComponent({
                              ...component,
                              config: { ...component.config, columns: newColumns }
                            });
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900"
                        >
                          <option value="">Select field...</option>
                          <option value="product_name">Product Name</option>
                          <option value="description">Description</option>
                          <option value="quantity">Quantity</option>
                          <option value="unit">Unit</option>
                          <option value="unit_price">Unit Price</option>
                          <option value="subtotal">Subtotal</option>
                        </select>

                        {/* Width */}
                        <input
                          type="text"
                          placeholder="Width (e.g., 30%)"
                          value={column.width || ''}
                          onChange={(e) => {
                            const newColumns = [...(component.config?.columns || [])];
                            newColumns[index] = { ...column, width: e.target.value };
                            onUpdateComponent({
                              ...component,
                              config: { ...component.config, columns: newColumns }
                            });
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900"
                        />

                        {/* Alignment */}
                        <select
                          value={column.align || 'left'}
                          onChange={(e) => {
                            const newColumns = [...(component.config?.columns || [])];
                            newColumns[index] = { ...column, align: e.target.value };
                            onUpdateComponent({
                              ...component,
                              config: { ...component.config, columns: newColumns }
                            });
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>

                        {/* Format */}
                        <select
                          value={column.format || ''}
                          onChange={(e) => {
                            const newColumns = [...(component.config?.columns || [])];
                            newColumns[index] = { ...column, format: e.target.value || null };
                            onUpdateComponent({
                              ...component,
                              config: { ...component.config, columns: newColumns }
                            });
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900"
                        >
                          <option value="">No format</option>
                          <option value="currency">Currency</option>
                          <option value="number">Number</option>
                          <option value="percentage">Percentage</option>
                          <option value="date">Date</option>
                        </select>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => {
                          const newColumns = (component.config?.columns || []).filter((_, i) => i !== index);
                          onUpdateComponent({
                            ...component,
                            config: { ...component.config, columns: newColumns }
                          });
                        }}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Remove column"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Column Button */}
                <button
                  onClick={() => {
                    const newColumns = [
                      ...(component.config?.columns || []),
                      { field: 'product_name', label: 'Product Name', width: '40%', align: 'left', format: null }
                    ];
                    onUpdateComponent({
                      ...component,
                      config: { ...component.config, columns: newColumns }
                    });
                  }}
                  className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded hover:bg-gray-50 text-sm text-gray-600 hover:text-gray-800"
                >
                  + Add Column
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
