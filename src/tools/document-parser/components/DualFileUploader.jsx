import React, { useRef, useState } from 'react';
import { Upload, X, FileSpreadsheet, CheckCircle } from 'lucide-react';

export default function DualFileUploader({
  onFilesSelect,
  isProcessing,
  onClear,
  primaryLabel = "1. Primary Document",
  secondaryLabel = "2. Secondary Document",
}) {
  // 🚀 关键：file state在组件内部管理
  const [customerFile, setCustomerFile] = useState(null);
  const [salesFile, setSalesFile] = useState(null);
  
  const customerInputRef = useRef(null);
  const salesInputRef = useRef(null);

  const handleCustomerChange = (e) => {
    const file = e.target.files[0];
    console.log('🔧 Customer file selected:', file?.name);
    setCustomerFile(file);
  };

  const handleSalesChange = (e) => {
    const file = e.target.files[0];
    console.log('🔧 Sales file selected:', file?.name);
    setSalesFile(file);
  };

  const handleParse = () => {
    console.log('🔧 Parse button clicked');
    console.log('🔧 Customer file:', customerFile?.name);
    console.log('🔧 Sales file:', salesFile?.name);
    
    if (customerFile && salesFile) {
      onFilesSelect(customerFile, salesFile);
    }
  };

  const handleClearLocal = () => {
    console.log('🔧 Clear button clicked');
    setCustomerFile(null);
    setSalesFile(null);
    if (customerInputRef.current) customerInputRef.current.value = '';
    if (salesInputRef.current) salesInputRef.current.value = '';
    onClear();
  };

  const bothFilesSelected = customerFile && salesFile;

  console.log('🔍 DualFileUploader render - Customer:', !!customerFile, 'Sales:', !!salesFile);

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Upload Documents
      </h3>
      
      {/* Primary Document Upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {primaryLabel}
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
          {customerFile ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle size={20} className="text-green-600" />
                <FileSpreadsheet size={20} className="text-gray-600" />
                <span className="text-sm text-gray-900">{customerFile.name}</span>
                <span className="text-xs text-gray-500">
                  ({(customerFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                onClick={handleClearLocal}
                className="text-red-600 hover:text-red-700"
                type="button"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => customerInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-2"
              type="button"
            >
              <Upload size={32} className="text-gray-400" />
              <span className="text-sm text-gray-600">
                Click to upload Customer Document
              </span>
              <span className="text-xs text-gray-500">
                Accepted formats: .xlsx, .xls, .csv
              </span>
            </button>
          )}
          <input
            ref={customerInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleCustomerChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Secondary Document Upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {secondaryLabel}
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
          {salesFile ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle size={20} className="text-green-600" />
                <FileSpreadsheet size={20} className="text-gray-600" />
                <span className="text-sm text-gray-900">{salesFile.name}</span>
                <span className="text-xs text-gray-500">
                  ({(salesFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                onClick={handleClearLocal}
                className="text-red-600 hover:text-red-700"
                type="button"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => salesInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-2"
              type="button"
            >
              <Upload size={32} className="text-gray-400" />
              <span className="text-sm text-gray-600">
                Click to upload Sales Document
              </span>
              <span className="text-xs text-gray-500">
                Accepted formats: .xlsx, .xls, .csv
              </span>
            </button>
          )}
          <input
            ref={salesInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleSalesChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Status Message */}
      {customerFile && !salesFile && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            ✓ Customer document uploaded. Please upload Sales document to continue.
          </p>
        </div>
      )}

      {salesFile && !customerFile && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            ✓ Sales document uploaded. Please upload Customer document to continue.
          </p>
        </div>
      )}

      {/* Parse Button */}
      {bothFilesSelected && !isProcessing && (
        <button
          onClick={handleParse}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          type="button"
        >
          Parse Both Files
        </button>
      )}

      {isProcessing && (
        <div className="flex items-center justify-center gap-3 py-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Processing files...</span>
        </div>
      )}
    </div>
  );
}