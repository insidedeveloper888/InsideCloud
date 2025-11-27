import React from 'react';
import { SearchableSelect } from '../../../components/ui/searchable-select';

/**
 * ProductSelect - Dropdown for selecting products
 * Uses base SearchableSelect with custom rendering for product details (SKU, price)
 */
export function ProductSelect({
  value,
  onChange,
  products = [],
  placeholder = 'Select Product...',
  className = '',
}) {
  // Adapt onChange to match existing event-style API
  const handleChange = (newValue) => {
    onChange({ target: { value: newValue } });
  };

  return (
    <SearchableSelect
      value={value}
      onChange={handleChange}
      options={products}
      getOptionValue={(product) => product.id}
      getOptionLabel={(product) => product.name || product.product_name || ''}
      placeholder={placeholder}
      className={className}
      searchable={true}
      searchKeys={['name', 'product_name', 'sku']}
      searchPlaceholder="Search by name or SKU..."
      clearable={true}
      renderOption={(product) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">
            {product.name || product.product_name}
          </span>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{product.sku || 'No SKU'}</span>
            <span>RM {(product.unit_price || product.price || 0).toFixed(2)}</span>
          </div>
        </div>
      )}
      renderSelected={(product) => (
        <span className="text-gray-900">
          {product.name || product.product_name}
          {product.sku && (
            <span className="text-gray-500 ml-1 text-xs">({product.sku})</span>
          )}
        </span>
      )}
    />
  );
}

export default ProductSelect;
