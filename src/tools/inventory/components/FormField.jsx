import React from 'react';

/**
 * Reusable form field components to reduce duplication
 */

/**
 * Form label with optional required indicator
 */
export function FormLabel({ children, required = false, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-gray-700 mb-2">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

/**
 * Standard text input field
 */
export function TextInput({
  value,
  onChange,
  placeholder,
  className = '',
  focusColor = 'focus:ring-emerald-500 focus:border-emerald-500',
  ...props
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 ${focusColor} bg-white text-gray-900 transition-all ${className}`}
      {...props}
    />
  );
}

/**
 * Standard number input field
 */
export function NumberInput({
  value,
  onChange,
  placeholder,
  min,
  max,
  step = '0.01',
  className = '',
  focusColor = 'focus:ring-emerald-500 focus:border-emerald-500',
  ...props
}) {
  return (
    <input
      type="number"
      value={value === 0 ? '' : value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 ${focusColor} bg-white text-gray-900 transition-all ${className}`}
      {...props}
    />
  );
}

/**
 * Standard textarea field
 */
export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 2,
  className = '',
  focusColor = 'focus:ring-emerald-500 focus:border-emerald-500',
  ...props
}) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 ${focusColor} bg-white text-gray-900 transition-all resize-none ${className}`}
      {...props}
    />
  );
}

/**
 * Standard select/dropdown field
 */
export function Select({
  value,
  onChange,
  children,
  className = '',
  focusColor = 'focus:ring-emerald-500 focus:border-emerald-500',
  ...props
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 ${focusColor} bg-white text-gray-900 transition-all ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

/**
 * Complete form field with label and input
 */
export default function FormField({
  label,
  required = false,
  type = 'text',
  value,
  onChange,
  placeholder,
  children,
  focusColor,
  inputProps = {},
  id
}) {
  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <TextArea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            focusColor={focusColor}
            id={id}
            {...inputProps}
          />
        );
      case 'number':
        return (
          <NumberInput
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            focusColor={focusColor}
            id={id}
            {...inputProps}
          />
        );
      case 'select':
        return (
          <Select
            value={value}
            onChange={onChange}
            focusColor={focusColor}
            id={id}
            {...inputProps}
          >
            {children || inputProps.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        );
      default:
        // For text inputs, if children are provided, return them directly
        // This allows custom input rendering
        if (children) {
          return children;
        }
        return (
          <TextInput
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            focusColor={focusColor}
            id={id}
            {...inputProps}
          />
        );
    }
  };

  return (
    <div>
      {label && <FormLabel required={required} htmlFor={id}>{label}</FormLabel>}
      {renderInput()}
    </div>
  );
}
