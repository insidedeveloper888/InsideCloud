import React, { useState, useEffect } from 'react';
import { ORGANIZATION_SLUG_KEY } from '../../components/organizationSelector';
import { InventoryAPI } from './api/inventory';
import { useCurrentUser } from '../../tools/contact-management/hooks/useCurrentUser';
import { Package, Plus, Warehouse, FileText, Truck } from 'lucide-react';
import FilterPanel from './components/FilterPanel';
import AddLocationModal from './components/AddLocationModal';
import AddCategoryModal from './components/AddCategoryModal';
import AddProductModal from './components/AddProductModal';
import CancelDOModal from './components/CancelDOModal';
import QuickAddProductModal from './components/QuickAddProductModal';
import AddSupplierModal from './components/AddSupplierModal';
import CreatePOModal from './components/CreatePOModal';
import StockOutModal from './components/StockOutModal';
import StockInModal from './components/StockInModal';
import PODetailModal from './components/modals/PODetailModal';
import AddDOModal from './components/modals/AddDOModal';
import DODetailModal from './components/modals/DODetailModal';
import OverviewTab from './components/tabs/OverviewTab';
import MovementsTab from './components/tabs/MovementsTab';
import ProductsTab from './components/tabs/ProductsTab';
import PurchaseOrdersTab from './components/tabs/PurchaseOrdersTab';
import SuppliersTab from './components/tabs/SuppliersTab';
import DeliveryOrdersTab from './components/tabs/DeliveryOrdersTab';
import {
  getPOStatusColor,
  getPOStatusLabel,
  getPOStatusIcon
} from './utils/helpers';
import { createToggleSort, createSortIcon } from './utils/sorting';
import { filterInventoryItems, sortInventoryItems } from './utils/filtering';
import './index.css';

/**
 * Custom hook for debouncing values
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 */
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

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
  const [showUnstocked, setShowUnstocked] = useState(false); // Hide unstocked items by default
  const [sortBy, setSortBy] = useState({ field: '', direction: '' }); // { field: 'sku'|'name'|'category'|'warehouse'|'quantity'|'available'|'status', direction: 'asc'|'desc' }

  // New sidebar filter states - per tab
  const [showFilters, setShowFilters] = useState({
    overview: false,
    movements: false,
    products: false,
    'purchase-orders': false,
    'delivery-orders': false,
    suppliers: false,
  });
  const [filters, setFilters] = useState({
    categories: [],
    locations: [],
    suppliers: [],
    stockStatuses: [],
    showInactive: false,
    movementTypes: [],  // For movements tab
    poStatuses: [],     // For purchase orders tab
    doStatuses: [],     // For delivery orders tab
    states: [],         // For suppliers tab
    minQuantity: null,  // For overview tab - quantity range
    itemType: 'selling', // For products tab - 'selling' or 'spare'
    maxQuantity: null,  // For overview tab - quantity range
  });

  // Search states for each tab
  const [poSearchTerm, setPoSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [movementSearchTerm, setMovementSearchTerm] = useState('');
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');

  // Debounced search terms (300ms delay) - reduces filtering operations
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedProductSearchTerm = useDebounce(productSearchTerm, 300);
  const debouncedMovementSearchTerm = useDebounce(movementSearchTerm, 300);

  // Sort states
  const [movementSortBy, setMovementSortBy] = useState({ field: '', direction: '' });
  const [productSortBy, setProductSortBy] = useState({ field: '', direction: '' });
  const [poSortBy, setPoSortBy] = useState({ field: '', direction: '' });

  // Pagination states
  const [stockPage, setStockPage] = useState(1);
  const [movementPage, setMovementPage] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Supplier filters
  const [supplierSortBy, setSupplierSortBy] = useState({ field: '', direction: '' });

  // Delivery Order (Out) states
  const [doSearchTerm, setDoSearchTerm] = useState('');
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
    category: '',
    unit: '',
    base_unit: '',
    unit_conversion_factor: 1,
    description: '',
    is_selling: false, // Default to not a selling item - user can enable in Items tab
    // Optional initial stock fields
    initial_location_id: '',
    initial_quantity: 0,
    initial_unit_cost: 0
  });

  const [quickProduct, setQuickProduct] = useState({
    sku: '',
    name: '',
    category: '',
    unit: ''
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
    reference_type: '',  // User can add custom types
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
  const [showAddUnitForm, setShowAddUnitForm] = useState({}); // { productId: boolean }

  // Load locations on mount (needed for Add Product modal and PO)
  useEffect(() => {
    if (!organizationSlug) return;
    const fetchLocations = async () => {
      try {
        const locationsRes = await InventoryAPI.getLocations(organizationSlug);
        setLocations(locationsRes.data || []);
      } catch (err) {
        console.error('Failed to fetch locations:', err);
        setError(`Failed to load warehouses: ${err.message}. Please refresh the page.`);
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
        setError(`Failed to load suppliers: ${err.message}. Please refresh the page.`);
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
        setError(`Failed to load products: ${err.message}. Please refresh the page.`);
      }
    };
    fetchProducts();
  }, [organizationSlug]);

  // Reset search terms when tab changes
  useEffect(() => {
    setSearchTerm('');
    setPoSearchTerm('');
    setProductSearchTerm('');
    setMovementSearchTerm('');
    setSupplierSearchTerm('');
    setDoSearchTerm('');
  }, [tab]);

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
          if (settingsRes.data.custom_stock_in_types) {
            setCustomStockInTypes(settingsRes.data.custom_stock_in_types);
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
        setError('Failed to load custom settings. Using system defaults. Some features may be limited.');
      }
    };
    fetchSettings();
  }, [organizationSlug]);

  // Reset pages when filters change (use debounced search terms)
  useEffect(() => { setStockPage(1); }, [debouncedSearchTerm, showUnstocked, sortBy, filters]);
  useEffect(() => { setMovementPage(1); }, [debouncedMovementSearchTerm, movementSortBy, filters]);
  useEffect(() => { setProductPage(1); }, [debouncedProductSearchTerm, productSortBy]);

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

  // Clear filters when switching tabs
  useEffect(() => {
    setFilters({
      categories: [],
      locations: [],
      suppliers: [],
      stockStatuses: [],
      showInactive: false,
      movementTypes: [],
      poStatuses: [],
      doStatuses: [],
      states: [],
      minQuantity: null,
      maxQuantity: null,
      movementDateFrom: '',
      movementDateTo: '',
      users: [],
      products: [],
      managedBy: [],
      poOrderDateFrom: '',
      poOrderDateTo: '',
      poExpectedDeliveryFrom: '',
      poExpectedDeliveryTo: '',
      customers: [],
      createdBy: [],
      doOrderDateFrom: '',
      doOrderDateTo: '',
    });
  }, [tab]);

  useEffect(() => {
    if (!organizationSlug) return;

    // Create abort controller for cleanup
    const abortController = new AbortController();
    let isMounted = true;

    const fetchDataWithCleanup = async () => {
      setLoading(true);
      setError(null);

      try {
        await fetchData(abortController.signal, isMounted);
      } catch (err) {
        // Don't set error if component unmounted or request aborted
        if (isMounted && err.name !== 'AbortError') {
          console.error('Failed to fetch inventory data:', err);
          const tabName = {
            'overview': 'stock overview',
            'products': 'product catalog',
            'movements': 'stock movements',
            'purchase-orders': 'purchase orders',
            'suppliers': 'suppliers',
            'delivery-orders': 'delivery orders'
          }[tab] || 'data';
          setError(`Failed to load ${tabName}: ${err.message}. Please try refreshing the page.`);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDataWithCleanup();

    // Cleanup function
    return () => {
      isMounted = false;
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationSlug, tab]);

  const fetchData = async (signal, isMounted = true) => {
    try {
      if (tab === 'overview') {
        const results = await Promise.allSettled([
          InventoryAPI.getItems(organizationSlug, {
            search: searchTerm
          }),
          InventoryAPI.getProducts(organizationSlug),
          InventoryAPI.getLocations(organizationSlug)
        ]);

        // Only update state if component is still mounted
        if (isMounted) {
          const [itemsResult, productsResult, locationsResult] = results;

          if (itemsResult.status === 'fulfilled') {
            setItems(itemsResult.value.data || []);
          } else {
            console.error('Failed to load items:', itemsResult.reason);
            setError(prev => (prev ? `${prev}\n• Stock items unavailable` : '• Stock items unavailable'));
          }

          if (productsResult.status === 'fulfilled') {
            setProducts(productsResult.value.data || []);
          } else {
            console.error('Failed to load products:', productsResult.reason);
            setError(prev => (prev ? `${prev}\n• Products unavailable` : '• Products unavailable'));
          }

          if (locationsResult.status === 'fulfilled') {
            setLocations(locationsResult.value.data || []);
          } else {
            console.error('Failed to load locations:', locationsResult.reason);
            setError(prev => (prev ? `${prev}\n• Warehouses unavailable` : '• Warehouses unavailable'));
          }
        }
      } else if (tab === 'products') {
        const results = await Promise.allSettled([
          InventoryAPI.getItems(organizationSlug),
          InventoryAPI.getProducts(organizationSlug),
          InventoryAPI.getLocations(organizationSlug)
        ]);

        if (isMounted) {
          const [itemsResult, productsResult, locationsResult] = results;

          if (itemsResult.status === 'fulfilled') {
            setItems(itemsResult.value.data || []);
          } else {
            console.error('Failed to load items:', itemsResult.reason);
            setError(prev => (prev ? `${prev}\n• Stock items unavailable` : '• Stock items unavailable'));
          }

          if (productsResult.status === 'fulfilled') {
            setProducts(productsResult.value.data || []);
          } else {
            console.error('Failed to load products:', productsResult.reason);
            setError(prev => (prev ? `${prev}\n• Products unavailable` : '• Products unavailable'));
          }

          if (locationsResult.status === 'fulfilled') {
            setLocations(locationsResult.value.data || []);
          } else {
            console.error('Failed to load locations:', locationsResult.reason);
            setError(prev => (prev ? `${prev}\n• Warehouses unavailable` : '• Warehouses unavailable'));
          }
        }
      } else if (tab === 'movements') {
        const movementsRes = await InventoryAPI.getMovements(organizationSlug, { limit: 50 });
        if (isMounted) {
          setMovements(movementsRes.data || []);
        }
      } else if (tab === 'purchase-orders') {
        const results = await Promise.allSettled([
          InventoryAPI.getPurchaseOrders(organizationSlug),
          InventoryAPI.getProducts(organizationSlug),
          InventoryAPI.getLocations(organizationSlug),
          InventoryAPI.getSuppliers(organizationSlug)
        ]);

        if (isMounted) {
          const [poResult, productsResult, locationsResult, suppliersResult] = results;

          if (poResult.status === 'fulfilled') {
            setPurchaseOrders(poResult.value.data || []);
          } else {
            console.error('Failed to load purchase orders:', poResult.reason);
            setError(prev => (prev ? `${prev}\n• Purchase orders unavailable` : '• Purchase orders unavailable'));
          }

          if (productsResult.status === 'fulfilled') {
            setProducts(productsResult.value.data || []);
          } else {
            console.error('Failed to load products:', productsResult.reason);
            setError(prev => (prev ? `${prev}\n• Products unavailable` : '• Products unavailable'));
          }

          if (locationsResult.status === 'fulfilled') {
            setLocations(locationsResult.value.data || []);
          } else {
            console.error('Failed to load locations:', locationsResult.reason);
            setError(prev => (prev ? `${prev}\n• Warehouses unavailable` : '• Warehouses unavailable'));
          }

          if (suppliersResult.status === 'fulfilled') {
            setSuppliers(suppliersResult.value.data || []);
          } else {
            console.error('Failed to load suppliers:', suppliersResult.reason);
            setError(prev => (prev ? `${prev}\n• Suppliers unavailable` : '• Suppliers unavailable'));
          }
        }
      } else if (tab === 'suppliers') {
        const suppliersRes = await InventoryAPI.getSuppliers(organizationSlug);
        if (isMounted) {
          setSuppliers(suppliersRes.data || []);
        }
      } else if (tab === 'delivery-orders') {
        const results = await Promise.allSettled([
          InventoryAPI.getDeliveryOrders(organizationSlug),
          InventoryAPI.getProducts(organizationSlug),
          InventoryAPI.getLocations(organizationSlug),
          fetch(`${process.env.REACT_APP_API_BASE || ''}/api/contacts?organization_slug=${organizationSlug}`).then(r => r.json())
        ]);

        if (isMounted) {
          const [doResult, productsResult, locationsResult, customersResult] = results;

          if (doResult.status === 'fulfilled') {
            setDeliveryOrders(doResult.value.data || []);
          } else {
            console.error('Failed to load delivery orders:', doResult.reason);
            setError(prev => (prev ? `${prev}\n• Delivery orders unavailable` : '• Delivery orders unavailable'));
          }

          if (productsResult.status === 'fulfilled') {
            setProducts(productsResult.value.data || []);
          } else {
            console.error('Failed to load products:', productsResult.reason);
            setError(prev => (prev ? `${prev}\n• Products unavailable` : '• Products unavailable'));
          }

          if (locationsResult.status === 'fulfilled') {
            setLocations(locationsResult.value.data || []);
          } else {
            console.error('Failed to load locations:', locationsResult.reason);
            setError(prev => (prev ? `${prev}\n• Warehouses unavailable` : '• Warehouses unavailable'));
          }

          if (customersResult.status === 'fulfilled') {
            // API returns array directly, filter for customers only
            const allContacts = Array.isArray(customersResult.value) ? customersResult.value : [];
            setCustomers(allContacts.filter(c => c.contact_types?.some(t => t.code === 'customer')));
          } else {
            console.error('Failed to load customers:', customersResult.reason);
            setError(prev => (prev ? `${prev}\n• Customers unavailable` : '• Customers unavailable'));
          }
        }
      }
    } catch (err) {
      // Re-throw to be handled by wrapper
      throw err;
    }
  };

  // Combine stock items with products that can be stocked in new locations
  // This allows users to:
  // 1. Stock-in products that were added without initial stock
  // 2. Stock-in existing products to different warehouses
  const itemsWithUnstockedProducts = React.useMemo(() => {
    // Filter out soft-deleted products first
    const activeProducts = products.filter(p => !p.is_deleted);

    // For each product, find which locations DON'T have stock yet
    // This creates virtual items for product+location combinations that don't exist
    const existingCombinations = new Set(
      items.map(item => `${item.product_id}-${item.location_id}`)
    );

    // Create virtual items for each active product in locations where it doesn't exist yet
    const virtualItems = [];
    activeProducts.forEach(product => {
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
    // Also filter out items belonging to soft-deleted products
    const itemsWithUpdatedStatus = items
      .filter(item => {
        const latestProduct = products.find(p => p.id === item.product_id);
        // Exclude items whose product is soft-deleted
        return latestProduct && !latestProduct.is_deleted;
      })
      .map(item => {
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

  // Extract unique categories from products
  const uniqueCategories = React.useMemo(() => {
    const cats = new Set();
    products.forEach(p => {
      if (p.category && p.category.trim()) {
        cats.add(p.category.trim());
      }
    });
    return Array.from(cats).sort();
  }, [products]);

  // Extract unique users from movements, POs, and DOs
  const uniqueUsers = React.useMemo(() => {
    const usersMap = new Map();

    // From movements
    movements.forEach(m => {
      if (m.created_by?.id) {
        usersMap.set(m.created_by.id, m.created_by);
      }
    });

    // From purchase orders
    purchaseOrders.forEach(po => {
      if (po.created_by?.id) {
        usersMap.set(po.created_by.id, po.created_by);
      }
    });

    // From delivery orders
    deliveryOrders.forEach(d => {
      if (d.created_by?.id) {
        usersMap.set(d.created_by.id, d.created_by);
      }
    });

    return Array.from(usersMap.values()).sort((a, b) =>
      (a.display_name || a.email || '').localeCompare(b.display_name || b.email || '')
    );
  }, [movements, purchaseOrders, deliveryOrders]);

  // Extract unique states from suppliers
  const uniqueStates = React.useMemo(() => {
    const statesSet = new Set();
    suppliers.forEach(s => {
      if (s.state && s.state.trim()) {
        statesSet.add(s.state.trim());
      }
    });
    return Array.from(statesSet).sort();
  }, [suppliers]);

  // Extract unique suppliers from purchase orders only
  const uniquePOSuppliers = React.useMemo(() => {
    const suppliersMap = new Map();
    purchaseOrders.forEach(po => {
      if (po.supplier?.id) {
        suppliersMap.set(po.supplier.id, po.supplier);
      }
    });
    return Array.from(suppliersMap.values()).sort((a, b) =>
      (a.name || '').localeCompare(b.name || '')
    );
  }, [purchaseOrders]);

  // Extract unique customers from delivery orders only
  const uniqueDOCustomers = React.useMemo(() => {
    const customersMap = new Map();
    deliveryOrders.forEach(d => {
      if (d.customer?.id) {
        customersMap.set(d.customer.id, d.customer);
      }
    });
    return Array.from(customersMap.values()).sort((a, b) => {
      const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.company_name || '';
      const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.company_name || '';
      return nameA.localeCompare(nameB);
    });
  }, [deliveryOrders]);

  // Filter and sort items (use debounced search term for better performance)
  const filteredItems = React.useMemo(() => {
    const filtered = filterInventoryItems(itemsWithUnstockedProducts, {
      searchTerm: debouncedSearchTerm,
      filters,
      showUnstocked
    });
    return sortInventoryItems(filtered, sortBy);
  }, [itemsWithUnstockedProducts, debouncedSearchTerm, showUnstocked, sortBy, filters]);

  // Sort handlers
  const toggleSort = createToggleSort(setSortBy);
  const toggleMovementSort = createToggleSort(setMovementSortBy);
  const toggleProductSort = createToggleSort(setProductSortBy);

  // Sort icons
  const SortIcon = createSortIcon(sortBy);
  const MovementSortIcon = createSortIcon(movementSortBy);
  const ProductSortIcon = createSortIcon(productSortBy);

  const handleAddProduct = async () => {
    try {
      setModalError('');

      // Validation
      if (!newProduct.sku?.trim()) {
        setModalError('SKU is required');
        return;
      }

      // Check for duplicate SKU (only active products)
      const duplicateSKU = products.find(p =>
        !p.is_deleted && p.sku?.toLowerCase() === newProduct.sku.trim().toLowerCase()
      );
      if (duplicateSKU) {
        setModalError(`SKU "${newProduct.sku.trim()}" already exists for an active product. Please use a different SKU.`);
        return;
      }

      // Check if SKU exists in a soft-deleted product
      const softDeletedSKU = products.find(p =>
        p.is_deleted && p.sku?.toLowerCase() === newProduct.sku.trim().toLowerCase()
      );
      if (softDeletedSKU) {
        console.warn(`SKU "${newProduct.sku.trim()}" exists in soft-deleted product. Attempting to reuse...`);
      }

      if (!newProduct.name?.trim()) {
        setModalError('Product name is required');
        return;
      }

      // Helper function to normalize product name (remove spaces, symbols, lowercase)
      const normalizeProductName = (name) => {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '');
      };

      // Check for duplicate product name (only active products, normalized)
      const normalizedNewName = normalizeProductName(newProduct.name.trim());
      const duplicateName = products.find(p =>
        !p.is_deleted && normalizeProductName(p.name) === normalizedNewName
      );
      if (duplicateName) {
        setModalError(`A product with similar name "${duplicateName.name}" already exists. Product names must be unique (ignoring spaces, symbols, and case).`);
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
        description: newProduct.description,
        is_selling: newProduct.is_selling || false // Default to not a selling item
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
          is_selling: false,
          initial_location_id: '',
          initial_quantity: 0,
          initial_unit_cost: 0
        });
        fetchData();
      } else {
        // Show error in modal
        const errorMsg = result.msg || 'Failed to create product';
        console.error('Product creation error:', errorMsg);

        if (errorMsg.includes('duplicate') || errorMsg.includes('already exists') || errorMsg.includes('unique constraint')) {
          // Check if it's a soft-deleted product
          const softDeletedProduct = products.find(p =>
            p.is_deleted && p.sku?.toLowerCase() === newProduct.sku.trim().toLowerCase()
          );

          if (softDeletedProduct) {
            setModalError(`SKU "${newProduct.sku.trim()}" exists in a deleted product. The database has a unique constraint on SKU. Please contact your administrator to permanently delete the old product or use a different SKU.`);
          } else {
            setModalError(`SKU "${newProduct.sku.trim()}" already exists. Please use a different SKU.`);
          }
        } else {
          setModalError(errorMsg);
        }
      }
    } catch (err) {
      console.error('Failed to add product:', err);
      const errorMsg = err.message || 'Failed to create product';

      if (errorMsg.includes('duplicate') || errorMsg.includes('already exists') || errorMsg.includes('unique constraint')) {
        setModalError(`SKU "${newProduct.sku.trim()}" already exists. Please use a different SKU or contact your administrator.`);
      } else {
        setModalError(errorMsg);
      }
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
        setStockInData({ quantity: 0, unit_cost: 0, reference_type: '', location_id: '', notes: '', unit: '', product_id: '' });
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

    const categoryToAdd = newCustomCategory.trim();
    const previousCategories = [...customCategories];
    const updatedCategories = [...customCategories, categoryToAdd];

    // Optimistic update
    setCustomCategories(updatedCategories);
    setNewProduct({ ...newProduct, category: categoryToAdd });
    setNewCustomCategory('');
    setShowAddCategoryModal(false);

    // Save to database
    try {
      await InventoryAPI.updateSettings(organizationSlug, { custom_categories: updatedCategories });
    } catch (err) {
      console.error('Failed to save categories:', err);
      // Rollback optimistic update
      setCustomCategories(previousCategories);
      setError(`Failed to save category: ${err.message}. Please try again.`);
      // Reopen modal so user can retry
      setNewCustomCategory(categoryToAdd);
      setShowAddCategoryModal(true);
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
    const previousUnits = [...customUnits];
    const previousConversions = [...unitConversions];
    const updatedUnits = [...customUnits, unitName];

    // Optimistic update
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
      // Rollback optimistic update
      setCustomUnits(previousUnits);
      setUnitConversions(previousConversions);
      setError(`Failed to save unit: ${err.message}. Please try again.`);
      // Reopen modal so user can retry
      setNewCustomUnit(unitName);
      setShowAddUnitModal(true);
    }
  };

  // Save custom categories to database
  const saveCustomCategories = async (newCategories) => {
    try {
      await InventoryAPI.updateSettings(organizationSlug, {
        custom_categories: newCategories
      });
    } catch (err) {
      console.error('Failed to save categories:', err);
    }
  };

  // Save custom units to database
  const saveCustomUnits = async (newUnits) => {
    try {
      await InventoryAPI.updateSettings(organizationSlug, {
        custom_units: newUnits
      });
    } catch (err) {
      console.error('Failed to save units:', err);
    }
  };

  // Save custom stock in types to database
  const saveCustomStockInTypes = async (newTypes) => {
    try {
      await InventoryAPI.updateSettings(organizationSlug, {
        custom_stock_in_types: newTypes
      });
    } catch (err) {
      console.error('Failed to save stock in types:', err);
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
    <div className="inventory-product min-h-screen bg-gray-50 m-0 p-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 md:px-8 py-4 md:py-6 m-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="bg-blue-100 p-2 md:p-3 rounded-lg">
                <Package className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Inventory Management</h1>
                <p className="text-gray-500 text-xs md:text-sm mt-0.5">Stock & P/D Orders</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:flex gap-2 sm:space-x-2 sm:gap-0">
              <button
                onClick={() => setShowAddLocationModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center justify-center space-x-1 md:space-x-2 transition-colors text-xs md:text-sm font-medium"
              >
                <Warehouse className="w-4 h-4" />
                <span className="hidden sm:inline">Add Warehouse</span>
                <span className="sm:hidden">Warehouse</span>
              </button>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center justify-center space-x-1 md:space-x-2 transition-colors text-xs md:text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Item</span>
                <span className="sm:hidden">Item</span>
              </button>
              <button
                onClick={() => setShowAddPOModal(true)}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 md:px-4 py-2 rounded-lg flex items-center justify-center space-x-1 md:space-x-2 transition-colors text-xs md:text-sm font-medium"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Create PO</span>
                <span className="sm:hidden">PO</span>
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
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 md:px-4 py-2 rounded-lg flex items-center justify-center space-x-1 md:space-x-2 transition-colors text-xs md:text-sm font-medium"
              >
                <Truck className="w-4 h-4" />
                <span className="hidden sm:inline">Create DO</span>
                <span className="sm:hidden">DO</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
        {/* Tabs - Sticky below header */}
        <div className="bg-white border-b border-gray-200 sticky top-[88px] z-10 overflow-x-auto">
          <nav className="flex px-4 md:px-8 space-x-1 min-w-max">
              <button
                onClick={() => setTab('overview')}
                className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  tab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Stock Overview
              </button>
              <button
                onClick={() => setTab('products')}
                className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  tab === 'products'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Items
              </button>
              <button
                onClick={() => setTab('movements')}
                className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  tab === 'movements'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Stock Movements
              </button>
              <button
                onClick={() => setTab('purchase-orders')}
                className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  tab === 'purchase-orders'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Purchase Orders
              </button>
              <button
                onClick={() => setTab('delivery-orders')}
                className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  tab === 'delivery-orders'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Delivery Orders
              </button>
              <button
                onClick={() => setTab('suppliers')}
                className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  tab === 'suppliers'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Suppliers
              </button>
            </nav>
        </div>

        {/* Content - No padding for full width */}
        <div className="flex h-[calc(100vh-180px)]">
          {/* Filter Panel - Full height sidebar */}
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            categories={uniqueCategories}
            locations={locations}
            suppliers={uniquePOSuppliers}
            products={products}
            users={uniqueUsers}
            customers={uniqueDOCustomers}
            states={uniqueStates}
            isOpen={showFilters[tab] || false}
            onClose={() => setShowFilters(prev => ({ ...prev, [tab]: false }))}
            currentTab={tab}
          />

          {/* Main Content Area */}
          <div className="flex-1 overflow-auto px-4 md:px-8 py-4 md:py-6">
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 rounded-xl p-5 mb-6 shadow-sm">
            <p className="text-red-900 text-sm font-medium">Error: {error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
            </div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {tab === 'overview' && (
              <OverviewTab
                products={products}
                items={items}
                filteredItems={filteredItems}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                filters={filters}
                showUnstocked={showUnstocked}
                setShowUnstocked={setShowUnstocked}
                stockPage={stockPage}
                setStockPage={setStockPage}
                ITEMS_PER_PAGE={ITEMS_PER_PAGE}
                setSelectedStockItem={setSelectedStockItem}
                setStockInData={setStockInData}
                setShowStockInModal={setShowStockInModal}
                setStockOutData={setStockOutData}
                setShowStockOutModal={setShowStockOutModal}
                handleItemClick={handleItemClick}
                toggleSort={toggleSort}
                SortIcon={SortIcon}
                allProductUnits={allProductUnits}
              />
            )}

            {/* Movements Tab */}
            {tab === 'movements' && (
              <MovementsTab
                movements={movements}
                filters={filters}
                movementSearchTerm={movementSearchTerm}
                setMovementSearchTerm={setMovementSearchTerm}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                movementPage={movementPage}
                setMovementPage={setMovementPage}
                ITEMS_PER_PAGE={ITEMS_PER_PAGE}
                movementSortBy={movementSortBy}
                toggleMovementSort={toggleMovementSort}
                MovementSortIcon={MovementSortIcon}
              />
            )}

            {/* Products Tab */}
            {tab === 'products' && (
              <ProductsTab
                products={products}
                setProducts={setProducts}
                items={items}
                setItems={setItems}
                productSearchTerm={productSearchTerm}
                setProductSearchTerm={setProductSearchTerm}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                filters={filters}
                setFilters={setFilters}
                productPage={productPage}
                setProductPage={setProductPage}
                ITEMS_PER_PAGE={ITEMS_PER_PAGE}
                productSortBy={productSortBy}
                toggleProductSort={toggleProductSort}
                ProductSortIcon={ProductSortIcon}
                expandedProductId={expandedProductId}
                setExpandedProductId={setExpandedProductId}
                productThresholds={productThresholds}
                setProductThresholds={setProductThresholds}
                customUnits={customUnits}
                setCustomUnits={setCustomUnits}
                thresholdsSaving={thresholdsSaving}
                setThresholdsSaving={setThresholdsSaving}
                allProductUnits={allProductUnits}
                setAllProductUnits={setAllProductUnits}
                newProductUnit={newProductUnit}
                setNewProductUnit={setNewProductUnit}
                showAddUnitForm={showAddUnitForm}
                setShowAddUnitForm={setShowAddUnitForm}
                setError={setError}
                organizationSlug={organizationSlug}
              />
            )}

            {/* Purchase Orders Tab */}
            {tab === 'purchase-orders' && (
              <PurchaseOrdersTab
                purchaseOrders={purchaseOrders}
                poSearchTerm={poSearchTerm}
                setPoSearchTerm={setPoSearchTerm}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                filters={filters}
                poSortBy={poSortBy}
                setPoSortBy={setPoSortBy}
                locations={locations}
                getPOStatusIcon={getPOStatusIcon}
                getPOStatusColor={getPOStatusColor}
                getPOStatusLabel={getPOStatusLabel}
                handleOpenPODetail={handleOpenPODetail}
                setShowAddPOModal={setShowAddPOModal}
              />
            )}

            {/* Suppliers Tab */}
            {tab === 'suppliers' && (
              <SuppliersTab
                suppliers={suppliers}
                supplierSearchTerm={supplierSearchTerm}
                setSupplierSearchTerm={setSupplierSearchTerm}
                filters={filters}
                supplierSortBy={supplierSortBy}
                setSupplierSortBy={setSupplierSortBy}
                handleDeleteSupplier={handleDeleteSupplier}
                setShowAddSupplierModal={setShowAddSupplierModal}
              />
            )}

            {/* Delivery Orders (Out) Tab */}
            {tab === 'delivery-orders' && (
              <DeliveryOrdersTab
                deliveryOrders={deliveryOrders}
                doSearchTerm={doSearchTerm}
                setDoSearchTerm={setDoSearchTerm}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                filters={filters}
                doSortBy={doSortBy}
                setDoSortBy={setDoSortBy}
                setSelectedDO={setSelectedDO}
                setShowDODetailModal={setShowDODetailModal}
              />
            )}

          </>
        )}
          </div>
        </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        newProduct={newProduct}
        setNewProduct={setNewProduct}
        onSubmit={handleAddProduct}
        modalError={modalError}
        customCategories={customCategories}
        setCustomCategories={setCustomCategories}
        saveCustomCategories={saveCustomCategories}
        customUnits={customUnits}
        setCustomUnits={setCustomUnits}
        saveCustomUnits={saveCustomUnits}
        locations={locations}
      />

      {/* Add Warehouse/Location Modal */}
      <AddLocationModal
        isOpen={showAddLocationModal}
        onClose={() => {
          setShowAddLocationModal(false);
          setModalError('');
        }}
        newLocation={newLocation}
        setNewLocation={setNewLocation}
        onSubmit={handleAddLocation}
        modalError={modalError}
      />

      {/* Stock Out Modal - Supports both pre-selected item and manual selection */}
      <StockOutModal
        isOpen={showStockOutModal}
        onClose={() => setShowStockOutModal(false)}
        selectedStockItem={selectedStockItem}
        setSelectedStockItem={setSelectedStockItem}
        stockOutData={stockOutData}
        setStockOutData={setStockOutData}
        onSubmit={handleStockOut}
        modalError={modalError}
        setModalError={setModalError}
        products={products}
        items={items}
        locations={locations}
        allProductUnits={allProductUnits}
      />

      {/* Stock In Modal - Supports both pre-selected item and manual selection */}
      <StockInModal
        isOpen={showStockInModal}
        onClose={() => setShowStockInModal(false)}
        selectedStockItem={selectedStockItem}
        setSelectedStockItem={setSelectedStockItem}
        stockInData={stockInData}
        setStockInData={setStockInData}
        onSubmit={handleStockIn}
        modalError={modalError}
        setModalError={setModalError}
        products={products}
        locations={locations}
        allProductUnits={allProductUnits}
        customStockInTypes={customStockInTypes}
        setCustomStockInTypes={setCustomStockInTypes}
        onSaveStockInTypes={saveCustomStockInTypes}
      />

      {/* Create Purchase Order Modal */}
      <CreatePOModal
        isOpen={showAddPOModal}
        onClose={() => setShowAddPOModal(false)}
        newPO={newPO}
        setNewPO={setNewPO}
        poItemToAdd={poItemToAdd}
        setPoItemToAdd={setPoItemToAdd}
        onSubmit={handleCreatePO}
        onAddItem={handleAddItemToPO}
        onRemoveItem={handleRemoveItemFromPO}
        modalError={modalError}
        setModalError={setModalError}
        suppliers={suppliers}
        products={products}
        locations={locations}
        allProductUnits={allProductUnits}
        onShowQuickAddProduct={() => setShowQuickAddProductModal(true)}
      />

      {/* Add Supplier Modal */}
      <AddSupplierModal
        isOpen={showAddSupplierModal}
        onClose={() => setShowAddSupplierModal(false)}
        newSupplier={newSupplier}
        setNewSupplier={setNewSupplier}
        onSubmit={handleAddSupplier}
      />

      {/* Quick Add Product Modal (for PO) */}
      <QuickAddProductModal
        isOpen={showQuickAddProductModal}
        onClose={() => setShowQuickAddProductModal(false)}
        quickProduct={quickProduct}
        setQuickProduct={setQuickProduct}
        onSubmit={handleQuickAddProduct}
        customCategories={customCategories}
        setCustomCategories={setCustomCategories}
        saveCustomCategories={saveCustomCategories}
        customUnits={customUnits}
        setCustomUnits={setCustomUnits}
        saveCustomUnits={saveCustomUnits}
      />

      {/* Add Custom Category Modal */}
      <AddCategoryModal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        value={newCustomCategory}
        onChange={setNewCustomCategory}
        onSubmit={handleAddCustomCategory}
      />

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
      <PODetailModal
        isOpen={showPODetailModal}
        selectedPO={selectedPO}
        onClose={() => {
          setShowPODetailModal(false);
          setSelectedPO(null);
        }}
        organizationSlug={organizationSlug}
        onUpdateStatus={handleUpdatePOStatus}
        onUploadDO={handleUploadDO}
        onRefresh={fetchData}
        onDelete={async (poId) => {
          await InventoryAPI.deletePurchaseOrder(organizationSlug, poId);
          await fetchData();
        }}
      />

      {/* Create Delivery Order Modal */}
      <AddDOModal
        isOpen={showAddDOModal}
        onClose={() => {
          setShowAddDOModal(false);
          setModalError('');
        }}
        newDO={newDO}
        setNewDO={setNewDO}
        doItemToAdd={doItemToAdd}
        setDoItemToAdd={setDoItemToAdd}
        customers={customers}
        locations={locations}
        products={products}
        items={items}
        allProductUnits={allProductUnits}
        onSubmit={handleCreateDO}
        modalError={modalError}
      />

      {/* Cancel DO Confirmation Modal */}
      <CancelDOModal
        isOpen={showCancelDOModal}
        onClose={() => setShowCancelDOModal(false)}
        selectedDO={selectedDO}
        cancelReason={cancelDOReason}
        setCancelReason={setCancelDOReason}
        onSubmit={handleCancelDO}
      />

      {/* DO Detail Modal */}
      <DODetailModal
        isOpen={showDODetailModal}
        selectedDO={selectedDO}
        onClose={() => {
          setShowDODetailModal(false);
          setSelectedDO(null);
        }}
        organizationSlug={organizationSlug}
        onUpdateStatus={handleUpdateDOStatus}
        onRefresh={fetchData}
        setShowCancelDOModal={setShowCancelDOModal}
      />
      </div>
    </div>
  );
}
