/**
 * HeaderEditor - Edit Header Section
 */
import React, { useRef } from 'react';
import { FormInput, FormCheckbox, ColorPicker } from '../../ui/FormInput';
import { Upload, X } from 'lucide-react';

export function HeaderEditor({ config, onChange }) {
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange({ ...config, logoUrl: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    onChange({ ...config, logoUrl: '' });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-900">📄 Header Section</h4>

      <FormCheckbox
        label="Enable Header"
        checked={config.enabled !== false}
        onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
      />

      {config.enabled !== false && (
        <>
          <FormInput
            type="number"
            label="Height (px)"
            value={config.height || 100}
            min={50}
            max={300}
            onChange={(e) => onChange({ ...config, height: parseInt(e.target.value) || 100 })}
          />

          <ColorPicker
            label="Background Color"
            color={config.backgroundColor || '#f8f9fa'}
            onChange={(color) => onChange({ ...config, backgroundColor: color })}
          />

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Logo
            </label>

            {config.logoUrl ? (
              <div className="space-y-2">
                <div className="relative border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <img
                    src={config.logoUrl}
                    alt="Logo Preview"
                    className="max-h-20 mx-auto"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <button
                    onClick={handleRemoveLogo}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Change Logo
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center gap-2"
              >
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="text-sm text-gray-600">Click to upload logo</span>
                <span className="text-xs text-gray-500">PNG, JPG, SVG (max 2MB)</span>
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

          <FormCheckbox
            label="Show Logo"
            checked={config.showLogo !== false}
            onChange={(e) => onChange({ ...config, showLogo: e.target.checked })}
          />

          <FormInput
            label="Company Name"
            value={config.companyName || ''}
            onChange={(e) => onChange({ ...config, companyName: e.target.value })}
            placeholder="Your Company Name"
          />

          <FormCheckbox
            label="Show Company Name"
            checked={config.showCompanyName !== false}
            onChange={(e) => onChange({ ...config, showCompanyName: e.target.checked })}
          />
        </>
      )}
    </div>
  );
}
