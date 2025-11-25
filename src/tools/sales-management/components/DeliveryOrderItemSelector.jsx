import React, { useState, useEffect } from 'react';
import { AlertCircle, Package } from 'lucide-react';

const resolveApiOrigin = () =>
    process.env.REACT_APP_API_ORIGIN || window.location.origin;

export default function DeliveryOrderItemSelector({
    salesOrderId,
    organizationSlug,
    onItemsSelected,
    initialSelectedItems = [],
}) {
    const [deliverySummary, setDeliverySummary] = useState([]);
    const [selectedItems, setSelectedItems] = useState(initialSelectedItems);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch delivery summary for the sales order
    useEffect(() => {
        if (!salesOrderId || !organizationSlug) return;

        const fetchDeliverySummary = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(
                    `${resolveApiOrigin()}/api/sales_orders/${salesOrderId}/delivery_summary?organization_slug=${organizationSlug}`,
                    { credentials: 'include' }
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch delivery summary');
                }

                const data = await response.json();
                setDeliverySummary(data);

                // Initialize selected items with remaining quantities
                if (initialSelectedItems.length === 0) {
                    const autoSelected = data
                        .filter(item => item.remaining_qty > 0)
                        .map(item => ({
                            product_id: item.product_id,
                            quantity: item.remaining_qty, // Default to remaining quantity
                            unit: item.unit,
                        }));
                    setSelectedItems(autoSelected);
                    onItemsSelected(autoSelected);
                }
            } catch (err) {
                console.error('Error fetching delivery summary:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDeliverySummary();
    }, [salesOrderId, organizationSlug]);

    const handleQuantityChange = (productId, newQuantity) => {
        const item = deliverySummary.find(i => i.product_id === productId);
        if (!item) return;

        const qty = parseFloat(newQuantity) || 0;

        // Validate quantity
        if (qty < 0) return;
        if (qty > item.remaining_qty) {
            alert(`Cannot deliver more than ${item.remaining_qty} ${item.unit} remaining`);
            return;
        }

        const updatedItems = selectedItems.filter(i => i.product_id !== productId);
        if (qty > 0) {
            updatedItems.push({
                product_id: productId,
                quantity: qty,
                unit: item.unit,
            });
        }

        setSelectedItems(updatedItems);
        onItemsSelected(updatedItems);
    };

    const handleToggleItem = (productId, checked) => {
        const item = deliverySummary.find(i => i.product_id === productId);
        if (!item) return;

        if (checked) {
            // Add item with remaining quantity
            const newItem = {
                product_id: productId,
                quantity: item.remaining_qty,
                unit: item.unit,
            };
            const updatedItems = [...selectedItems.filter(i => i.product_id !== productId), newItem];
            setSelectedItems(updatedItems);
            onItemsSelected(updatedItems);
        } else {
            // Remove item
            const updatedItems = selectedItems.filter(i => i.product_id !== productId);
            setSelectedItems(updatedItems);
            onItemsSelected(updatedItems);
        }
    };

    const getSelectedQuantity = (productId) => {
        const item = selectedItems.find(i => i.product_id === productId);
        return item ? item.quantity : 0;
    };

    const isItemSelected = (productId) => {
        return selectedItems.some(i => i.product_id === productId && i.quantity > 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading delivery summary...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <div>
                    <p className="text-sm font-medium text-red-900">Error loading delivery summary</p>
                    <p className="text-xs text-red-700 mt-1">{error}</p>
                </div>
            </div>
        );
    }

    if (deliverySummary.length === 0) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                <div>
                    <p className="text-sm font-medium text-yellow-900">No items to deliver</p>
                    <p className="text-xs text-yellow-700 mt-1">All items from this sales order have been fully delivered.</p>
                </div>
            </div>
        );
    }

    const totalItemsToDeliver = selectedItems.filter(i => i.quantity > 0).length;
    const totalQuantity = selectedItems.reduce((sum, i) => sum + i.quantity, 0);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Select Items to Deliver</h3>
                <div className="text-xs text-gray-600">
                    {totalItemsToDeliver} item{totalItemsToDeliver !== 1 ? 's' : ''}, {totalQuantity.toFixed(2)} units
                </div>
            </div>

            {/* Items List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {deliverySummary.map((item) => {
                    const selected = isItemSelected(item.product_id);
                    const selectedQty = getSelectedQuantity(item.product_id);
                    const deliveryPercentage = item.delivery_percentage || 0;

                    return (
                        <div
                            key={item.product_id}
                            className={`border rounded-lg p-3 transition-all ${selected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {/* Checkbox */}
                                <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={(e) => handleToggleItem(item.product_id, e.target.checked)}
                                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    disabled={item.remaining_qty === 0}
                                />

                                {/* Item Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium text-gray-900">{item.product_name}</h4>
                                            {item.product_sku && (
                                                <p className="text-xs text-gray-500">SKU: {item.product_sku}</p>
                                            )}
                                        </div>
                                        {item.remaining_qty === 0 && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                ✓ Fully Delivered
                                            </span>
                                        )}
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                            <span>Ordered: {item.ordered_qty} {item.unit}</span>
                                            <span>Delivered: {item.delivered_qty} {item.unit} ({deliveryPercentage}%)</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div
                                                className="bg-blue-600 h-1.5 rounded-full transition-all"
                                                style={{ width: `${Math.min(deliveryPercentage, 100)}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            Remaining: <span className="font-medium text-gray-900">{item.remaining_qty} {item.unit}</span>
                                        </div>
                                    </div>

                                    {/* Quantity Input */}
                                    {selected && item.remaining_qty > 0 && (
                                        <div className="mt-3 flex items-center gap-2">
                                            <label className="text-xs font-medium text-gray-700">Deliver now:</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max={item.remaining_qty}
                                                step="0.01"
                                                value={selectedQty}
                                                onChange={(e) => handleQuantityChange(item.product_id, e.target.value)}
                                                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-gray-900"
                                            />
                                            <span className="text-xs text-gray-600">{item.unit}</span>
                                            {selectedQty > item.remaining_qty && (
                                                <span className="text-xs text-red-600">
                                                    Max: {item.remaining_qty}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary Footer */}
            {totalItemsToDeliver > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm">
                        <Package size={16} className="text-blue-600" />
                        <span className="font-medium text-blue-900">
                            Ready to deliver: {totalItemsToDeliver} item{totalItemsToDeliver !== 1 ? 's' : ''} ({totalQuantity.toFixed(2)} units total)
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
