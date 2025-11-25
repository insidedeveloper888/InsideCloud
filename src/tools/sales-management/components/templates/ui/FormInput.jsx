/**
 * FormInput Component
 *
 * Reusable input component with proper text styling (text-gray-900).
 * Fixes the white text on white background issue across all template editors.
 */
import React from 'react';

export function FormInput({
  type = 'text',
  value,
  onChange,
  label,
  placeholder,
  min,
  max,
  step,
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <div className="mb-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={`
          w-full px-3 py-2
          border border-gray-300 rounded-md
          text-gray-900 text-sm
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
    </div>
  );
}

export function FormTextarea({
  value,
  onChange,
  label,
  placeholder,
  rows = 3,
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <div className="mb-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`
          w-full px-3 py-2
          border border-gray-300 rounded-md
          text-gray-900 text-sm
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
    </div>
  );
}

export function FormCheckbox({
  checked,
  onChange,
  label,
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <div className="flex items-center mb-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={`
          w-4 h-4
          text-blue-600 border-gray-300 rounded
          focus:ring-2 focus:ring-blue-500
          disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      {label && (
        <label className="ml-2 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
    </div>
  );
}

export function ColorPicker({
  color,
  onChange,
  label,
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <div className="mb-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`
            w-12 h-10
            border border-gray-300 rounded-md
            cursor-pointer
            disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="
            flex-1 px-3 py-2
            border border-gray-300 rounded-md
            text-gray-900 text-sm
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          "
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
