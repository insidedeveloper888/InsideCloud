import React, { useState } from 'react';
import { Download, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';
import { Button } from '../../../components/ui/button';

/**
 * DownloadButton Component
 * Exports parsed data as CSV file
 */
function DownloadButton({ data, originalFilename }) {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    if (!data || !data.rows || data.rows.length === 0) {
      alert('No data to download');
      return;
    }

    try {
      // Generate CSV using PapaParse
      const csv = Papa.unparse({
        fields: data.headers,
        data: data.rows.map(row => {
          // Convert row object to array in correct order
          return data.headers.map(header => {
            const value = row[header];
            // Convert boolean to string, handle null/undefined
            if (value === null || value === undefined) return '';
            if (typeof value === 'boolean') return value.toString();
            return value;
          });
        })
      });

      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const baseFilename = originalFilename
        ? originalFilename.replace(/\.[^/.]+$/, '') // Remove extension
        : 'export';
      const filename = `parsed_${baseFilename}_${timestamp}.csv`;

      // Create download link and trigger
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      URL.revokeObjectURL(url);

      // Show success state
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  return (
    <div className="mb-8">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Export Parsed Data
            </h3>
            <p className="text-sm text-gray-600">
              Download the cleaned and formatted data as a CSV file
            </p>
          </div>

          <Button
            onClick={handleDownload}
            disabled={downloaded}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {downloaded ? (
              <>
                <CheckCircle size={16} />
                Downloaded
              </>
            ) : (
              <>
                <Download size={16} />
                Download CSV
              </>
            )}
          </Button>
        </div>

        {downloaded && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              ✓ File downloaded successfully!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DownloadButton;
