import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

// Components
import SoftwareSelector from './components/SoftwareSelector';
import DocumentTypeSelector from './components/DocumentTypeSelector';
import FileUploader from './components/FileUploader';
import DataPreviewTable from './components/DataPreviewTable';
import DownloadButton from './components/DownloadButton';

// Parsers
import { parseInvoiceWithItem } from './parsers/sql-accounting/invoiceWithItem';
import { parseSupplierInvoice } from './parsers/sql-accounting/supplierInvoice';
import { parseGLDocumentOR } from './parsers/sql-accounting/glDocumentOR';
import { parseGLDocumentPV } from './parsers/sql-accounting/glDocumentPV';

// Utilities
import { readExcelFile } from './parsers/common/excelReader';
import { readCSVFile } from './parsers/common/csvReader';
import { SOFTWARE_TYPES, DOCUMENT_TYPES } from './utils/constants';

import './index.css';

/**
 * DocumentParser Component
 *
 * Main component for parsing CSV/Excel files from accounting software.
 * Pure frontend implementation - no database or API calls.
 *
 * @param {Object} props
 * @param {string} props.organizationSlug - Organization identifier (unused currently)
 */
function DocumentParser({ organizationSlug }) {
  const [selectedSoftware, setSelectedSoftware] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Get parser function based on selected software and doc type
  const getParser = (software, docType) => {
    if (software === SOFTWARE_TYPES.SQL_ACCOUNTING) {
      if (docType === DOCUMENT_TYPES.SQL_ACCOUNTING.INVOICE_WITH_ITEM) {
        return parseInvoiceWithItem;
      }
      if (docType === DOCUMENT_TYPES.SQL_ACCOUNTING.SUPPLIER_INVOICE) {
        return parseSupplierInvoice;
      }
      if (docType === DOCUMENT_TYPES.SQL_ACCOUNTING.GL_DOCUMENT_OR) {
        return parseGLDocumentOR;
      }
      if (docType === DOCUMENT_TYPES.SQL_ACCOUNTING.GL_DOCUMENT_PV) {
        return parseGLDocumentPV;
      }
      // Add more SQL Accounting parsers here
    } else if (software === SOFTWARE_TYPES.AUTOCOUNT) {
      // Add Autocount parsers here
    }

    throw new Error(`No parser available for ${software} - ${docType}`);
  };

  // Handle file upload and parsing
  const handleFileUpload = async (file) => {
    setUploadedFile(file);
    setError(null);
    setParsedData(null);
    setIsProcessing(true);

    try {
      // Step 1: Read file based on extension
      const extension = file.name.split('.').pop().toLowerCase();
      let rawData;

      if (extension === 'xlsx' || extension === 'xls') {
        rawData = await readExcelFile(file);
      } else if (extension === 'csv') {
        rawData = await readCSVFile(file);
      } else {
        throw new Error(`Unsupported file type: .${extension}`);
      }

      // Step 2: Get appropriate parser
      const parser = getParser(selectedSoftware, selectedDocType);

      // Step 3: Parse the data
      const result = parser(rawData);

      // Step 4: Store parsed data
      setParsedData(result);
    } catch (err) {
      console.error('Parsing error:', err);
      setError(err.message || 'Failed to parse file');
      setParsedData(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file removal
  const handleClearFile = () => {
    setUploadedFile(null);
    setParsedData(null);
    setError(null);
  };

  // Handle software change
  const handleSoftwareChange = (software) => {
    setSelectedSoftware(software);
    setSelectedDocType(null); // Reset doc type when software changes
    setUploadedFile(null);
    setParsedData(null);
    setError(null);
  };

  // Handle document type change
  const handleDocTypeChange = (docType) => {
    setSelectedDocType(docType);
    setUploadedFile(null);
    setParsedData(null);
    setError(null);
  };

  return (
    <div className="document-parser-container">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Document Parser
        </h1>
        <p className="text-gray-600">
          Parse and format CSV/Excel exports from accounting software
        </p>
      </div>

      {/* Software Selector */}
      <SoftwareSelector value={selectedSoftware} onChange={handleSoftwareChange} />

      {/* Document Type Selector */}
      {selectedSoftware && (
        <DocumentTypeSelector
          software={selectedSoftware}
          value={selectedDocType}
          onChange={handleDocTypeChange}
        />
      )}

      {/* File Uploader */}
      {selectedDocType && (
        <FileUploader
          onFileSelect={handleFileUpload}
          isProcessing={isProcessing}
          selectedFile={uploadedFile}
          onClear={handleClearFile}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">
                  Parsing Error
                </h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Preview */}
      {parsedData && (
        <>
          <DataPreviewTable data={parsedData} />
          <DownloadButton data={parsedData} originalFilename={uploadedFile?.name} />
        </>
      )}

      {/* Help Text */}
      {!selectedSoftware && (
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Select the accounting software that generated your export file</li>
            <li>Choose the specific document type you want to parse</li>
            <li>Upload your CSV or Excel file</li>
            <li>Review the parsed data in the preview table</li>
            <li>Download the cleaned CSV file</li>
          </ol>
        </div>
      )}
    </div>
  );
}

export default DocumentParser;
