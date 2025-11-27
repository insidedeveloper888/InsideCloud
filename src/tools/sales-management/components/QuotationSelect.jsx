import React from 'react';
import { SearchableSelect } from '../../../components/ui/searchable-select';

/**
 * QuotationSelect - Dropdown for selecting quotations
 * Shows quotation code, customer name, amount, and status badge
 */
export function QuotationSelect({
  value,
  onChange,
  quotations = [],
  placeholder = 'Select Quotation...',
  className = '',
  filterConverted = true, // Filter out quotations already converted to SO
}) {
  // Adapt onChange to match existing event-style API
  const handleChange = (newValue) => {
    onChange({ target: { value: newValue } });
  };

  // Pre-filter options
  const filterOptions = (options) => {
    return options.filter(q => {
      // Filter out cancelled
      if (q.status === 'cancelled') return false;
      // Filter out converted (if enabled)
      if (filterConverted && q.converted_to_sales_order_id) return false;
      return true;
    });
  };

  // Status badge styles
  const getStatusStyle = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'sent':
        return 'bg-blue-100 text-blue-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Format currency
  const formatAmount = (amount) => {
    return `RM ${Number(amount || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
  };

  // Get customer name
  const getCustomerName = (quotation) => {
    return quotation.customer_name || quotation.customer?.company_name || 'Unknown Customer';
  };

  // Custom option rendering
  const renderOption = (quotation, { isSelected }) => (
    <div className="flex items-center justify-between w-full gap-2">
      <div className="flex flex-col min-w-0 flex-1">
        <span className={`font-medium truncate ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
          {quotation.quotation_code}
        </span>
        <span className="text-xs text-gray-500 truncate">{getCustomerName(quotation)}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm text-gray-600">{formatAmount(quotation.total_amount)}</span>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusStyle(quotation.status)}`}>
          {quotation.status}
        </span>
      </div>
    </div>
  );

  // Custom selected display
  const renderSelected = (quotation) => {
    return `${quotation.quotation_code} - ${getCustomerName(quotation)}`;
  };

  return (
    <SearchableSelect
      value={value}
      onChange={handleChange}
      options={quotations}
      getOptionValue={(q) => q.id}
      getOptionLabel={(q) => q.quotation_code}
      placeholder={placeholder}
      className={className}
      searchable={true}
      searchKeys={['quotation_code', 'customer_name']}
      searchPlaceholder="Search by code or customer..."
      clearable={true}
      filterOptions={filterOptions}
      renderOption={renderOption}
      renderSelected={renderSelected}
      minDropdownWidth={450}
    />
  );
}

export default QuotationSelect;
