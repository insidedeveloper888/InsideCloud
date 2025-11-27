import React from 'react';
import { SearchableSelect } from '../../../components/ui/searchable-select';

/**
 * SalesOrderSelect - Dropdown for selecting sales orders
 * Shows order code, customer name, amount, and status badge
 */
export function SalesOrderSelect({
  value,
  onChange,
  salesOrders = [],
  placeholder = 'Select Sales Order...',
  className = '',
  filterCompleted = false,
  filterFullyDelivered = false,
}) {
  // Adapt onChange to match existing event-style API
  const handleChange = (newValue) => {
    onChange({ target: { value: newValue } });
  };

  // Pre-filter options
  const filterOptions = (options) => {
    return options.filter(order => {
      // Filter out cancelled
      if (order.status === 'cancelled') return false;
      // Filter out completed (if enabled)
      if (filterCompleted && order.status === 'completed') return false;
      // Filter out fully delivered (if enabled)
      if (filterFullyDelivered && order.is_fully_delivered) return false;
      return true;
    });
  };

  // Status badge styles
  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'confirmed':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
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
  const getCustomerName = (order) => {
    return order.customer_name || order.customer?.company_name || 'Unknown Customer';
  };

  // Custom option rendering
  const renderOption = (order, { isSelected }) => (
    <div className="flex items-center justify-between w-full gap-2">
      <div className="flex flex-col min-w-0 flex-1">
        <span className={`font-medium truncate ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
          {order.order_code}
        </span>
        <span className="text-xs text-gray-500 truncate">{getCustomerName(order)}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm text-gray-600">{formatAmount(order.total_amount)}</span>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusStyle(order.status)}`}>
          {order.status}
        </span>
      </div>
    </div>
  );

  // Custom selected display
  const renderSelected = (order) => {
    return `${order.order_code} - ${getCustomerName(order)}`;
  };

  return (
    <SearchableSelect
      value={value}
      onChange={handleChange}
      options={salesOrders}
      getOptionValue={(o) => o.id}
      getOptionLabel={(o) => o.order_code}
      placeholder={placeholder}
      className={className}
      searchable={true}
      searchKeys={['order_code', 'customer_name']}
      searchPlaceholder="Search by code or customer..."
      clearable={true}
      filterOptions={filterOptions}
      renderOption={renderOption}
      renderSelected={renderSelected}
      minDropdownWidth={450}
    />
  );
}

export default SalesOrderSelect;
