import React, { useRef } from 'react';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '../utils/constants';

/**
 * FileUploader Component
 * Handles file selection and upload
 */
function FileUploader({ onFileSelect, isProcessing, selectedFile, onClear }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSelect(file);
    }
  };

  const validateAndSelect = (file) => {
    // Validate file type
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_FILE_TYPES.includes(extension)) {
      alert(`Invalid file type. Accepted formats: ${ACCEPTED_FILE_TYPES.join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      alert(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Step 3: Upload File
      </h2>

      {!selectedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept={ACCEPTED_FILE_TYPES.join(',')}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Upload size={32} className="text-gray-600" />
            </div>

            <div>
              <p className="text-lg font-medium text-gray-900 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-gray-600">
                Supported formats: {ACCEPTED_FILE_TYPES.join(', ')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Maximum file size: {MAX_FILE_SIZE / (1024 * 1024)}MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-6 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <File size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-600">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>

            {isProcessing ? (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm font-medium">Processing...</span>
              </div>
            ) : (
              <Button
                onClick={onClear}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <X size={16} />
                Remove
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUploader;
