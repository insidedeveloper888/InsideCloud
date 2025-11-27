import React from 'react';
import { SearchableSelect } from '../../../components/ui/searchable-select';

/**
 * DeliveryOrderSelect - Dropdown for selecting delivery orders
 * Shows DO code, customer name, delivery date, and status badge
 */
export function DeliveryOrderSelect({
  value,
  onChange,
  deliveryOrders = [],
  placeholder = 'Select Delivery Order...',
  className = '',
  filterDelivered = false,
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
      // Filter out delivered (if enabled)
      if (filterDelivered && order.status === 'delivered') return false;
      return true;
    });
  };

  // Status badge styles
  const getStatusStyle = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'in_transit':
        return 'bg-yellow-100 text-yellow-700';
      case 'ready':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-MY', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
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
          {order.delivery_order_code}
        </span>
        <span className="text-xs text-gray-500 truncate">{getCustomerName(order)}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm text-gray-600">{formatDate(order.delivery_date)}</span>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusStyle(order.status)}`}>
          {order.status}
        </span>
      </div>
    </div>
  );

  // Custom selected display
  const renderSelected = (order) => {
    return `${order.delivery_order_code} - ${getCustomerName(order)}`;
  };

  return (
    <SearchableSelect
      value={value}
      onChange={handleChange}
      options={deliveryOrders}
      getOptionValue={(o) => o.id}
      getOptionLabel={(o) => o.delivery_order_code}
      placeholder={placeholder}
      className={className}
      searchable={true}
      searchKeys={['delivery_order_code', 'customer_name']}
      searchPlaceholder="Search by code or customer..."
      clearable={true}
      filterOptions={filterOptions}
      renderOption={renderOption}
      renderSelected={renderSelected}
      minDropdownWidth={450}
    />
  );
}

export default DeliveryOrderSelect;
