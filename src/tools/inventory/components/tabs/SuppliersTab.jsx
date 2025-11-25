import React from 'react';
import { Users, Search, Plus, Trash2 } from 'lucide-react';

/**
 * Suppliers Tab - Supplier Management
 * Displays:
 * - List of suppliers with search functionality
 * - Supplier details (name, contact person, email, phone, address)
 * - Desktop table and mobile card views
 * - Add/delete supplier actions
 */
export default function SuppliersTab({
  suppliers,
  supplierSearchTerm,
  setSupplierSearchTerm,
  filters,
  supplierSortBy,
  setSupplierSortBy,
  handleDeleteSupplier,
  setShowAddSupplierModal
}) {
  return (
    <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-200/70 bg-gradient-to-r from-gray-50 to-white flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">Suppliers</h2>
        <button
          onClick={() => setShowAddSupplierModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>
      {/* Search Bar */}
      <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by supplier name, contact person, email, or phone..."
            value={supplierSearchTerm}
            onChange={(e) => setSupplierSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all text-sm"
          />
        </div>
      </div>
      {/* Mobile Card View for Suppliers */}
      <div className="md:hidden space-y-3 p-4">
        {(() => {
          let filteredSuppliers = suppliers.filter(supplier => {
            // State filter
            if (filters.states?.length > 0 && !filters.states.includes(supplier.state)) {
              return false;
            }

            // Text search filter
            if (supplierSearchTerm) {
              const searchLower = supplierSearchTerm.toLowerCase();
              return (
                supplier.name?.toLowerCase().includes(searchLower) ||
                supplier.contact_person?.toLowerCase().includes(searchLower) ||
                supplier.email?.toLowerCase().includes(searchLower) ||
                supplier.phone?.toLowerCase().includes(searchLower)
              );
            }

            return true;
          });

          if (filteredSuppliers.length === 0) {
            return (
              <div className="flex flex-col items-center space-y-3 py-12">
                <Users className="w-12 h-12 text-gray-300" />
                <p className="text-gray-500">{supplierSearchTerm ? 'No suppliers match your search' : 'No suppliers yet'}</p>
              </div>
            );
          }

          return filteredSuppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-gray-900">{supplier.name}</p>
                  <p className="text-sm text-gray-600">{supplier.contact_person || '-'}</p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`⚠️ Delete supplier "${supplier.name}"?\n\nThis action cannot be undone. All supplier information will be permanently removed.`)) {
                      handleDeleteSupplier(supplier.id);
                    }
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1 text-sm">
                {supplier.email && <p className="text-gray-600"><span className="text-gray-500">Email:</span> {supplier.email}</p>}
                {supplier.phone && <p className="text-gray-600"><span className="text-gray-500">Phone:</span> {supplier.phone}</p>}
                {supplier.address && <p className="text-gray-600 text-xs mt-2 break-words"><span className="text-gray-500">Address:</span> {supplier.address}</p>}
              </div>
            </div>
          ));
        })()}
      </div>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
              {[
                { field: 'name', label: 'Supplier Name' },
                { field: 'contact_person', label: 'Contact Person' },
                { field: 'email', label: 'Email' },
                { field: 'phone', label: 'Phone' },
                { field: 'address', label: 'Address' }
              ].map(col => (
                <th
                  key={col.field}
                  onClick={() => setSupplierSortBy(prev => ({ field: col.field, direction: prev.field === col.field && prev.direction === 'asc' ? 'desc' : 'asc' }))}
                  className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  <span className="inline-flex items-center space-x-1">
                    <span>{col.label}</span>
                    {supplierSortBy.field === col.field && (
                      <span>{supplierSortBy.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
              ))}
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(() => {
              // Filter suppliers based on search term
              let filteredSuppliers = suppliers.filter(supplier => {
                // State filter
                if (filters.states?.length > 0 && !filters.states.includes(supplier.state)) {
                  return false;
                }

                // Text search filter
                if (supplierSearchTerm) {
                  const searchLower = supplierSearchTerm.toLowerCase();
                  return (
                    supplier.name?.toLowerCase().includes(searchLower) ||
                    supplier.contact_person?.toLowerCase().includes(searchLower) ||
                    supplier.email?.toLowerCase().includes(searchLower) ||
                    supplier.phone?.toLowerCase().includes(searchLower) ||
                    supplier.address?.toLowerCase().includes(searchLower)
                  );
                }

                return true;
              });

              // Sort
              if (supplierSortBy.field) {
                filteredSuppliers = [...filteredSuppliers].sort((a, b) => {
                  const valA = (a[supplierSortBy.field] || '').toString().toLowerCase();
                  const valB = (b[supplierSortBy.field] || '').toString().toLowerCase();
                  return supplierSortBy.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                });
              }

              if (filteredSuppliers.length === 0) {
                return (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <Users className="w-12 h-12 text-gray-300" />
                        <p className="text-gray-500">
                          {supplierSearchTerm ? 'No suppliers match your search' : 'No suppliers yet'}
                        </p>
                        {!supplierSearchTerm && (
                          <button
                            onClick={() => setShowAddSupplierModal(true)}
                            className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
                          >
                            Add First Supplier
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }

              return filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-900">{supplier.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {supplier.contact_person || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {supplier.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {supplier.phone || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                    <div className="whitespace-normal break-words">{supplier.address || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => {
                        if (window.confirm(`⚠️ Delete supplier "${supplier.name}"?\n\nThis action cannot be undone. All supplier information will be permanently removed.`)) {
                          handleDeleteSupplier(supplier.id);
                        }
                      }}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete supplier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
