import React, { useState, useEffect, useRef } from 'react';
import { ORGANIZATION_SLUG_KEY } from '../../components/organizationSelector';
import { InventoryAPI } from './api/inventory';
import { useCurrentUser } from '../../tools/contact-management/hooks/useCurrentUser';
import { Package, Plus, Warehouse, Activity, Search, Filter, Minus, FileText, Truck, CheckCircle, Settings, Users, X, Upload, Clock, Eye, ChevronDown } from 'lucide-react';

// Searchable Select Component
const SearchableSelect = ({ value, onChange, options, placeholder = 'Select...', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl bg-white text-left flex items-center justify-between text-sm text-gray-900 hover:border-gray-300 transition-all"
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search..."
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400">No results</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 transition-colors ${
                    opt.value === value ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Inventory Management Product
 * Main component for inventory management system
 */
export default function InventoryProduct({ onBack }) {
  const organizationSlug = localStorage.getItem(ORGANIZATION_SLUG_KEY);
  const { individualId } = useCurrentUser();

  // All hooks must be at the top level
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [movements, setMovements] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Filter states for Stock Overview
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showUnstocked, setShowUnstocked] = useState(false); // Hide unstocked items by default
  const [sortBy, setSortBy] = useState({ field: '', direction: '' }); // { field: 'sku'|'name'|'category'|'warehouse'|'quantity'|'available'|'status', direction: 'asc'|'desc' }
  const [categoryFilter] = useState(''); // eslint-disable-line no-unused-vars

  // Search states for each tab
  const [poSearchTerm, setPoSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [movementSearchTerm, setMovementSearchTerm] = useState('');
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');

  // Date filter states
  const [movementDateFrom, setMovementDateFrom] = useState('');
  const [movementDateTo, setMovementDateTo] = useState('');
  const [movementLocationFilter, setMovementLocationFilter] = useState('');
  const [movementProductFilter, setMovementProductFilter] = useState('');
  const [movementUserFilter, setMovementUserFilter] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState(''); // 'stock_in', 'stock_out'
  const [movementSortBy, setMovementSortBy] = useState({ field: '', direction: '' });
  const [productSortBy, setProductSortBy] = useState({ field: '', direction: '' });

  // Pagination states
  const [stockPage, setStockPage] = useState(1);
  const [movementPage, setMovementPage] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [poDateFrom, setPoDateFrom] = useState('');
  const [poDateTo, setPoDateTo] = useState('');

  // Modal states for forms
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showQuickAddProductModal, setShowQuickAddProductModal] = useState(false);
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showAddPOModal, setShowAddPOModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showPODetailModal, setShowPODetailModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [newLocation, setNewLocation] = useState({
    name: '',
    code: '',
    address: ''
  });
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    category: 'CCTV',
    unit: 'pcs',
    description: '',
    // Optional initial stock fields
    initial_location_id: '',
    initial_quantity: 0,
    initial_unit_cost: 0
  });

  const [quickProduct, setQuickProduct] = useState({
    sku: '',
    name: '',
    category: 'CCTV',
    unit: 'pcs'
  });
  const [stockOutData, setStockOutData] = useState({
    quantity: 0,
    notes: ''
  });

  // Stock In state for manual entries (refund, return, adjustment)
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [stockInData, setStockInData] = useState({
    quantity: 0,
    unit_cost: 0,
    reference_type: 'manual',  // 'manual', 'return', 'refund', 'adjustment'
    location_id: '',  // For products without existing stock (virtual items)
    notes: ''
  });

  const [newPO, setNewPO] = useState({
    supplier_id: '',
    po_number: '',
    expected_delivery_date: '',
    location_id: '',  // Receiving warehouse
    notes: '',
    items: []  // Array of { product_id, quantity, unit_cost }
  });

  const [poItemToAdd, setPoItemToAdd] = useState({
    product_id: '',
    quantity: 0,
    unit_cost: 0
  });

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });

  const [defaultLowStockThreshold, setDefaultLowStockThreshold] = useState(10);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Custom categories and units
  const [customCategories, setCustomCategories] = useState(['CCTV', 'Lighting', 'AV System', 'Network', 'Accessories']);
  const [customUnits, setCustomUnits] = useState(['pcs', 'meter', 'box', 'set']);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [newCustomCategory, setNewCustomCategory] = useState('');
  const [newCustomUnit, setNewCustomUnit] = useState('');

  // Load locations on mount (needed for Add Product modal and PO)
  useEffect(() => {
    if (!organizationSlug) return;
    const fetchLocations = async () => {
      try {
        const locationsRes = await InventoryAPI.getLocations(organizationSlug);
        setLocations(locationsRes.data || []);
      } catch (err) {
        console.error('Failed to fetch locations:', err);
      }
    };
    fetchLocations();
  }, [organizationSlug]);

  // Load suppliers on mount (needed for PO creation modal)
  useEffect(() => {
    if (!organizationSlug) return;
    const fetchSuppliers = async () => {
      try {
        const suppliersRes = await InventoryAPI.getSuppliers(organizationSlug);
        setSuppliers(suppliersRes.data || []);
      } catch (err) {
        console.error('Failed to fetch suppliers:', err);
      }
    };
    fetchSuppliers();
  }, [organizationSlug]);

  // Load products on mount (needed for PO creation modal)
  useEffect(() => {
    if (!organizationSlug) return;
    const fetchProducts = async () => {
      try {
        const productsRes = await InventoryAPI.getProducts(organizationSlug);
        setProducts(productsRes.data || []);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      }
    };
    fetchProducts();
  }, [organizationSlug]);

  // Load settings on mount
  useEffect(() => {
    if (!organizationSlug) return;
    const fetchSettings = async () => {
      try {
        const settingsRes = await InventoryAPI.getSettings(organizationSlug);
        if (settingsRes.code === 0 && settingsRes.data) {
          setDefaultLowStockThreshold(settingsRes.data.low_stock_threshold || 10);
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
        // Keep default value if fetch fails
      }
    };
    fetchSettings();
  }, [organizationSlug]);

  // Reset pages when filters change
  useEffect(() => { setStockPage(1); }, [searchTerm, locationFilter, statusFilter, showUnstocked, sortBy]);
  useEffect(() => { setMovementPage(1); }, [movementSearchTerm, movementDateFrom, movementDateTo, movementLocationFilter, movementProductFilter, movementUserFilter, movementTypeFilter, movementSortBy]);
  useEffect(() => { setProductPage(1); }, [productSearchTerm, productSortBy]);

  useEffect(() => {
    if (!organizationSlug) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationSlug, tab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (tab === 'overview') {
        const [itemsRes, productsRes, locationsRes] = await Promise.all([
          InventoryAPI.getItems(organizationSlug, {
            category: categoryFilter,
            search: searchTerm
          }),
          InventoryAPI.getProducts(organizationSlug),
          InventoryAPI.getLocations(organizationSlug)
        ]);

        setItems(itemsRes.data || []);
        setProducts(productsRes.data || []);
        setLocations(locationsRes.data || []);
      } else if (tab === 'products') {
        const [itemsRes, productsRes, locationsRes] = await Promise.all([
          InventoryAPI.getItems(organizationSlug),
          InventoryAPI.getProducts(organizationSlug),
          InventoryAPI.getLocations(organizationSlug)
        ]);

        setItems(itemsRes.data || []);
        setProducts(productsRes.data || []);
        setLocations(locationsRes.data || []);
      } else if (tab === 'movements') {
        const movementsRes = await InventoryAPI.getMovements(organizationSlug, { limit: 50 });
        setMovements(movementsRes.data || []);
      } else if (tab === 'purchase-orders') {
        const [poRes, productsRes, locationsRes, suppliersRes] = await Promise.all([
          InventoryAPI.getPurchaseOrders(organizationSlug),
          InventoryAPI.getProducts(organizationSlug),
          InventoryAPI.getLocations(organizationSlug),
          InventoryAPI.getSuppliers(organizationSlug)
        ]);
        setPurchaseOrders(poRes.data || []);
        setProducts(productsRes.data || []);
        setLocations(locationsRes.data || []);
        setSuppliers(suppliersRes.data || []);
      } else if (tab === 'suppliers') {
        const suppliersRes = await InventoryAPI.getSuppliers(organizationSlug);
        setSuppliers(suppliersRes.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch inventory data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Combine stock items with products that can be stocked in new locations
  // This allows users to:
  // 1. Stock-in products that were added without initial stock
  // 2. Stock-in existing products to different warehouses
  const itemsWithUnstockedProducts = React.useMemo(() => {
    // For each product, find which locations DON'T have stock yet
    // This creates virtual items for product+location combinations that don't exist
    const existingCombinations = new Set(
      items.map(item => `${item.product_id}-${item.location_id}`)
    );

    // Create virtual items for each product in locations where it doesn't exist yet
    const virtualItems = [];
    products.forEach(product => {
      // Check if this product has ANY stock anywhere
      const hasAnyStock = items.some(item => item.product_id === product.id);

      if (!hasAnyStock) {
        // Product has no stock anywhere - show one virtual item (user picks location)
        virtualItems.push({
          id: `virtual-${product.id}`,
          product_id: product.id,
          location_id: null,
          quantity: 0,
          reserved_quantity: 0,
          available_quantity: 0,
          stock_status: 'no_stock',
          product: product,
          location: null,
          isVirtual: true,
          isNewProduct: true  // Flag: product has no stock anywhere
        });
      } else {
        // Product has stock in some locations - create virtual items for OTHER locations
        locations.forEach(location => {
          const combinationKey = `${product.id}-${location.id}`;
          if (!existingCombinations.has(combinationKey)) {
            virtualItems.push({
              id: `virtual-${product.id}-${location.id}`,
              product_id: product.id,
              location_id: location.id,
              quantity: 0,
              reserved_quantity: 0,
              available_quantity: 0,
              stock_status: 'no_stock',
              product: product,
              location: location,
              isVirtual: true,
              isNewProduct: false  // Flag: product exists elsewhere, this is just new location
            });
          }
        });
      }
    });

    // Recalculate stock status based on current threshold setting
    const itemsWithUpdatedStatus = items.map(item => {
      const available = item.quantity - (item.reserved_quantity || 0);
      let status = 'normal';
      if (available === 0) {
        status = 'out_of_stock';
      } else if (available <= (item.low_stock_threshold || defaultLowStockThreshold)) {
        status = 'low_stock';
      }
      return { ...item, stock_status: status, available_quantity: available };
    });

    return [...itemsWithUpdatedStatus, ...virtualItems];
  }, [items, products, locations, defaultLowStockThreshold]);

  // Filter and sort items
  const filteredItems = React.useMemo(() => {
    let result = itemsWithUnstockedProducts.filter(item => {
      // Search filter
      const matchesSearch = !searchTerm ||
        item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase());

      // Location filter
      const matchesLocation = !locationFilter ||
        item.location_id === locationFilter ||
        (item.isVirtual && !item.location_id);

      // Status filter
      const matchesStatus = !statusFilter || item.stock_status === statusFilter;

      // Hide unstocked items unless toggled on
      const matchesUnstocked = showUnstocked || item.stock_status !== 'no_stock';

      return matchesSearch && matchesLocation && matchesStatus && matchesUnstocked;
    });

    // Sorting
    if (sortBy.field && sortBy.direction) {
      result = [...result].sort((a, b) => {
        let aVal, bVal;
        switch (sortBy.field) {
          case 'sku':
            aVal = a.product?.sku || '';
            bVal = b.product?.sku || '';
            break;
          case 'name':
            aVal = a.product?.name || '';
            bVal = b.product?.name || '';
            break;
          case 'category':
            aVal = a.product?.category || '';
            bVal = b.product?.category || '';
            break;
          case 'warehouse':
            aVal = a.location?.name || '';
            bVal = b.location?.name || '';
            break;
          case 'quantity':
            aVal = a.quantity || 0;
            bVal = b.quantity || 0;
            return sortBy.direction === 'asc' ? aVal - bVal : bVal - aVal;
          case 'available':
            aVal = a.available_quantity || 0;
            bVal = b.available_quantity || 0;
            return sortBy.direction === 'asc' ? aVal - bVal : bVal - aVal;
          case 'status':
            aVal = a.status || '';
            bVal = b.status || '';
            break;
          default:
            return 0;
        }
        // String comparison
        if (typeof aVal === 'string') {
          const cmp = aVal.localeCompare(bVal);
          return sortBy.direction === 'asc' ? cmp : -cmp;
        }
        return 0;
      });
    }

    return result;
  }, [itemsWithUnstockedProducts, searchTerm, locationFilter, statusFilter, showUnstocked, sortBy]);

  // Toggle sort for a field: asc -> desc -> none
  const createToggleSort = (setter) => (field) => {
    setter(prev => {
      if (prev.field !== field) return { field, direction: 'asc' };
      if (prev.direction === 'asc') return { field, direction: 'desc' };
      return { field: '', direction: '' };
    });
  };
  const toggleSort = createToggleSort(setSortBy);
  const toggleMovementSort = createToggleSort(setMovementSortBy);
  const toggleProductSort = createToggleSort(setProductSortBy);

  // Render sort indicator
  const createSortIcon = (sortState) => ({ field }) => {
    if (sortState.field !== field) return <span className="text-gray-300">↕</span>;
    if (sortState.direction === 'asc') return <span className="text-emerald-600">↑</span>;
    return <span className="text-emerald-600">↓</span>;
  };
  const SortIcon = createSortIcon(sortBy);
  const MovementSortIcon = createSortIcon(movementSortBy);
  const ProductSortIcon = createSortIcon(productSortBy);

  // Pagination component
  const Pagination = ({ currentPage, totalItems, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
        <span className="text-sm text-gray-600">
          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems}
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => onPageChange(i + 1)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${currentPage === i + 1 ? 'bg-emerald-500 text-white' : 'border border-gray-300 hover:bg-gray-100'}`}
            >
              {i + 1}
            </button>
          )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const getStatusColor = (status) => {
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

  const getStatusLabel = (status) => {
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

  const getMovementTypeColor = (type) => {
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

  const getMovementTypeLabel = (type) => {
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

  const getPOStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'approved':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ordered':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'partially_received':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'received':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPOStatusLabel = (status) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'approved':
        return 'Approved';
      case 'ordered':
        return 'Ordered';
      case 'partially_received':
        return 'Partially Received';
      case 'received':
        return 'Received';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getPOStatusIcon = (status) => {
    switch (status) {
      case 'draft':
        return FileText;
      case 'approved':
        return CheckCircle;
      case 'ordered':
        return CheckCircle;
      case 'partially_received':
        return Truck;
      case 'received':
        return CheckCircle;
      default:
        return FileText;
    }
  };

  const handleAddProduct = async () => {
    try {
      // Create product first
      const productData = {
        sku: newProduct.sku,
        name: newProduct.name,
        category: newProduct.category,
        unit: newProduct.unit,
        description: newProduct.description
      };

      console.log('Creating product:', productData);
      const result = await InventoryAPI.createProduct(organizationSlug, productData);
      console.log('Product creation result:', result);

      if (result.code === 0) {
        const createdProduct = result.data;
        console.log('Created product:', createdProduct);

        // If initial stock is provided, create stock movement
        if (newProduct.initial_location_id && newProduct.initial_quantity > 0) {
          const movementData = {
            product_id: createdProduct.id,
            location_id: newProduct.initial_location_id,
            movement_type: 'stock_in',
            quantity: newProduct.initial_quantity,
            unit_cost: newProduct.initial_unit_cost || 0,
            notes: 'Initial stock',
            created_by_individual_id: individualId
          };

          console.log('Creating initial stock movement:', movementData);
          const movementResult = await InventoryAPI.createMovement(organizationSlug, movementData);
          console.log('Movement creation result:', movementResult);

          if (movementResult.code !== 0) {
            console.error('Failed to create initial stock:', movementResult.msg);
            setError(`Product created, but failed to set initial stock: ${movementResult.msg}`);
          }
        } else {
          console.log('Skipping initial stock - location_id:', newProduct.initial_location_id, 'quantity:', newProduct.initial_quantity);
        }

        setShowAddProductModal(false);
        setNewProduct({
          sku: '',
          name: '',
          category: 'CCTV',
          unit: 'pcs',
          description: '',
          initial_location_id: '',
          initial_quantity: 0,
          initial_unit_cost: 0
        });
        fetchData();
      } else {
        setError(result.msg || 'Failed to create product');
      }
    } catch (err) {
      console.error('Failed to add product:', err);
      setError(err.message);
    }
  };

  const handleQuickAddProduct = async () => {
    try {
      // Validate required fields
      if (!quickProduct.sku || !quickProduct.name) {
        setError('SKU and Name are required');
        return;
      }

      // Create product
      const productData = {
        sku: quickProduct.sku,
        name: quickProduct.name,
        category: quickProduct.category,
        unit: quickProduct.unit,
        description: ''
      };

      const result = await InventoryAPI.createProduct(organizationSlug, productData);

      if (result.code === 0) {
        const createdProduct = result.data;

        // Close modal and reset form
        setShowQuickAddProductModal(false);
        setQuickProduct({
          sku: '',
          name: '',
          category: 'CCTV',
          unit: 'pcs'
        });

        // Refresh products list
        const productsRes = await InventoryAPI.getProducts(organizationSlug);
        setProducts(productsRes.data || []);

        // Auto-select the newly created product
        setPoItemToAdd({ ...poItemToAdd, product_id: createdProduct.id });
      } else {
        setError(result.msg || 'Failed to create product');
      }
    } catch (err) {
      console.error('Failed to quick add product:', err);
      setError(err.message);
    }
  };

  const handleStockOut = async () => {
    try {
      if (stockOutData.quantity <= 0) {
        setError('Invalid quantity');
        return;
      }

      // Determine product_id and location_id based on mode
      let productId, locationId, maxQuantity;

      if (selectedStockItem) {
        // Pre-selected item mode
        productId = selectedStockItem.product_id;
        locationId = selectedStockItem.location_id;
        maxQuantity = selectedStockItem.available_quantity;
      } else {
        // Manual selection mode (from top button)
        productId = stockOutData.product_id;
        locationId = stockOutData.location_id;
        // Find the stock item to check available quantity
        const stockItem = items.find(i => i.product_id === productId && i.location_id === locationId);
        maxQuantity = stockItem?.available_quantity || 0;
      }

      if (!productId) {
        setError('Please select a product');
        return;
      }
      if (!locationId) {
        setError('Please select a warehouse');
        return;
      }

      if (stockOutData.quantity > maxQuantity) {
        setError(`Cannot stock out more than available quantity (${maxQuantity})`);
        return;
      }

      const movementData = {
        product_id: productId,
        location_id: locationId,
        movement_type: 'stock_out',
        quantity: stockOutData.quantity,
        unit_cost: 0,
        notes: stockOutData.notes || 'Stock out',
        created_by_individual_id: individualId
      };

      const result = await InventoryAPI.createMovement(organizationSlug, movementData);
      if (result.code === 0) {
        setShowStockOutModal(false);
        setSelectedStockItem(null);
        setStockOutData({ quantity: 0, notes: '', product_id: '', location_id: '' });
        fetchData();
      } else {
        setError(result.msg || 'Failed to stock out');
      }
    } catch (err) {
      console.error('Failed to stock out:', err);
      setError(err.message);
    }
  };

  const handleItemClick = (item) => {
    setSelectedStockItem(item);
    setStockOutData({ quantity: 1, notes: '' });
    setShowStockOutModal(true);
  };

  // Handle Stock In for manual entries (refund, return, adjustment)
  const handleStockIn = async () => {
    try {
      if (stockInData.quantity <= 0) {
        setError('Invalid quantity');
        return;
      }

      // Determine product_id and location_id based on mode
      let productId, locationId;

      if (selectedStockItem) {
        // Pre-selected item mode
        productId = selectedStockItem.product_id;
        locationId = selectedStockItem.isVirtual && !selectedStockItem.location_id
          ? stockInData.location_id
          : selectedStockItem.location_id;
      } else {
        // Manual selection mode (from top button)
        productId = stockInData.product_id;
        locationId = stockInData.location_id;
      }

      if (!productId) {
        setError('Please select a product');
        return;
      }
      if (!locationId) {
        setError('Please select a warehouse');
        return;
      }

      const movementData = {
        product_id: productId,
        location_id: locationId,
        movement_type: 'stock_in',
        quantity: parseFloat(stockInData.quantity),
        unit_cost: parseFloat(stockInData.unit_cost) || 0,
        reference_type: stockInData.reference_type,
        notes: stockInData.notes || `Stock in: ${stockInData.reference_type}`,
        created_by_individual_id: individualId
      };

      const result = await InventoryAPI.createMovement(organizationSlug, movementData);
      if (result.code === 0) {
        setShowStockInModal(false);
        setSelectedStockItem(null);
        setStockInData({ quantity: 0, unit_cost: 0, reference_type: 'manual', location_id: '', notes: '' });
        fetchData();
      } else {
        setError(result.msg || 'Failed to stock in');
      }
    } catch (err) {
      console.error('Failed to stock in:', err);
      setError(err.message);
    }
  };

  const handleAddLocation = async () => {
    try {
      if (!newLocation.name) {
        setError('Warehouse name is required');
        return;
      }

      console.log('Creating location:', newLocation);
      const result = await InventoryAPI.createLocation(organizationSlug, newLocation);
      console.log('Location creation result:', result);

      if (result.code === 0) {
        setShowAddLocationModal(false);
        setNewLocation({
          name: '',
          code: '',
          address: ''
        });
        // Reload locations
        const locationsRes = await InventoryAPI.getLocations(organizationSlug);
        setLocations(locationsRes.data || []);
      } else {
        setError(result.msg || 'Failed to create warehouse');
      }
    } catch (err) {
      console.error('Failed to add location:', err);
      setError(err.message);
    }
  };

  const handleAddItemToPO = () => {
    if (!poItemToAdd.product_id || poItemToAdd.quantity <= 0 || poItemToAdd.unit_cost <= 0) {
      setError('Please select a product and enter valid quantity and unit cost');
      return;
    }

    const product = products.find(p => p.id === poItemToAdd.product_id);
    if (!product) {
      setError('Invalid product selected');
      return;
    }

    setNewPO({
      ...newPO,
      items: [...newPO.items, {
        ...poItemToAdd,
        product_name: product.name,
        product_sku: product.sku
      }]
    });

    setPoItemToAdd({ product_id: '', quantity: 0, unit_cost: 0 });
  };

  const handleRemoveItemFromPO = (index) => {
    setNewPO({
      ...newPO,
      items: newPO.items.filter((_, i) => i !== index)
    });
  };

  const handleCreatePO = async () => {
    try {
      if (!newPO.supplier_id || !newPO.po_number || newPO.items.length === 0) {
        setError('Please fill in supplier, PO number, and add at least one item');
        return;
      }

      const poData = {
        supplier_id: newPO.supplier_id,
        po_number: newPO.po_number,
        expected_delivery_date: newPO.expected_delivery_date || null,
        notes: newPO.notes,
        items: newPO.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost
        }))
      };

      console.log('Creating PO:', poData);
      const result = await InventoryAPI.createPurchaseOrder(organizationSlug, poData);
      console.log('PO creation result:', result);

      if (result.code === 0) {
        setShowAddPOModal(false);
        setNewPO({
          supplier_id: '',
          po_number: '',
          expected_delivery_date: '',
          location_id: '',
          notes: '',
          items: []
        });
        setPoItemToAdd({ product_id: '', quantity: 0, unit_cost: 0 });
        fetchData();
      } else {
        setError(result.msg || 'Failed to create purchase order');
      }
    } catch (err) {
      console.error('Failed to create PO:', err);
      setError(err.message);
    }
  };

  const handleAddSupplier = async () => {
    try {
      // Validation
      if (!organizationSlug) {
        setError('Organization not found. Please refresh the page.');
        return;
      }

      if (!newSupplier.name || !newSupplier.name.trim()) {
        setError('Supplier name is required');
        return;
      }

      // Email validation (if provided)
      if (newSupplier.email && newSupplier.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newSupplier.email.trim())) {
          setError('Please enter a valid email address');
          return;
        }
      }

      // Phone validation (if provided) - basic check for at least 8 digits
      if (newSupplier.phone && newSupplier.phone.trim()) {
        const phoneDigits = newSupplier.phone.replace(/\D/g, '');
        if (phoneDigits.length < 8) {
          setError('Please enter a valid phone number (at least 8 digits)');
          return;
        }
      }

      console.log('Creating supplier:', newSupplier);
      console.log('Organization slug:', organizationSlug);
      const result = await InventoryAPI.createSupplier(organizationSlug, newSupplier);
      console.log('Supplier creation result:', result);

      if (result.code === 0) {
        setShowAddSupplierModal(false);
        setNewSupplier({
          name: '',
          contact_person: '',
          email: '',
          phone: '',
          address: '',
          notes: ''
        });
        fetchData();
      } else {
        setError(result.msg || 'Failed to create supplier');
      }
    } catch (err) {
      console.error('Failed to add supplier:', err);
      setError(err.message);
    }
  };

  const handleAddCustomCategory = () => {
    if (!newCustomCategory.trim()) {
      setError('Category name is required');
      return;
    }
    if (customCategories.includes(newCustomCategory.trim())) {
      setError('Category already exists');
      return;
    }
    setCustomCategories([...customCategories, newCustomCategory.trim()]);
    setNewProduct({ ...newProduct, category: newCustomCategory.trim() });
    setNewCustomCategory('');
    setShowAddCategoryModal(false);
  };

  const handleAddCustomUnit = () => {
    if (!newCustomUnit.trim()) {
      setError('Unit name is required');
      return;
    }
    if (customUnits.includes(newCustomUnit.trim())) {
      setError('Unit already exists');
      return;
    }
    setCustomUnits([...customUnits, newCustomUnit.trim()]);
    setNewProduct({ ...newProduct, unit: newCustomUnit.trim() });
    setNewCustomUnit('');
    setShowAddUnitModal(false);
  };

  const handleCategoryChange = (value) => {
    if (value === '__add_new__') {
      setShowAddCategoryModal(true);
    } else {
      setNewProduct({ ...newProduct, category: value });
    }
  };

  const handleUnitChange = (value) => {
    if (value === '__add_new__') {
      setShowAddUnitModal(true);
    } else {
      setNewProduct({ ...newProduct, unit: value });
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSettingsLoading(true);

      // Save settings
      const result = await InventoryAPI.updateSettings(organizationSlug, {
        low_stock_threshold: defaultLowStockThreshold
      });

      if (result.code === 0) {
        // Automatically migrate all existing stock items to use the new threshold
        console.log('Migrating stock thresholds...');
        const migrateResult = await InventoryAPI.migrateStockThresholds(organizationSlug);

        if (migrateResult.code === 0) {
          console.log(`Successfully updated ${migrateResult.data.updatedCount} stock items to threshold: ${migrateResult.data.threshold}`);
        }

        // Refresh data to show updated statuses (await to ensure fresh data)
        await fetchData();

        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 3000);
      } else {
        setError(result.msg || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(err.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleOpenPODetail = (po) => {
    setSelectedPO(po);
    setShowPODetailModal(true);
  };

  const handleUpdatePOStatus = async (newStatus) => {
    try {
      if (!selectedPO) return;

      // Call API to update PO status
      const response = await fetch(`${process.env.REACT_APP_API_BASE || ''}/api/inventory/${selectedPO.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_slug: organizationSlug,
          action: 'update-po-status',
          status: newStatus
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update PO status: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.code === 0) {
        // Update local state
        setSelectedPO({ ...selectedPO, status: newStatus });
        // Refresh the purchase orders list
        fetchData();
      } else {
        setError(result.msg || 'Failed to update PO status');
      }
    } catch (err) {
      console.error('Failed to update PO status:', err);
      setError(err.message);
    }
  };

  const handleUploadDO = async (file) => {
    try {
      if (!selectedPO || !file) return;

      // For now, we'll store the file reference in the PO
      // In a production system, you would upload to cloud storage (S3, Supabase Storage, etc.)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('organization_slug', organizationSlug);
      formData.append('po_id', selectedPO.id);

      const response = await fetch(`${process.env.REACT_APP_API_BASE || ''}/api/inventory/upload-do`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to upload DO: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.code === 0) {
        // Update selectedPO with DO file reference
        setSelectedPO({ ...selectedPO, delivery_order_url: result.data.file_url });
        fetchData();
      } else {
        setError(result.msg || 'Failed to upload delivery order');
      }
    } catch (err) {
      console.error('Failed to upload DO:', err);
      setError(err.message);
    }
  };

  return (
    <div className="inventory-product min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 m-0 p-0">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm sticky top-0 z-10">
        <div className="px-8 py-6 m-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl blur opacity-20"></div>
                <div className="relative bg-gradient-to-br from-emerald-500 to-cyan-600 p-3 rounded-2xl shadow-lg">
                  <Package className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Inventory Management</h1>
                <p className="text-gray-500 text-sm font-medium mt-0.5 tracking-wide">Stock & Purchase Orders</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddLocationModal(true)}
                className="group relative bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center space-x-2 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <Warehouse className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span className="font-medium">Add Warehouse</span>
              </button>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="group relative bg-gradient-to-r from-gray-900 to-gray-800 text-white px-5 py-2.5 rounded-xl flex items-center space-x-2 hover:from-gray-800 hover:to-gray-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
                <span className="font-medium">Add Product</span>
              </button>
              <button
                onClick={() => setShowAddPOModal(true)}
                className="group bg-white border-2 border-emerald-600 text-emerald-600 px-5 py-2.5 rounded-xl flex items-center space-x-2 hover:bg-emerald-600 hover:text-white transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
              >
                <FileText className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span className="font-medium">Create PO</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
        {/* Tabs */}
        <div className="bg-white/50 backdrop-blur-sm border-b border-gray-200/70">
          <nav className="flex px-8 space-x-1">
              <button
                onClick={() => setTab('overview')}
                className={`relative px-6 py-4 text-sm font-semibold transition-all duration-200 ${
                  tab === 'overview'
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="relative z-10">Stock Overview</span>
                {tab === 'overview' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"></div>
                )}
              </button>
              <button
                onClick={() => setTab('products')}
                className={`relative px-6 py-4 text-sm font-semibold transition-all duration-200 ${
                  tab === 'products'
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="relative z-10">Products</span>
                {tab === 'products' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"></div>
                )}
              </button>
              <button
                onClick={() => setTab('movements')}
                className={`relative px-6 py-4 text-sm font-semibold transition-all duration-200 ${
                  tab === 'movements'
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="relative z-10">Stock Movements</span>
                {tab === 'movements' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"></div>
                )}
              </button>
              <button
                onClick={() => setTab('purchase-orders')}
                className={`relative px-6 py-4 text-sm font-semibold transition-all duration-200 ${
                  tab === 'purchase-orders'
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="relative z-10">Purchase Orders</span>
                {tab === 'purchase-orders' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"></div>
                )}
              </button>
              <button
                onClick={() => setTab('suppliers')}
                className={`relative px-6 py-4 text-sm font-semibold transition-all duration-200 ${
                  tab === 'suppliers'
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="relative z-10">Suppliers</span>
                {tab === 'suppliers' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"></div>
                )}
              </button>
              <button
                onClick={() => setTab('settings')}
                className={`relative px-6 py-4 text-sm font-semibold transition-all duration-200 ${
                  tab === 'settings'
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="relative z-10">Settings</span>
                {tab === 'settings' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"></div>
                )}
              </button>
            </nav>
        </div>

        {/* Content - No padding for full width */}
        <div className="px-8 py-6">
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 rounded-xl p-5 mb-6 shadow-sm">
            <p className="text-red-900 text-sm font-medium">Error: {error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent absolute top-0"></div>
            </div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {tab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="group relative bg-white border border-gray-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-bl-3xl opacity-50"></div>
                    <div className="relative">
                      <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Total Products</div>
                      <div className="text-4xl font-bold text-gray-900 mb-1">{products.length}</div>
                      <div className="text-xs text-emerald-600 font-medium">In catalog</div>
                    </div>
                  </div>
                  <div className="group relative bg-white border border-gray-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-100 to-cyan-50 rounded-bl-3xl opacity-50"></div>
                    <div className="relative">
                      <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Stock Items</div>
                      <div className="text-4xl font-bold text-gray-900 mb-1">{items.length}</div>
                      <div className="text-xs text-cyan-600 font-medium">In inventory</div>
                    </div>
                  </div>
                  <div className="group relative bg-white border border-gray-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 rounded-bl-3xl opacity-50"></div>
                    <div className="relative">
                      <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Low Stock Alert</div>
                      <div className="text-4xl font-bold text-amber-600 mb-1">
                        {items.filter(i => i.stock_status === 'low_stock').length}
                      </div>
                      <div className="text-xs text-amber-600 font-medium">Need restock</div>
                    </div>
                  </div>
                  <div className="group relative bg-white border border-gray-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 rounded-bl-3xl opacity-50"></div>
                    <div className="relative">
                      <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Out of Stock</div>
                      <div className="text-4xl font-bold text-red-600 mb-1">
                        {items.filter(i => i.stock_status === 'out_of_stock').length}
                      </div>
                      <div className="text-xs text-red-600 font-medium">Zero quantity</div>
                    </div>
                  </div>
                </div>

                {/* Inventory Table */}
                <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200/70 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900">Stock Items</h2>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedStockItem(null);
                            setStockInData({ quantity: 1, unit_cost: 0, reference_type: 'manual', location_id: '', notes: '', product_id: '' });
                            setShowStockInModal(true);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center space-x-2 shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Stock In</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStockItem(null);
                            setStockOutData({ quantity: 1, notes: '', product_id: '', location_id: '' });
                            setShowStockOutModal(true);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-orange-600 transition-all flex items-center space-x-2 shadow-sm"
                        >
                          <Minus className="w-4 h-4" />
                          <span>Stock Out</span>
                        </button>
                      </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="space-y-3">
                      <div className="flex space-x-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search by product name or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-900"
                          />
                        </div>
                        <SearchableSelect
                          value={locationFilter}
                          onChange={setLocationFilter}
                          options={[
                            { value: '', label: 'All Warehouses' },
                            ...locations.map(l => ({ value: l.id, label: l.name }))
                          ]}
                          placeholder="All Warehouses"
                          className="w-48"
                        />
                        <SearchableSelect
                          value={statusFilter}
                          onChange={setStatusFilter}
                          options={[
                            { value: '', label: 'All Status' },
                            { value: 'normal', label: 'Normal' },
                            { value: 'low_stock', label: 'Low Stock' },
                            { value: 'out_of_stock', label: 'Out of Stock' },
                            { value: 'no_stock', label: 'Unstocked' }
                          ]}
                          placeholder="All Status"
                          className="w-40"
                        />
                      </div>
                      {/* Show Unstocked Toggle */}
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showUnstocked}
                            onChange={(e) => setShowUnstocked(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <span className="text-sm text-gray-600">Show unstocked products</span>
                        </label>
                        <span className="text-sm text-gray-500">{filteredItems.length} items</span>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200/70">
                      <thead className="bg-gradient-to-b from-gray-50 to-gray-100/50">
                        <tr>
                          <th onClick={() => toggleSort('sku')} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                            <span className="flex items-center space-x-1"><span>SKU</span><SortIcon field="sku" /></span>
                          </th>
                          <th onClick={() => toggleSort('name')} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                            <span className="flex items-center space-x-1"><span>Product Name</span><SortIcon field="name" /></span>
                          </th>
                          <th onClick={() => toggleSort('category')} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                            <span className="flex items-center space-x-1"><span>Category</span><SortIcon field="category" /></span>
                          </th>
                          <th onClick={() => toggleSort('warehouse')} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                            <span className="flex items-center space-x-1"><span>Warehouse</span><SortIcon field="warehouse" /></span>
                          </th>
                          <th onClick={() => toggleSort('quantity')} className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                            <span className="flex items-center justify-end space-x-1"><span>Quantity</span><SortIcon field="quantity" /></span>
                          </th>
                          <th onClick={() => toggleSort('available')} className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                            <span className="flex items-center justify-end space-x-1"><span>Available</span><SortIcon field="available" /></span>
                          </th>
                          <th onClick={() => toggleSort('status')} className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                            <span className="flex items-center justify-center space-x-1"><span>Status</span><SortIcon field="status" /></span>
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {filteredItems.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="px-6 py-16 text-center">
                              <div className="flex flex-col items-center space-y-3">
                                <div className="p-4 bg-gray-100 rounded-full">
                                  <Package className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-medium">
                                  {searchTerm || locationFilter ? 'No matching inventory found' : 'No inventory data'}
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredItems.slice((stockPage - 1) * ITEMS_PER_PAGE, stockPage * ITEMS_PER_PAGE).map((item) => (
                            <tr
                              key={item.id}
                              onClick={() => !item.isVirtual && handleItemClick(item)}
                              className={`hover:bg-gradient-to-r transition-colors duration-150 group ${
                                item.isVirtual
                                  ? 'hover:from-purple-50/40 hover:to-indigo-50/40 cursor-default'
                                  : 'hover:from-red-50/40 hover:to-orange-50/40 cursor-pointer'
                              }`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                {item.product?.sku}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item.product?.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {item.product?.category || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {item.location?.name || (item.isVirtual ? <span className="text-purple-500 italic">Select location</span> : '-')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                                {item.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right flex items-center justify-end space-x-2">
                                <span className={item.isVirtual ? 'text-purple-600' : 'text-emerald-600'}>{item.available_quantity}</span>
                                {!item.isVirtual && <Minus className="w-4 h-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span
                                  className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full border shadow-sm ${getStatusColor(
                                    item.stock_status
                                  )}`}
                                >
                                  {getStatusLabel(item.stock_status)}
                                </span>
                              </td>
                              {/* Actions Column - Stock In/Out buttons */}
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  {/* Stock In Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedStockItem(item);
                                      setStockInData({ quantity: 1, unit_cost: 0, reference_type: 'manual', location_id: '', notes: '' });
                                      setShowStockInModal(true);
                                    }}
                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Stock In"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                  {/* Stock Out Button - Only show if there's actual stock */}
                                  {!item.isVirtual && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedStockItem(item);
                                        setStockOutData({ quantity: 1, notes: '' });
                                        setShowStockOutModal(true);
                                      }}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Stock Out"
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    <Pagination currentPage={stockPage} totalItems={filteredItems.length} onPageChange={setStockPage} />
                  </div>
                </div>
              </div>
            )}

            {/* Movements Tab */}
            {tab === 'movements' && (
              <div>
              <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200/70 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="text-xl font-bold text-gray-900">Stock Movements</h2>
                </div>
                {/* Search and Filter Bar */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by product, warehouse, or notes..."
                      value={movementSearchTerm}
                      onChange={(e) => setMovementSearchTerm(e.target.value)}
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                    />
                  </div>
                  {/* Date Range */}
                  <div className="flex items-center space-x-2">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <label className="text-sm text-gray-600">Date From:</label>
                    <input
                      type="date"
                      value={movementDateFrom}
                      onChange={(e) => setMovementDateFrom(e.target.value)}
                      className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all text-sm"
                    />
                    <label className="text-sm text-gray-600">To:</label>
                    <input
                      type="date"
                      value={movementDateTo}
                      onChange={(e) => setMovementDateTo(e.target.value)}
                      className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all text-sm"
                    />
                  </div>
                  {/* Dropdown Filters */}
                  <div className="flex items-center space-x-2 flex-wrap gap-2">
                    <SearchableSelect
                      value={movementTypeFilter}
                      onChange={setMovementTypeFilter}
                      options={[
                        { value: '', label: 'All Types' },
                        { value: 'stock_in', label: 'Stock In' },
                        { value: 'stock_out', label: 'Stock Out' }
                      ]}
                      placeholder="All Types"
                      className="w-36"
                    />
                    <SearchableSelect
                      value={movementLocationFilter}
                      onChange={setMovementLocationFilter}
                      options={[
                        { value: '', label: 'All Warehouses' },
                        ...locations.map(loc => ({ value: loc.id, label: loc.name }))
                      ]}
                      placeholder="All Warehouses"
                      className="w-44"
                    />
                    <SearchableSelect
                      value={movementProductFilter}
                      onChange={setMovementProductFilter}
                      options={[
                        { value: '', label: 'All Products' },
                        ...products.map(prod => ({ value: prod.id, label: prod.name }))
                      ]}
                      placeholder="All Products"
                      className="w-48"
                    />
                    <SearchableSelect
                      value={movementUserFilter}
                      onChange={setMovementUserFilter}
                      options={[
                        { value: '', label: 'All Users' },
                        ...[...new Map(movements.filter(m => m.individual?.id).map(m => [m.individual.id, m.individual])).values()].map(user => ({ value: user.id, label: user.display_name }))
                      ]}
                      placeholder="All Users"
                      className="w-44"
                    />
                    {(movementDateFrom || movementDateTo || movementTypeFilter || movementLocationFilter || movementProductFilter || movementUserFilter) && (
                      <button
                        onClick={() => {
                          setMovementDateFrom('');
                          setMovementDateTo('');
                          setMovementTypeFilter('');
                          setMovementLocationFilter('');
                          setMovementProductFilter('');
                          setMovementUserFilter('');
                        }}
                        className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200/70">
                    <thead className="bg-gradient-to-b from-gray-50 to-gray-100/50">
                      <tr>
                        <th onClick={() => toggleMovementSort('date')} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                          <span className="flex items-center space-x-1"><span>Date</span><MovementSortIcon field="date" /></span>
                        </th>
                        <th onClick={() => toggleMovementSort('type')} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                          <span className="flex items-center space-x-1"><span>Type</span><MovementSortIcon field="type" /></span>
                        </th>
                        <th onClick={() => toggleMovementSort('product')} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                          <span className="flex items-center space-x-1"><span>Product</span><MovementSortIcon field="product" /></span>
                        </th>
                        <th onClick={() => toggleMovementSort('warehouse')} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                          <span className="flex items-center space-x-1"><span>Warehouse</span><MovementSortIcon field="warehouse" /></span>
                        </th>
                        <th onClick={() => toggleMovementSort('quantity')} className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                          <span className="flex items-center justify-end space-x-1"><span>Quantity</span><MovementSortIcon field="quantity" /></span>
                        </th>
                        <th onClick={() => toggleMovementSort('operator')} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                          <span className="flex items-center space-x-1"><span>Operator</span><MovementSortIcon field="operator" /></span>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {(() => {
                        // Filter movements based on all filters
                        const filteredMovements = movements.filter(movement => {
                          // Text search filter
                          if (movementSearchTerm) {
                            const searchLower = movementSearchTerm.toLowerCase();
                            const matchesSearch = (
                              movement.product?.name?.toLowerCase().includes(searchLower) ||
                              movement.product?.sku?.toLowerCase().includes(searchLower) ||
                              movement.location?.name?.toLowerCase().includes(searchLower) ||
                              movement.notes?.toLowerCase().includes(searchLower)
                            );
                            if (!matchesSearch) return false;
                          }

                          // Movement type filter (stock_in / stock_out)
                          if (movementTypeFilter && movement.movement_type !== movementTypeFilter) return false;

                          // Location filter
                          if (movementLocationFilter && movement.location_id !== movementLocationFilter) return false;

                          // Product filter
                          if (movementProductFilter && movement.product_id !== movementProductFilter) return false;

                          // User filter
                          if (movementUserFilter && movement.individual?.id !== movementUserFilter) return false;

                          // Date range filter
                          if (movementDateFrom || movementDateTo) {
                            const movementDate = new Date(movement.occurred_at);
                            movementDate.setHours(0, 0, 0, 0);

                            if (movementDateFrom) {
                              const fromDate = new Date(movementDateFrom);
                              fromDate.setHours(0, 0, 0, 0);
                              if (movementDate < fromDate) return false;
                            }

                            if (movementDateTo) {
                              const toDate = new Date(movementDateTo);
                              toDate.setHours(23, 59, 59, 999);
                              if (movementDate > toDate) return false;
                            }
                          }

                          return true;
                        });

                        // Sort movements
                        if (movementSortBy.field && movementSortBy.direction) {
                          filteredMovements.sort((a, b) => {
                            let aVal, bVal;
                            switch (movementSortBy.field) {
                              case 'date':
                                aVal = new Date(a.occurred_at).getTime();
                                bVal = new Date(b.occurred_at).getTime();
                                return movementSortBy.direction === 'asc' ? aVal - bVal : bVal - aVal;
                              case 'type':
                                aVal = a.movement_type || '';
                                bVal = b.movement_type || '';
                                break;
                              case 'product':
                                aVal = a.product?.name || '';
                                bVal = b.product?.name || '';
                                break;
                              case 'warehouse':
                                aVal = a.location?.name || '';
                                bVal = b.location?.name || '';
                                break;
                              case 'quantity':
                                aVal = a.quantity || 0;
                                bVal = b.quantity || 0;
                                return movementSortBy.direction === 'asc' ? aVal - bVal : bVal - aVal;
                              case 'operator':
                                aVal = a.individual?.display_name || '';
                                bVal = b.individual?.display_name || '';
                                break;
                              default:
                                return 0;
                            }
                            const cmp = String(aVal).localeCompare(String(bVal));
                            return movementSortBy.direction === 'asc' ? cmp : -cmp;
                          });
                        }

                        if (filteredMovements.length === 0) {
                          return (
                            <tr>
                              <td colSpan="7" className="px-6 py-16 text-center">
                                <div className="flex flex-col items-center space-y-3">
                                  <div className="p-4 bg-gray-100 rounded-full">
                                    <Activity className="w-8 h-8 text-gray-400" />
                                  </div>
                                  <p className="text-gray-500 font-medium">
                                    {movementSearchTerm ? 'No movements match your search' : 'No movement records'}
                                  </p>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        const paginatedMovements = filteredMovements.slice((movementPage - 1) * ITEMS_PER_PAGE, movementPage * ITEMS_PER_PAGE);
                        return (
                          <>
                            {paginatedMovements.map((movement) => (
                              <tr key={movement.id} className="hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-cyan-50/30 transition-colors duration-150">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {new Date(movement.occurred_at).toLocaleDateString('zh-CN')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className={`font-bold ${getMovementTypeColor(movement.movement_type)}`}>
                                    {getMovementTypeLabel(movement.movement_type)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {movement.product?.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {movement.location?.name || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                                  {movement.movement_type === 'stock_out' ? '-' : '+'}{movement.quantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {movement.created_by_name || movement.individual?.display_name || '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {movement.notes || '-'}
                                </td>
                              </tr>
                            ))}
                            <tr><td colSpan="7" className="p-0"><Pagination currentPage={movementPage} totalItems={filteredMovements.length} onPageChange={setMovementPage} /></td></tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
              </div>
            )}

            {/* Products Tab */}
            {tab === 'products' && (
              <div>
                <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200/70 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Product Catalog</h2>
                  </div>
                  {/* Search Bar */}
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 flex items-center space-x-2">
                        <Search className="w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by SKU, product name, or category..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
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
                            <span className="flex items-center space-x-1"><span>Unit</span><ProductSortIcon field="unit" /></span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {(() => {
                          // Filter products based on search term
                          let filteredProducts = products.filter(product => {
                            if (!productSearchTerm) return true;
                            const searchLower = productSearchTerm.toLowerCase();
                            return (
                              product.sku?.toLowerCase().includes(searchLower) ||
                              product.name?.toLowerCase().includes(searchLower) ||
                              product.category?.toLowerCase().includes(searchLower)
                            );
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
                                <td colSpan="4" className="px-6 py-16 text-center">
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
                              {paginatedProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-cyan-50/30 transition-colors duration-150">
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
                                    {product.unit}
                                  </td>
                                </tr>
                              ))}
                              <tr><td colSpan="4" className="p-0"><Pagination currentPage={productPage} totalItems={filteredProducts.length} onPageChange={setProductPage} /></td></tr>
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Purchase Orders Tab */}
            {tab === 'purchase-orders' && (
              <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
                {/* Search and Filter Bar */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white space-y-3">
                  <div className="flex items-center space-x-2">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by PO number, supplier, or product..."
                      value={poSearchTerm}
                      onChange={(e) => setPoSearchTerm(e.target.value)}
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <div className="flex items-center space-x-2 flex-1">
                      <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Order Date From:</label>
                      <input
                        type="date"
                        value={poDateFrom}
                        onChange={(e) => setPoDateFrom(e.target.value)}
                        className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                      />
                      <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">To:</label>
                      <input
                        type="date"
                        value={poDateTo}
                        onChange={(e) => setPoDateTo(e.target.value)}
                        className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                      />
                      {(poDateFrom || poDateTo) && (
                        <button
                          onClick={() => {
                            setPoDateFrom('');
                            setPoDateTo('');
                          }}
                          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-all"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">PO Number</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Supplier</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Order Date</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Expected Delivery</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Warehouse</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Total Amount</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Items</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(() => {
                        // Filter purchase orders based on search term and date range
                        const filteredPOs = purchaseOrders.filter(po => {
                          // Text search filter
                          if (poSearchTerm) {
                            const searchLower = poSearchTerm.toLowerCase();
                            const matchesSearch = (
                              po.po_number?.toLowerCase().includes(searchLower) ||
                              po.supplier?.name?.toLowerCase().includes(searchLower) ||
                              po.items?.some(item =>
                                item.product?.name?.toLowerCase().includes(searchLower) ||
                                item.product?.sku?.toLowerCase().includes(searchLower)
                              )
                            );
                            if (!matchesSearch) return false;
                          }

                          // Date range filter (by order_date)
                          if (poDateFrom || poDateTo) {
                            if (!po.order_date) return false; // Exclude POs without order date

                            const orderDate = new Date(po.order_date);
                            orderDate.setHours(0, 0, 0, 0); // Reset time for date-only comparison

                            if (poDateFrom) {
                              const fromDate = new Date(poDateFrom);
                              fromDate.setHours(0, 0, 0, 0);
                              if (orderDate < fromDate) return false;
                            }

                            if (poDateTo) {
                              const toDate = new Date(poDateTo);
                              toDate.setHours(23, 59, 59, 999); // End of day
                              if (orderDate > toDate) return false;
                            }
                          }

                          return true;
                        });

                        if (filteredPOs.length === 0) {
                          return (
                            <tr>
                              <td colSpan="8" className="px-6 py-16 text-center">
                                <div className="flex flex-col items-center space-y-3">
                                  <FileText className="w-12 h-12 text-gray-300" />
                                  <p className="text-gray-500">
                                    {poSearchTerm ? 'No purchase orders match your search' : 'No purchase orders yet'}
                                  </p>
                                  {!poSearchTerm && (
                                    <button
                                      onClick={() => setShowAddPOModal(true)}
                                      className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
                                    >
                                      Create First Purchase Order
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return filteredPOs.map((po) => {
                          const StatusIcon = getPOStatusIcon(po.status);
                          // Find warehouse name from location_id
                          const warehouse = po.location_id
                            ? locations.find(loc => loc.id === po.location_id)
                            : null;

                          return (
                            <tr
                              key={po.id}
                              onClick={() => handleOpenPODetail(po)}
                              className="hover:bg-gray-50/50 transition-colors duration-150 cursor-pointer"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-4 h-4 text-gray-400" />
                                  <span className="font-semibold text-gray-900">{po.po_number}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-gray-900">{po.supplier?.name || 'N/A'}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {po.order_date ? new Date(po.order_date).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : 'TBD'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-1.5">
                                  <Warehouse className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-900">
                                    {warehouse?.name || 'Default'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getPOStatusColor(po.status)}`}>
                                  <StatusIcon className="w-3.5 h-3.5" />
                                  <span>{getPOStatusLabel(po.status)}</span>
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span className="font-bold text-gray-900">RM {(po.total_amount || 0).toFixed(2)}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-sm">
                                  {po.items?.length || 0}
                                </span>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Suppliers Tab */}
            {tab === 'suppliers' && (
              <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200/70 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Suppliers</h2>
                  <button
                    onClick={() => setShowAddSupplierModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Supplier</span>
                  </button>
                </div>
                {/* Search Bar */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-2">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by supplier name, contact person, email, or phone..."
                      value={supplierSearchTerm}
                      onChange={(e) => setSupplierSearchTerm(e.target.value)}
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Supplier Name</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Contact Person</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(() => {
                        // Filter suppliers based on search term
                        const filteredSuppliers = suppliers.filter(supplier => {
                          if (!supplierSearchTerm) return true;
                          const searchLower = supplierSearchTerm.toLowerCase();
                          return (
                            supplier.name?.toLowerCase().includes(searchLower) ||
                            supplier.contact_person?.toLowerCase().includes(searchLower) ||
                            supplier.email?.toLowerCase().includes(searchLower) ||
                            supplier.phone?.toLowerCase().includes(searchLower) ||
                            supplier.address?.toLowerCase().includes(searchLower)
                          );
                        });

                        if (filteredSuppliers.length === 0) {
                          return (
                            <tr>
                              <td colSpan="5" className="px-6 py-16 text-center">
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
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {supplier.address || '-'}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {tab === 'settings' && (
              <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm p-8">
                <div className="max-w-2xl">
                  <div className="flex items-center space-x-3 mb-8">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Inventory Settings</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="border-2 border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Low Stock Threshold</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Set the default quantity threshold for low stock alerts. When stock reaches or falls below this number, items will be marked as "Low Stock".
                      </p>
                      <div className="flex items-center space-x-4 mb-4">
                        <label className="block text-sm font-semibold text-gray-700">Default Threshold:</label>
                        <input
                          type="number"
                          value={defaultLowStockThreshold === 0 ? '' : defaultLowStockThreshold}
                          onChange={(e) => {
                            setDefaultLowStockThreshold(e.target.value === '' ? 0 : parseInt(e.target.value));
                            setSettingsSaved(false); // Reset saved state when user makes changes
                          }}
                          className="w-32 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                          min="0"
                        />
                        <span className="text-sm text-gray-600">units</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          This setting is synced to the database and shared across all devices.
                        </p>
                        <button
                          onClick={handleSaveSettings}
                          disabled={settingsLoading}
                          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {settingsLoading ? (
                            <>
                              <Clock className="w-4 h-4 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : settingsSaved ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Saved!</span>
                            </>
                          ) : (
                            <>
                              <Settings className="w-4 h-4" />
                              <span>Save Settings</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Future Settings</h3>
                      <p className="text-sm text-gray-600">
                        Additional settings will be available here:
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-gray-600">
                        <li className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                          <span>Auto-reorder thresholds</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                          <span>Email notifications for low stock</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                          <span>Default warehouse for new stock</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                          <span>Currency and tax settings</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200/50 transform transition-all max-h-[90vh] overflow-y-auto my-auto">
            <div className="sticky top-0 bg-white px-8 pt-8 pb-4 border-b border-gray-100 z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
              </div>
            </div>
            <div className="px-8 pb-8 pt-4 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">SKU</label>
                <input
                  type="text"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                  placeholder="e.g., CCTV-001"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                  placeholder="e.g., 1080P Camera"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                >
                  {customCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__add_new__" className="font-bold text-emerald-600">+ Add New Category...</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Unit</label>
                <select
                  value={newProduct.unit}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                >
                  {customUnits.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                  <option value="__add_new__" className="font-bold text-emerald-600">+ Add New Unit...</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all resize-none"
                  rows="2"
                  placeholder="Product description..."
                />
              </div>

              {/* Initial Stock Section (Optional) */}
              <div className="pt-5 border-t-2 border-gray-100">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Warehouse className="w-4 h-4 text-emerald-600" />
                  <span>Initial Stock (Optional)</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                    <select
                      value={newProduct.initial_location_id}
                      onChange={(e) => setNewProduct({ ...newProduct, initial_location_id: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                    >
                      <option value="">Skip initial stock</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {newProduct.initial_location_id && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                        <input
                          type="number"
                          value={newProduct.initial_quantity === 0 ? '' : newProduct.initial_quantity}
                          onChange={(e) => setNewProduct({ ...newProduct, initial_quantity: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                          placeholder="0"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Unit Cost</label>
                        <input
                          type="number"
                          value={newProduct.initial_unit_cost === 0 ? '' : newProduct.initial_unit_cost}
                          onChange={(e) => setNewProduct({ ...newProduct, initial_unit_cost: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white px-8 py-4 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddProductModal(false)}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                className="px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-semibold rounded-xl hover:from-gray-800 hover:to-gray-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Warehouse/Location Modal */}
      {showAddLocationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200/50 transform transition-all max-h-[90vh] overflow-y-auto my-auto">
            <div className="sticky top-0 bg-white px-8 pt-8 pb-4 border-b border-gray-100 z-10">
              <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl">
                <Warehouse className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Add Warehouse/Location</h2>
              </div>
            </div>
            <div className="px-8 pb-8 pt-4 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Warehouse Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                  placeholder="e.g., Main Warehouse, Site Storage, Truck 01"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Code (Optional)
                </label>
                <input
                  type="text"
                  value={newLocation.code}
                  onChange={(e) => setNewLocation({ ...newLocation, code: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                  placeholder="e.g., MAIN, SITE-01, TRUCK-01"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Address (Optional)
                </label>
                <textarea
                  value={newLocation.address}
                  onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all resize-none"
                  rows="2"
                  placeholder="Warehouse address..."
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white px-8 py-4 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddLocationModal(false);
                  setNewLocation({
                    name: '',
                    code: '',
                    address: ''
                  });
                }}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLocation}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                Add Warehouse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Out Modal - Supports both pre-selected item and manual selection */}
      {showStockOutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200/50 transform transition-all max-h-[90vh] overflow-y-auto my-auto">
            <div className="sticky top-0 bg-white px-8 pt-8 pb-4 border-b border-gray-100 z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl">
                  <Minus className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Stock Out</h2>
              </div>
            </div>
            <div className="px-8 pb-8 pt-4">
            {/* Product Info - Only show if pre-selected */}
            {selectedStockItem && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Product</p>
                    <p className="font-bold text-gray-900">{selectedStockItem.product?.name}</p>
                    <p className="text-xs text-gray-600">{selectedStockItem.product?.sku}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Location</p>
                    <p className="font-bold text-gray-900">{selectedStockItem.location?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Current Stock</p>
                    <p className="font-bold text-gray-900">{selectedStockItem.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Available</p>
                    <p className="font-bold text-emerald-600">{selectedStockItem.available_quantity}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-5">
              {/* Product Selector - Only show if no pre-selected item */}
              {!selectedStockItem && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Product *</label>
                    <select
                      value={stockOutData.product_id || ''}
                      onChange={(e) => {
                        const productId = e.target.value;
                        setStockOutData({ ...stockOutData, product_id: productId, location_id: '' });
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900 transition-all"
                    >
                      <option value="">Select product...</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Warehouse *</label>
                    <select
                      value={stockOutData.location_id || ''}
                      onChange={(e) => setStockOutData({ ...stockOutData, location_id: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900 transition-all"
                    >
                      <option value="">Select warehouse...</option>
                      {/* Only show locations that have stock for the selected product */}
                      {stockOutData.product_id
                        ? items.filter(item => item.product_id === stockOutData.product_id && item.quantity > 0).map(item => (
                            <option key={item.location_id} value={item.location_id}>
                              {item.location?.name} (Available: {item.available_quantity})
                            </option>
                          ))
                        : locations.map((location) => (
                            <option key={location.id} value={location.id}>
                              {location.name}
                            </option>
                          ))
                      }
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity *</label>
                <input
                  type="number"
                  value={stockOutData.quantity === 0 ? '' : stockOutData.quantity}
                  onChange={(e) => setStockOutData({ ...stockOutData, quantity: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900 transition-all"
                  placeholder="Enter quantity"
                  min="1"
                  max={selectedStockItem?.available_quantity}
                />
                {selectedStockItem && (
                  <p className="text-xs text-gray-500 mt-1">Max: {selectedStockItem.available_quantity} units</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes <span className="text-gray-400 font-normal">(Optional)</span></label>
                <textarea
                  value={stockOutData.notes}
                  onChange={(e) => setStockOutData({ ...stockOutData, notes: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900 transition-all resize-none"
                  rows="2"
                  placeholder="e.g., Shipped to customer, Used in project..."
                />
              </div>
            </div>
            </div>
            <div className="sticky bottom-0 bg-white px-8 py-4 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowStockOutModal(false);
                  setSelectedStockItem(null);
                  setStockOutData({ quantity: 0, notes: '', product_id: '', location_id: '' });
                }}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleStockOut}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-xl hover:from-red-700 hover:to-orange-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                Stock Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock In Modal - Supports both pre-selected item and manual selection */}
      {showStockInModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-emerald-200/50 transform transition-all max-h-[90vh] overflow-y-auto my-auto">
            <div className="sticky top-0 bg-white px-8 pt-8 pb-4 border-b border-gray-100 z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Stock In</h2>
              </div>
            </div>
            <div className="px-8 pb-8 pt-4">
            {/* Product Info - Only show if pre-selected */}
            {selectedStockItem && (
              <div className={`rounded-xl p-4 mb-6 border ${selectedStockItem.isVirtual ? 'bg-purple-50 border-purple-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Product</p>
                    <p className="font-bold text-gray-900">{selectedStockItem.product?.name}</p>
                    <p className="text-xs text-gray-600">{selectedStockItem.product?.sku}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Location</p>
                    <p className={`font-bold ${selectedStockItem.isVirtual && !selectedStockItem.location_id ? 'text-purple-600' : 'text-gray-900'}`}>
                      {selectedStockItem.isVirtual && !selectedStockItem.location_id
                        ? 'Select below'
                        : selectedStockItem.location?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Current Stock</p>
                    <p className={`font-bold ${selectedStockItem.isVirtual ? 'text-purple-600' : 'text-emerald-600'}`}>
                      {selectedStockItem.quantity} {selectedStockItem.product?.unit}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-5">
              {/* Product Selector - Only show if no pre-selected item */}
              {!selectedStockItem && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product *</label>
                  <select
                    value={stockInData.product_id || ''}
                    onChange={(e) => setStockInData({ ...stockInData, product_id: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                  >
                    <option value="">Select product...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Location Selector - Show if no pre-selected item OR virtual item without location */}
              {(!selectedStockItem || (selectedStockItem?.isVirtual && !selectedStockItem?.location_id)) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Warehouse *</label>
                  <select
                    value={stockInData.location_id}
                    onChange={(e) => setStockInData({ ...stockInData, location_id: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                  >
                    <option value="">Select warehouse...</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} {location.code ? `(${location.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reference Type Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock In Type *</label>
                <select
                  value={stockInData.reference_type}
                  onChange={(e) => setStockInData({ ...stockInData, reference_type: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                >
                  <option value="manual">Manual Entry</option>
                  <option value="return">Customer Return</option>
                  <option value="refund">Supplier Refund</option>
                  <option value="adjustment">Stock Adjustment</option>
                </select>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity *</label>
                <input
                  type="number"
                  value={stockInData.quantity === 0 ? '' : stockInData.quantity}
                  onChange={(e) => setStockInData({ ...stockInData, quantity: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                  placeholder="Enter quantity to add"
                  min="0.01"
                  step="0.01"
                />
              </div>

              {/* Unit Cost Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Unit Cost <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input
                  type="number"
                  value={stockInData.unit_cost === 0 ? '' : stockInData.unit_cost}
                  onChange={(e) => setStockInData({ ...stockInData, unit_cost: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                  placeholder="Enter unit cost"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes <span className="text-gray-400 font-normal">(Optional)</span></label>
                <textarea
                  value={stockInData.notes}
                  onChange={(e) => setStockInData({ ...stockInData, notes: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all resize-none"
                  rows="2"
                  placeholder="e.g., Returned from customer, Supplier refund..."
                />
              </div>
            </div>

            </div>
            <div className="sticky bottom-0 bg-white px-8 py-4 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowStockInModal(false);
                  setSelectedStockItem(null);
                  setStockInData({ quantity: 0, unit_cost: 0, reference_type: 'manual', location_id: '', notes: '' });
                }}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleStockIn}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-cyan-600 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                <div className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Confirm Stock In</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Purchase Order Modal */}
      {showAddPOModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-gray-200/50 transform transition-all my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-8 pt-8 pb-4 border-b border-gray-100 z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Create Purchase Order</h2>
              </div>
            </div>

            <div className="px-8 pb-8 pt-4 space-y-6">
              {/* PO Basic Info */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier *</label>
                  <select
                    value={newPO.supplier_id}
                    onChange={(e) => setNewPO({ ...newPO, supplier_id: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">PO Number *</label>
                  <input
                    type="text"
                    value={newPO.po_number}
                    onChange={(e) => setNewPO({ ...newPO, po_number: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                    placeholder="e.g., PO-2025-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={newPO.expected_delivery_date}
                    onChange={(e) => setNewPO({ ...newPO, expected_delivery_date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Receiving Warehouse</label>
                  <select
                    value={newPO.location_id}
                    onChange={(e) => setNewPO({ ...newPO, location_id: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                  >
                    <option value="">Default Warehouse</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={newPO.notes}
                  onChange={(e) => setNewPO({ ...newPO, notes: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all resize-none"
                  rows="2"
                  placeholder="Additional notes for this purchase order..."
                />
              </div>

              {/* Add Items Section */}
              <div className="border-t-2 border-gray-100 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Purchase Order Items *</h3>

                {/* Add Item Form */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Product</label>
                      <select
                        value={poItemToAdd.product_id}
                        onChange={(e) => {
                          if (e.target.value === '__create_new__') {
                            setShowQuickAddProductModal(true);
                          } else {
                            setPoItemToAdd({ ...poItemToAdd, product_id: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 text-sm"
                      >
                        <option value="">Select Product</option>
                        <option value="__create_new__" className="font-semibold text-emerald-600">+ Create New Product</option>
                        <option disabled>──────────</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={poItemToAdd.quantity === 0 ? '' : poItemToAdd.quantity}
                        onChange={(e) => setPoItemToAdd({ ...poItemToAdd, quantity: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm text-gray-900"
                        placeholder="0"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Unit Cost</label>
                      <input
                        type="number"
                        value={poItemToAdd.unit_cost === 0 ? '' : poItemToAdd.unit_cost}
                        onChange={(e) => setPoItemToAdd({ ...poItemToAdd, unit_cost: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm text-gray-900"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddItemToPO}
                    className="mt-3 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-all flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item</span>
                  </button>
                </div>

                {/* Items List with Scroll */}
                {newPO.items.length > 0 ? (
                  <>
                    {/* Scrollable Items Container */}
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-2 mb-3">
                      {newPO.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-white border-2 border-gray-200 rounded-xl p-4">
                          <div className="flex-1">
                            <p className="font-bold text-gray-900">{item.product_name}</p>
                            <p className="text-sm text-gray-600">{item.product_sku}</p>
                          </div>
                          <div className="text-right mr-4">
                            <p className="text-sm text-gray-600">Qty: <span className="font-bold text-gray-900">{item.quantity}</span></p>
                            <p className="text-sm text-gray-600">Unit Cost: <span className="font-bold text-gray-900">RM {item.unit_cost.toFixed(2)}</span></p>
                          </div>
                          <div className="text-right mr-4">
                            <p className="text-xs text-gray-500">Subtotal</p>
                            <p className="text-lg font-bold text-emerald-600">RM {(item.quantity * item.unit_cost).toFixed(2)}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveItemFromPO(index)}
                            className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* Items count indicator */}
                    {newPO.items.length > 3 && (
                      <p className="text-xs text-gray-500 text-center mb-2">
                        Showing {newPO.items.length} items (scroll to see all)
                      </p>
                    )}
                    {/* Total - Always visible */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border-2 border-emerald-200 sticky bottom-0">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                          <span className="text-xs text-gray-600 ml-2">({newPO.items.length} items)</span>
                        </div>
                        <span className="text-2xl font-bold text-emerald-600">
                          RM {newPO.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No items added yet. Add at least one item to create the purchase order.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t-2 border-gray-100">
              <button
                onClick={() => {
                  setShowAddPOModal(false);
                  setNewPO({
                    supplier_id: '',
                    po_number: '',
                    expected_delivery_date: '',
                    location_id: '',
                    notes: '',
                    items: []
                  });
                  setPoItemToAdd({ product_id: '', quantity: 0, unit_cost: 0 });
                }}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePO}
                disabled={!newPO.supplier_id || !newPO.po_number || newPO.items.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Create Purchase Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg border border-gray-200/50 transform transition-all max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Add Supplier</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier Name *</label>
                <input
                  type="text"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                  placeholder="e.g., ABC Electronics"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Person</label>
                <input
                  type="text"
                  value={newSupplier.contact_person}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                  placeholder="e.g., John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                  placeholder="e.g., john@abcelectronics.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                  placeholder="e.g., +60123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <textarea
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all resize-none"
                  rows="2"
                  placeholder="Supplier address..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={newSupplier.notes}
                  onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all resize-none"
                  rows="2"
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t-2 border-gray-100">
              <button
                onClick={() => {
                  setShowAddSupplierModal(false);
                  setNewSupplier({
                    name: '',
                    contact_person: '',
                    email: '',
                    phone: '',
                    address: '',
                    notes: ''
                  });
                }}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSupplier}
                disabled={!newSupplier.name}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Add Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Product Modal (for PO) */}
      {showQuickAddProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg border border-gray-200/50 transform transition-all max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Quick Add Product</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">SKU *</label>
                <input
                  type="text"
                  value={quickProduct.sku}
                  onChange={(e) => setQuickProduct({ ...quickProduct, sku: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                  placeholder="e.g., CAM-001"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={quickProduct.name}
                  onChange={(e) => setQuickProduct({ ...quickProduct, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                  placeholder="e.g., HD Camera 1080P"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    value={quickProduct.category}
                    onChange={(e) => setQuickProduct({ ...quickProduct, category: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                  >
                    <option value="CCTV">CCTV</option>
                    <option value="Access Control">Access Control</option>
                    <option value="Networking">Networking</option>
                    <option value="Cable">Cable</option>
                    <option value="Power Supply">Power Supply</option>
                    <option value="Tools">Tools</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Unit</label>
                  <select
                    value={quickProduct.unit}
                    onChange={(e) => setQuickProduct({ ...quickProduct, unit: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                  >
                    <option value="pcs">pcs</option>
                    <option value="box">box</option>
                    <option value="meter">meter</option>
                    <option value="roll">roll</option>
                    <option value="set">set</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t-2 border-gray-100">
              <button
                onClick={() => {
                  setShowQuickAddProductModal(false);
                  setQuickProduct({
                    sku: '',
                    name: '',
                    category: 'CCTV',
                    unit: 'pcs'
                  });
                }}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickAddProduct}
                disabled={!quickProduct.sku || !quickProduct.name}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Create & Add to PO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200/50 transform transition-all max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Add New Category</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category Name *</label>
                <input
                  type="text"
                  value={newCustomCategory}
                  onChange={(e) => setNewCustomCategory(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomCategory()}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 transition-all"
                  placeholder="e.g., Smart Home, Security Systems"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t-2 border-gray-100">
              <button
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setNewCustomCategory('');
                }}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomCategory}
                disabled={!newCustomCategory.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Unit Modal */}
      {showAddUnitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200/50 transform transition-all max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Add New Unit</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Unit Name *</label>
                <input
                  type="text"
                  value={newCustomUnit}
                  onChange={(e) => setNewCustomUnit(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomUnit()}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 transition-all"
                  placeholder="e.g., kg, liter, roll"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t-2 border-gray-100">
              <button
                onClick={() => {
                  setShowAddUnitModal(false);
                  setNewCustomUnit('');
                }}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomUnit}
                disabled={!newCustomUnit.trim()}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-xl hover:from-orange-700 hover:to-red-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Add Unit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PO Detail Modal */}
      {showPODetailModal && selectedPO && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200/50 transform transition-all my-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Purchase Order Details</h2>
                  <p className="text-sm text-gray-500">{selectedPO.po_number}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPODetailModal(false);
                  setSelectedPO(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* PO Info Section */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Supplier</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedPO.supplier?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getPOStatusColor(selectedPO.status)}`}>
                      {React.createElement(getPOStatusIcon(selectedPO.status), { className: 'w-3.5 h-3.5' })}
                      <span>{getPOStatusLabel(selectedPO.status)}</span>
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Order Date</label>
                  <p className="text-gray-900">{selectedPO.order_date ? new Date(selectedPO.order_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expected Delivery</label>
                  <p className="text-gray-900">{selectedPO.expected_delivery_date ? new Date(selectedPO.expected_delivery_date).toLocaleDateString() : 'TBD'}</p>
                </div>
              </div>

              {/* Notes */}
              {selectedPO.notes && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Notes</label>
                  <p className="text-gray-700 bg-gray-50 rounded-lg p-4">{selectedPO.notes}</p>
                </div>
              )}

              {/* Items List */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">Order Items</label>
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Product</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Quantity</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Unit Cost</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedPO.items?.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-semibold text-gray-900">{item.product_name}</p>
                              <p className="text-xs text-gray-500">{item.product_sku}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-900">RM {item.unit_cost.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">RM {(item.quantity * item.unit_cost).toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gradient-to-r from-emerald-50 to-teal-50">
                        <td colSpan="3" className="px-4 py-4 text-right font-bold text-gray-900">Total Amount:</td>
                        <td className="px-4 py-4 text-right text-xl font-bold text-emerald-600">RM {(selectedPO.total_amount || 0).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status Update Section */}
              <div className="border-t-2 border-gray-200 pt-6">
                <label className="block text-sm font-bold text-gray-900 mb-3">Update Status</label>

                {/* Warning when PO is received */}
                {selectedPO.status === 'received' && (
                  <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-900">Stock Added to Inventory</p>
                        <p className="text-xs text-emerald-700 mt-1">
                          Status is locked. For returns or corrections, use Stock Out movements.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-3">
                  <button
                    onClick={() => handleUpdatePOStatus('draft')}
                    disabled={selectedPO.status === 'draft' || selectedPO.status === 'received'}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      selectedPO.status === 'draft' || selectedPO.status === 'received'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <FileText className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-xs">Draft</span>
                  </button>
                  <button
                    onClick={() => handleUpdatePOStatus('ordered')}
                    disabled={selectedPO.status === 'ordered' || selectedPO.status === 'received'}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      selectedPO.status === 'ordered' || selectedPO.status === 'received'
                        ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-xs">Ordered</span>
                  </button>
                  <button
                    onClick={() => handleUpdatePOStatus('partially_received')}
                    disabled={selectedPO.status === 'partially_received' || selectedPO.status === 'received'}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      selectedPO.status === 'partially_received' || selectedPO.status === 'received'
                        ? 'bg-yellow-100 text-yellow-400 cursor-not-allowed'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    }`}
                  >
                    <Truck className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-xs">Partial</span>
                  </button>
                  <button
                    onClick={() => handleUpdatePOStatus('received')}
                    disabled={selectedPO.status === 'received'}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      selectedPO.status === 'received'
                        ? 'bg-emerald-100 text-emerald-400 cursor-not-allowed'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-xs">Received</span>
                  </button>
                </div>
              </div>

              {/* Delivery Order Upload Section */}
              <div className="border-t-2 border-gray-200 pt-6">
                <label className="block text-sm font-bold text-gray-900 mb-3">Delivery Order (DO)</label>
                {selectedPO.delivery_order_url ? (
                  <div className="flex items-center justify-between bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="text-emerald-800 font-medium">Delivery order uploaded</span>
                    </div>
                    <a
                      href={selectedPO.delivery_order_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </a>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id="do-upload"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleUploadDO(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="do-upload"
                      className="flex items-center justify-center space-x-2 px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
                    >
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600 font-medium">Upload Delivery Order</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, JPG, PNG</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-4 flex justify-end">
              <button
                onClick={() => {
                  setShowPODetailModal(false);
                  setSelectedPO(null);
                }}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
