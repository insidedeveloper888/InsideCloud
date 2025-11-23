import React from 'react';
import { Package, Search, Filter, Settings, ChevronDown, Trash2, X } from 'lucide-react';
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
  setError,
  organizationSlug
}) {
  return (
    <div>
      <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm">
        <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-200/70 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">Product Catalog</h2>
        </div>
        {/* Search Bar and Filter Button */}
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by SKU, product name, or category..."
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
              {(filters.categories.length > 0 || filters.showInactive) && (
                <span className={`px-1.5 py-0.5 text-xs rounded-md font-semibold ${
                  showFilters.products ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
                }`}>
                  {filters.categories.length + (filters.showInactive ? 1 : 0)}
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
                    {productSearchTerm ? 'No products match your search' : 'No products'}
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
                  <span className="flex items-center space-x-1"><span>Product Name</span><ProductSortIcon field="name" /></span>
                </th>
                <th onClick={() => toggleProductSort('category')} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                  <span className="flex items-center space-x-1"><span>Category</span><ProductSortIcon field="category" /></span>
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {product.category}
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
                                    if (window.confirm(`Delete product "${product.name}"? This will remove it from inventory.`)) {
                                      try {
                                        await InventoryAPI.deleteProduct(organizationSlug, product.id);
                                        setProducts(products.filter(p => p.id !== product.id));
                                        setItems(items.filter(i => i.product_id !== product.id));
                                      } catch (err) {
                                        setError('Failed to delete product');
                                      }
                                    }
                                  }}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                  title="Delete product"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan="5" className="px-6 py-4 bg-gray-50 border-t border-b border-gray-200 overflow-visible">
                                <div className="space-y-4">
                                  {/* Base Unit & Threshold */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                      <label className="block text-xs font-semibold text-gray-600 mb-1">Base Unit</label>
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
                                      <label className="block text-xs font-semibold text-gray-600 mb-1">Low Stock Threshold</label>
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
                                            const updates = {
                                              low_stock_threshold: productThresholds[product.id] !== undefined ? productThresholds[product.id] : product.low_stock_threshold,
                                              base_unit: productThresholds[`${product.id}_base_unit`] ?? product.base_unit ?? 'pcs'
                                            };
                                            await InventoryAPI.updateProduct(organizationSlug, product.id, updates);
                                            setProducts(products.map(p => p.id === product.id ? { ...p, ...updates } : p));
                                            const newThresholds = { ...productThresholds };
                                            delete newThresholds[product.id];
                                            delete newThresholds[`${product.id}_base_unit`];
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
                                        {thresholdsSaving ? 'Saving...' : 'Save'}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Unit Conversions */}
                                  <div className="border-t border-gray-200 pt-4">
                                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Unit Conversions</h5>
                                    {productUnits.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mb-3">
                                        {productUnits.map((unit) => (
                                          <div key={unit.id} className="flex items-center space-x-2 px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm">
                                            <span className="text-gray-900">1 {unit.unit_name} = {unit.conversion_to_base} {product.base_unit || 'pcs'}</span>
                                            {!unit.is_base_unit && (
                                              <button
                                                onClick={async () => {
                                                  await InventoryAPI.deleteProductUnit(organizationSlug, unit.id);
                                                  setAllProductUnits(allProductUnits.filter(u => u.id !== unit.id));
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="text"
                                        value={newProductUnit[product.id]?.unit_name || ''}
                                        onChange={(e) => setNewProductUnit({
                                          ...newProductUnit,
                                          [product.id]: { ...newProductUnit[product.id], unit_name: e.target.value }
                                        })}
                                        className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white"
                                        placeholder="box"
                                      />
                                      <span className="text-gray-400">=</span>
                                      <input
                                        type="number"
                                        min="1"
                                        value={newProductUnit[product.id]?.conversion || ''}
                                        onChange={(e) => setNewProductUnit({
                                          ...newProductUnit,
                                          [product.id]: { ...newProductUnit[product.id], conversion: e.target.value }
                                        })}
                                        className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white"
                                        placeholder="12"
                                      />
                                      <span className="text-sm text-gray-500">{product.base_unit || 'pcs'}</span>
                                      <button
                                        onClick={async () => {
                                          const unitData = newProductUnit[product.id];
                                          if (!unitData?.unit_name || !unitData?.conversion) return;
                                          try {
                                            const res = await InventoryAPI.createProductUnit(organizationSlug, {
                                              product_id: product.id,
                                              unit_name: unitData.unit_name,
                                              conversion_to_base: parseFloat(unitData.conversion),
                                              is_base_unit: false
                                            });
                                            if (res.code === 0) {
                                              setAllProductUnits([...allProductUnits, res.data]);
                                              setNewProductUnit({ ...newProductUnit, [product.id]: { unit_name: '', conversion: '' } });
                                            }
                                          } catch (err) {
                                            setError(err.message);
                                          }
                                        }}
                                        className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
                                      >
                                        Add
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    <tr><td colSpan="5" className="p-0"><Pagination currentPage={productPage} totalItems={filteredProducts.length} onPageChange={setProductPage} itemsPerPage={ITEMS_PER_PAGE} /></td></tr>
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
