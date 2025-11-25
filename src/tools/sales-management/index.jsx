/**
 * Sales Management (销售管理) - Main Component
 *
 * A comprehensive sales order management system with:
 * - Multi-item sales orders with customers and products
 * - Configurable running number format
 * - Team-based visibility control
 * - Sales analytics dashboard
 * - Settings management
 */

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Settings, List, FileText, Users, Truck, Receipt } from 'lucide-react';
import { useSalesOrders } from './hooks/useSalesOrders';
import { useQuotations } from './hooks/useQuotations';
import { useDeliveryOrders } from './hooks/useDeliveryOrders';
import { useInvoices } from './hooks/useInvoices';
import { useSalesSettings } from './hooks/useSalesSettings';
import SalesOrderListView from './components/SalesOrderListView';
import SalesOrderFormDialog from './components/SalesOrderFormDialog';
import QuotationsListView from './components/QuotationsListView';
import QuotationFormDialog from './components/QuotationFormDialog';
import DeliveryOrderListView from './components/DeliveryOrderListView';
import DeliveryOrderFormDialog from './components/DeliveryOrderFormDialog';
import InvoiceListView from './components/InvoiceListView';
import InvoiceFormDialog from './components/InvoiceFormDialog';
import InvoicePaymentDialog from './components/InvoicePaymentDialog';
import SettingsView from './components/SettingsView';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import TeamsView from './components/TeamsView';
import ConfirmDialog from './components/ConfirmDialog';

const TABS = {
  ANALYTICS: 0,
  QUOTATIONS: 1,
  ORDERS: 2,
  DELIVERY_ORDERS: 3,
  INVOICES: 4,
  TEAMS: 5,
  SETTINGS: 6,
};

const resolveApiOrigin = () =>
  process.env.REACT_APP_API_ORIGIN || window.location.origin;

export default function SalesManagementApp({ organizationSlug }) {
  const [activeTab, setActiveTab] = useState(TABS.ANALYTICS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isQuotationFormOpen, setIsQuotationFormOpen] = useState(false);
  const [isDeliveryOrderFormOpen, setIsDeliveryOrderFormOpen] = useState(false);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [editingDeliveryOrder, setEditingDeliveryOrder] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [salesPersons, setSalesPersons] = useState([]);
  const [products, setProducts] = useState([]);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  // Hooks
  const {
    salesOrders,
    loading: ordersLoading,
    createSalesOrder,
    updateSalesOrder,
    deleteSalesOrder,
    getSalesOrder,
  } = useSalesOrders(organizationSlug);

  const {
    quotations,
    loading: quotationsLoading,
    createQuotation,
    updateQuotation,
    deleteQuotation,
    getQuotation,
  } = useQuotations(organizationSlug);

  // Stable empty filters to prevent continuous refetching
  const deliveryOrderFilters = useMemo(() => ({}), []);

  const {
    deliveryOrders,
    loading: deliveryOrdersLoading,
    createDeliveryOrder,
    updateDeliveryOrder,
    deleteDeliveryOrder,
    markDelivered,
    getDeliveryOrder,
  } = useDeliveryOrders(organizationSlug, deliveryOrderFilters);

  const {
    invoices,
    loading: invoicesLoading,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    addPayment,
    deletePayment,
  } = useInvoices(organizationSlug);

  const {
    settings,
    updateSettings,
    previewFormat,
  } = useSalesSettings(organizationSlug);

  // Fetch customers (contacts with type = 'customer')
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!organizationSlug) return;

      try {
        const response = await fetch(
          `${resolveApiOrigin()}/api/contacts?organization_slug=${organizationSlug}`,
          { credentials: 'include' }
        );

        if (response.ok) {
          const data = await response.json();
          const customerList = data.filter(c => c.contact_type === 'customer' && !c.is_deleted);
          setCustomers(customerList);
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
      }
    };

    fetchCustomers();
  }, [organizationSlug]);

  // Fetch sales persons (organization members)
  useEffect(() => {
    const fetchSalesPersons = async () => {
      if (!organizationSlug) return;

      try {
        const response = await fetch(
          `${resolveApiOrigin()}/api/sales_management/members?organization_slug=${organizationSlug}`,
          { credentials: 'include' }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('📊 Sales persons data:', data);
          setSalesPersons(data);
        } else {
          console.error('❌ Failed to fetch sales persons:', response.status, response.statusText);
        }
      } catch (err) {
        console.error('Error fetching sales persons:', err);
      }
    };

    fetchSalesPersons();
  }, [organizationSlug]);

  // Fetch products (inventory)
  useEffect(() => {
    const fetchProducts = async () => {
      if (!organizationSlug) return;

      try {
        const response = await fetch(
          `${resolveApiOrigin()}/api/inventory?organization_slug=${organizationSlug}&type=products`,
          { credentials: 'include' }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('📦 Products data:', data);
          // The inventory API returns data in { success: true, data: [...] } format
          const productList = data.data || [];
          console.log('📦 Processed products:', productList);
          setProducts(productList);
        } else {
          console.error('❌ Failed to fetch products:', response.status, response.statusText);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };

    fetchProducts();
  }, [organizationSlug]);

  const handleCreateOrder = () => {
    setEditingOrder(null);
    setIsFormOpen(true);
  };

  const handleEditOrder = async (order) => {
    // Fetch full order details including line items
    try {
      const fullOrder = await getSalesOrder(order.id);
      setEditingOrder(fullOrder);
      setIsFormOpen(true);
    } catch (err) {
      console.error('Error loading order:', err);
      alert('Failed to load order details');
    }
  };

  const handleViewOrder = async (order) => {
    // Fetch full order details including line items
    try {
      const fullOrder = await getSalesOrder(order.id);
      setEditingOrder(fullOrder);
      setIsFormOpen(true);
    } catch (err) {
      console.error('Error loading order:', err);
      alert('Failed to load order details');
    }
  };

  const handleSaveOrder = async (orderData) => {
    if (editingOrder) {
      // Update existing order
      await updateSalesOrder(editingOrder.id, orderData);
    } else {
      // Create new order
      await createSalesOrder(orderData);
    }
    setIsFormOpen(false);
    setEditingOrder(null);
  };

  const handleDeleteOrder = (orderId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Sales Order',
      message: 'Are you sure you want to delete this sales order? This action cannot be undone.',
      onConfirm: async () => {
        await deleteSalesOrder(orderId);
      },
    });
  };

  // Quotation handlers
  const handleCreateQuotation = () => {
    setEditingQuotation(null);
    setIsQuotationFormOpen(true);
  };

  const handleEditQuotation = async (quotation) => {
    try {
      const fullQuotation = await getQuotation(quotation.id);
      setEditingQuotation(fullQuotation);
      setIsQuotationFormOpen(true);
    } catch (err) {
      console.error('Error loading quotation:', err);
      alert('Failed to load quotation details');
    }
  };

  const handleViewQuotation = async (quotation) => {
    try {
      const fullQuotation = await getQuotation(quotation.id);
      setEditingQuotation(fullQuotation);
      setIsQuotationFormOpen(true);
    } catch (err) {
      console.error('Error loading quotation:', err);
      alert('Failed to load quotation details');
    }
  };

  const handleSaveQuotation = async (quotationData) => {
    if (editingQuotation) {
      await updateQuotation(editingQuotation.id, quotationData);
    } else {
      await createQuotation(quotationData);
    }
    setIsQuotationFormOpen(false);
    setEditingQuotation(null);
  };

  const handleDeleteQuotation = (quotationId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Quotation',
      message: 'Are you sure you want to delete this quotation? This action cannot be undone.',
      onConfirm: async () => {
        await deleteQuotation(quotationId);
      },
    });
  };

  // Delivery Order handlers
  const handleCreateDeliveryOrder = () => {
    setEditingDeliveryOrder(null);
    setIsDeliveryOrderFormOpen(true);
  };

  const handleEditDeliveryOrder = async (deliveryOrder) => {
    try {
      const fullDeliveryOrder = await getDeliveryOrder(deliveryOrder.id);
      setEditingDeliveryOrder(fullDeliveryOrder);
      setIsDeliveryOrderFormOpen(true);
    } catch (err) {
      console.error('Error loading delivery order:', err);
      alert('Failed to load delivery order details');
    }
  };

  const handleSaveDeliveryOrder = async (deliveryOrderData) => {
    if (editingDeliveryOrder) {
      await updateDeliveryOrder(editingDeliveryOrder.id, deliveryOrderData);
    } else {
      await createDeliveryOrder(deliveryOrderData);
    }
    setIsDeliveryOrderFormOpen(false);
    setEditingDeliveryOrder(null);
  };

  const handleDeleteDeliveryOrder = (deliveryOrderId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Delivery Order',
      message: 'Are you sure you want to delete this delivery order? This action cannot be undone.',
      onConfirm: async () => {
        await deleteDeliveryOrder(deliveryOrderId);
      },
    });
  };

  const handleMarkDelivered = (deliveryOrderId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Mark as Delivered',
      message: 'Mark this delivery order as delivered?',
      onConfirm: async () => {
        await markDelivered(deliveryOrderId);
      },
    });
  };

  // Invoice handlers
  const handleCreateInvoice = () => {
    setEditingInvoice(null);
    setIsInvoiceFormOpen(true);
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setIsInvoiceFormOpen(true);
  };

  const handleSaveInvoice = async (invoiceData) => {
    if (editingInvoice) {
      await updateInvoice(editingInvoice.id, invoiceData);
    } else {
      await createInvoice(invoiceData);
    }
    setIsInvoiceFormOpen(false);
    setEditingInvoice(null);
  };

  const handleDeleteInvoice = (invoiceId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Invoice',
      message: 'Are you sure you want to delete this invoice? This action cannot be undone.',
      onConfirm: async () => {
        await deleteInvoice(invoiceId);
      },
    });
  };

  const handleAddPayment = (invoice) => {
    setSelectedInvoiceForPayment(invoice);
    setIsPaymentDialogOpen(true);
  };

  const handleSavePayment = async (invoiceId, paymentData) => {
    await addPayment(invoiceId, paymentData);
  };

  const handleDeletePayment = async (invoiceId, paymentId) => {
    await deletePayment(invoiceId, paymentId);
  };

  const handleSaveSettings = async (settingsData) => {
    await updateSettings(settingsData);
  };

  const tabs = [
    { id: TABS.ANALYTICS, label: 'Analytics', icon: BarChart3 },
    { id: TABS.QUOTATIONS, label: 'Quotations', icon: FileText },
    { id: TABS.ORDERS, label: 'Sales Orders', icon: List },
    { id: TABS.DELIVERY_ORDERS, label: 'Delivery Orders', icon: Truck },
    { id: TABS.INVOICES, label: 'Invoices', icon: Receipt },
    { id: TABS.TEAMS, label: 'Teams', icon: Users },
    { id: TABS.SETTINGS, label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case TABS.QUOTATIONS:
        return (
          <QuotationsListView
            quotations={quotations}
            loading={quotationsLoading}
            onCreateQuotation={handleCreateQuotation}
            onEditQuotation={handleEditQuotation}
            onDeleteQuotation={handleDeleteQuotation}
            onViewQuotation={handleViewQuotation}
            customers={customers}
            salesPersons={salesPersons}
            organizationSlug={organizationSlug}
          />
        );

      case TABS.ORDERS:
        return (
          <SalesOrderListView
            salesOrders={salesOrders}
            loading={ordersLoading}
            onCreateOrder={handleCreateOrder}
            onEditOrder={handleEditOrder}
            onDeleteOrder={handleDeleteOrder}
            onViewOrder={handleViewOrder}
            customers={customers}
            salesPersons={salesPersons}
            organizationSlug={organizationSlug}
          />
        );

      case TABS.DELIVERY_ORDERS:
        return (
          <DeliveryOrderListView
            deliveryOrders={deliveryOrders}
            loading={deliveryOrdersLoading}
            onCreateOrder={handleCreateDeliveryOrder}
            onEditOrder={handleEditDeliveryOrder}
            onDeleteOrder={handleDeleteDeliveryOrder}
            onMarkDelivered={handleMarkDelivered}
            organizationSlug={organizationSlug}
          />
        );

      case TABS.INVOICES:
        return (
          <InvoiceListView
            invoices={invoices}
            loading={invoicesLoading}
            onCreateInvoice={handleCreateInvoice}
            onEditInvoice={handleEditInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onAddPayment={handleAddPayment}
            organizationSlug={organizationSlug}
          />
        );

      case TABS.ANALYTICS:
        return (
          <AnalyticsDashboard
            salesOrders={salesOrders}
            organizationSlug={organizationSlug}
            salesPersons={salesPersons}
          />
        );

      case TABS.TEAMS:
        return (
          <TeamsView
            organizationSlug={organizationSlug}
          />
        );

      case TABS.SETTINGS:
        return (
          <SettingsView
            settings={settings}
            onSave={handleSaveSettings}
            onPreviewFormat={previewFormat}
            organizationSlug={organizationSlug}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="border-b border-gray-200">
          <div className="px-4 md:px-6 py-3 md:py-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">销售管理</h1>
          </div>

          {/* Tabs */}
          <div className="px-2 md:px-6">
            <div className="flex gap-0.5 md:gap-1 border-b border-gray-200 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2.5 md:py-3
                      font-medium text-sm transition-colors whitespace-nowrap
                      border-b-2 -mb-px min-w-[60px] md:min-w-0
                      ${isActive
                        ? 'text-blue-600 border-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="hidden md:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 md:px-6 pb-6">{renderContent()}</div>
      </div>

      {/* Quotation Form Dialog */}
      <QuotationFormDialog
        isOpen={isQuotationFormOpen}
        onClose={() => {
          setIsQuotationFormOpen(false);
          setEditingQuotation(null);
        }}
        onSave={handleSaveQuotation}
        order={editingQuotation}
        customers={customers}
        salesPersons={salesPersons}
        products={products}
        organizationSlug={organizationSlug}
      />

      {/* Sales Order Form Dialog */}
      <SalesOrderFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingOrder(null);
        }}
        onSave={handleSaveOrder}
        order={editingOrder}
        customers={customers}
        salesPersons={salesPersons}
        products={products}
        quotations={quotations}
        organizationSlug={organizationSlug}
      />

      {/* Delivery Order Form Dialog */}
      <DeliveryOrderFormDialog
        isOpen={isDeliveryOrderFormOpen}
        onClose={() => {
          setIsDeliveryOrderFormOpen(false);
          setEditingDeliveryOrder(null);
        }}
        onSave={handleSaveDeliveryOrder}
        order={editingDeliveryOrder}
        customers={customers}
        salesPersons={salesPersons}
        products={products}
        salesOrders={salesOrders}
        organizationSlug={organizationSlug}
      />

      {/* Invoice Form Dialog */}
      <InvoiceFormDialog
        isOpen={isInvoiceFormOpen}
        onClose={() => {
          setIsInvoiceFormOpen(false);
          setEditingInvoice(null);
        }}
        onSave={handleSaveInvoice}
        invoice={editingInvoice}
        customers={customers}
        salesPersons={salesPersons}
        products={products}
        salesOrders={salesOrders}
        deliveryOrders={deliveryOrders}
        organizationSlug={organizationSlug}
      />

      {/* Invoice Payment Dialog */}
      <InvoicePaymentDialog
        isOpen={isPaymentDialogOpen}
        onClose={() => {
          setIsPaymentDialogOpen(false);
          setSelectedInvoiceForPayment(null);
        }}
        invoice={selectedInvoiceForPayment}
        onAddPayment={handleSavePayment}
        onDeletePayment={handleDeletePayment}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
    </div>
  );
}
