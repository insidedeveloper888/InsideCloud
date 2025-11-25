import React from 'react';
import ColorPicker from '../ui/ColorPicker';
import FontPicker from '../ui/FontPicker';

/**
 * HeaderEditor - Configure header section (logo + company info)
 */
export default function HeaderEditor({ config, onChange }) {
  const companyInfoFields = [
    { key: 'name', label: 'Company Name' },
    { key: 'address', label: 'Address' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'website', label: 'Website' },
    { key: 'tax_id', label: 'Tax ID' },
  ];

  const toggleField = (field) => {
    const currentFields = config.companyInfo.fields || [];
    const newFields = currentFields.includes(field)
      ? currentFields.filter(f => f !== field)
      : [...currentFields, field];

    onChange({
      companyInfo: { ...config.companyInfo, fields: newFields }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Header Settings</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure the header section with logo and company information
        </p>
      </div>

      {/* Enable Header */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <input
          type="checkbox"
          id="header-enabled"
          checked={config.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <label htmlFor="header-enabled" className="text-sm font-medium text-gray-900">
          Enable Header Section
        </label>
      </div>

      {config.enabled && (
        <>
          {/* Header Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Header Height (px)
              </label>
              <input
                type="number"
                value={config.height}
                onChange={(e) => onChange({ height: parseInt(e.target.value) || 100 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="50"
                max="300"
              />
            </div>

            <ColorPicker
              color={config.backgroundColor}
              onChange={(color) => onChange({ backgroundColor: color })}
              label="Background Color"
            />
          </div>

          {/* Logo Settings */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-lg">🖼️</span>
              Logo Settings
            </h4>

            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="logo-enabled"
                checked={config.logo.enabled}
                onChange={(e) => onChange({
                  logo: { ...config.logo, enabled: e.target.checked }
                })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="logo-enabled" className="text-sm font-medium text-gray-900">
                Show Logo
              </label>
            </div>

            {config.logo.enabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="text"
                    value={config.logo.url}
                    onChange={(e) => onChange({
                      logo: { ...config.logo, url: e.target.value }
                    })}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a publicly accessible image URL
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position
                    </label>
                    <select
                      value={config.logo.position}
                      onChange={(e) => onChange({
                        logo: { ...config.logo, position: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Width (px)
                    </label>
                    <input
                      type="number"
                      value={config.logo.width}
                      onChange={(e) => onChange({
                        logo: { ...config.logo, width: parseInt(e.target.value) || 80 }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="20"
                      max="300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Height (px)
                    </label>
                    <input
                      type="number"
                      value={config.logo.height}
                      onChange={(e) => onChange({
                        logo: { ...config.logo, height: parseInt(e.target.value) || 80 }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="20"
                      max="300"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Company Info Settings */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-lg">🏢</span>
              Company Information
            </h4>

            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="companyinfo-enabled"
                checked={config.companyInfo.enabled}
                onChange={(e) => onChange({
                  companyInfo: { ...config.companyInfo, enabled: e.target.checked }
                })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="companyinfo-enabled" className="text-sm font-medium text-gray-900">
                Show Company Information
              </label>
            </div>

            {config.companyInfo.enabled && (
              <div className="space-y-4">
                {/* Fields Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fields to Display
                  </label>
                  <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                    {companyInfoFields.map(field => (
                      <label key={field.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(config.companyInfo.fields || []).includes(field.key)}
                          onChange={() => toggleField(field.key)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Styling Options */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position
                    </label>
                    <select
                      value={config.companyInfo.position}
                      onChange={(e) => onChange({
                        companyInfo: { ...config.companyInfo, position: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text Alignment
                    </label>
                    <select
                      value={config.companyInfo.alignment}
                      onChange={(e) => onChange({
                        companyInfo: { ...config.companyInfo, alignment: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Font Size
                    </label>
                    <input
                      type="number"
                      value={config.companyInfo.fontSize}
                      onChange={(e) => onChange({
                        companyInfo: { ...config.companyInfo, fontSize: parseInt(e.target.value) || 10 }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="6"
                      max="24"
                    />
                  </div>

                  <ColorPicker
                    color={config.companyInfo.fontColor}
                    onChange={(color) => onChange({
                      companyInfo: { ...config.companyInfo, fontColor: color }
                    })}
                    label="Text Color"
                  />
                </div>

                <FontPicker
                  font={config.companyInfo.fontFamily}
                  onChange={(font) => onChange({
                    companyInfo: { ...config.companyInfo, fontFamily: font }
                  })}
                  label="Font Family"
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
