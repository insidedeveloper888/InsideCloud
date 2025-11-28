/**
 * Filter constants for inventory module
 */

export const STOCK_STATUS_OPTIONS = [
  { id: 'normal', label: 'Normal' },
  { id: 'low_stock', label: 'Low Stock' },
  { id: 'out_of_stock', label: 'Out of Stock' },
  { id: 'no_stock', label: 'Unstocked' },
];

export const MOVEMENT_TYPE_OPTIONS = [
  { id: 'stock_in', label: 'Stock In' },
  { id: 'stock_out', label: 'Stock Out' },
];

export const ITEM_TYPE_OPTIONS = [
  { id: 'selling', label: 'Selling Items' },
  { id: 'spare', label: 'Non-Selling' },
];

export const PO_STATUS_OPTIONS = [
  { id: 'draft', label: 'Draft' },
  { id: 'ordered', label: 'Ordered' },
  { id: 'in_transit', label: 'In Transit' },
  { id: 'received', label: 'Received' },
];

export const DO_STATUS_OPTIONS = [
  { id: 'draft', label: 'Draft' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'dispatched', label: 'Dispatched' },
  { id: 'delivered', label: 'Delivered' },
];
