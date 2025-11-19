/**
 * ContactImportDialog Component
 * 3-step wizard for importing contacts from CSV
 */

import React, { useState } from 'react';
import { X, Download, Upload, AlertCircle, CheckCircle, XCircle, FileText } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8989';

const STEPS = {
  UPLOAD: 0,
  PREVIEW: 1,
  RESULTS: 2,
};

export default function ContactImportDialog({ isOpen, onClose, organizationSlug, individualId, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(STEPS.UPLOAD);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setCurrentStep(STEPS.UPLOAD);
    setFile(null);
    setParsedData([]);
    setValidationResults(null);
    setImportResults(null);
    setError(null);
    onClose();
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/contacts/import/template?organization_slug=${organizationSlug}`
      );

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contact_import_template_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading template:', err);
      setError(err.message);
    }
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};

      // Map CSV headers to expected field names
      headers.forEach((header, index) => {
        const value = values[index] || '';
        const cleanHeader = header.replace(/\*/g, '').trim();

        // Map to camelCase field names
        if (cleanHeader.toLowerCase() === 'first name') row.firstName = value;
        else if (cleanHeader.toLowerCase() === 'last name') row.lastName = value;
        else if (cleanHeader.toLowerCase() === 'phone 1') row.phone1 = value;
        else if (cleanHeader.toLowerCase() === 'email') row.email = value;
        else if (cleanHeader.toLowerCase() === 'phone 2') row.phone2 = value;
        else if (cleanHeader.toLowerCase() === 'company name') row.companyName = value;
        else if (cleanHeader.toLowerCase() === 'entity type') row.entityType = value;
        else if (cleanHeader.toLowerCase() === 'contact type') row.contactType = value;
        else if (cleanHeader.toLowerCase() === 'stage') row.stage = value;
        else if (cleanHeader.toLowerCase() === 'channel') row.channel = value;
        else if (cleanHeader.toLowerCase() === 'tags') row.tags = value;
        else if (cleanHeader.toLowerCase() === 'notes') row.notes = value;
      });

      rows.push(row);
    }

    return rows;
  };

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError(null);
    setIsLoading(true);

    try {
      const text = await uploadedFile.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        throw new Error('CSV file is empty or invalid');
      }

      setParsedData(rows);

      // Validate data
      const response = await fetch(`${API_BASE}/api/contacts/import/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_slug: organizationSlug,
          rows,
        }),
      });

      if (!response.ok) {
        throw new Error('Validation failed');
      }

      const results = await response.json();
      setValidationResults(results);
      setCurrentStep(STEPS.PREVIEW);
    } catch (err) {
      console.error('Error processing file:', err);
      setError(err.message);
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Filter out invalid rows and duplicates
      const validRows = validationResults.validatedRows
        .filter(r => r.valid && !r.warnings.some(w => w.includes('already exists')))
        .map(r => r.data);

      const response = await fetch(`${API_BASE}/api/contacts/import/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_slug: organizationSlug,
          individual_id: individualId,
          rows: validRows,
        }),
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const results = await response.json();
      setImportResults(results);
      setCurrentStep(STEPS.RESULTS);

      if (results.success > 0 && onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error executing import:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (row) => {
    if (!row.valid) {
      return <XCircle size={16} className="text-red-500" />;
    }
    if (row.warnings.some(w => w.includes('already exists'))) {
      return <XCircle size={16} className="text-orange-500" />;
    }
    if (row.warnings.length > 0) {
      return <AlertCircle size={16} className="text-yellow-500" />;
    }
    return <CheckCircle size={16} className="text-green-500" />;
  };

  const getStatusColor = (row) => {
    if (!row.valid) return 'bg-red-50';
    if (row.warnings.some(w => w.includes('already exists'))) return 'bg-orange-50';
    if (row.warnings.length > 0) return 'bg-yellow-50';
    return 'bg-green-50';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Import Contacts</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {['Upload CSV', 'Preview & Validate', 'Import Results'].map((label, index) => (
              <div key={index} className="flex items-center flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      index <= currentStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      index <= currentStep ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {index < 2 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Upload */}
          {currentStep === STEPS.UPLOAD && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Instructions</h3>
                <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                  <li>Download the CSV template below</li>
                  <li>Fill in your contact data following the template format</li>
                  <li>Required fields: First Name, Last Name, Phone 1, Entity Type, Contact Type</li>
                  <li>Entity Type must be: <strong>company</strong> or <strong>individual</strong></li>
                  <li>Contact Type must be: customer, supplier, coi, or internal</li>
                  <li>Tags: Separate multiple tags with commas</li>
                  <li>Upload the completed CSV file</li>
                </ol>
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Download size={20} />
                Download CSV Template
              </button>

              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                  disabled={isLoading}
                />
                <label
                  htmlFor="csv-upload"
                  className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    isLoading
                      ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <Upload size={40} className="text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700">
                    {isLoading ? 'Processing...' : 'Click to upload CSV file'}
                  </p>
                  {file && (
                    <p className="text-xs text-gray-500 mt-1">{file.name}</p>
                  )}
                </label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-600 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Preview & Validate */}
          {currentStep === STEPS.PREVIEW && validationResults && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-900">
                    {validationResults.summary.total}
                  </div>
                  <div className="text-sm text-blue-700">Total Rows</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-900">
                    {validationResults.summary.valid}
                  </div>
                  <div className="text-sm text-green-700">Valid</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-900">
                    {validationResults.summary.validWithWarnings}
                  </div>
                  <div className="text-sm text-yellow-700">Warnings</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-900">
                    {validationResults.summary.invalid + validationResults.summary.duplicates}
                  </div>
                  <div className="text-sm text-red-700">Will Skip</div>
                </div>
              </div>

              {/* Validation Details */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                          #
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                          Status
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                          Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                          Email
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                          Type
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                          Issues
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {validationResults.validatedRows.map((row, index) => (
                        <tr key={index} className={getStatusColor(row)}>
                          <td className="px-3 py-2 text-gray-600">{index + 1}</td>
                          <td className="px-3 py-2">{getStatusIcon(row)}</td>
                          <td className="px-3 py-2 text-gray-900">
                            {row.data.firstName} {row.data.lastName}
                          </td>
                          <td className="px-3 py-2 text-gray-600">{row.data.email || '-'}</td>
                          <td className="px-3 py-2 text-gray-600">{row.data.contactType || '-'}</td>
                          <td className="px-3 py-2">
                            {[...row.errors, ...row.warnings].map((issue, i) => (
                              <div
                                key={i}
                                className={`text-xs ${
                                  row.errors.includes(issue) ? 'text-red-700' : 'text-yellow-700'
                                }`}
                              >
                                {issue}
                              </div>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {validationResults.summary.validWithWarnings > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-1">Auto-creation enabled</p>
                      <p>
                        New stages, channels, and tags will be automatically created during import.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Results */}
          {currentStep === STEPS.RESULTS && importResults && (
            <div className="space-y-6">
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Import Complete</h3>
                <p className="text-gray-600">
                  Successfully imported {importResults.success} of {importResults.total} contacts
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">{importResults.total}</div>
                  <div className="text-sm text-blue-700">Total Processed</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">{importResults.success}</div>
                  <div className="text-sm text-green-700">Imported</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-900">{importResults.failed}</div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900">Error Details</h4>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                            Row
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                            Error
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {importResults.errors.map((err, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-gray-900">{err.row}</td>
                            <td className="px-4 py-2 text-red-700">{err.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            {currentStep === STEPS.RESULTS ? 'Close' : 'Cancel'}
          </button>

          <div className="flex gap-2">
            {currentStep === STEPS.PREVIEW && (
              <>
                <button
                  onClick={() => setCurrentStep(STEPS.UPLOAD)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={
                    isLoading ||
                    validationResults.summary.valid + validationResults.summary.validWithWarnings ===
                      0
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Importing...' : `Import ${validationResults.summary.valid + validationResults.summary.validWithWarnings} Contacts`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
