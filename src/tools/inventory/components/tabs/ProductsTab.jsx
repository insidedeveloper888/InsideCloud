import React from 'react';
import { Package, Search, Settings, ChevronDown, Trash2, X, Filter, Plus, Info } from 'lucide-react';
import SearchableSelect from '../SearchableSelect';
import Pagination from '../Pagination';
import { InventoryAPI } from '../../api/inventory';

/**
 * Products Tab - Product Catalog Management
 * Displays:
 * - Product catalog with search and filters
 * - Product settings (base unit, low stock threshold, unit conversions)
 * - Desktop table and mobile card views
 * - Add/delete product actions
 */
export default function ProductsTab({
  products,
  setProducts,
  items,
  setItems,
  productSearchTerm,
  setProductSearchTerm,
  showFilters,
  setShowFilters,
  filters,
  setFilters,
  productPage,
  setProductPage,
  ITEMS_PER_PAGE,
  productSortBy,
  toggleProductSort,
  ProductSortIcon,
  expandedProductId,
  setExpandedProductId,
  productThresholds,
  setProductThresholds,
  customUnits,
  setCustomUnits,
  thresholdsSaving,
  setThresholdsSaving,
  allProductUnits,
  setAllProductUnits,
  newProductUnit,
  setNewProductUnit,
  showAddUnitForm,
  setShowAddUnitForm,
  setError,
  organizationSlug
}) {
  return (
    <div>
      <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm">
        <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-200/70 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">Item Catalog</h2>
        </div>
        {/* Search Bar and Filter Button */}
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by SKU, item name, or category..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all text-sm"
              />
            </div>
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(prev => ({ ...prev, products: !prev.products }))}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all flex-1 sm:flex-initial ${
                showFilters.products
                  ? 'bg-gray-900 border-gray-900 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }`}
              title="Toggle filters"
            >
              <Filter size={14} />
              <span className="hidden sm:inline">Filter</span>
              {filters.itemType && (
                <span className={`px-1.5 py-0.5 text-xs rounded-md font-semibold ${
                  showFilters.products ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
                }`}>
                  1
                </span>
              )}
            </button>
          </div>
        </div>
        {/* Mobile Card View for Products */}
        <div className="md:hidden space-y-3 p-4">
          {(() => {
            let filteredProducts = products.filter(product => {
              if (product.is_deleted) return false;

              // Item type filter
              if (filters.itemType === 'selling' && !product.is_selling) return false;
              if (filters.itemType === 'spare' && product.is_selling) return false;

              // Category filter
              if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
                return false;
              }

              // Search filter
              if (productSearchTerm) {
                const searchLower = productSearchTerm.toLowerCase();
                const matchesSearch = (
                  product.sku?.toLowerCase().includes(searchLower) ||
                  product.name?.toLowerCase().includes(searchLower) ||
                  product.category?.toLowerCase().includes(searchLower)
                );
                if (!matchesSearch) return false;
              }

              return true;
            });

            if (filteredProducts.length === 0) {
              return (
                <div className="flex flex-col items-center space-y-3 py-12">
                  <div className="p-4 bg-gray-100 rounded-full">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">
                    {productSearchTerm ? 'No items match your search' : 'No items'}
                  </p>
                </div>
              );
            }

            const paginatedProducts = filteredProducts.slice((productPage - 1) * ITEMS_PER_PAGE, productPage * ITEMS_PER_PAGE);
            return (
              <>
                {paginatedProducts.map((product) => (
                  <div key={product.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.sku}</p>
                      </div>
                      <button
                        onClick={async () => {
                          if (window.confirm(`Delete product "${product.name}"?`)) {
                            try {
                              await InventoryAPI.deleteProduct(organizationSlug, product.id);
                              setProducts(products.filter(p => p.id !== product.id));
                              setItems(items.filter(i => i.product_id !== product.id));
                            } catch (err) {
                              setError('Failed to delete product');
                            }
                          }
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">Category:</span> <span className="text-gray-900">{product.category || '-'}</span></div>
                      <div><span className="text-gray-500">Unit:</span> <span className="text-gray-900">{product.base_unit || product.unit || 'pcs'}</span></div>
                    </div>
                    <button
                      onClick={() => setExpandedProductId(expandedProductId === product.id ? null : product.id)}
                      className="mt-2 text-sm text-blue-600 flex items-center"
                    >
                      <Settings className="w-3 h-3 mr-1" /> Settings
                      <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${expandedProductId === product.id ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                ))}
                <Pagination currentPage={productPage} totalItems={filteredProducts.length} onPageChange={setProductPage} itemsPerPage={ITEMS_PER_PAGE} />
              </>
            );
          })()}
        </div>
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200/70">
            <thead className="bg-gradient-to-b from-gray-50 to-gray-100/50">
              <tr>
                <th onClick={() => toggleProductSort('sku')} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                  <span className="flex items-center space-x-1"><span>SKU</span><ProductSortIcon field="sku" /></span>
                </th>
                <th onClick={() => toggleProductSort('name')} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                  <span className="flex items-center space-x-1"><span>Item Name</span><ProductSortIcon field="name" /></span>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th onClick={() => toggleProductSort('category')} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                  <span className="flex items-center space-x-1"><span>Category</span><ProductSortIcon field="category" /></span>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Selling Price
                </th>
                <th onClick={() => toggleProductSort('unit')} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                  <span className="flex items-center space-x-1"><span>Base Unit</span><ProductSortIcon field="unit" /></span>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {(() => {
                // Filter products based on search term and exclude deleted
                let filteredProducts = products.filter(product => {
                  if (product.is_deleted) return false;

                  // Item type filter
                  if (filters.itemType === 'selling' && !product.is_selling) return false;
                  if (filters.itemType === 'spare' && product.is_selling) return false;

                  // Category filter
                  if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
                    return false;
                  }

                  // Search filter
                  if (productSearchTerm) {
                    const searchLower = productSearchTerm.toLowerCase();
                    const matchesSearch = (
                      product.sku?.toLowerCase().includes(searchLower) ||
                      product.name?.toLowerCase().includes(searchLower) ||
                      product.category?.toLowerCase().includes(searchLower)
                    );
                    if (!matchesSearch) return false;
                  }

                  return true;
                });

                // Sort products
                if (productSortBy.field && productSortBy.direction) {
                  filteredProducts = [...filteredProducts].sort((a, b) => {
                    const aVal = a[productSortBy.field] || '';
                    const bVal = b[productSortBy.field] || '';
                    const cmp = String(aVal).localeCompare(String(bVal));
                    return productSortBy.direction === 'asc' ? cmp : -cmp;
                  });
                }

                if (filteredProducts.length === 0) {
                  return (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="p-4 bg-gray-100 rounded-full">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500 font-medium">
                            {productSearchTerm ? 'No products match your search' : 'No products'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                }

                const paginatedProducts = filteredProducts.slice((productPage - 1) * ITEMS_PER_PAGE, productPage * ITEMS_PER_PAGE);
                return (
                  <>
                    {paginatedProducts.map((product) => {
                      const productUnits = (allProductUnits || []).filter(u => u.product_id === product.id);
                      const baseUnit = productUnits.find(u => u.is_base_unit);
                      const isExpanded = expandedProductId === product.id;
                      return (
                        <React.Fragment key={product.id}>
                          <tr className="hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-cyan-50/30 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                              {product.sku}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {product.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {product.is_selling ? (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                                  Selling
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                                  Non-Selling
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {product.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {baseUnit?.selling_price ? (
                                <div className="flex flex-col">
                                  <span className="font-semibold text-emerald-600">
                                    RM {parseFloat(baseUnit.selling_price).toFixed(2)}
                                  </span>
                                  <span className="text-xs text-gray-500">per {product.base_unit || product.unit || 'pcs'}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {product.base_unit || product.unit || 'pcs'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  <Settings className="w-4 h-4" />
                                  <span>Settings</span>
                                  <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (window.confirm(`Delete item "${product.name}"? This will remove it from inventory.`)) {
                                      try {
                                        await InventoryAPI.deleteProduct(organizationSlug, product.id);
                                        setProducts(products.filter(p => p.id !== product.id));
                                        setItems(items.filter(i => i.product_id !== product.id));
                                      } catch (err) {
                                        setError('Failed to delete item');
                                      }
                                    }
                                  }}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                  title="Delete item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan="7" className="px-6 py-4 bg-gray-50 border-t border-b border-gray-200 overflow-visible">
                                <div className="space-y-4">
                                  {/* Base Unit & Threshold */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                      <div className="flex items-center gap-1 mb-1">
                                        <label className="block text-xs font-semibold text-gray-600">Base Unit</label>
                                        <div className="group relative">
                                          <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50">
                                            The smallest unit you track in inventory (e.g., pcs, kg, L). All other units will convert to this base unit.
                                          </div>
                                        </div>
                                      </div>
                                      <SearchableSelect
                                        value={productThresholds[`${product.id}_base_unit`] ?? product.base_unit ?? 'pcs'}
                                        onChange={(val) => setProductThresholds({
                                          ...productThresholds,
                                          [`${product.id}_base_unit`]: val
                                        })}
                                        options={customUnits.map(u => ({ value: u, label: u }))}
                                        placeholder="Select unit..."
                                        allowAddNew={true}
                                        onAddNew={(newUnit) => {
                                          if (!customUnits.includes(newUnit)) {
                                            setCustomUnits([...customUnits, newUnit]);
                                          }
                                        }}
                                        addNewLabel="+ Add New Unit..."
                                      />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1 mb-1">
                                        <label className="block text-xs font-semibold text-gray-600">Low Stock Threshold</label>
                                        <div className="group relative">
                                          <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50">
                                            Get notified when available quantity falls below this number. Leave empty for no alerts.
                                          </div>
                                        </div>
                                      </div>
                                      <input
                                        type="number"
                                        min="0"
                                        value={productThresholds[product.id] !== undefined ? productThresholds[product.id] : (product.low_stock_threshold ?? '')}
                                        onChange={(e) => setProductThresholds({
                                          ...productThresholds,
                                          [product.id]: e.target.value === '' ? null : parseInt(e.target.value)
                                        })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white"
                                        placeholder="Empty = no alert"
                                      />
                                    </div>
                                    <div className="flex items-end">
                                      <button
                                        onClick={async () => {
                                          setThresholdsSaving(true);
                                          try {
                                            // Update product fields
                                            const updates = {
                                              low_stock_threshold: productThresholds[product.id] !== undefined ? productThresholds[product.id] : product.low_stock_threshold,
                                              base_unit: productThresholds[`${product.id}_base_unit`] ?? product.base_unit ?? 'pcs',
                                              is_selling: productThresholds[`${product.id}_is_selling`] ?? product.is_selling ?? true
                                            };
                                            await InventoryAPI.updateProduct(organizationSlug, product.id, updates);
                                            setProducts(products.map(p => p.id === product.id ? { ...p, ...updates } : p));

                                            // Handle base unit pricing (create or update base unit record)
                                            const baseUnitBuy = productThresholds[`${product.id}_base_buy`];
                                            const baseUnitSell = productThresholds[`${product.id}_base_sell`];

                                            if (baseUnitBuy !== undefined || baseUnitSell !== undefined) {
                                              // Search for existing base unit - check by product_id AND unit_name match
                                              const existingBaseUnit = allProductUnits?.find(u =>
                                                u.product_id === product.id &&
                                                u.unit_name === updates.base_unit &&
                                                u.is_base_unit
                                              );

                                              console.log('Looking for existing base unit:', { product_id: product.id, unit_name: updates.base_unit });
                                              console.log('Found existing base unit:', existingBaseUnit);

                                              const baseUnitData = {
                                                unit_name: updates.base_unit,
                                                conversion_to_base: 1,
                                                is_base_unit: true,
                                                buying_price: baseUnitBuy !== undefined ? (baseUnitBuy === '' ? null : parseFloat(baseUnitBuy)) : existingBaseUnit?.buying_price,
                                                selling_price: baseUnitSell !== undefined ? (baseUnitSell === '' ? null : parseFloat(baseUnitSell)) : existingBaseUnit?.selling_price
                                              };

                                              if (existingBaseUnit) {
                                                // Update existing base unit
                                                console.log('Updating existing base unit:', existingBaseUnit.id, baseUnitData);
                                                const result = await InventoryAPI.updateProductUnit(organizationSlug, existingBaseUnit.id, baseUnitData);
                                                if (result.code === 0) {
                                                  setAllProductUnits(allProductUnits.map(u =>
                                                    u.id === existingBaseUnit.id ? { ...u, ...baseUnitData } : u
                                                  ));
                                                } else {
                                                  console.error('Failed to update base unit:', result);
                                                  setError('Failed to update base unit pricing');
                                                }
                                              } else {
                                                // Create new base unit
                                                console.log('Creating new base unit:', { product_id: product.id, ...baseUnitData });
                                                const res = await InventoryAPI.createProductUnit(organizationSlug, { product_id: product.id, ...baseUnitData });
                                                if (res.code === 0) {
                                                  setAllProductUnits([...allProductUnits, res.data]);
                                                } else {
                                                  console.error('Failed to create base unit:', res);
                                                  setError('Failed to create base unit pricing');
                                                }
                                              }
                                            }

                                            // Handle non-base unit custom selling prices
                                            const nonBaseUnits = allProductUnits.filter(u => u.product_id === product.id && !u.is_base_unit);
                                            for (const unit of nonBaseUnits) {
                                              const customPrice = productThresholds[`${unit.id}_unit_sell`];
                                              if (customPrice !== undefined) {
                                                const unitData = {
                                                  selling_price: customPrice === '' ? null : parseFloat(customPrice)
                                                };
                                                const result = await InventoryAPI.updateProductUnit(organizationSlug, unit.id, unitData);
                                                if (result.code === 0) {
                                                  setAllProductUnits(allProductUnits.map(u =>
                                                    u.id === unit.id ? { ...u, ...unitData } : u
                                                  ));
                                                } else {
                                                  console.error('Failed to update unit selling price:', result);
                                                }
                                              }
                                            }

                                            const newThresholds = { ...productThresholds };
                                            delete newThresholds[product.id];
                                            delete newThresholds[`${product.id}_base_unit`];
                                            delete newThresholds[`${product.id}_is_selling`];
                                            delete newThresholds[`${product.id}_base_buy`];
                                            delete newThresholds[`${product.id}_base_sell`];
                                            // Delete all unit-specific selling prices for this product
                                            nonBaseUnits.forEach(unit => {
                                              delete newThresholds[`${unit.id}_unit_sell`];
                                            });
                                            setProductThresholds(newThresholds);
                                          } catch (err) {
                                            setError('Failed to save');
                                          } finally {
                                            setThresholdsSaving(false);
                                          }
                                        }}
                                        disabled={thresholdsSaving}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                                      >
                                        {thresholdsSaving ? 'Saving...' : 'Save All'}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Is Selling Toggle */}
                                  <div className="border-t border-gray-200 pt-4">
                                    <label className="flex items-center space-x-2 cursor-pointer group">
                                      <input
                                        type="checkbox"
                                        checked={productThresholds[`${product.id}_is_selling`] ?? product.is_selling ?? true}
                                        onChange={(e) => setProductThresholds({
                                          ...productThresholds,
                                          [`${product.id}_is_selling`]: e.target.checked
                                        })}
                                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                      />
                                      <span className="text-sm font-semibold text-gray-700">This is a selling item (vs. non-selling item/accessory)</span>
                                      <div className="relative">
                                        <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50">
                                          Check this if you sell this item to customers. Uncheck for internal use items, spare parts, or accessories that aren't sold separately.
                                        </div>
                                      </div>
                                    </label>
                                  </div>

                                  {/* Base Unit Pricing - Only show for selling items */}
                                  {(() => {
                                    const isSelling = productThresholds[`${product.id}_is_selling`] ?? product.is_selling ?? true;
                                    if (!isSelling) return null; // Hide for non-selling items

                                    return (
                                      <div className="border-t border-gray-200 pt-4">
                                        <div className="flex items-center gap-2 mb-2">
                                          <h5 className="text-sm font-semibold text-gray-700">Base Unit ({product.base_unit || 'pcs'}) Pricing</h5>
                                          <div className="group relative">
                                            <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50">
                                              Set the selling price for one base unit. Prices for other units (box, carton, etc.) will be calculated automatically based on conversion factors.
                                            </div>
                                          </div>
                                        </div>
                                        {(() => {
                                          const baseUnit = productUnits.find(u => u.product_id === product.id && u.is_base_unit);

                                          return (
                                            <div className="flex items-center space-x-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                                              <span className="text-sm font-semibold text-gray-700">Selling Price:</span>
                                              <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={productThresholds[`${product.id}_base_sell`] ?? baseUnit?.selling_price ?? ''}
                                                onChange={(e) => setProductThresholds({
                                                  ...productThresholds,
                                                  [`${product.id}_base_sell`]: e.target.value
                                                })}
                                                className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white font-semibold"
                                                placeholder="50.00"
                                              />
                                              <span className="text-sm text-gray-600">RM per {product.base_unit || 'pcs'}</span>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    );
                                  })()}

                                  {/* Unit Conversions with Pricing */}
                                  <div className="border-t border-gray-200 pt-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h5 className="text-sm font-semibold text-gray-700">Additional Unit Conversions & Pricing</h5>
                                      <div className="group relative">
                                        <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-80 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50">
                                          Define how larger units relate to your base unit. Example: "1 box = 12 pcs". Selling prices are auto-calculated from your base unit price, or you can override with a custom discount price (e.g., RM 580 per box instead of RM 600).
                                        </div>
                                      </div>
                                    </div>
                                    {(() => {
                                      const nonBaseUnits = productUnits.filter(u => !u.is_base_unit);

                                      return nonBaseUnits.length > 0 && (
                                        <div className="space-y-2 mb-3">
                                          {nonBaseUnits.map((unit) => {
                                            const baseUnit = productUnits.find(u => u.product_id === product.id && u.is_base_unit);
                                            const baseSellingPrice = productThresholds[`${product.id}_base_sell`] ?? baseUnit?.selling_price ?? 0;
                                            const calculatedPrice = baseSellingPrice * unit.conversion_to_base;
                                            const isSelling = productThresholds[`${product.id}_is_selling`] ?? product.is_selling ?? true;
                                            const currentSellingPrice = productThresholds[`${unit.id}_unit_sell`] ?? unit.selling_price;

                                            return (
                                              <div key={unit.id} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm space-y-2">
                                                <div className="flex items-center space-x-3">
                                                  <span className="text-gray-900 flex-shrink-0">1 {unit.unit_name} = {unit.conversion_to_base} {product.base_unit || 'pcs'}</span>
                                                  <button
                                                    onClick={async () => {
                                                      await InventoryAPI.deleteProductUnit(organizationSlug, unit.id);
                                                      setAllProductUnits(allProductUnits.filter(u => u.id !== unit.id));
                                                    }}
                                                    className="text-red-500 hover:text-red-700 ml-auto"
                                                  >
                                                    <X className="w-3 h-3" />
                                                  </button>
                                                </div>
                                                {isSelling && baseSellingPrice > 0 && (
                                                  <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-2 rounded-lg">
                                                    <span className="text-xs text-gray-600 flex-shrink-0">Selling Price:</span>
                                                    <input
                                                      type="number"
                                                      min="0"
                                                      step="0.01"
                                                      value={currentSellingPrice ?? ''}
                                                      onChange={(e) => setProductThresholds({
                                                        ...productThresholds,
                                                        [`${unit.id}_unit_sell`]: e.target.value
                                                      })}
                                                      className="w-24 px-2 py-1 border border-gray-300 rounded text-xs text-gray-900 bg-white font-semibold"
                                                      placeholder={calculatedPrice.toFixed(2)}
                                                    />
                                                    <span className="text-xs text-gray-600">RM / {unit.unit_name}</span>
                                                    {!currentSellingPrice && (
                                                      <span className="text-xs text-emerald-600 italic">
                                                        (auto: RM {calculatedPrice.toFixed(2)})
                                                      </span>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()}
                                    {(() => {
                                      const isFormVisible = showAddUnitForm[product.id] || false;

                                      return (
                                        <div className="space-y-3">
                                          {/* Add New Unit Button (collapsed state) */}
                                          {!isFormVisible && (
                                            <button
                                              onClick={() => setShowAddUnitForm({ ...showAddUnitForm, [product.id]: true })}
                                              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border-2 border-dashed border-emerald-300 hover:border-emerald-400 transition-all w-full justify-center"
                                            >
                                              <Plus className="w-4 h-4" />
                                              <span>Add New Unit Conversion</span>
                                            </button>
                                          )}

                                          {/* Add New Unit Form (expanded state) */}
                                          {isFormVisible && (
                                            <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-lg space-y-3">
                                              <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-semibold text-gray-700">New Unit Conversion</span>
                                                <button
                                                  onClick={() => {
                                                    setShowAddUnitForm({ ...showAddUnitForm, [product.id]: false });
                                                    setNewProductUnit({ ...newProductUnit, [product.id]: { unit_name: '', conversion: '', buying_price: '', selling_price: '' } });
                                                  }}
                                                  className="text-gray-400 hover:text-gray-600"
                                                >
                                                  <X className="w-4 h-4" />
                                                </button>
                                              </div>

                                              <div className="flex items-center space-x-2 flex-wrap gap-2">
                                                <div className="flex flex-col">
                                                  <label className="text-xs text-gray-600 mb-1">Unit Name</label>
                                                  <SearchableSelect
                                                    value={newProductUnit[product.id]?.unit_name || ''}
                                                    onChange={(value) => setNewProductUnit({
                                                      ...newProductUnit,
                                                      [product.id]: { ...newProductUnit[product.id], unit_name: value }
                                                    })}
                                                    options={(() => {
                                                      // Get unique unit names from all product units
                                                      const uniqueUnits = [...new Set(allProductUnits.map(u => u.unit_name))];
                                                      return uniqueUnits.map(unit => ({ value: unit, label: unit }));
                                                    })()}
                                                    placeholder="Select or type..."
                                                    className="w-36"
                                                    allowAddNew={true}
                                                    onAddNew={(newValue) => {
                                                      setNewProductUnit({
                                                        ...newProductUnit,
                                                        [product.id]: { ...newProductUnit[product.id], unit_name: newValue }
                                                      });
                                                    }}
                                                    addNewLabel="+ Add New Unit..."
                                                  />
                                                </div>
                                                <span className="text-gray-400 mt-6">=</span>
                                                <div className="flex flex-col">
                                                  <label className="text-xs text-gray-600 mb-1">Quantity</label>
                                                  <input
                                                    type="number"
                                                    min="1"
                                                    value={newProductUnit[product.id]?.conversion || ''}
                                                    onChange={(e) => setNewProductUnit({
                                                      ...newProductUnit,
                                                      [product.id]: { ...newProductUnit[product.id], conversion: e.target.value }
                                                    })}
                                                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    placeholder="12"
                                                  />
                                                </div>
                                                <span className="text-sm text-gray-500 mt-6">{product.base_unit || 'pcs'}</span>
                                              </div>

                                              <div className="flex items-center space-x-2 pt-2">
                                                <button
                                                  onClick={async () => {
                                                    const unitData = newProductUnit[product.id];

                                                    // Validation with user feedback
                                                    if (!unitData?.unit_name?.trim()) {
                                                      alert('Please enter a unit name (e.g., box, carton)');
                                                      return;
                                                    }
                                                    if (!unitData?.conversion || parseFloat(unitData.conversion) <= 0) {
                                                      alert('Please enter a valid conversion value (e.g., 12)');
                                                      return;
                                                    }

                                                    // Check for duplicate unit name for this product
                                                    const existingUnit = allProductUnits.find(u =>
                                                      u.product_id === product.id &&
                                                      u.unit_name.toLowerCase() === unitData.unit_name.trim().toLowerCase()
                                                    );
                                                    if (existingUnit) {
                                                      alert(`Unit "${unitData.unit_name.trim()}" already exists for this product. Please use a different unit name.`);
                                                      return;
                                                    }

                                                    try {
                                                      const res = await InventoryAPI.createProductUnit(organizationSlug, {
                                                        product_id: product.id,
                                                        unit_name: unitData.unit_name.trim(),
                                                        conversion_to_base: parseFloat(unitData.conversion),
                                                        buying_price: null,
                                                        selling_price: null,
                                                        is_base_unit: false
                                                      });
                                                      if (res.code === 0) {
                                                        // Update the product units list with the new unit
                                                        console.log('Unit created successfully:', res.data);
                                                        console.log('Selling price in response:', res.data.selling_price);
                                                        console.log('Buying price in response:', res.data.buying_price);

                                                        // Ensure prices are properly formatted in the data we store
                                                        const newUnit = {
                                                          ...res.data,
                                                          selling_price: res.data.selling_price !== null ? parseFloat(res.data.selling_price) : null,
                                                          buying_price: res.data.buying_price !== null ? parseFloat(res.data.buying_price) : null
                                                        };
                                                        console.log('Formatted unit to store:', newUnit);

                                                        setAllProductUnits([...allProductUnits, newUnit]);
                                                        // Clear the input form and hide it
                                                        setNewProductUnit({ ...newProductUnit, [product.id]: { unit_name: '', conversion: '' } });
                                                        setShowAddUnitForm({ ...showAddUnitForm, [product.id]: false });
                                                      } else {
                                                        alert(`Failed to add unit: ${res.msg || 'Unknown error'}`);
                                                      }
                                                    } catch (err) {
                                                      console.error('Error adding unit:', err);
                                                      // Check if it's a duplicate unit error from backend
                                                      if (err.message?.includes('already exists') || err.message?.includes('duplicate')) {
                                                        alert(`Unit "${unitData.unit_name.trim()}" already exists for this product. Please use a different unit name.`);
                                                      } else {
                                                        alert(`Error adding unit: ${err.message}`);
                                                      }
                                                      setError(err.message);
                                                    }
                                                  }}
                                                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
                                                >
                                                  Add Unit
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setShowAddUnitForm({ ...showAddUnitForm, [product.id]: false });
                                                    setNewProductUnit({ ...newProductUnit, [product.id]: { unit_name: '', conversion: '' } });
                                                  }}
                                                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                                                >
                                                  Cancel
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    <tr><td colSpan="7" className="p-0"><Pagination currentPage={productPage} totalItems={filteredProducts.length} onPageChange={setProductPage} itemsPerPage={ITEMS_PER_PAGE} /></td></tr>
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
