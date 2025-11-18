import React from 'react';
import { FileText, ChevronDown } from 'lucide-react';
import { SOFTWARE_TYPES, DOCUMENT_TYPES, DOCUMENT_LABELS } from '../utils/constants';

/**
 * DocumentTypeSelector Component
 * Allows user to select which type of document they're uploading
 */
function DocumentTypeSelector({ software, value, onChange }) {
  const getDocumentOptions = () => {
    if (software === SOFTWARE_TYPES.SQL_ACCOUNTING) {
      return [
        {
          id: DOCUMENT_TYPES.SQL_ACCOUNTING.INVOICE_WITH_ITEM,
          label: DOCUMENT_LABELS[DOCUMENT_TYPES.SQL_ACCOUNTING.INVOICE_WITH_ITEM],
        },
        {
          id: DOCUMENT_TYPES.SQL_ACCOUNTING.SUPPLIER_INVOICE,
          label: DOCUMENT_LABELS[DOCUMENT_TYPES.SQL_ACCOUNTING.SUPPLIER_INVOICE],
        },
        {
          id: DOCUMENT_TYPES.SQL_ACCOUNTING.GL_DOCUMENT_OR,
          label: DOCUMENT_LABELS[DOCUMENT_TYPES.SQL_ACCOUNTING.GL_DOCUMENT_OR],
        },
        {
          id: DOCUMENT_TYPES.SQL_ACCOUNTING.GL_DOCUMENT_PV,
          label: DOCUMENT_LABELS[DOCUMENT_TYPES.SQL_ACCOUNTING.GL_DOCUMENT_PV],
        },
      ];
    } else if (software === SOFTWARE_TYPES.AUTOCOUNT) {
      return [
        // Add Autocount document types here
      ];
    }
    return [];
  };

  const options = getDocumentOptions();

  if (options.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Step 2: Select Document Type
        </h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Document types for this software are coming soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Step 2: Select Document Type
      </h2>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <FileText size={20} className="text-gray-400" />
        </div>

        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-12 pr-10 py-3 text-base text-gray-900 border-2 border-gray-200 rounded-lg appearance-none cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 bg-white"
        >
          <option value="" disabled>
            Select a document type...
          </option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDown size={20} className="text-gray-400" />
        </div>
      </div>
    </div>
  );
}

export default DocumentTypeSelector;
