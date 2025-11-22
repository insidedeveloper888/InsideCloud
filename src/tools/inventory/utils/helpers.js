import { FileText, CheckCircle, Truck } from 'lucide-react';

/**
 * Stock Status Utilities
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'normal':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'low_stock':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'out_of_stock':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'no_stock':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusLabel = (status) => {
  switch (status) {
    case 'normal':
      return 'Normal';
    case 'low_stock':
      return 'Low Stock';
    case 'out_of_stock':
      return 'Out of Stock';
    case 'no_stock':
      return 'Unstocked';
    default:
      return status;
  }
};

/**
 * Movement Type Utilities
 */
export const getMovementTypeColor = (type) => {
  switch (type) {
    case 'stock_in':
      return 'text-green-600';
    case 'stock_out':
      return 'text-red-600';
    case 'adjustment':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
};

export const getMovementTypeLabel = (type) => {
  switch (type) {
    case 'stock_in':
      return 'Stock In';
    case 'stock_out':
      return 'Stock Out';
    case 'adjustment':
      return 'Adjustment';
    default:
      return type;
  }
};

/**
 * Purchase Order Status Utilities
 */
export const getPOStatusColor = (status) => {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'approved':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'ordered':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'in_transit':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'received':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getPOStatusLabel = (status) => {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'approved':
      return 'Approved';
    case 'ordered':
      return 'Ordered';
    case 'in_transit':
      return 'In Transit';
    case 'received':
      return 'Received';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
};

export const getPOStatusIcon = (status) => {
  switch (status) {
    case 'draft':
      return FileText;
    case 'approved':
      return CheckCircle;
    case 'ordered':
      return CheckCircle;
    case 'in_transit':
      return Truck;
    case 'received':
      return CheckCircle;
    default:
      return FileText;
  }
};
