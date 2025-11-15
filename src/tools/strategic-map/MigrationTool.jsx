import React, { useState } from 'react';
import { migrateLocalStorageToDatabase, loadFromLocalStorage } from './api';

/**
 * Data Migration Tool Component
 * Helps users migrate their Strategic Map data from localStorage to database
 */
const MigrationTool = ({ organizationSlug }) => {
  const [status, setStatus] = useState('idle'); // idle, counting, migrating, success, error
  const [result, setResult] = useState(null);
  const [itemCount, setItemCount] = useState(0);

  // Count items in localStorage
  const countItems = () => {
    const localData = loadFromLocalStorage(organizationSlug);
    let count = 0;

    Object.values(localData).forEach(cellItems => {
      count += cellItems.length;
    });

    setItemCount(count);
    setStatus('counted');
  };

  // Start migration
  const handleMigrate = async () => {
    setStatus('migrating');
    setResult(null);

    try {
      const migrationResult = await migrateLocalStorageToDatabase(organizationSlug);

      setResult(migrationResult);
      setStatus('success');

      // If migration was successful and no failures, offer to clear localStorage
      if (migrationResult.data.failed === 0) {
        console.log('✅ Migration successful! All items migrated.');
      }
    } catch (error) {
      console.error('Migration failed:', error);
      setStatus('error');
      setResult({ error: error.message });
    }
  };

  // Clear localStorage after successful migration
  const handleClearLocalStorage = () => {
    if (window.confirm('Are you sure you want to clear localStorage? This cannot be undone. Make sure the migration was successful first!')) {
      localStorage.removeItem(`strategic_map_${organizationSlug}`);
      setItemCount(0);
      alert('localStorage cleared successfully!');
    }
  };

  return (
    <div className="p-6 bg-white border border-gray-300 rounded-lg shadow-sm max-w-2xl mx-auto my-6">
      <h3 className="text-xl font-bold text-gray-900 mb-3">Strategic Map Data Migration Tool</h3>
      <p className="text-sm text-gray-600 mb-4">
        Migrate your Strategic Map data from browser localStorage to the database.
        This enables data sync across devices and provides better data security.
      </p>

      {status === 'idle' && (
        <div>
          <button
            onClick={countItems}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Check Data in localStorage
          </button>
        </div>
      )}

      {status === 'counted' && (
        <div>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-gray-700">
              Found <strong className="text-blue-700">{itemCount} items</strong> in localStorage
            </p>
          </div>

          {itemCount > 0 ? (
            <div className="flex gap-3">
              <button
                onClick={handleMigrate}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Start Migration
              </button>
              <button
                onClick={() => setStatus('idle')}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="text-gray-600">
              No items to migrate. Your localStorage is empty.
            </div>
          )}
        </div>
      )}

      {status === 'migrating' && (
        <div className="flex items-center gap-3 text-blue-600">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="font-medium">Migrating {itemCount} items to database...</span>
        </div>
      )}

      {status === 'success' && result && (
        <div>
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800 font-semibold mb-2">✅ Migration Successful!</p>
            <div className="text-sm text-gray-700 space-y-1">
              <p>Created: <strong className="text-green-700">{result.data.created}</strong> items</p>
              <p>Failed: <strong className="text-red-700">{result.data.failed}</strong> items</p>
            </div>
          </div>

          {result.data.failed === 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-gray-700 mb-2">
                All items were successfully migrated! You can now safely clear your localStorage.
              </p>
              <button
                onClick={handleClearLocalStorage}
                className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
              >
                Clear localStorage
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setStatus('idle');
              setResult(null);
              setItemCount(0);
            }}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          >
            Done
          </button>
        </div>
      )}

      {status === 'error' && result && (
        <div>
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800 font-semibold mb-2">❌ Migration Failed</p>
            <p className="text-sm text-gray-700">{result.error}</p>
          </div>

          <button
            onClick={() => {
              setStatus('idle');
              setResult(null);
            }}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Migration Notes:</h4>
        <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
          <li>Migration does not delete localStorage data automatically</li>
          <li>You can continue using localStorage mode even after migration</li>
          <li>To use database mode, set REACT_APP_USE_STRATEGIC_MAP_API=true in .env</li>
          <li>Database mode provides data sync across devices and better security</li>
        </ul>
      </div>
    </div>
  );
};

export default MigrationTool;
