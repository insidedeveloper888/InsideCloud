import React from 'react';
import { Building2, Database } from 'lucide-react';
import { SOFTWARE_TYPES, SOFTWARE_LABELS } from '../utils/constants';

/**
 * SoftwareSelector Component
 * Allows user to select which accounting software the file is from
 */
function SoftwareSelector({ value, onChange }) {
  const softwareOptions = [
    {
      id: SOFTWARE_TYPES.SQL_ACCOUNTING,
      label: SOFTWARE_LABELS[SOFTWARE_TYPES.SQL_ACCOUNTING],
      icon: Database,
      description: 'Parse exports from SQL Accounting',
    },
    {
      id: SOFTWARE_TYPES.AUTOCOUNT,
      label: SOFTWARE_LABELS[SOFTWARE_TYPES.AUTOCOUNT],
      icon: Building2,
      description: 'Parse exports from Autocount',
    },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Step 1: Select Accounting Software
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {softwareOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.id;

          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={`
                relative p-6 rounded-lg border-2 transition-all duration-200
                ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                }
              `}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`
                  w-12 h-12 rounded-lg flex items-center justify-center
                  ${isSelected ? 'bg-blue-600' : 'bg-gray-100'}
                `}
                >
                  <Icon
                    size={24}
                    className={isSelected ? 'text-white' : 'text-gray-600'}
                  />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {option.label}
                  </h3>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SoftwareSelector;
