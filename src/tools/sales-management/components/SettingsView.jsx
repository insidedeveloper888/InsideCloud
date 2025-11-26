import React, { useState, useEffect } from 'react';
import { Save, ChevronDown, ChevronUp, CheckCircle, FileText } from 'lucide-react';
import StatusConfigurationPanel from './StatusConfigurationPanel';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';
import TemplatesView from './templates/TemplatesView';
import { useSalesOrderStatuses } from '../hooks/useSalesOrderStatuses';
import { useQuotationStatuses } from '../hooks/useQuotationStatuses';
import { useDeliveryOrderStatuses } from '../hooks/useDeliveryOrderStatuses';
import { useInvoiceStatuses } from '../hooks/useInvoiceStatuses';
import { useQuotationSettings } from '../hooks/useQuotationSettings';
import { useDeliveryOrderSettings } from '../hooks/useDeliveryOrderSettings';
import { useInvoiceSettings } from '../hooks/useInvoiceSettings';

export default function SettingsView({ settings, onSave, onPreviewFormat, organizationSlug }) {
  const { statuses: salesOrderStatuses, loading: soStatusesLoading, updateStatuses: updateSOStatuses } = useSalesOrderStatuses(organizationSlug);
  const { statuses: quotationStatuses, loading: qtStatusesLoading, updateStatuses: updateQtStatuses } = useQuotationStatuses(organizationSlug);
  const { statuses: deliveryOrderStatuses, loading: doStatusesLoading, updateStatuses: updateDOStatuses } = useDeliveryOrderStatuses(organizationSlug);
  const { statuses: invoiceStatuses, loading: invStatusesLoading, updateStatuses: updateInvStatuses } = useInvoiceStatuses(organizationSlug);

  const {
    settings: quotationSettings,
    updateSettings: updateQuotationSettings,
  } = useQuotationSettings(organizationSlug);
  const {
    settings: deliveryOrderSettings,
    updateSettings: updateDeliveryOrderSettings,
  } = useDeliveryOrderSettings(organizationSlug);
  const {
    settings: invoiceSettings,
    updateSettings: updateInvoiceSettings,
  } = useInvoiceSettings(organizationSlug);

  const [formData, setFormData] = useState({
    salesOrder: {
      order_code_format: 'SO-{YYMM}-{5digits}',
      reset_period: 'monthly',
      default_tax_rate: 0,
      sales_order_visibility: 'organization',
      enable_sales_teams: false,
    },
    quotation: {
      order_code_format: 'QT-{YYMM}-{5digits}',
      reset_period: 'monthly',
      default_tax_rate: 0,
      sales_order_visibility: 'organization',
      enable_sales_teams: false,
    },
    deliveryOrder: {
      order_code_format: 'DO-{YYMM}-{5digits}',
      reset_period: 'monthly',
      sales_order_visibility: 'organization',
      enable_sales_teams: false,
    },
    invoice: {
      order_code_format: 'INV-{YYMM}-{5digits}',
      reset_period: 'monthly',
      default_tax_rate: 0,
      sales_order_visibility: 'organization',
      enable_sales_teams: false,
    },
    salesOrderStatuses: [],
    quotationStatuses: [],
    deliveryOrderStatuses: [],
    invoiceStatuses: [],
  });

  const [preview, setPreview] = useState({ salesOrder: '', quotation: '', deliveryOrder: '', invoice: '' });
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [viewMode, setViewMode] = useState('settings'); // 'settings' or 'templates'
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const getPreviewString = (previewValue) => {
    if (typeof previewValue === 'string') return previewValue;
    if (typeof previewValue === 'object' && previewValue?.preview) return previewValue.preview;
    return '';
  };

  // Load settings
  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        salesOrder: {
          order_code_format: settings.order_code_format || 'SO-{YYMM}-{5digits}',
          reset_period: settings.reset_period || 'monthly',
          default_tax_rate: settings.default_tax_rate || 0,
          sales_order_visibility: settings.sales_order_visibility || 'organization',
          enable_sales_teams: settings.enable_sales_teams || false,
        }
      }));
    }
  }, [settings]);

  useEffect(() => {
    if (quotationSettings) {
      setFormData(prev => ({
        ...prev,
        quotation: {
          order_code_format: quotationSettings.order_code_format || 'QT-{YYMM}-{5digits}',
          reset_period: quotationSettings.reset_period || 'monthly',
          default_tax_rate: quotationSettings.default_tax_rate || 0,
          sales_order_visibility: quotationSettings.sales_order_visibility || 'organization',
          enable_sales_teams: quotationSettings.enable_sales_teams || false,
        }
      }));
    }
  }, [quotationSettings]);

  useEffect(() => {
    if (deliveryOrderSettings) {
      setFormData(prev => ({
        ...prev,
        deliveryOrder: {
          order_code_format: deliveryOrderSettings.order_code_format || 'DO-{YYMM}-{5digits}',
          reset_period: deliveryOrderSettings.reset_period || 'monthly',
          sales_order_visibility: deliveryOrderSettings.sales_order_visibility || 'organization',
          enable_sales_teams: deliveryOrderSettings.enable_sales_teams || false,
        }
      }));
    }
  }, [deliveryOrderSettings]);

  useEffect(() => {
    if (invoiceSettings) {
      setFormData(prev => ({
        ...prev,
        invoice: {
          order_code_format: invoiceSettings.order_code_format || 'INV-{YYMM}-{5digits}',
          reset_period: invoiceSettings.reset_period || 'monthly',
          default_tax_rate: invoiceSettings.default_tax_rate || 0,
          sales_order_visibility: invoiceSettings.sales_order_visibility || 'organization',
          enable_sales_teams: invoiceSettings.enable_sales_teams || false,
        }
      }));
    }
  }, [invoiceSettings]);

  useEffect(() => {
    if (salesOrderStatuses) {
      setFormData(prev => ({ ...prev, salesOrderStatuses }));
    }
  }, [salesOrderStatuses]);

  useEffect(() => {
    if (quotationStatuses) {
      setFormData(prev => ({ ...prev, quotationStatuses }));
    }
  }, [quotationStatuses]);

  useEffect(() => {
    if (deliveryOrderStatuses) {
      setFormData(prev => ({ ...prev, deliveryOrderStatuses }));
    }
  }, [deliveryOrderStatuses]);

  useEffect(() => {
    if (invoiceStatuses) {
      setFormData(prev => ({ ...prev, invoiceStatuses }));
    }
  }, [invoiceStatuses]);

  // Auto-preview formats
  useEffect(() => {
    const updatePreview = async () => {
      if (formData.salesOrder.order_code_format) {
        try {
          const response = await fetch('/api/settings/preview_format', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ format: formData.salesOrder.order_code_format, counter: 1 }),
          });
          if (response.ok) {
            const data = await response.json();
            setPreview(prev => ({ ...prev, salesOrder: typeof data === 'string' ? data : (data?.preview || 'Invalid') }));
          }
        } catch (error) {
          console.error('Error previewing sales order format:', error);
        }
      }
    };
    updatePreview();
  }, [formData.salesOrder.order_code_format]);

  useEffect(() => {
    const updatePreview = async () => {
      if (formData.quotation.order_code_format) {
        try {
          const response = await fetch('/api/quotation_settings/preview_format', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ format: formData.quotation.order_code_format, counter: 1 }),
          });
          if (response.ok) {
            const data = await response.json();
            setPreview(prev => ({ ...prev, quotation: typeof data === 'string' ? data : (data?.preview || 'Invalid') }));
          }
        } catch (error) {
          console.error('Error previewing quotation format:', error);
        }
      }
    };
    updatePreview();
  }, [formData.quotation.order_code_format]);

  useEffect(() => {
    const updatePreview = async () => {
      if (formData.deliveryOrder.order_code_format) {
        try {
          const response = await fetch('/api/delivery_order_settings/preview_format', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ format: formData.deliveryOrder.order_code_format, counter: 1 }),
          });
          if (response.ok) {
            const data = await response.json();
            setPreview(prev => ({ ...prev, deliveryOrder: typeof data === 'string' ? data : (data?.preview || 'Invalid') }));
          }
        } catch (error) {
          console.error('Error previewing delivery order format:', error);
        }
      }
    };
    updatePreview();
  }, [formData.deliveryOrder.order_code_format]);

  useEffect(() => {
    const updatePreview = async () => {
      if (formData.invoice.order_code_format) {
        try {
          const response = await fetch('/api/invoice_settings/preview_format', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ format: formData.invoice.order_code_format, counter: 1 }),
          });
          if (response.ok) {
            const data = await response.json();
            setPreview(prev => ({ ...prev, invoice: typeof data === 'string' ? data : (data?.preview || 'Invalid') }));
          }
        } catch (error) {
          console.error('Error previewing invoice format:', error);
        }
      }
    };
    updatePreview();
  }, [formData.invoice.order_code_format]);

  const executeSave = async () => {
    setSaving(true);
    setShowSuccess(false);

    try {
      await Promise.all([
        onSave(formData.salesOrder),
        updateQuotationSettings(formData.quotation),
        updateDeliveryOrderSettings(formData.deliveryOrder),
        updateInvoiceSettings(formData.invoice),
        updateSOStatuses(formData.salesOrderStatuses),
        updateQtStatuses(formData.quotationStatuses),
        updateDOStatuses(formData.deliveryOrderStatuses),
        updateInvStatuses(formData.invoiceStatuses),
      ]);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = (e) => {
    e.preventDefault();
    setConfirmDialog({
      isOpen: true,
      title: 'Save Settings',
      message: 'Are you sure you want to save all changes to the settings?',
      onConfirm: executeSave,
    });
  };

  const updateField = (docType, field, value) => {
    setFormData(prev => ({
      ...prev,
      [docType]: { ...prev[docType], [field]: value }
    }));
  };

  return (
    <div className="w-full">
      {/* Header with Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg mb-3">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">Settings</h2>
            <p className="text-[10px] text-gray-500">Configure sales management</p>
          </div>
          {viewMode === 'settings' && (
            <div className="flex items-center gap-2">
              {showSuccess && (
                <span className="text-xs font-medium text-green-600 flex items-center gap-1 animate-fade-in">
                  <CheckCircle size={14} />
                  Saved!
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 text-xs font-medium"
              >
                <Save size={14} />
                {saving ? 'Saving...' : 'Save All'}
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setViewMode('settings')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              viewMode === 'settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            General Settings
          </button>
          <button
            onClick={() => setViewMode('templates')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              viewMode === 'templates'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <FileText size={16} />
            PDF Templates
          </button>
        </div>
      </div>

      {/* Conditional Content */}
      {viewMode === 'settings' ? (
        <form onSubmit={handleSaveAll} className="w-full">
          {/* 2-Column Grid Layout */}
          <div className="grid grid-cols-2 gap-4">
            <DocumentTypeCard
              title="Quotation"
              color="blue"
              formData={formData.quotation}
              preview={preview.quotation}
              statuses={formData.quotationStatuses}
              onUpdateField={(field, value) => updateField('quotation', field, value)}
              onUpdateStatuses={(newStatuses) => setFormData(prev => ({ ...prev, quotationStatuses: newStatuses }))}
              statusesLoading={qtStatusesLoading}
              showVisibility={true}
              showTaxRate={true}
              getPreviewString={getPreviewString}
            />

            <DocumentTypeCard
              title="Sales Order"
              color="green"
              formData={formData.salesOrder}
              preview={preview.salesOrder}
              statuses={formData.salesOrderStatuses}
              onUpdateField={(field, value) => updateField('salesOrder', field, value)}
              onUpdateStatuses={(newStatuses) => setFormData(prev => ({ ...prev, salesOrderStatuses: newStatuses }))}
              statusesLoading={soStatusesLoading}
              showVisibility={true}
              showTaxRate={true}
              getPreviewString={getPreviewString}
            />

            <DocumentTypeCard
              title="Delivery Order"
              color="yellow"
              formData={formData.deliveryOrder}
              preview={preview.deliveryOrder}
              statuses={formData.deliveryOrderStatuses}
              onUpdateField={(field, value) => updateField('deliveryOrder', field, value)}
              onUpdateStatuses={(newStatuses) => setFormData(prev => ({ ...prev, deliveryOrderStatuses: newStatuses }))}
              statusesLoading={doStatusesLoading}
              showVisibility={true}
              showTaxRate={false}
              getPreviewString={getPreviewString}
            />

            <DocumentTypeCard
              title="Invoice"
              color="purple"
              formData={formData.invoice}
              preview={preview.invoice}
              statuses={formData.invoiceStatuses}
              onUpdateField={(field, value) => updateField('invoice', field, value)}
              onUpdateStatuses={(newStatuses) => setFormData(prev => ({ ...prev, invoiceStatuses: newStatuses }))}
              statusesLoading={invStatusesLoading}
              showVisibility={true}
              showTaxRate={true}
              getPreviewString={getPreviewString}
            />
          </div>
        </form>
      ) : (
        <TemplatesView organizationSlug={organizationSlug} />
      )}

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

// Compact Document Type Card with 2-column internal layout
function DocumentTypeCard({
  title,
  color,
  formData,
  preview,
  statuses,
  onUpdateField,
  onUpdateStatuses,
  statusesLoading,
  showVisibility,
  showTaxRate,
  getPreviewString
}) {
  const [expandedSections, setExpandedSections] = useState({
    status: false,
    visibility: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const colorClasses = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', hover: 'hover:bg-blue-50' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', hover: 'hover:bg-green-50' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', hover: 'hover:bg-yellow-50' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', hover: 'hover:bg-purple-50' },
  };

  const colors = colorClasses[color];

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className={`px-2 py-1.5 border-b ${colors.border} ${colors.bg}`}>
        <h3 className={`text-xs font-bold uppercase tracking-wide ${colors.text}`}>{title}</h3>
      </div>

      <div className="p-2 space-y-2">
        {/* Number Format Section - Compact 2-column */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-medium text-gray-500 mb-0.5 uppercase">Format</label>
            <input
              type="text"
              value={formData.order_code_format}
              onChange={(e) => onUpdateField('order_code_format', e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-gray-900"
            />
            {getPreviewString(preview) && (
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">→ {getPreviewString(preview)}</p>
            )}
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-0.5 uppercase">Reset</label>
              <select
                value={formData.reset_period}
                onChange={(e) => onUpdateField('reset_period', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-gray-900"
              >
                <option value="never">Never</option>
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {showTaxRate && (
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-0.5 uppercase">Tax %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.default_tax_rate}
                  onChange={(e) => onUpdateField('default_tax_rate', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-gray-900"
                />
              </div>
            )}
          </div>
        </div>

        {/* Status Configuration - Collapsible */}
        <div className="border-t pt-2">
          <button
            type="button"
            onClick={() => toggleSection('status')}
            className="flex items-center justify-between w-full text-left hover:bg-gray-50 -mx-1 px-1 py-0.5 rounded"
          >
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Status Workflow</span>
            {expandedSections.status ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {expandedSections.status && (
            <div className="mt-2">
              <StatusConfigurationPanel
                statuses={statuses}
                onSave={onUpdateStatuses}
                loading={statusesLoading}
                embedded={true}
              />
            </div>
          )}
        </div>

        {/* Visibility - Collapsible */}
        {showVisibility && (
          <div className="border-t pt-2">
            <button
              type="button"
              onClick={() => toggleSection('visibility')}
              className="flex items-center justify-between w-full text-left hover:bg-gray-50 -mx-1 px-1 py-0.5 rounded"
            >
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Visibility</span>
              {expandedSections.visibility ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {expandedSections.visibility && (
              <div className="mt-2 space-y-1">
                <label className={`flex items-start gap-2 p-1.5 border rounded cursor-pointer transition-colors ${colors.hover}`}>
                  <input
                    type="radio"
                    name={`${title}-visibility`}
                    value="organization"
                    checked={formData.sales_order_visibility === 'organization'}
                    onChange={(e) => onUpdateField('sales_order_visibility', e.target.value)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-900">Organization</div>
                    <div className="text-xs text-gray-500">All can view</div>
                  </div>
                </label>

                <label className={`flex items-start gap-2 p-1.5 border rounded cursor-pointer transition-colors ${colors.hover}`}>
                  <input
                    type="radio"
                    name={`${title}-visibility`}
                    value="assigned_only"
                    checked={formData.sales_order_visibility === 'assigned_only'}
                    onChange={(e) => onUpdateField('sales_order_visibility', e.target.value)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-900">Assigned Only</div>
                    <div className="text-xs text-gray-500">Own only</div>
                  </div>
                </label>

                <label className={`flex items-start gap-2 p-1.5 border rounded cursor-pointer transition-colors ${colors.hover}`}>
                  <input
                    type="radio"
                    name={`${title}-visibility`}
                    value="team_based"
                    checked={formData.sales_order_visibility === 'team_based'}
                    onChange={(e) => onUpdateField('sales_order_visibility', e.target.value)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-900">Team-Based</div>
                    <div className="text-xs text-gray-500">Own + team</div>
                  </div>
                </label>

                {formData.sales_order_visibility === 'team_based' && (
                  <div className="pl-5 pt-1">
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={formData.enable_sales_teams}
                        onChange={(e) => onUpdateField('enable_sales_teams', e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span className="text-xs text-gray-700">Enable Teams</span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
