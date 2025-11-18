import React from 'react';
import { CheckCircle2 } from 'lucide-react';

/**
 * DataPreviewTable Component
 * Displays parsed data in a table format
 */
function DataPreviewTable({ data }) {
  if (!data || !data.rows || data.rows.length === 0) {
    return null;
  }

  const { headers, rows, metadata } = data;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Preview Parsed Data
        </h2>
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 size={20} />
          <span className="text-sm font-medium">
            {metadata.totalRows} rows parsed successfully
          </span>
        </div>
      </div>

      {/* Metadata Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-blue-600 font-medium">Software</p>
            <p className="text-blue-900">{metadata.software}</p>
          </div>
          <div>
            <p className="text-blue-600 font-medium">Document Type</p>
            <p className="text-blue-900">{metadata.docType}</p>
          </div>
          <div>
            <p className="text-blue-600 font-medium">Total Rows</p>
            <p className="text-blue-900">{metadata.totalRows}</p>
          </div>
          <div>
            <p className="text-blue-600 font-medium">Totals Row Excluded</p>
            <p className="text-blue-900">{metadata.hadTotalsRow ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border-b border-gray-200"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  {headers.map((header, colIndex) => {
                    const value = row[header];
                    const displayValue =
                      value === null || value === undefined || value === ''
                        ? '-'
                        : typeof value === 'boolean'
                        ? value.toString()
                        : value;

                    return (
                      <td
                        key={colIndex}
                        className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                      >
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-gray-600 mt-2">
        Scroll horizontally to view all {headers.length} columns
      </p>
    </div>
  );
}

export default DataPreviewTable;
