import React, { useState, useEffect } from 'react';
import { useTemplates } from '../../hooks/useTemplates';
import TemplateList from './TemplateList';
import { TemplateBuilderV2 } from './TemplateBuilderV2';

/**
 * TemplatesView - Main view for managing all document templates
 * Organized by document type with tabbed interface
 */
export default function TemplatesView({ organizationSlug }) {
  const [activeTab, setActiveTab] = useState('quotation');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingDocumentType, setEditingDocumentType] = useState(null);
  const [initializing, setInitializing] = useState(false);
  const [initLoading, setInitLoading] = useState(false);

  const {
    templates: allTemplates,
    loading,
    createTemplate,
    updateTemplate,
    initializeDefaultTemplates
  } = useTemplates(organizationSlug);

  const documentTypes = [
    { key: 'quotation', label: 'Quotations', icon: '📋' },
    { key: 'sales_order', label: 'Sales Orders', icon: '📦' },
    { key: 'delivery_order', label: 'Delivery Orders', icon: '🚚' },
    { key: 'invoice', label: 'Invoices', icon: '🧾' },
  ];

  // Check if templates need initialization
  useEffect(() => {
    if (!loading && allTemplates.length === 0) {
      // No templates exist - show initialization message
      setInitializing(true);
    }
  }, [loading, allTemplates]);

  const handleInitialize = async () => {
    console.log('[TemplatesView] handleInitialize called');
    console.log('[TemplatesView] organizationSlug:', organizationSlug);

    const confirmed = window.confirm('Initialize default templates for all document types? This will create 4 templates (one for each document type).');
    console.log('[TemplatesView] User confirmed:', confirmed);

    if (!confirmed) {
      return;
    }

    setInitLoading(true);
    console.log('[TemplatesView] Starting initialization...');

    try {
      console.log('[TemplatesView] Calling initializeDefaultTemplates()');
      const result = await initializeDefaultTemplates();
      console.log('[TemplatesView] initializeDefaultTemplates() result:', result);
      console.log('[TemplatesView] Templates initialized successfully');
      setInitializing(false);
      console.log('[TemplatesView] Set initializing to false');
    } catch (error) {
      console.error('[TemplatesView] Failed to initialize templates:', error);
      console.error('[TemplatesView] Error message:', error.message);
      console.error('[TemplatesView] Error stack:', error.stack);

      // Use setTimeout to prevent alert from being immediately closed by re-render
      setTimeout(() => {
        alert(`Failed to initialize templates:\n\n${error.message}\n\nCheck the browser console for more details.`);
      }, 100);
    } finally {
      console.log('[TemplatesView] Finally block - setting initLoading to false');
      setInitLoading(false);
    }
  };

  const handleEdit = (templateId, documentType) => {
    if (templateId) {
      // Edit existing template
      const template = allTemplates.find(t => t.id === templateId);
      setEditingTemplate(template);
      setEditingDocumentType(template.document_type);
    } else {
      // Create new template
      setEditingTemplate(null);
      setEditingDocumentType(documentType);
    }
  };

  const handleSave = async (templateData) => {
    try {
      if (editingTemplate) {
        // Update existing
        await updateTemplate(editingTemplate.id, templateData);
      } else {
        // Create new
        await createTemplate({
          ...templateData,
          document_type: editingDocumentType
        });
      }
      setEditingTemplate(null);
      setEditingDocumentType(null);
    } catch (error) {
      throw error; // Let TemplateEditor handle the error display
    }
  };

  const handleClose = () => {
    // Just close - the TemplateBuilderView handles its own confirmation
    setEditingTemplate(null);
    setEditingDocumentType(null);
  };

  // Show initialization screen if no templates exist
  if (initializing) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <div className="max-w-lg mx-auto">
          <div className="text-gray-400 mb-6">
            <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            No Templates Found
          </h3>
          <p className="text-gray-600 mb-8">
            Get started by initializing default templates for all document types.
            You can customize them later to match your brand.
          </p>
          <button
            onClick={handleInitialize}
            disabled={initLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {initLoading ? 'Initializing...' : 'Initialize Default Templates'}
          </button>
          <p className="text-sm text-gray-500 mt-4">
            This will create 4 templates: Quotation, Sales Order, Delivery Order, and Invoice
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1">
          {documentTypes.map(type => (
            <button
              key={type.key}
              onClick={() => setActiveTab(type.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === type.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Template List for Active Tab */}
      <TemplateList
        documentType={activeTab}
        organizationSlug={organizationSlug}
        onEdit={handleEdit}
      />

      {/* Template Builder Modal */}
      {editingDocumentType && (
        <TemplateBuilderV2
          template={editingTemplate}
          documentType={editingDocumentType}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
