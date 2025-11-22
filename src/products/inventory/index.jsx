import React, { useState, useEffect, useRef } from 'react';
import { ORGANIZATION_SLUG_KEY } from '../../components/organizationSelector';
import { InventoryAPI } from './api/inventory';
import { useCurrentUser } from '../../tools/contact-management/hooks/useCurrentUser';
import { Package, Plus, Warehouse, Activity, Search, Minus, FileText, Truck, CheckCircle, Settings, Users, X, Upload, Eye, ChevronDown, Trash2 } from 'lucide-react';

// Searchable Select Component with Add New option
const SearchableSelect = ({ value, onChange, options, placeholder = 'Select...', className = '', allowAddNew = false, onAddNew = null, addNewLabel = '+ Add New...' }) => {
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

  const handleAddNew = () => {
    const newValue = search.trim();
    if (onAddNew) {
      onAddNew(newValue); // Pass search value (can be empty for modal triggers)
      if (newValue) {
        onChange(newValue); // Only set value if there's text
      }
    }
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl bg-white text-left flex items-center justify-between text-sm text-gray-900 hover:border-gray-300 transition-all"
      >
        <span className={selectedOption || value ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption ? selectedOption.label : (value || placeholder)}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-[9999] mt-1 w-full bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-visible">
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
          <div className="max-h-40 overflow-y-auto bg-white">
            {filteredOptions.map((opt) => (
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
            ))}
            {filteredOptions.length === 0 && !allowAddNew && (
              <div className="px-3 py-2 text-sm text-gray-400">No results</div>
            )}
            {allowAddNew && (
              <button
                type="button"
                onClick={handleAddNew}
                className="w-full px-3 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 font-medium border-t border-gray-100"
              >
                {search.trim() ? `+ Add "${search.trim()}"` : addNewLabel}
              </button>
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
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [customers, setCustomers] = useState([]);

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
  const [poSupplierFilter, setPoSupplierFilter] = useState('');
  const [poWarehouseFilter, setPoWarehouseFilter] = useState('');
  const [poStatusFilter, setPoStatusFilter] = useState('');
  const [poSortBy, setPoSortBy] = useState({ field: '', direction: '' });

  // Supplier filters
  const [supplierSortBy, setSupplierSortBy] = useState({ field: '', direction: '' });

  // Delivery Order (Out) states
  const [doSearchTerm, setDoSearchTerm] = useState('');
  const [doStatusFilter, setDoStatusFilter] = useState('');
  const [doCustomerFilter, setDoCustomerFilter] = useState('');
  const [doWarehouseFilter, setDoWarehouseFilter] = useState('');
  const [doSortBy, setDoSortBy] = useState({ field: '', direction: '' });
  const [showAddDOModal, setShowAddDOModal] = useState(false);
  const [showDODetailModal, setShowDODetailModal] = useState(false);
  const [selectedDO, setSelectedDO] = useState(null);
  const [showCancelDOModal, setShowCancelDOModal] = useState(false);
  const [cancelDOReason, setCancelDOReason] = useState('');
  const [newDO, setNewDO] = useState({
    customer_id: '',
    customer_name: '',
    location_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    do_number: '',
    delivery_address: '',
    notes: '',
    items: []
  });

  const [doItemToAdd, setDoItemToAdd] = useState({
    product_id: '',
    quantity: 0,
    unit_cost: 0,
    unit: 'pcs'
  });

  // Modal states for forms
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showQuickAddProductModal, setShowQuickAddProductModal] = useState(false);
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showAddPOModal, setShowAddPOModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);

  // Modal-specific error states (shown inside modals)
  const [modalError, setModalError] = useState('');
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
    base_unit: 'pcs',
    unit_conversion_factor: 1,
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
    notes: '',
    unit: '',  // Selected unit (empty = base unit)
    product_id: '',
    location_id: ''
  });

  // Stock In state for manual entries (refund, return, adjustment)
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [stockInData, setStockInData] = useState({
    quantity: 0,
    unit_cost: 0,
    reference_type: 'return',  // 'return', 'refund', 'adjustment', 'transfer_in', 'found', or custom
    location_id: '',  // For products without existing stock (virtual items)
    notes: '',
    unit: '',  // Selected unit (empty = base unit)
    product_id: ''  // For manual selection when no item pre-selected
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
    unit_cost: 0,
    unit: 'pcs'
  });

  const [newSupplier, setNewSupplier] = useState({
    // Personal Information
    first_name: '',
    last_name: '',
    // Contact Information
    phone_1: '',
    phone_2: '',
    email: '',
    // Business Information
    entity_type: 'company',
    company_name: '',
    industry: '',
    contact_person_name: '',
    contact_person_phone: '',
    // Address Information
    address_line_1: '',
    address_line_2: '',
    postal_code: '',
    state: '',
    city: '',
    // Notes
    notes: ''
  });

  const [productThresholds, setProductThresholds] = useState({}); // { productId: threshold }
  const [thresholdsSaving, setThresholdsSaving] = useState(false);

  // Custom categories and units - empty by default, each org defines their own
  const [customCategories, setCustomCategories] = useState([]);
  const [customUnits, setCustomUnits] = useState(['pcs', 'meter', 'box', 'set']);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [newCustomCategory, setNewCustomCategory] = useState('');
  const [newCustomUnit, setNewCustomUnit] = useState('');
  const [unitConversions, setUnitConversions] = useState([]);
  const [newUnitConversion, setNewUnitConversion] = useState({ to_unit: '', conversion_factor: '' }); // For Add Unit modal
  const [customStockInTypes, setCustomStockInTypes] = useState([]); // Custom stock in types added by user

  // Per-product settings
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [allProductUnits, setAllProductUnits] = useState([]);
  const [newProductUnit, setNewProductUnit] = useState({}); // { productId: { unit_name, conversion } }

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
          if (settingsRes.data.custom_categories) {
            setCustomCategories(settingsRes.data.custom_categories);
          }
          if (settingsRes.data.custom_units) {
            setCustomUnits(settingsRes.data.custom_units);
          }
        }
        // Load unit conversions
        const convRes = await InventoryAPI.getUnitConversions(organizationSlug);
        if (convRes.code === 0 && convRes.data) {
          setUnitConversions(convRes.data);
        }
        // Load product units
        const productUnitsRes = await InventoryAPI.getProductUnits(organizationSlug);
        if (productUnitsRes.code === 0 && productUnitsRes.data) {
          setAllProductUnits(productUnitsRes.data);
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

  // ESC key to close modals
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowAddProductModal(false);
        setShowAddLocationModal(false);
        setShowAddPOModal(false);
        setShowAddSupplierModal(false);
        setShowPODetailModal(false);
        setShowAddDOModal(false);
        setShowDODetailModal(false);
        setShowCancelDOModal(false);
        setModalError('');
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

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
      } else if (tab === 'delivery-orders') {
        const [doRes, productsRes, locationsRes, customersRes] = await Promise.all([
          InventoryAPI.getDeliveryOrders(organizationSlug),
          InventoryAPI.getProducts(organizationSlug),
          InventoryAPI.getLocations(organizationSlug),
          fetch(`${process.env.REACT_APP_API_BASE || ''}/api/contacts?organization_slug=${organizationSlug}`).then(r => r.json())
        ]);
        setDeliveryOrders(doRes.data || []);
        setProducts(productsRes.data || []);
        setLocations(locationsRes.data || []);
        // API returns array directly, filter for customers only
        const allContacts = Array.isArray(customersRes) ? customersRes : [];
        setCustomers(allContacts.filter(c => c.contact_type === 'customer'));
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

    // Recalculate stock status based on per-product threshold
    // Only trigger low stock if threshold is explicitly set (not null)
    // Use latest product data from products state (not the snapshot in item.product)
    const itemsWithUpdatedStatus = items.map(item => {
      const available = item.quantity - (item.reserved_quantity || 0);
      const latestProduct = products.find(p => p.id === item.product_id);
      const threshold = latestProduct?.low_stock_threshold; // null means no alert
      let status = 'normal';
      if (available === 0) {
        status = 'out_of_stock';
      } else if (threshold !== null && threshold !== undefined && available <= threshold) {
        status = 'low_stock';
      }
      return { ...item, stock_status: status, available_quantity: available, product: latestProduct || item.product };
    });

    return [...itemsWithUpdatedStatus, ...virtualItems];
  }, [items, products, locations]);

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

  const getPOStatusLabel = (status) => {
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

  const getPOStatusIcon = (status) => {
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

  const handleAddProduct = async () => {
    try {
      setModalError('');

      // Validation
      if (!newProduct.sku?.trim()) {
        setModalError('SKU is required');
        return;
      }
      if (!newProduct.name?.trim()) {
        setModalError('Product name is required');
        return;
      }

      // Create product first
      const productData = {
        sku: newProduct.sku.trim(),
        name: newProduct.name.trim(),
        category: newProduct.category,
        unit: newProduct.unit,
        base_unit: newProduct.base_unit || 'pcs',
        unit_conversion_factor: newProduct.unit_conversion_factor || 1,
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
            setModalError(`Product created, but failed to set initial stock: ${movementResult.msg}`);
            return;
          }
        } else {
          console.log('Skipping initial stock - location_id:', newProduct.initial_location_id, 'quantity:', newProduct.initial_quantity);
        }

        setShowAddProductModal(false);
        setModalError('');
        setNewProduct({
          sku: '',
          name: '',
          category: customCategories[0] || '',
          unit: 'pcs',
          base_unit: 'pcs',
          unit_conversion_factor: 1,
          description: '',
          initial_location_id: '',
          initial_quantity: 0,
          initial_unit_cost: 0
        });
        fetchData();
      } else {
        // Show error in modal
        const errorMsg = result.msg || 'Failed to create product';
        if (errorMsg.includes('duplicate') || errorMsg.includes('already exists')) {
          setModalError('A product with this SKU already exists');
        } else {
          setModalError(errorMsg);
        }
      }
    } catch (err) {
      console.error('Failed to add product:', err);
      setModalError(err.message || 'Failed to create product');
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
          category: '',
          unit: ''
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
      setModalError('');
      if (stockOutData.quantity <= 0) {
        setModalError('Invalid quantity');
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
        setModalError('Please select a product');
        return;
      }
      if (!locationId) {
        setModalError('Please select a warehouse');
        return;
      }

      // Convert quantity to base unit if a different unit was selected
      let finalQuantity = parseFloat(stockOutData.quantity);
      const currentProduct = products.find(p => p.id === productId);
      const baseUnit = currentProduct?.base_unit || 'pcs';

      if (stockOutData.unit && stockOutData.unit !== baseUnit) {
        const unitConv = allProductUnits.find(u => u.product_id === productId && u.unit_name === stockOutData.unit);
        if (unitConv) {
          finalQuantity = finalQuantity * unitConv.conversion_to_base;
        }
      }

      if (finalQuantity > maxQuantity) {
        setModalError(`Cannot stock out more than available quantity (${maxQuantity} ${baseUnit})`);
        return;
      }

      const movementData = {
        product_id: productId,
        location_id: locationId,
        movement_type: 'stock_out',
        quantity: finalQuantity,
        unit_cost: 0,
        notes: stockOutData.notes || `Stock out${stockOutData.unit && stockOutData.unit !== baseUnit ? ` (${stockOutData.quantity} ${stockOutData.unit})` : ''}`,
        created_by_individual_id: individualId
      };

      const result = await InventoryAPI.createMovement(organizationSlug, movementData);
      if (result.code === 0) {
        setShowStockOutModal(false);
        setSelectedStockItem(null);
        setModalError('');
        setStockOutData({ quantity: 0, notes: '', unit: '', product_id: '', location_id: '' });
        fetchData();
      } else {
        setModalError(result.msg || 'Failed to stock out');
      }
    } catch (err) {
      console.error('Failed to stock out:', err);
      setModalError(err.message);
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
      setModalError('');
      if (stockInData.quantity <= 0) {
        setModalError('Invalid quantity');
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
        setModalError('Please select a product');
        return;
      }
      if (!locationId) {
        setModalError('Please select a warehouse');
        return;
      }

      // Convert quantity to base unit if a different unit was selected
      let finalQuantity = parseFloat(stockInData.quantity);
      const currentProduct = products.find(p => p.id === productId);
      const baseUnit = currentProduct?.base_unit || 'pcs';

      if (stockInData.unit && stockInData.unit !== baseUnit) {
        const unitConv = allProductUnits.find(u => u.product_id === productId && u.unit_name === stockInData.unit);
        if (unitConv) {
          finalQuantity = finalQuantity * unitConv.conversion_to_base;
        }
      }

      const movementData = {
        product_id: productId,
        location_id: locationId,
        movement_type: 'stock_in',
        quantity: finalQuantity,
        unit_cost: parseFloat(stockInData.unit_cost) || 0,
        reference_type: stockInData.reference_type,
        notes: stockInData.notes || `Stock in: ${stockInData.reference_type}${stockInData.unit && stockInData.unit !== baseUnit ? ` (${stockInData.quantity} ${stockInData.unit})` : ''}`,
        created_by_individual_id: individualId
      };

      const result = await InventoryAPI.createMovement(organizationSlug, movementData);
      if (result.code === 0) {
        setShowStockInModal(false);
        setSelectedStockItem(null);
        setModalError('');
        setStockInData({ quantity: 0, unit_cost: 0, reference_type: 'return', location_id: '', notes: '', unit: '', product_id: '' });
        fetchData();
      } else {
        setModalError(result.msg || 'Failed to stock in');
      }
    } catch (err) {
      console.error('Failed to stock in:', err);
      setModalError(err.message);
    }
  };

  const handleAddLocation = async () => {
    try {
      setModalError('');
      if (!newLocation.name) {
        setModalError('Warehouse name is required');
        return;
      }

      console.log('Creating location:', newLocation);
      const result = await InventoryAPI.createLocation(organizationSlug, newLocation);
      console.log('Location creation result:', result);

      if (result.code === 0) {
        setShowAddLocationModal(false);
        setModalError('');
        setNewLocation({
          name: '',
          code: '',
          address: ''
        });
        // Reload locations
        const locationsRes = await InventoryAPI.getLocations(organizationSlug);
        setLocations(locationsRes.data || []);
      } else {
        setModalError(result.msg || 'Failed to create warehouse');
      }
    } catch (err) {
      console.error('Failed to add location:', err);
      setModalError(err.message);
    }
  };

  const handleAddItemToPO = () => {
    if (!poItemToAdd.product_id || poItemToAdd.quantity <= 0 || poItemToAdd.unit_cost <= 0) {
      setModalError('Please select a product and enter valid quantity and unit cost');
      return;
    }

    const product = products.find(p => p.id === poItemToAdd.product_id);
    if (!product) {
      setModalError('Invalid product selected');
      return;
    }
    setModalError('');

    setNewPO({
      ...newPO,
      items: [...newPO.items, {
        ...poItemToAdd,
        product_name: product.name,
        product_sku: product.sku
      }]
    });

    setPoItemToAdd({ product_id: '', quantity: 0, unit_cost: 0, unit: 'pcs' });
  };

  const handleRemoveItemFromPO = (index) => {
    setNewPO({
      ...newPO,
      items: newPO.items.filter((_, i) => i !== index)
    });
  };

  const handleCreatePO = async () => {
    try {
      setModalError('');
      if (!newPO.supplier_id || !newPO.po_number || newPO.items.length === 0) {
        setModalError('Please fill in supplier, PO number, and add at least one item');
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
      const result = await InventoryAPI.createPurchaseOrder(organizationSlug, poData, individualId);
      console.log('PO creation result:', result);

      if (result.code === 0) {
        setShowAddPOModal(false);
        setModalError('');
        setNewPO({
          supplier_id: '',
          po_number: '',
          expected_delivery_date: '',
          location_id: '',
          notes: '',
          items: []
        });
        setPoItemToAdd({ product_id: '', quantity: 0, unit_cost: 0, unit: 'pcs' });
        fetchData();
      } else {
        setModalError(result.msg || 'Failed to create purchase order');
      }
    } catch (err) {
      console.error('Failed to create PO:', err);
      setModalError(err.message);
    }
  };

  const handleAddSupplier = async () => {
    try {
      if (!organizationSlug) {
        setError('Organization not found. Please refresh the page.');
        return;
      }

      // Validation - required fields
      if (!newSupplier.first_name || !newSupplier.first_name.trim()) {
        setError('First name is required');
        return;
      }
      if (!newSupplier.last_name || !newSupplier.last_name.trim()) {
        setError('Last name is required');
        return;
      }
      if (!newSupplier.phone_1 || !newSupplier.phone_1.trim()) {
        setError('Phone 1 is required');
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

      const result = await InventoryAPI.createSupplier(organizationSlug, newSupplier);

      if (result.code === 0) {
        setShowAddSupplierModal(false);
        setNewSupplier({
          first_name: '', last_name: '', phone_1: '', phone_2: '', email: '',
          entity_type: 'company', company_name: '', industry: '',
          contact_person_name: '', contact_person_phone: '',
          address_line_1: '', address_line_2: '', postal_code: '', state: '', city: '',
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

  const handleDeleteSupplier = async (supplierId) => {
    try {
      const result = await InventoryAPI.deleteSupplier(organizationSlug, supplierId);
      if (result.code === 0) {
        fetchData();
      } else {
        setError(result.msg || 'Failed to delete supplier');
      }
    } catch (err) {
      console.error('Failed to delete supplier:', err);
      setError(err.message);
    }
  };

  const handleAddCustomCategory = async () => {
    if (!newCustomCategory.trim()) {
      setError('Category name is required');
      return;
    }
    if (customCategories.includes(newCustomCategory.trim())) {
      setError('Category already exists');
      return;
    }
    const updatedCategories = [...customCategories, newCustomCategory.trim()];
    setCustomCategories(updatedCategories);
    setNewProduct({ ...newProduct, category: newCustomCategory.trim() });
    setNewCustomCategory('');
    setShowAddCategoryModal(false);
    // Save to database
    try {
      await InventoryAPI.updateSettings(organizationSlug, { custom_categories: updatedCategories });
    } catch (err) {
      console.error('Failed to save categories:', err);
    }
  };

  const handleAddCustomUnit = async () => {
    if (!newCustomUnit.trim()) {
      setError('Unit name is required');
      return;
    }
    if (customUnits.includes(newCustomUnit.trim())) {
      setError('Unit already exists');
      return;
    }
    const unitName = newCustomUnit.trim();
    const updatedUnits = [...customUnits, unitName];
    setCustomUnits(updatedUnits);
    setNewProduct({ ...newProduct, unit: unitName });
    setNewCustomUnit('');
    setShowAddUnitModal(false);
    // Save to database
    try {
      await InventoryAPI.updateSettings(organizationSlug, { custom_units: updatedUnits });
      // If conversion is provided, save it too
      if (newUnitConversion.to_unit && newUnitConversion.conversion_factor) {
        const res = await InventoryAPI.upsertUnitConversion(organizationSlug, {
          from_unit: unitName,
          to_unit: newUnitConversion.to_unit,
          conversion_factor: parseFloat(newUnitConversion.conversion_factor)
        });
        if (res.code === 0) {
          setUnitConversions([...unitConversions, res.data]);
        }
      }
      setNewUnitConversion({ to_unit: '', conversion_factor: '' });
    } catch (err) {
      console.error('Failed to save units:', err);
    }
  };

  const handleCategoryChange = (value) => {
    setNewProduct({ ...newProduct, category: value });
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

      // Convert file to base64 data URL for storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target.result;
        // Update PO with the delivery order URL
        const result = await InventoryAPI.updatePOStatus(organizationSlug, selectedPO.id, selectedPO.status, dataUrl);
        if (result.code === 0) {
          setSelectedPO({ ...selectedPO, delivery_order_url: dataUrl });
          fetchData();
        } else {
          setError(result.msg || 'Failed to save delivery order');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to upload DO:', err);
      setError(err.message);
    }
  };

  // Create Delivery Order (Out) handler
  const handleCreateDO = async () => {
    try {
      setModalError('');

      if (!newDO.location_id) {
        setModalError('Please select a warehouse');
        return;
      }
      if (!newDO.items || newDO.items.length === 0) {
        setModalError('Please add at least one item');
        return;
      }

      // Validate all items have products and quantities
      for (const item of newDO.items) {
        if (!item.product_id) {
          setModalError('All items must have a product selected');
          return;
        }
        if (!item.quantity || item.quantity <= 0) {
          setModalError('All items must have a valid quantity');
          return;
        }
      }

      const result = await InventoryAPI.createDeliveryOrder(organizationSlug, newDO, individualId);

      if (result.code === 0) {
        setShowAddDOModal(false);
        setNewDO({
          customer_id: '',
          customer_name: '',
          location_id: '',
          order_date: new Date().toISOString().split('T')[0],
          expected_delivery_date: '',
          do_number: '',
          delivery_address: '',
          notes: '',
          items: []
        });
        setModalError('');
        fetchData();
      } else {
        setModalError(result.msg || 'Failed to create delivery order');
      }
    } catch (err) {
      console.error('Failed to create DO:', err);
      setModalError(err.message);
    }
  };

  // Update DO status handler
  const handleUpdateDOStatus = async (status) => {
    try {
      if (!selectedDO) return;

      const result = await InventoryAPI.updateDOStatus(organizationSlug, selectedDO.id, status, selectedDO.delivery_order_url);

      if (result.code === 0) {
        setSelectedDO({ ...selectedDO, status });
        fetchData();
      } else {
        setError(result.msg || 'Failed to update DO status');
      }
    } catch (err) {
      console.error('Failed to update DO status:', err);
      setError(err.message);
    }
  };

  // Cancel DO handler
  const handleCancelDO = async () => {
    try {
      if (!selectedDO || !cancelDOReason.trim()) return;

      const result = await InventoryAPI.cancelDeliveryOrder(organizationSlug, selectedDO.id, cancelDOReason.trim(), individualId);

      if (result.code === 0) {
        setSelectedDO({ ...selectedDO, status: 'cancelled', cancellation_reason: cancelDOReason.trim() });
        setShowCancelDOModal(false);
        setCancelDOReason('');
        fetchData();
      } else {
        setError(result.msg || 'Failed to cancel delivery order');
      }
    } catch (err) {
      console.error('Failed to cancel DO:', err);
      setError(err.message);
    }
  };

  return (
    <div className="inventory-product min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 m-0 p-0">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm sticky top-0 z-20">
        <div className="px-4 md:px-8 py-4 md:py-6 m-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl md:rounded-2xl blur opacity-20"></div>
                <div className="relative bg-gradient-to-br from-emerald-500 to-cyan-600 p-2 md:p-3 rounded-xl md:rounded-2xl shadow-lg">
                  <Package className="w-5 h-5 md:w-7 md:h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-gray-900 tracking-tight">Inventory Management</h1>
                <p className="text-gray-500 text-xs md:text-sm font-medium mt-0.5 tracking-wide">Stock & P/D Orders</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:flex gap-2 sm:space-x-2 sm:gap-0">
              <button
                onClick={() => setShowAddLocationModal(true)}
                className="group relative bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl flex items-center justify-center space-x-1 md:space-x-2 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md text-xs md:text-sm"
              >
                <Warehouse className="w-4 h-4" />
                <span className="font-medium hidden sm:inline">Add Warehouse</span>
                <span className="font-medium sm:hidden">Warehouse</span>
              </button>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="group relative bg-gradient-to-r from-gray-900 to-gray-800 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl flex items-center justify-center space-x-1 md:space-x-2 hover:from-gray-800 hover:to-gray-700 transition-all duration-200 shadow-md text-xs md:text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium hidden sm:inline">Add Product</span>
                <span className="font-medium sm:hidden">Product</span>
              </button>
              <button
                onClick={() => setShowAddPOModal(true)}
                className="group bg-white border-2 border-emerald-600 text-emerald-600 px-3 md:px-5 py-2 md:py-2.5 rounded-xl flex items-center justify-center space-x-1 md:space-x-2 hover:bg-emerald-600 hover:text-white transition-all duration-200 shadow-sm text-xs md:text-sm"
              >
                <FileText className="w-4 h-4" />
                <span className="font-medium hidden sm:inline">Create PO</span>
                <span className="font-medium sm:hidden">PO</span>
              </button>
              <button
                onClick={() => {
                  setNewDO({
                    customer_id: '',
                    customer_name: '',
                    location_id: locations[0]?.id || '',
                    order_date: new Date().toISOString().split('T')[0],
                    expected_delivery_date: '',
                    notes: '',
                    items: []
                  });
                  setShowAddDOModal(true);
                }}
                className="group bg-white border-2 border-blue-600 text-blue-600 px-3 md:px-5 py-2 md:py-2.5 rounded-xl flex items-center justify-center space-x-1 md:space-x-2 hover:bg-blue-600 hover:text-white transition-all duration-200 shadow-sm text-xs md:text-sm"
              >
                <Truck className="w-4 h-4" />
                <span className="font-medium hidden sm:inline">Create DO</span>
                <span className="font-medium sm:hidden">DO</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
        {/* Tabs - Sticky below header */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/70 sticky top-[88px] z-10 overflow-x-auto">
          <nav className="flex px-4 md:px-8 space-x-1 min-w-max">
              <button
                onClick={() => setTab('overview')}
                className={`relative px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
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
                className={`relative px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
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
                className={`relative px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
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
                className={`relative px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
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
                onClick={() => setTab('delivery-orders')}
                className={`relative px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  tab === 'delivery-orders'
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="relative z-10">Delivery Orders</span>
                {tab === 'delivery-orders' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"></div>
                )}
              </button>
              <button
                onClick={() => setTab('suppliers')}
                className={`relative px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
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
            </nav>
        </div>

        {/* Content - No padding for full width */}
        <div className="px-4 md:px-8 py-4 md:py-6">
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
                  <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-200/70 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <h2 className="text-lg md:text-xl font-bold text-gray-900">Stock Items</h2>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedStockItem(null);
                            setStockInData({ quantity: 1, unit_cost: 0, reference_type: 'return', location_id: '', notes: '', product_id: '' });
                            setShowStockInModal(true);
                          }}
                          className="px-3 md:px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-semibold rounded-xl hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center space-x-1 md:space-x-2 shadow-sm"
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
                          className="px-3 md:px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-semibold rounded-xl hover:from-red-600 hover:to-orange-600 transition-all flex items-center space-x-1 md:space-x-2 shadow-sm"
                        >
                          <Minus className="w-4 h-4" />
                          <span>Stock Out</span>
                        </button>
                      </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search by product name or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-900 text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <SearchableSelect
                            value={locationFilter}
                            onChange={setLocationFilter}
                            options={[
                              { value: '', label: 'All Warehouses' },
                              ...locations.map(l => ({ value: l.id, label: l.name }))
                            ]}
                            placeholder="All Warehouses"
                            className="w-36 sm:w-48"
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
                            className="w-32 sm:w-40"
                          />
                        </div>
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
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3 p-4">
                    {filteredItems.length === 0 ? (
                      <div className="flex flex-col items-center space-y-3 py-12">
                        <div className="p-4 bg-gray-100 rounded-full">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">
                          {searchTerm || locationFilter ? 'No matching inventory found' : 'No inventory data'}
                        </p>
                      </div>
                    ) : (
                      filteredItems.slice((stockPage - 1) * ITEMS_PER_PAGE, stockPage * ITEMS_PER_PAGE).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => !item.isVirtual && handleItemClick(item)}
                          className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm ${!item.isVirtual ? 'cursor-pointer active:bg-gray-50' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <p className="font-bold text-gray-900">{item.product?.name}</p>
                              <p className="text-sm text-gray-500">{item.product?.sku}</p>
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full border ${getStatusColor(item.stock_status)}`}>
                              {getStatusLabel(item.stock_status)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                            <div>
                              <span className="text-gray-500">Category:</span>
                              <span className="ml-1 text-gray-900">{item.product?.category || '-'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Warehouse:</span>
                              <span className="ml-1 text-gray-900">{item.location?.name || '-'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Qty:</span>
                              <span className="ml-1 font-semibold text-gray-900">{item.quantity} {item.product?.base_unit || item.product?.unit}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Avail:</span>
                              <span className={`ml-1 font-semibold ${item.isVirtual ? 'text-purple-600' : 'text-emerald-600'}`}>{item.available_quantity}</span>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStockItem(item);
                                setStockInData({ quantity: 1, unit_cost: 0, reference_type: 'return', location_id: '', notes: '' });
                                setShowStockInModal(true);
                              }}
                              className="px-3 py-1.5 text-sm text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center"
                            >
                              <Plus className="w-4 h-4 mr-1" /> In
                            </button>
                            {!item.isVirtual && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStockItem(item);
                                  setStockOutData({ quantity: 1, notes: '' });
                                  setShowStockOutModal(true);
                                }}
                                className="px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center"
                              >
                                <Minus className="w-4 h-4 mr-1" /> Out
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    <Pagination currentPage={stockPage} totalItems={filteredItems.length} onPageChange={setStockPage} />
                  </div>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
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
                                {item.quantity} <span className="text-gray-400 font-normal">{item.product?.base_unit || item.product?.unit}</span>
                                {item.product?.unit !== item.product?.base_unit && item.product?.unit_conversion_factor > 1 && (
                                  <span className="text-gray-400 font-normal text-xs ml-1">({(item.quantity / item.product.unit_conversion_factor).toFixed(1)} {item.product.unit})</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right flex items-center justify-end space-x-2">
                                <span className={item.isVirtual ? 'text-purple-600' : 'text-emerald-600'}>{item.available_quantity}</span>
                                <span className="text-gray-400 font-normal">{item.product?.base_unit || item.product?.unit}</span>
                                {item.product?.unit !== item.product?.base_unit && item.product?.unit_conversion_factor > 1 && (
                                  <span className="text-gray-400 font-normal text-xs">({(item.available_quantity / item.product.unit_conversion_factor).toFixed(1)} {item.product.unit})</span>
                                )}
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
                                      setStockInData({ quantity: 1, unit_cost: 0, reference_type: 'return', location_id: '', notes: '' });
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
                <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-200/70 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">Stock Movements</h2>
                </div>
                {/* Search and Filter Bar */}
                <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by product, warehouse, or notes..."
                      value={movementSearchTerm}
                      onChange={(e) => setMovementSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all text-sm"
                    />
                  </div>
                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Date From:</label>
                      <input
                        type="date"
                        value={movementDateFrom}
                        onChange={(e) => setMovementDateFrom(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">To:</label>
                      <input
                        type="date"
                        value={movementDateTo}
                        onChange={(e) => setMovementDateTo(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all text-sm"
                      />
                    </div>
                  </div>
                  {/* Dropdown Filters */}
                  <div className="grid grid-cols-2 gap-2">
                    <SearchableSelect
                      value={movementTypeFilter}
                      onChange={setMovementTypeFilter}
                      options={[
                        { value: '', label: 'All Types' },
                        { value: 'stock_in', label: 'Stock In' },
                        { value: 'stock_out', label: 'Stock Out' }
                      ]}
                      placeholder="All Types"
                      className="w-full"
                    />
                    <SearchableSelect
                      value={movementLocationFilter}
                      onChange={setMovementLocationFilter}
                      options={[
                        { value: '', label: 'All Warehouses' },
                        ...locations.map(loc => ({ value: loc.id, label: loc.name }))
                      ]}
                      placeholder="All Warehouses"
                      className="w-full"
                    />
                    <SearchableSelect
                      value={movementProductFilter}
                      onChange={setMovementProductFilter}
                      options={[
                        { value: '', label: 'All Products' },
                        ...products.map(prod => ({ value: prod.id, label: prod.name }))
                      ]}
                      placeholder="All Products"
                      className="w-full"
                    />
                    <SearchableSelect
                      value={movementUserFilter}
                      onChange={setMovementUserFilter}
                      options={[
                        { value: '', label: 'All Users' },
                        ...[...new Map(movements.filter(m => m.individual?.id).map(m => [m.individual.id, m.individual])).values()].map(user => ({ value: user.id, label: user.display_name }))
                      ]}
                      placeholder="All Users"
                      className="w-full"
                    />
                  </div>
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
                      className="w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
                <div className="hidden md:block overflow-x-auto">
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
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Unit
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
                          if (movementUserFilter && movement.created_by?.id !== movementUserFilter) return false;

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

                        const paginatedMovements = filteredMovements.slice((movementPage - 1) * ITEMS_PER_PAGE, movementPage * ITEMS_PER_PAGE);

                        // Mobile card view empty state
                        if (filteredMovements.length === 0) {
                          return (
                            <tr className="md:table-row hidden">
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
                                  {movement.product?.base_unit || movement.product?.unit || 'pcs'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {movement.created_by?.display_name || movement.created_by_name || '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {movement.notes || '-'}
                                </td>
                              </tr>
                            ))}
                            <tr><td colSpan="8" className="p-0"><Pagination currentPage={movementPage} totalItems={filteredMovements.length} onPageChange={setMovementPage} /></td></tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
                {/* Mobile Card View for Movements */}
                {(() => {
                  // Filter movements based on all filters (same logic)
                  const filteredMovements = movements.filter(movement => {
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
                    if (movementTypeFilter && movement.movement_type !== movementTypeFilter) return false;
                    if (movementLocationFilter && movement.location_id !== movementLocationFilter) return false;
                    if (movementProductFilter && movement.product_id !== movementProductFilter) return false;
                    if (movementUserFilter && movement.created_by?.id !== movementUserFilter) return false;
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
                  const paginatedMovements = filteredMovements.slice((movementPage - 1) * ITEMS_PER_PAGE, movementPage * ITEMS_PER_PAGE);

                  return (
                    <div className="md:hidden space-y-3 p-4">
                      {filteredMovements.length === 0 ? (
                        <div className="flex flex-col items-center space-y-3 py-12">
                          <div className="p-4 bg-gray-100 rounded-full">
                            <Activity className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500 font-medium">
                            {movementSearchTerm ? 'No movements match your search' : 'No movement records'}
                          </p>
                        </div>
                      ) : (
                        <>
                          {paginatedMovements.map((movement) => (
                            <div key={movement.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-bold text-gray-900">{movement.product?.name}</p>
                                  <p className="text-xs text-gray-500">{new Date(movement.occurred_at).toLocaleDateString('zh-CN')}</p>
                                </div>
                                <span className={`font-bold text-lg ${getMovementTypeColor(movement.movement_type)}`}>
                                  {movement.movement_type === 'stock_out' ? '-' : '+'}{movement.quantity}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 text-sm">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${movement.movement_type === 'stock_in' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                  {getMovementTypeLabel(movement.movement_type)}
                                </span>
                                <span className="text-gray-500">{movement.location?.name || '-'}</span>
                                {movement.notes && <span className="text-gray-400 truncate max-w-[150px]">{movement.notes}</span>}
                              </div>
                            </div>
                          ))}
                          <Pagination currentPage={movementPage} totalItems={filteredMovements.length} onPageChange={setMovementPage} />
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
              </div>
            )}

            {/* Products Tab */}
            {tab === 'products' && (
              <div>
                <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm">
                  <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-200/70 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center rounded-t-2xl">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">Product Catalog</h2>
                  </div>
                  {/* Search Bar */}
                  <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by SKU, product name, or category..."
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all text-sm"
                      />
                    </div>
                  </div>
                  {/* Mobile Card View for Products */}
                  <div className="md:hidden space-y-3 p-4">
                    {(() => {
                      let filteredProducts = products.filter(product => {
                        if (product.is_deleted) return false;
                        if (!productSearchTerm) return true;
                        const searchLower = productSearchTerm.toLowerCase();
                        return (
                          product.sku?.toLowerCase().includes(searchLower) ||
                          product.name?.toLowerCase().includes(searchLower) ||
                          product.category?.toLowerCase().includes(searchLower)
                        );
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
                          <Pagination currentPage={productPage} totalItems={filteredProducts.length} onPageChange={setProductPage} />
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
                              <tr><td colSpan="5" className="p-0"><Pagination currentPage={productPage} totalItems={filteredProducts.length} onPageChange={setProductPage} /></td></tr>
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
                <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by PO number, supplier, or product..."
                      value={poSearchTerm}
                      onChange={(e) => setPoSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">From:</label>
                      <input
                        type="date"
                        value={poDateFrom}
                        onChange={(e) => setPoDateFrom(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">To:</label>
                      <input
                        type="date"
                        value={poDateTo}
                        onChange={(e) => setPoDateTo(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all text-sm"
                      />
                    </div>
                    <SearchableSelect
                      value={poSupplierFilter}
                      onChange={setPoSupplierFilter}
                      options={[{ value: '', label: 'All Suppliers' }, ...suppliers.map(s => ({ value: s.id, label: s.name }))]}
                      placeholder="Supplier"
                      className="w-full"
                    />
                    <SearchableSelect
                      value={poWarehouseFilter}
                      onChange={setPoWarehouseFilter}
                      options={[{ value: '', label: 'All Warehouses' }, ...locations.map(l => ({ value: l.id, label: l.name }))]}
                      placeholder="Warehouse"
                      className="w-full"
                    />
                    <SearchableSelect
                      value={poStatusFilter}
                      onChange={setPoStatusFilter}
                      options={[
                        { value: '', label: 'All Status' },
                        { value: 'draft', label: 'Draft' },
                        { value: 'ordered', label: 'Ordered' },
                        { value: 'in_transit', label: 'In Transit' },
                        { value: 'received', label: 'Received' }
                      ]}
                      placeholder="Status"
                      className="w-full"
                    />
                  </div>
                  {(poDateFrom || poDateTo || poSupplierFilter || poWarehouseFilter || poStatusFilter) && (
                    <button
                      onClick={() => {
                        setPoDateFrom('');
                        setPoDateTo('');
                        setPoSupplierFilter('');
                        setPoWarehouseFilter('');
                        setPoStatusFilter('');
                      }}
                      className="w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
                {/* Mobile Card View for POs */}
                <div className="md:hidden space-y-3 p-4">
                  {(() => {
                    let filteredPOs = purchaseOrders.filter(po => {
                      if (poSearchTerm) {
                        const searchLower = poSearchTerm.toLowerCase();
                        const matchesSearch = (po.po_number?.toLowerCase().includes(searchLower) || po.supplier?.name?.toLowerCase().includes(searchLower));
                        if (!matchesSearch) return false;
                      }
                      if (poSupplierFilter && po.supplier_id !== poSupplierFilter) return false;
                      if (poWarehouseFilter && po.location_id !== poWarehouseFilter) return false;
                      if (poStatusFilter && po.status !== poStatusFilter) return false;
                      return true;
                    });

                    if (filteredPOs.length === 0) {
                      return (
                        <div className="flex flex-col items-center space-y-3 py-12">
                          <FileText className="w-12 h-12 text-gray-300" />
                          <p className="text-gray-500">{poSearchTerm ? 'No purchase orders match your search' : 'No purchase orders yet'}</p>
                        </div>
                      );
                    }

                    return filteredPOs.map((po) => {
                      const StatusIcon = getPOStatusIcon(po.status);
                      const warehouse = po.location_id ? locations.find(loc => loc.id === po.location_id) : null;
                      return (
                        <div key={po.id} onClick={() => handleOpenPODetail(po)} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm cursor-pointer active:bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-gray-900">{po.po_number}</p>
                              <p className="text-sm text-gray-600">{po.supplier?.name || 'N/A'}</p>
                            </div>
                            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold border ${getPOStatusColor(po.status)}`}>
                              <StatusIcon className="w-3 h-3" />
                              <span>{getPOStatusLabel(po.status)}</span>
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                            <div><span className="text-gray-500">Date:</span> <span className="text-gray-900">{po.order_date ? new Date(po.order_date).toLocaleDateString() : 'N/A'}</span></div>
                            <div><span className="text-gray-500">Items:</span> <span className="font-semibold text-emerald-600">{po.items?.length || 0}</span></div>
                            <div><span className="text-gray-500">Warehouse:</span> <span className="text-gray-900">{warehouse?.name || 'Default'}</span></div>
                            <div><span className="text-gray-500">Total:</span> <span className="font-bold text-gray-900">RM {(po.total_amount || 0).toFixed(2)}</span></div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                        {[
                          { field: 'po_number', label: 'PO Number', align: 'left' },
                          { field: 'supplier', label: 'Supplier', align: 'left' },
                          { field: 'order_date', label: 'Order Date', align: 'left' },
                          { field: 'expected_delivery_date', label: 'Expected Delivery', align: 'left' },
                          { field: 'warehouse', label: 'Warehouse', align: 'left' },
                          { field: 'status', label: 'Status', align: 'left' },
                          { field: 'total_amount', label: 'Total Amount', align: 'right' },
                          { field: 'items', label: 'Items', align: 'center' },
                          { field: 'created_by', label: 'Managed By', align: 'left' }
                        ].map(col => (
                          <th
                            key={col.field}
                            onClick={() => setPoSortBy(prev => ({ field: col.field, direction: prev.field === col.field && prev.direction === 'asc' ? 'desc' : 'asc' }))}
                            className={`px-6 py-4 text-${col.align} text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none`}
                          >
                            <span className="inline-flex items-center space-x-1">
                              <span>{col.label}</span>
                              {poSortBy.field === col.field && (
                                <span>{poSortBy.direction === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(() => {
                        // Filter purchase orders based on search term and date range
                        let filteredPOs = purchaseOrders.filter(po => {
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

                          // Supplier filter
                          if (poSupplierFilter && po.supplier_id !== poSupplierFilter) return false;

                          // Warehouse filter
                          if (poWarehouseFilter && po.location_id !== poWarehouseFilter) return false;

                          // Status filter
                          if (poStatusFilter && po.status !== poStatusFilter) return false;

                          // Date range filter (by order_date)
                          if (poDateFrom || poDateTo) {
                            if (!po.order_date) return false;
                            const orderDate = new Date(po.order_date);
                            orderDate.setHours(0, 0, 0, 0);
                            if (poDateFrom) {
                              const fromDate = new Date(poDateFrom);
                              fromDate.setHours(0, 0, 0, 0);
                              if (orderDate < fromDate) return false;
                            }
                            if (poDateTo) {
                              const toDate = new Date(poDateTo);
                              toDate.setHours(23, 59, 59, 999);
                              if (orderDate > toDate) return false;
                            }
                          }

                          return true;
                        });

                        // Sort
                        if (poSortBy.field) {
                          filteredPOs = [...filteredPOs].sort((a, b) => {
                            let valA, valB;
                            switch (poSortBy.field) {
                              case 'po_number': valA = a.po_number || ''; valB = b.po_number || ''; break;
                              case 'supplier': valA = a.supplier?.name || ''; valB = b.supplier?.name || ''; break;
                              case 'order_date': valA = a.order_date || ''; valB = b.order_date || ''; break;
                              case 'expected_delivery_date': valA = a.expected_delivery_date || ''; valB = b.expected_delivery_date || ''; break;
                              case 'warehouse': valA = locations.find(l => l.id === a.location_id)?.name || ''; valB = locations.find(l => l.id === b.location_id)?.name || ''; break;
                              case 'status': valA = a.status || ''; valB = b.status || ''; break;
                              case 'total_amount': valA = a.total_amount || 0; valB = b.total_amount || 0; break;
                              case 'items': valA = a.items?.length || 0; valB = b.items?.length || 0; break;
                              case 'created_by': valA = a.created_by?.display_name || ''; valB = b.created_by?.display_name || ''; break;
                              default: return 0;
                            }
                            if (typeof valA === 'number') {
                              return poSortBy.direction === 'asc' ? valA - valB : valB - valA;
                            }
                            return poSortBy.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                          });
                        }

                        if (filteredPOs.length === 0) {
                          return (
                            <tr>
                              <td colSpan="9" className="px-6 py-16 text-center">
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
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-700">{po.created_by?.display_name || '-'}</span>
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
                              if (window.confirm(`Delete supplier "${supplier.name}"?`)) {
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
                                  if (window.confirm(`Delete supplier "${supplier.name}"? This will soft-delete the contact.`)) {
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
            )}

            {/* Delivery Orders (Out) Tab */}
            {tab === 'delivery-orders' && (
              <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm">
                <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-200/70 bg-gradient-to-r from-gray-50 to-white rounded-t-2xl">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">Delivery Orders</h2>
                </div>
                {/* Filters */}
                <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50 space-y-3 relative z-20">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by DO number, customer..."
                      value={doSearchTerm}
                      onChange={(e) => setDoSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 relative z-20">
                    <SearchableSelect
                      value={doStatusFilter}
                      onChange={setDoStatusFilter}
                      options={[
                        { value: '', label: 'All Status' },
                        { value: 'draft', label: 'Draft' },
                        { value: 'confirmed', label: 'Confirmed' },
                        { value: 'dispatched', label: 'Dispatched' },
                        { value: 'delivered', label: 'Delivered' },
                        { value: 'cancelled', label: 'Cancelled' }
                      ]}
                      placeholder="Status"
                      className="w-full"
                    />
                    <SearchableSelect
                      value={doCustomerFilter}
                      onChange={setDoCustomerFilter}
                      options={[{ value: '', label: 'All Customers' }, ...customers.map(c => ({ value: c.id, label: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.company_name || 'Unknown' }))]}
                      placeholder="Customer"
                      className="w-full"
                    />
                    <SearchableSelect
                      value={doWarehouseFilter}
                      onChange={setDoWarehouseFilter}
                      options={[{ value: '', label: 'All Warehouses' }, ...locations.map(l => ({ value: l.id, label: l.name }))]}
                      placeholder="Warehouse"
                      className="w-full"
                    />
                  </div>
                  {(doStatusFilter || doCustomerFilter || doWarehouseFilter) && (
                    <button
                      onClick={() => { setDoStatusFilter(''); setDoCustomerFilter(''); setDoWarehouseFilter(''); }}
                      className="w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
                {/* Mobile Card View for DOs */}
                <div className="md:hidden space-y-3 p-4">
                  {(() => {
                    let filteredDOs = deliveryOrders.filter(d => {
                      if (doSearchTerm) {
                        const search = doSearchTerm.toLowerCase();
                        if (!d.do_number?.toLowerCase().includes(search) &&
                            !d.customer_name?.toLowerCase().includes(search) &&
                            !d.customer?.first_name?.toLowerCase().includes(search)) return false;
                      }
                      if (doStatusFilter && d.status !== doStatusFilter) return false;
                      if (doCustomerFilter && d.customer_id !== doCustomerFilter) return false;
                      if (doWarehouseFilter && d.location_id !== doWarehouseFilter) return false;
                      return true;
                    });

                    if (filteredDOs.length === 0) {
                      return (
                        <div className="flex flex-col items-center space-y-3 py-12">
                          <FileText className="w-12 h-12 text-gray-300" />
                          <p className="text-gray-500">No delivery orders yet</p>
                        </div>
                      );
                    }

                    return filteredDOs.map(d => (
                      <div key={d.id} onClick={() => { setSelectedDO(d); setShowDODetailModal(true); }} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm cursor-pointer active:bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-gray-900">{d.do_number}</p>
                            <p className="text-sm text-gray-600">{d.customer_name || `${d.customer?.first_name || ''} ${d.customer?.last_name || ''}`.trim() || '-'}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            d.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                            d.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                            d.status === 'dispatched' ? 'bg-yellow-100 text-yellow-700' :
                            d.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {d.status?.charAt(0).toUpperCase() + d.status?.slice(1)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-gray-500">Date:</span> <span className="text-gray-900">{d.order_date ? new Date(d.order_date).toLocaleDateString() : '-'}</span></div>
                          <div><span className="text-gray-500">Items:</span> <span className="font-semibold text-emerald-600">{d.items?.length || 0}</span></div>
                          <div><span className="text-gray-500">Warehouse:</span> <span className="text-gray-900">{d.location?.name || '-'}</span></div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                        {[
                          { field: 'do_number', label: 'DO Number' },
                          { field: 'customer', label: 'Customer' },
                          { field: 'order_date', label: 'Order Date' },
                          { field: 'warehouse', label: 'Warehouse' },
                          { field: 'status', label: 'Status' },
                          { field: 'items', label: 'Items' },
                          { field: 'created_by', label: 'Created By' }
                        ].map(col => (
                          <th
                            key={col.field}
                            onClick={() => setDoSortBy(prev => ({ field: col.field, direction: prev.field === col.field && prev.direction === 'asc' ? 'desc' : 'asc' }))}
                            className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                          >
                            <span className="inline-flex items-center space-x-1">
                              <span>{col.label}</span>
                              {doSortBy.field === col.field && <span>{doSortBy.direction === 'asc' ? '↑' : '↓'}</span>}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(() => {
                        let filteredDOs = deliveryOrders.filter(d => {
                          if (doSearchTerm) {
                            const search = doSearchTerm.toLowerCase();
                            if (!d.do_number?.toLowerCase().includes(search) &&
                                !d.customer_name?.toLowerCase().includes(search) &&
                                !d.customer?.first_name?.toLowerCase().includes(search) &&
                                !d.customer?.company_name?.toLowerCase().includes(search)) return false;
                          }
                          if (doStatusFilter && d.status !== doStatusFilter) return false;
                          if (doCustomerFilter && d.customer_id !== doCustomerFilter) return false;
                          if (doWarehouseFilter && d.location_id !== doWarehouseFilter) return false;
                          return true;
                        });

                        if (doSortBy.field) {
                          filteredDOs = [...filteredDOs].sort((a, b) => {
                            let valA, valB;
                            switch (doSortBy.field) {
                              case 'do_number': valA = a.do_number || ''; valB = b.do_number || ''; break;
                              case 'customer': valA = a.customer_name || a.customer?.first_name || ''; valB = b.customer_name || b.customer?.first_name || ''; break;
                              case 'order_date': valA = a.order_date || ''; valB = b.order_date || ''; break;
                              case 'warehouse': valA = a.location?.name || ''; valB = b.location?.name || ''; break;
                              case 'status': valA = a.status || ''; valB = b.status || ''; break;
                              case 'items': valA = a.items?.length || 0; valB = b.items?.length || 0; break;
                              case 'created_by': valA = a.created_by?.display_name || ''; valB = b.created_by?.display_name || ''; break;
                              default: return 0;
                            }
                            if (typeof valA === 'number') return doSortBy.direction === 'asc' ? valA - valB : valB - valA;
                            return doSortBy.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                          });
                        }

                        if (filteredDOs.length === 0) {
                          return (
                            <tr>
                              <td colSpan="7" className="px-6 py-16 text-center">
                                <div className="flex flex-col items-center space-y-3">
                                  <FileText className="w-12 h-12 text-gray-300" />
                                  <p className="text-gray-500">No delivery orders yet</p>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return filteredDOs.map(d => (
                          <tr
                            key={d.id}
                            onClick={() => { setSelectedDO(d); setShowDODetailModal(true); }}
                            className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                          >
                            <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{d.do_number}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900">{d.customer_name || `${d.customer?.first_name || ''} ${d.customer?.last_name || ''}`.trim() || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{d.order_date ? new Date(d.order_date).toLocaleDateString() : '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{d.location?.name || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                d.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                                d.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                d.status === 'dispatched' ? 'bg-yellow-100 text-yellow-700' :
                                d.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {d.status?.charAt(0).toUpperCase() + d.status?.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-sm">{d.items?.length || 0}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{d.created_by?.display_name || '-'}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </>
        )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddProductModal(false); setShowAddLocationModal(false); setShowAddPOModal(false); setShowAddSupplierModal(false); setShowPODetailModal(false); setShowAddDOModal(false); setShowDODetailModal(false); setShowCancelDOModal(false); setModalError(''); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200/50 transform transition-all max-h-[90vh] overflow-y-auto my-auto">
            <div className="sticky top-0 bg-white px-4 md:px-8 pt-4 md:pt-8 pb-4 border-b border-gray-100 z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Add New Product</h2>
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
                <SearchableSelect
                  value={newProduct.category}
                  onChange={(val) => handleCategoryChange(val)}
                  options={customCategories.map(c => ({ value: c, label: c }))}
                  placeholder="Select category..."
                  allowAddNew={true}
                  onAddNew={(newCat) => {
                    if (!customCategories.includes(newCat)) {
                      setCustomCategories([...customCategories, newCat]);
                    }
                  }}
                  addNewLabel="+ Add New Category..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Base Unit</label>
                <SearchableSelect
                  value={newProduct.base_unit}
                  onChange={(val) => setNewProduct({ ...newProduct, base_unit: val, unit: val })}
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
            <div className="sticky bottom-0 bg-white px-8 py-4 border-t border-gray-100">
              {modalError && (
                <div className="mb-3 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                  {modalError}
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => { setShowAddProductModal(false); setModalError(''); }}
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
        </div>
      )}

      {/* Add Warehouse/Location Modal */}
      {showAddLocationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddProductModal(false); setShowAddLocationModal(false); setShowAddPOModal(false); setShowAddSupplierModal(false); setShowPODetailModal(false); setShowAddDOModal(false); setShowDODetailModal(false); setShowCancelDOModal(false); setModalError(''); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200/50 transform transition-all max-h-[90vh] overflow-y-auto my-auto">
            <div className="sticky top-0 bg-white px-4 md:px-8 pt-4 md:pt-8 pb-4 border-b border-gray-100 z-10">
              <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl">
                <Warehouse className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Add Warehouse/Location</h2>
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
            <div className="sticky bottom-0 bg-white px-8 py-4 border-t border-gray-100">
              {modalError && (
                <div className="mb-3 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                  {modalError}
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddLocationModal(false);
                    setModalError('');
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
        </div>
      )}

      {/* Stock Out Modal - Supports both pre-selected item and manual selection */}
      {showStockOutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddProductModal(false); setShowAddLocationModal(false); setShowAddPOModal(false); setShowAddSupplierModal(false); setShowPODetailModal(false); setShowAddDOModal(false); setShowDODetailModal(false); setShowCancelDOModal(false); setModalError(''); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200/50 transform transition-all max-h-[90vh] overflow-y-auto my-auto">
            <div className="sticky top-0 bg-white px-4 md:px-8 pt-4 md:pt-8 pb-4 border-b border-gray-100 z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl">
                  <Minus className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Stock Out</h2>
              </div>
            </div>
            <div className="px-8 pb-8 pt-4">
            {/* Product Info - Only show if pre-selected */}
            {selectedStockItem && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* Quantity Input with Unit Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity *</label>
                {(() => {
                  const currentProductId = selectedStockItem?.product?.id || stockOutData.product_id;
                  const productUnitsForItem = currentProductId ? allProductUnits.filter(u => u.product_id === currentProductId) : [];
                  const currentProduct = products.find(p => p.id === currentProductId);
                  const baseUnit = currentProduct?.base_unit || 'pcs';

                  return (
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={stockOutData.quantity === 0 ? '' : stockOutData.quantity}
                        onChange={(e) => setStockOutData({ ...stockOutData, quantity: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900 transition-all"
                        placeholder="Enter quantity"
                        min="0.01"
                        step="0.01"
                      />
                      {productUnitsForItem.length > 0 ? (
                        <select
                          value={stockOutData.unit || baseUnit}
                          onChange={(e) => setStockOutData({ ...stockOutData, unit: e.target.value })}
                          className="w-32 px-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900"
                        >
                          <option value={baseUnit}>{baseUnit}</option>
                          {productUnitsForItem.filter(u => !u.is_base_unit).map(u => (
                            <option key={u.id} value={u.unit_name}>{u.unit_name}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-32 px-3 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 text-center">
                          {baseUnit}
                        </div>
                      )}
                    </div>
                  );
                })()}
                {stockOutData.unit && stockOutData.unit !== (selectedStockItem?.product?.base_unit || 'pcs') && (() => {
                  const currentProductId = selectedStockItem?.product?.id || stockOutData.product_id;
                  const unitConv = allProductUnits.find(u => u.product_id === currentProductId && u.unit_name === stockOutData.unit);
                  if (unitConv && stockOutData.quantity > 0) {
                    const baseQty = stockOutData.quantity * unitConv.conversion_to_base;
                    const currentProduct = products.find(p => p.id === currentProductId);
                    return (
                      <p className="text-xs text-red-600 mt-1">
                        = {baseQty} {currentProduct?.base_unit || 'pcs'} (base unit)
                      </p>
                    );
                  }
                  return null;
                })()}
                {selectedStockItem && (
                  <p className="text-xs text-gray-500 mt-1">Available: {selectedStockItem.available_quantity} {selectedStockItem.product?.base_unit || selectedStockItem.product?.unit}</p>
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
            <div className="sticky bottom-0 bg-white px-8 py-4 border-t border-gray-100">
              {modalError && (
                <div className="mb-3 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                  {modalError}
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowStockOutModal(false);
                    setSelectedStockItem(null);
                    setModalError('');
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
        </div>
      )}

      {/* Stock In Modal - Supports both pre-selected item and manual selection */}
      {showStockInModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddProductModal(false); setShowAddLocationModal(false); setShowAddPOModal(false); setShowAddSupplierModal(false); setShowPODetailModal(false); setShowAddDOModal(false); setShowDODetailModal(false); setShowCancelDOModal(false); setModalError(''); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-emerald-200/50 transform transition-all max-h-[90vh] overflow-y-auto my-auto">
            <div className="sticky top-0 bg-white px-4 md:px-8 pt-4 md:pt-8 pb-4 border-b border-gray-100 z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Stock In</h2>
              </div>
            </div>
            <div className="px-8 pb-8 pt-4">
            {/* Product Info - Only show if pre-selected */}
            {selectedStockItem && (
              <div className={`rounded-xl p-4 mb-6 border ${selectedStockItem.isVirtual ? 'bg-purple-50 border-purple-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <SearchableSelect
                  value={stockInData.reference_type}
                  onChange={(val) => setStockInData({ ...stockInData, reference_type: val })}
                  options={[
                    { value: 'return', label: 'Customer Return' },
                    { value: 'refund', label: 'Supplier Refund' },
                    { value: 'adjustment', label: 'Stock Adjustment' },
                    { value: 'transfer_in', label: 'Transfer In' },
                    { value: 'found', label: 'Found Stock' },
                    ...customStockInTypes.map(t => ({ value: t, label: t }))
                  ]}
                  placeholder="Select type..."
                  allowAddNew={true}
                  onAddNew={(newType) => {
                    if (newType && !customStockInTypes.includes(newType)) {
                      setCustomStockInTypes([...customStockInTypes, newType]);
                    }
                    if (newType) {
                      setStockInData({ ...stockInData, reference_type: newType });
                    }
                  }}
                  addNewLabel="+ Add Custom Type..."
                />
              </div>

              {/* Quantity Input with Unit Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity *</label>
                {(() => {
                  const currentProductId = selectedStockItem?.product?.id || stockInData.product_id;
                  const productUnitsForItem = currentProductId ? allProductUnits.filter(u => u.product_id === currentProductId) : [];
                  const currentProduct = products.find(p => p.id === currentProductId);
                  const baseUnit = currentProduct?.base_unit || 'pcs';

                  return (
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={stockInData.quantity === 0 ? '' : stockInData.quantity}
                        onChange={(e) => setStockInData({ ...stockInData, quantity: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                        placeholder="Enter quantity"
                        min="0.01"
                        step="0.01"
                      />
                      {productUnitsForItem.length > 0 ? (
                        <select
                          value={stockInData.unit || baseUnit}
                          onChange={(e) => setStockInData({ ...stockInData, unit: e.target.value })}
                          className="w-32 px-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900"
                        >
                          <option value={baseUnit}>{baseUnit}</option>
                          {productUnitsForItem.filter(u => !u.is_base_unit).map(u => (
                            <option key={u.id} value={u.unit_name}>{u.unit_name}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-32 px-3 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 text-center">
                          {baseUnit}
                        </div>
                      )}
                    </div>
                  );
                })()}
                {stockInData.unit && stockInData.unit !== (selectedStockItem?.product?.base_unit || 'pcs') && (() => {
                  const currentProductId = selectedStockItem?.product?.id || stockInData.product_id;
                  const unitConv = allProductUnits.find(u => u.product_id === currentProductId && u.unit_name === stockInData.unit);
                  if (unitConv && stockInData.quantity > 0) {
                    const baseQty = stockInData.quantity * unitConv.conversion_to_base;
                    const currentProduct = products.find(p => p.id === currentProductId);
                    return (
                      <p className="text-xs text-emerald-600 mt-1">
                        = {baseQty} {currentProduct?.base_unit || 'pcs'} (base unit)
                      </p>
                    );
                  }
                  return null;
                })()}
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
            <div className="sticky bottom-0 bg-white px-8 py-4 border-t border-gray-100">
              {modalError && (
                <div className="mb-3 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                  {modalError}
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowStockInModal(false);
                    setSelectedStockItem(null);
                    setModalError('');
                    setStockInData({ quantity: 0, unit_cost: 0, reference_type: 'return', location_id: '', notes: '' });
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
        </div>
      )}

      {/* Create Purchase Order Modal */}
      {showAddPOModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddProductModal(false); setShowAddLocationModal(false); setShowAddPOModal(false); setShowAddSupplierModal(false); setShowPODetailModal(false); setShowAddDOModal(false); setShowDODetailModal(false); setShowCancelDOModal(false); setModalError(''); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-gray-200/50 transform transition-all my-4 md:my-8 max-h-[95vh] md:max-h-[90vh] overflow-y-auto mx-2 md:mx-auto">
            <div className="sticky top-0 bg-white px-4 md:px-8 pt-4 md:pt-8 pb-4 border-b border-gray-100 z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Create Purchase Order</h2>
              </div>
            </div>

            <div className="px-8 pb-8 pt-4 space-y-6">
              {/* PO Basic Info */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier *</label>
                  <SearchableSelect
                    value={newPO.supplier_id}
                    onChange={(val) => setNewPO({ ...newPO, supplier_id: val })}
                    options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                    placeholder="Select supplier..."
                  />
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Receiving Warehouse *</label>
                  <SearchableSelect
                    value={newPO.location_id}
                    onChange={(val) => setNewPO({ ...newPO, location_id: val })}
                    options={locations.map(l => ({ value: l.id, label: l.name }))}
                    placeholder="Select warehouse..."
                  />
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
                  <div className="grid grid-cols-2 md:grid-cols-12 gap-3">
                    <div className="col-span-2 md:col-span-4">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Product</label>
                      <SearchableSelect
                        value={poItemToAdd.product_id}
                        onChange={(val) => {
                          const selectedProduct = products.find(p => p.id === val);
                          setPoItemToAdd({
                            ...poItemToAdd,
                            product_id: val,
                            unit: selectedProduct?.base_unit || selectedProduct?.unit || 'pcs'
                          });
                        }}
                        options={products.filter(p => !p.is_deleted).map(p => ({
                          value: p.id,
                          label: `${p.name} (${p.sku})`
                        }))}
                        placeholder="Select product..."
                        allowAddNew={true}
                        onAddNew={() => setShowQuickAddProductModal(true)}
                        addNewLabel="+ Create New Product"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
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
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">UOM</label>
                      {(() => {
                        const selectedProduct = products.find(p => p.id === poItemToAdd.product_id);
                        const productUnitsForPO = poItemToAdd.product_id
                          ? allProductUnits.filter(u => u.product_id === poItemToAdd.product_id)
                          : [];
                        const baseUnit = selectedProduct?.base_unit || 'pcs';
                        const availableUnits = [
                          baseUnit,
                          ...productUnitsForPO.map(u => u.unit_name).filter(u => u !== baseUnit)
                        ];
                        return (
                          <select
                            value={poItemToAdd.unit || baseUnit}
                            onChange={(e) => setPoItemToAdd({ ...poItemToAdd, unit: e.target.value })}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm text-gray-900"
                            disabled={!poItemToAdd.product_id}
                          >
                            {availableUnits.map((unit) => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        );
                      })()}
                    </div>
                    <div className="col-span-1 md:col-span-2">
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
                    <div className="col-span-1 md:col-span-2 flex items-end">
                      <button
                        onClick={handleAddItemToPO}
                        className="w-full px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-all flex items-center justify-center space-x-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden md:inline">Add Item</span>
                        <span className="md:hidden">Add</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items List with Scroll */}
                {newPO.items.length > 0 ? (
                  <>
                    {/* Scrollable Items Container */}
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-2 mb-3">
                      {newPO.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-white border-2 border-gray-200 rounded-xl p-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">{item.product_name}</p>
                            <p className="text-xs text-gray-500">{item.product_sku}</p>
                          </div>
                          <div className="text-center px-3">
                            <p className="text-xs text-gray-500">Qty</p>
                            <p className="font-bold text-gray-900">{item.quantity} {item.unit || 'pcs'}</p>
                          </div>
                          <div className="text-center px-3">
                            <p className="text-xs text-gray-500">Unit Cost</p>
                            <p className="font-bold text-gray-900">RM {item.unit_cost.toFixed(2)}</p>
                          </div>
                          <div className="text-right px-3">
                            <p className="text-xs text-gray-500">Subtotal</p>
                            <p className="font-bold text-emerald-600">RM {(item.quantity * item.unit_cost).toFixed(2)}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveItemFromPO(index)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
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

            <div className="mt-8 pt-6 pb-6 border-t-2 border-gray-100">
              {modalError && (
                <div className="mb-3 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                  {modalError}
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddPOModal(false);
                    setModalError('');
                    setNewPO({
                      supplier_id: '',
                      po_number: '',
                      expected_delivery_date: '',
                      location_id: '',
                      notes: '',
                      items: []
                    });
                    setPoItemToAdd({ product_id: '', quantity: 0, unit_cost: 0, unit: 'pcs' });
                  }}
                  className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePO}
                  disabled={!newPO.supplier_id || !newPO.po_number || !newPO.location_id || newPO.items.length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Create Purchase Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddProductModal(false); setShowAddLocationModal(false); setShowAddPOModal(false); setShowAddSupplierModal(false); setShowPODetailModal(false); setShowAddDOModal(false); setShowDODetailModal(false); setShowCancelDOModal(false); setModalError(''); } }}>
          <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-8 w-full max-w-2xl border border-gray-200/50 transform transition-all max-h-[95vh] md:max-h-[90vh] overflow-y-auto my-auto mx-2 md:mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Add Supplier</h2>
              </div>
              <button
                onClick={() => setShowAddSupplierModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      value={newSupplier.first_name}
                      onChange={(e) => setNewSupplier({ ...newSupplier, first_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      value={newSupplier.last_name}
                      onChange={(e) => setNewSupplier({ ...newSupplier, last_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                      placeholder="Doe"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone 1 *</label>
                    <input
                      type="tel"
                      value={newSupplier.phone_1}
                      onChange={(e) => setNewSupplier({ ...newSupplier, phone_1: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                      placeholder="+60 12-345 6789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone 2</label>
                    <input
                      type="tel"
                      value={newSupplier.phone_2}
                      onChange={(e) => setNewSupplier({ ...newSupplier, phone_2: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                      placeholder="+60 3-1234 5678"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Business Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Entity Type</label>
                    <select
                      value={newSupplier.entity_type}
                      onChange={(e) => setNewSupplier({ ...newSupplier, entity_type: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                    >
                      <option value="individual">Individual</option>
                      <option value="company">Company</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={newSupplier.company_name}
                      onChange={(e) => setNewSupplier({ ...newSupplier, company_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                      placeholder="Acme Inc."
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Industry</label>
                  <input
                    type="text"
                    value={newSupplier.industry}
                    onChange={(e) => setNewSupplier({ ...newSupplier, industry: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                    placeholder="e.g., Technology, Finance, Manufacturing"
                  />
                </div>
                {newSupplier.entity_type === 'company' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Person Name</label>
                      <input
                        type="text"
                        value={newSupplier.contact_person_name}
                        onChange={(e) => setNewSupplier({ ...newSupplier, contact_person_name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                        placeholder="Contact person"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Person Phone</label>
                      <input
                        type="tel"
                        value={newSupplier.contact_person_phone}
                        onChange={(e) => setNewSupplier({ ...newSupplier, contact_person_phone: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                        placeholder="Contact phone"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Address Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 1</label>
                    <input
                      type="text"
                      value={newSupplier.address_line_1}
                      onChange={(e) => setNewSupplier({ ...newSupplier, address_line_1: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                      placeholder="Street address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 2</label>
                    <input
                      type="text"
                      value={newSupplier.address_line_2}
                      onChange={(e) => setNewSupplier({ ...newSupplier, address_line_2: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                      placeholder="Apartment, Suite, etc. (optional)"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code</label>
                      <input
                        type="text"
                        value={newSupplier.postal_code}
                        onChange={(e) => setNewSupplier({ ...newSupplier, postal_code: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                        placeholder="50000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                      <select
                        value={newSupplier.state}
                        onChange={(e) => setNewSupplier({ ...newSupplier, state: e.target.value, city: '' })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                      >
                        <option value="">Select state...</option>
                        <optgroup label="States">
                          <option value="Johor">Johor</option>
                          <option value="Kedah">Kedah</option>
                          <option value="Kelantan">Kelantan</option>
                          <option value="Melaka">Melaka</option>
                          <option value="Negeri Sembilan">Negeri Sembilan</option>
                          <option value="Pahang">Pahang</option>
                          <option value="Penang">Penang</option>
                          <option value="Perak">Perak</option>
                          <option value="Perlis">Perlis</option>
                          <option value="Sabah">Sabah</option>
                          <option value="Sarawak">Sarawak</option>
                          <option value="Selangor">Selangor</option>
                          <option value="Terengganu">Terengganu</option>
                        </optgroup>
                        <optgroup label="Federal Territories">
                          <option value="Kuala Lumpur">Kuala Lumpur</option>
                          <option value="Labuan">Labuan</option>
                          <option value="Putrajaya">Putrajaya</option>
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        value={newSupplier.city}
                        onChange={(e) => setNewSupplier({ ...newSupplier, city: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                        placeholder="City"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
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
                    first_name: '', last_name: '', phone_1: '', phone_2: '', email: '',
                    entity_type: 'company', company_name: '', industry: '',
                    contact_person_name: '', contact_person_phone: '',
                    address_line_1: '', address_line_2: '', postal_code: '', state: '', city: '',
                    notes: ''
                  });
                }}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSupplier}
                disabled={!newSupplier.first_name || !newSupplier.last_name || !newSupplier.phone_1}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) { setShowQuickAddProductModal(false); setModalError(''); } }}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg border border-gray-200/50 transform transition-all max-h-[90vh] overflow-visible my-auto">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Quick Add Product</h2>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <SearchableSelect
                    value={quickProduct.category}
                    onChange={(val) => setQuickProduct({ ...quickProduct, category: val })}
                    options={customCategories.map(cat => ({ value: cat, label: cat }))}
                    placeholder="Select category..."
                    allowAddNew={true}
                    onAddNew={(newCat) => {
                      if (newCat && !customCategories.includes(newCat)) {
                        setCustomCategories([...customCategories, newCat]);
                      }
                    }}
                    addNewLabel="+ Add new category..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Unit</label>
                  <SearchableSelect
                    value={quickProduct.unit}
                    onChange={(val) => setQuickProduct({ ...quickProduct, unit: val })}
                    options={customUnits.map(u => ({ value: u, label: u }))}
                    placeholder="Select unit..."
                    allowAddNew={true}
                    onAddNew={(newUnit) => {
                      if (newUnit && !customUnits.includes(newUnit)) {
                        setCustomUnits([...customUnits, newUnit]);
                      }
                    }}
                    addNewLabel="+ Add new unit..."
                  />
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
                    category: '',
                    unit: ''
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddProductModal(false); setShowAddLocationModal(false); setShowAddPOModal(false); setShowAddSupplierModal(false); setShowPODetailModal(false); setShowAddDOModal(false); setShowDODetailModal(false); setShowCancelDOModal(false); setModalError(''); } }}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200/50 transform transition-all max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Add New Category</h2>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddProductModal(false); setShowAddLocationModal(false); setShowAddPOModal(false); setShowAddSupplierModal(false); setShowPODetailModal(false); setShowAddDOModal(false); setShowDODetailModal(false); setShowCancelDOModal(false); setModalError(''); } }}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200/50 transform transition-all max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Add New Unit</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Unit Name *</label>
                <input
                  type="text"
                  value={newCustomUnit}
                  onChange={(e) => setNewCustomUnit(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomUnit()}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 transition-all placeholder:text-gray-400"
                  placeholder="e.g., box, carton, roll"
                  autoFocus
                />
              </div>

              {/* Optional Unit Conversion */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Unit Conversion (Optional)</label>
                <p className="text-xs text-gray-500 mb-3">Define how this unit converts to another unit</p>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 whitespace-nowrap">1 {newCustomUnit || 'unit'} =</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newUnitConversion.conversion_factor}
                    onChange={(e) => setNewUnitConversion({ ...newUnitConversion, conversion_factor: e.target.value })}
                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center text-gray-900 bg-white placeholder:text-gray-400"
                    placeholder="12"
                  />
                  <select
                    value={newUnitConversion.to_unit}
                    onChange={(e) => setNewUnitConversion({ ...newUnitConversion, to_unit: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white"
                  >
                    <option value="">Select unit...</option>
                    {customUnits.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t-2 border-gray-100">
              <button
                onClick={() => {
                  setShowAddUnitModal(false);
                  setNewCustomUnit('');
                  setNewUnitConversion({ to_unit: '', conversion_factor: '' });
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddProductModal(false); setShowAddLocationModal(false); setShowAddPOModal(false); setShowAddSupplierModal(false); setShowPODetailModal(false); setShowAddDOModal(false); setShowDODetailModal(false); setShowCancelDOModal(false); setModalError(''); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto border border-gray-200/50 transform transition-all my-auto mx-2 md:mx-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-8 py-4 md:py-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">Purchase Order Details</h2>
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

            <div className="p-4 md:p-8 space-y-4 md:space-y-6">
              {/* PO Info Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
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
                  {selectedPO.status !== 'received' ? (
                    <input
                      type="date"
                      value={selectedPO.expected_delivery_date || ''}
                      onChange={async (e) => {
                        const newDate = e.target.value;
                        try {
                          await InventoryAPI.updatePO(organizationSlug, selectedPO.id, { expected_delivery_date: newDate || null });
                          setSelectedPO({ ...selectedPO, expected_delivery_date: newDate || null });
                          await fetchData();
                        } catch (err) {
                          console.error('Failed to update expected delivery date:', err);
                        }
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{selectedPO.expected_delivery_date ? new Date(selectedPO.expected_delivery_date).toLocaleDateString() : 'TBD'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Managed By</label>
                  <p className="text-gray-900">{selectedPO.created_by?.display_name || '-'}</p>
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
                    onClick={() => handleUpdatePOStatus('in_transit')}
                    disabled={selectedPO.status === 'in_transit' || selectedPO.status === 'received'}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      selectedPO.status === 'in_transit' || selectedPO.status === 'received'
                        ? 'bg-yellow-100 text-yellow-400 cursor-not-allowed'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    }`}
                  >
                    <Truck className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-xs">In Transit</span>
                  </button>
                  <button
                    onClick={() => handleUpdatePOStatus('received')}
                    disabled={selectedPO.status === 'received' || !selectedPO.delivery_order_url}
                    title={!selectedPO.delivery_order_url && selectedPO.status !== 'received' ? 'Upload Delivery Order first' : ''}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      selectedPO.status === 'received'
                        ? 'bg-emerald-100 text-emerald-400 cursor-not-allowed'
                        : !selectedPO.delivery_order_url
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-xs">Received</span>
                    {!selectedPO.delivery_order_url && selectedPO.status !== 'received' && (
                      <span className="block text-[10px] text-gray-400">Upload DO first</span>
                    )}
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
                    <button
                      onClick={() => {
                        const url = selectedPO.delivery_order_url;
                        if (url.startsWith('data:')) {
                          // For base64 data URLs, create a blob and open
                          const byteString = atob(url.split(',')[1]);
                          const mimeType = url.split(',')[0].split(':')[1].split(';')[0];
                          const ab = new ArrayBuffer(byteString.length);
                          const ia = new Uint8Array(ab);
                          for (let i = 0; i < byteString.length; i++) {
                            ia[i] = byteString.charCodeAt(i);
                          }
                          const blob = new Blob([ab], { type: mimeType });
                          const blobUrl = URL.createObjectURL(blob);
                          window.open(blobUrl, '_blank');
                        } else {
                          window.open(url, '_blank');
                        }
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
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
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 md:px-8 py-4 flex flex-col-reverse sm:flex-row gap-2 sm:justify-between">
              {selectedPO.status !== 'received' ? (
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this purchase order? This action cannot be undone.')) {
                      try {
                        await InventoryAPI.deletePurchaseOrder(organizationSlug, selectedPO.id);
                        setShowPODetailModal(false);
                        setSelectedPO(null);
                        await fetchData();
                      } catch (err) {
                        alert(err.message || 'Failed to delete purchase order');
                      }
                    }
                  }}
                  className="px-6 py-2.5 bg-red-100 text-red-700 font-semibold rounded-xl hover:bg-red-200 transition-all flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              ) : (
                <div />
              )}
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

      {/* Create Delivery Order Modal */}
      {showAddDOModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddProductModal(false); setShowAddLocationModal(false); setShowAddPOModal(false); setShowAddSupplierModal(false); setShowPODetailModal(false); setShowAddDOModal(false); setShowDODetailModal(false); setShowCancelDOModal(false); setModalError(''); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-gray-200/50 transform transition-all my-4 md:my-8 max-h-[95vh] md:max-h-[90vh] overflow-y-auto mx-2 md:mx-auto">
            <div className="sticky top-0 bg-white px-4 md:px-8 pt-4 md:pt-8 pb-4 border-b border-gray-100 z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Create Delivery Order</h2>
              </div>
            </div>

            <div className="px-8 pb-8 pt-4 space-y-6">
              {/* DO Basic Info */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Customer *</label>
                  <SearchableSelect
                    value={newDO.customer_id}
                    onChange={(val) => {
                      const selectedCustomer = customers.find(c => c.id === val);
                      const customerName = selectedCustomer ? `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim() : '';
                      // Build full address from address_line_1, address_line_2, postal_code, city, state
                      const addressParts = [
                        selectedCustomer?.address_line_1,
                        selectedCustomer?.address_line_2,
                        selectedCustomer?.postal_code,
                        selectedCustomer?.city,
                        selectedCustomer?.state
                      ].filter(Boolean);
                      const customerAddress = addressParts.join(', ') || '';
                      setNewDO({ ...newDO, customer_id: val, customer_name: customerName, delivery_address: customerAddress });
                    }}
                    options={customers.map(c => ({ value: c.id, label: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.company_name || 'Unknown' }))}
                    placeholder="Select customer..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">DO Number</label>
                  <input
                    type="text"
                    value={newDO.do_number}
                    onChange={(e) => setNewDO({ ...newDO, do_number: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Source Warehouse *</label>
                  <SearchableSelect
                    value={newDO.location_id}
                    onChange={(val) => setNewDO({ ...newDO, location_id: val })}
                    options={locations.map(l => ({ value: l.id, label: l.name }))}
                    placeholder="Select warehouse..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={newDO.expected_delivery_date}
                    onChange={(e) => setNewDO({ ...newDO, expected_delivery_date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Address *</label>
                <textarea
                  value={newDO.delivery_address}
                  onChange={(e) => setNewDO({ ...newDO, delivery_address: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all resize-none"
                  rows="2"
                  placeholder="Delivery address (auto-filled from customer)"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={newDO.notes}
                  onChange={(e) => setNewDO({ ...newDO, notes: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all resize-none"
                  rows="2"
                  placeholder="Additional notes for this delivery order..."
                />
              </div>

              {/* Add Items Section */}
              <div className="border-t-2 border-gray-100 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Delivery Order Items *</h3>

                {/* Add Item Form */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-12 gap-3">
                    <div className="col-span-2 md:col-span-6">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Product</label>
                      <SearchableSelect
                        value={doItemToAdd.product_id}
                        onChange={(val) => {
                          const selectedProduct = products.find(p => p.id === val);
                          setDoItemToAdd({
                            ...doItemToAdd,
                            product_id: val,
                            unit: selectedProduct?.base_unit || selectedProduct?.unit || 'pcs'
                          });
                        }}
                        options={products.filter(p => !p.is_deleted).map(p => ({
                          value: p.id,
                          label: `${p.name} (${p.sku})`
                        }))}
                        placeholder="Select product..."
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={doItemToAdd.quantity === 0 ? '' : doItemToAdd.quantity}
                        onChange={(e) => setDoItemToAdd({ ...doItemToAdd, quantity: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm text-gray-900"
                        placeholder="0"
                        min="1"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">UOM</label>
                      {(() => {
                        const selectedProduct = products.find(p => p.id === doItemToAdd.product_id);
                        const productUnitsForDO = doItemToAdd.product_id
                          ? allProductUnits.filter(u => u.product_id === doItemToAdd.product_id)
                          : [];
                        const baseUnit = selectedProduct?.base_unit || 'pcs';
                        const availableUnits = [
                          baseUnit,
                          ...productUnitsForDO.map(u => u.unit_name).filter(u => u !== baseUnit)
                        ];
                        return (
                          <select
                            value={doItemToAdd.unit || baseUnit}
                            onChange={(e) => setDoItemToAdd({ ...doItemToAdd, unit: e.target.value })}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm text-gray-900"
                            disabled={!doItemToAdd.product_id}
                          >
                            {availableUnits.map((unit) => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        );
                      })()}
                    </div>
                    <div className="col-span-2 md:col-span-2 flex items-end">
                      {(() => {
                        const stockItem = items.find(i => i.product_id === doItemToAdd.product_id && i.location_id === newDO.location_id);
                        const availableQty = stockItem?.quantity || 0;
                        // Calculate already added qty for same product
                        const alreadyAddedQty = newDO.items.filter(i => i.product_id === doItemToAdd.product_id).reduce((sum, i) => sum + (i.quantity || 0), 0);
                        const remainingQty = availableQty - alreadyAddedQty;
                        const isInsufficientStock = doItemToAdd.product_id && newDO.location_id && doItemToAdd.quantity > remainingQty;

                        return (
                          <button
                            onClick={() => {
                              if (!doItemToAdd.product_id || !doItemToAdd.quantity || isInsufficientStock) return;
                              const product = products.find(p => p.id === doItemToAdd.product_id);
                              setNewDO({
                                ...newDO,
                                items: [...newDO.items, {
                                  product_id: doItemToAdd.product_id,
                                  product_name: product?.name || '',
                                  product_sku: product?.sku || '',
                                  quantity: doItemToAdd.quantity,
                                  unit: doItemToAdd.unit || product?.base_unit || 'pcs'
                                }]
                              });
                              setDoItemToAdd({ product_id: '', quantity: 0, unit_cost: 0, unit: 'pcs' });
                            }}
                            disabled={!doItemToAdd.product_id || !doItemToAdd.quantity || isInsufficientStock}
                            className="w-full px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-all flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4" />
                            <span className="hidden md:inline">Add Item</span>
                            <span className="md:hidden">Add</span>
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                  {doItemToAdd.product_id && newDO.location_id && (() => {
                    const stockItem = items.find(i => i.product_id === doItemToAdd.product_id && i.location_id === newDO.location_id);
                    const availableQty = stockItem?.quantity || 0;
                    const alreadyAddedQty = newDO.items.filter(i => i.product_id === doItemToAdd.product_id).reduce((sum, i) => sum + (i.quantity || 0), 0);
                    const remainingQty = availableQty - alreadyAddedQty;
                    const isInsufficient = doItemToAdd.quantity > remainingQty;
                    return (
                      <p className={`text-xs mt-2 ${isInsufficient ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        Available: {remainingQty} in stock {alreadyAddedQty > 0 ? `(${alreadyAddedQty} already added)` : ''}
                        {isInsufficient && ' - Insufficient stock!'}
                      </p>
                    );
                  })()}
                </div>

                {/* Items List with Scroll */}
                {newDO.items.length > 0 ? (
                  <>
                    {/* Scrollable Items Container */}
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-2 mb-3">
                      {newDO.items.map((item, index) => {
                        const stockItem = items.find(i => i.product_id === item.product_id && i.location_id === newDO.location_id);
                        const availableQty = stockItem?.quantity || 0;
                        const isOverStock = item.quantity > availableQty;
                        return (
                          <div key={index} className={`flex items-center justify-between border-2 rounded-xl p-3 ${isOverStock ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 truncate">{item.product_name}</p>
                              <p className="text-xs text-gray-500">{item.product_sku}</p>
                              {isOverStock && <p className="text-xs text-red-600">Exceeds available stock ({availableQty})</p>}
                            </div>
                            <div className="text-center px-4">
                              <p className="text-xs text-gray-500">Quantity</p>
                              <p className="font-bold text-gray-900">{item.quantity} {item.unit || 'pcs'}</p>
                            </div>
                            <button
                              onClick={() => setNewDO({ ...newDO, items: newDO.items.filter((_, i) => i !== index) })}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {/* Items count indicator */}
                    {newDO.items.length > 3 && (
                      <p className="text-xs text-gray-500 text-center mb-2">
                        Showing {newDO.items.length} items (scroll to see all)
                      </p>
                    )}
                    {/* Total Items Summary */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border-2 border-emerald-200 sticky bottom-0">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Total Items:</span>
                        <span className="text-2xl font-bold text-emerald-600">{newDO.items.length}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Truck className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No items added yet. Add at least one item to create the delivery order.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-8 pb-8">
              {modalError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{modalError}</p>
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => { setShowAddDOModal(false); setModalError(''); setDoItemToAdd({ product_id: '', quantity: 0, unit_cost: 0, unit: 'pcs' }); }}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDO}
                  disabled={!newDO.customer_id || !newDO.location_id || !newDO.delivery_address?.trim() || newDO.items.length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  Create Delivery Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel DO Confirmation Modal */}
      {showCancelDOModal && selectedDO && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowCancelDOModal(false); setCancelDOReason(''); } }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <X className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Cancel Delivery Order</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to cancel <span className="font-semibold">{selectedDO.do_number}</span>?
                {(selectedDO.status === 'confirmed' || selectedDO.status === 'dispatched') && (
                  <span className="block mt-2 text-amber-600 font-medium">Stock will be restored to inventory.</span>
                )}
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Reason *</label>
                <textarea
                  value={cancelDOReason}
                  onChange={(e) => setCancelDOReason(e.target.value)}
                  placeholder="Enter reason for cancellation..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white"
                  rows={3}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => { setShowCancelDOModal(false); setCancelDOReason(''); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Go Back
                </button>
                <button
                  onClick={handleCancelDO}
                  disabled={!cancelDOReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DO Detail Modal */}
      {showDODetailModal && selectedDO && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddProductModal(false); setShowAddLocationModal(false); setShowAddPOModal(false); setShowAddSupplierModal(false); setShowPODetailModal(false); setShowAddDOModal(false); setShowDODetailModal(false); setShowCancelDOModal(false); setModalError(''); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200/50 my-auto">
            <div className="sticky top-0 bg-white px-8 pt-8 pb-4 border-b border-gray-100 z-10 flex justify-between items-center">
              <div><h2 className="text-xl md:text-2xl font-bold text-gray-900">Delivery Order Details</h2><p className="text-sm text-gray-500">{selectedDO.do_number}</p></div>
              <button onClick={() => { setShowDODetailModal(false); setSelectedDO(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="px-8 pb-8 pt-4 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Customer</label><p className="text-gray-900">{selectedDO.customer_name || '-'}</p></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Warehouse</label><p className="text-gray-900">{selectedDO.location?.name || '-'}</p></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Delivery Address</label><p className="text-gray-900">{selectedDO.delivery_address || '-'}</p></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Created By</label><p className="text-gray-900">{selectedDO.created_by?.display_name || '-'}</p></div>
              </div>

              {/* Order Items - PO Style */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">Order Items</label>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Product</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedDO.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{item.product?.name || '-'}</div>
                            <div className="text-xs text-gray-500">{item.product?.sku || item.product?.code || '-'}</div>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-center text-gray-600">{item.unit || 'pcs'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-emerald-50 border-t border-emerald-200">
                      <tr>
                        <td className="px-4 py-3 font-bold text-gray-900">Total Items:</td>
                        <td className="px-4 py-3 text-center text-lg font-bold text-emerald-600">{selectedDO.items?.reduce((sum, item) => sum + (item.quantity || 0), 0)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Update Status - PO Style */}
              <div className="border-t pt-4">
                <label className="block text-sm font-bold text-gray-900 mb-3">Update Status</label>
                {selectedDO.status === 'delivered' ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center space-x-2 text-emerald-700">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Stock Deducted from Inventory</span>
                    </div>
                    <p className="text-sm text-emerald-600 mt-1">Status is locked. For returns or corrections, use Stock In movements.</p>
                  </div>
                ) : null}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => selectedDO.status !== 'draft' ? null : null}
                    disabled={true}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      selectedDO.status === 'draft' ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 border-gray-200 opacity-50'
                    }`}
                  >
                    <FileText className="w-5 h-5 text-gray-500 mb-1" />
                    <span className="text-xs font-medium text-gray-600">Draft</span>
                  </button>
                  <button
                    onClick={() => selectedDO.status === 'draft' && selectedDO.delivery_order_url ? handleUpdateDOStatus('confirmed') : null}
                    disabled={selectedDO.status !== 'draft' || !selectedDO.delivery_order_url}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      selectedDO.status === 'confirmed' ? 'bg-blue-100 border-blue-300' :
                      selectedDO.status === 'draft' && selectedDO.delivery_order_url ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 cursor-pointer' :
                      'bg-gray-50 border-gray-200 opacity-50'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5 text-blue-500 mb-1" />
                    <span className="text-xs font-medium text-blue-600">Confirmed</span>
                  </button>
                  <button
                    onClick={() => selectedDO.status === 'confirmed' ? handleUpdateDOStatus('dispatched') : null}
                    disabled={selectedDO.status !== 'confirmed'}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      selectedDO.status === 'dispatched' ? 'bg-yellow-100 border-yellow-300' :
                      selectedDO.status === 'confirmed' ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 cursor-pointer' :
                      'bg-gray-50 border-gray-200 opacity-50'
                    }`}
                  >
                    <Truck className="w-5 h-5 text-yellow-600 mb-1" />
                    <span className="text-xs font-medium text-yellow-700">Dispatched</span>
                  </button>
                  <button
                    onClick={() => selectedDO.status === 'dispatched' ? handleUpdateDOStatus('delivered') : null}
                    disabled={selectedDO.status !== 'dispatched'}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      selectedDO.status === 'delivered' ? 'bg-emerald-100 border-emerald-300' :
                      selectedDO.status === 'dispatched' ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 cursor-pointer' :
                      'bg-gray-50 border-gray-200 opacity-50'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5 text-emerald-500 mb-1" />
                    <span className="text-xs font-medium text-emerald-600">Delivered</span>
                  </button>
                </div>
              </div>

              {/* Cancel Button - Show only if not delivered or already cancelled */}
              {selectedDO.status !== 'delivered' && selectedDO.status !== 'cancelled' && (
                <div className="border-t pt-4">
                  <button
                    onClick={() => setShowCancelDOModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span className="font-medium">Cancel Delivery Order</span>
                  </button>
                </div>
              )}

              {/* Show cancellation info if cancelled */}
              {selectedDO.status === 'cancelled' && (
                <div className="border-t pt-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-red-700 mb-2">
                      <X className="w-5 h-5" />
                      <span className="font-bold">Delivery Order Cancelled</span>
                    </div>
                    <p className="text-sm text-red-600"><span className="font-medium">Reason:</span> {selectedDO.cancellation_reason || '-'}</p>
                    {selectedDO.cancelled_at && <p className="text-xs text-red-500 mt-1">Cancelled on {new Date(selectedDO.cancelled_at).toLocaleString()}</p>}
                  </div>
                </div>
              )}

              {/* Delivery Order (DO) Document Upload */}
              <div className="border-t pt-4">
                <label className="block text-sm font-bold text-gray-900 mb-3">Delivery Order (DO)</label>
                {selectedDO.delivery_order_url ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-emerald-700">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">DO Document uploaded</span>
                    </div>
                    <button
                      onClick={() => {
                        const url = selectedDO.delivery_order_url;
                        if (url?.startsWith('data:')) {
                          const byteString = atob(url.split(',')[1]);
                          const mimeString = url.split(',')[0].split(':')[1].split(';')[0];
                          const ab = new ArrayBuffer(byteString.length);
                          const ia = new Uint8Array(ab);
                          for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                          const blob = new Blob([ab], { type: mimeString });
                          window.open(URL.createObjectURL(blob), '_blank');
                        } else {
                          window.open(url, '_blank');
                        }
                      }}
                      className="px-3 py-1 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
                    >
                      View DO
                    </button>
                  </div>
                ) : (
                  <>
                    <input type="file" id="do-out-upload" accept=".pdf,.jpg,.jpeg,.png" onChange={async (e) => {
                      if (e.target.files?.[0]) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onload = async (event) => {
                          const dataUrl = event.target.result;
                          // Update DO with the document URL using updateDOStatus
                          const result = await InventoryAPI.updateDOStatus(organizationSlug, selectedDO.id, selectedDO.status, dataUrl);
                          if (result.code === 0) {
                            setSelectedDO({ ...selectedDO, delivery_order_url: dataUrl });
                            fetchData();
                          } else {
                            console.error('Failed to save DO document:', result.msg);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }} className="hidden" />
                    <label htmlFor="do-out-upload" className="flex items-center justify-center space-x-2 px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600 font-medium">Upload DO Document</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-2">Upload DO to enable status confirmation</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
