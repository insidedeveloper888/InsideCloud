/**
 * TemplateBuilderView - Visual Drag-and-Drop Template Builder
 *
 * Three-panel layout:
 * 1. Section Library (left) - Draggable section cards
 * 2. Canvas (center) - Drop zone with visual preview
 * 3. Property Panel (right) - Edit selected section
 */
import React, { useState } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { SectionLibrary } from './SectionLibrary/LibrarySidebar';
import { FlexibleCanvas } from './Canvas/FlexibleCanvas';
import { PropertyPanel } from './PropertyPanel/PanelContainer';
import { FormInput } from './ui/FormInput';
import { ConfirmDialog } from '../../../../components/ui/confirm-dialog';
import { X, Save } from 'lucide-react';

export function TemplateBuilderView({ template, onSave, onClose, documentType }) {
  // Template metadata
  const [templateName, setTemplateName] = useState(template?.name || '');

  // Section management
  const [sections, setSections] = useState(
    template?.config?.sections || []
  );

  // Active section for editing
  const [activeSection, setActiveSection] = useState(null);

  // Drag state
  const [activeDragId, setActiveDragId] = useState(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Generate unique section ID
  const generateSectionId = (type) => {
    return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Create default config for section type
  const createDefaultConfig = (type) => {
    const defaults = {
      header: {
        enabled: true,
        height: 100,
        backgroundColor: '#f8f9fa',
        logoUrl: '',
        companyName: '',
        showLogo: true,
        showCompanyName: true
      },
      title: {
        enabled: true,
        text: 'QUOTATION',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#000000'
      },
      documentDetails: {
        enabled: true,
        fields: ['documentNumber', 'date', 'customerName', 'validUntil'],
        layout: 'twoColumn'
      },
      itemsTable: {
        enabled: true,
        columns: ['item', 'description', 'quantity', 'unitPrice', 'amount'],
        showBorders: true,
        headerBackgroundColor: '#f8f9fa'
      },
      totals: {
        enabled: true,
        showSubtotal: true,
        showTax: true,
        showDiscount: true,
        showTotal: true,
        taxRate: 0,
        discountRate: 0
      },
      notes: {
        enabled: true,
        title: 'Notes',
        content: 'Thank you for your business.',
        fontSize: 12
      },
      signatures: {
        enabled: true,
        signatureCount: 1,
        signatures: [
          {
            label: 'Authorized By',
            includeDate: true
          }
        ],
        layout: 'horizontal',
        lineHeight: 60,
        lineColor: '#000000'
      },
      footer: {
        enabled: true,
        height: 50,
        backgroundColor: '#f8f9fa',
        text: 'Company Address | Phone | Email',
        fontSize: 10,
        textAlign: 'center'
      },
      watermark: {
        enabled: false,
        text: 'DRAFT',
        opacity: 0.1,
        fontSize: 72,
        rotation: -45
      }
    };

    return defaults[type] || {};
  };

  // Handle drag start
  const handleDragStart = (event) => {
    setActiveDragId(event.active.id);
  };

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;

    setActiveDragId(null);

    if (!over) return;

    // Dropping from library to canvas
    if (active.id.startsWith('library-')) {
      const sectionType = active.id.replace('library-', '');
      const newSection = {
        id: generateSectionId(sectionType),
        type: sectionType,
        config: createDefaultConfig(sectionType),
        enabled: true,
        newRow: true, // Start on new row by default
        width: 100 // Full width by default
      };

      setSections(prev => [...prev, newSection]);
    }

    // Reordering within canvas (handled by SortableContext in Canvas)
  };

  // Handle section edit
  const handleEditSection = (section) => {
    setActiveSection(section);
  };

  // Handle section delete
  const handleDeleteSection = (sectionId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Section',
      message: 'Are you sure you want to delete this section? This action cannot be undone.',
      onConfirm: () => {
        setSections(prev => prev.filter(s => s.id !== sectionId));
        if (activeSection?.id === sectionId) {
          setActiveSection(null);
        }
      }
    });
  };

  // Handle section config update
  const handleUpdateSectionConfig = (sectionId, newConfig) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, config: newConfig } : s
    ));

    // Update active section if it's the one being edited
    if (activeSection?.id === sectionId) {
      setActiveSection(prev => ({ ...prev, config: newConfig }));
    }
  };

  // Handle section reorder
  const handleReorderSections = (newSections) => {
    setSections(newSections);
  };

  // Handle save
  const handleSave = () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    const templateData = {
      name: templateName,
      document_type: documentType,
      config: {
        sections: sections.map((s, index) => ({
          id: s.id,
          type: s.type,
          order: index,
          config: s.config,
          enabled: s.enabled !== false
        }))
      }
    };

    onSave(templateData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-xl font-semibold text-gray-900">Template Builder</h2>
            <FormInput
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template Name"
              className="max-w-md"
            />
            <span className="text-sm text-gray-500">{documentType}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Template
            </button>
            <button
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  title: 'Close Template Builder',
                  message: 'Are you sure you want to close? Any unsaved changes will be lost.',
                  onConfirm: onClose
                });
              }}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content - Three Panel Layout */}
        <div className="flex-1 flex overflow-hidden">
          <DndContext
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Left Panel - Section Library */}
            <div className="w-64 border-r bg-gray-50 overflow-y-auto">
              <SectionLibrary />
            </div>

            {/* Center Panel - Canvas */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
              <FlexibleCanvas
                sections={sections}
                onEditSection={handleEditSection}
                onDeleteSection={handleDeleteSection}
                onReorderSections={handleReorderSections}
                activeSection={activeSection}
              />
            </div>

            {/* Right Panel - Property Panel */}
            <div className="w-80 border-l bg-white overflow-y-auto">
              <PropertyPanel
                section={activeSection}
                onUpdateConfig={(newConfig) => {
                  if (activeSection) {
                    handleUpdateSectionConfig(activeSection.id, newConfig);
                  }
                }}
                onClose={() => setActiveSection(null)}
              />
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeDragId ? (
                <div className="bg-white border-2 border-blue-500 rounded-lg p-4 shadow-lg">
                  <div className="text-sm font-medium text-gray-900">
                    {activeDragId.replace('library-', '').replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
          variant="danger"
          confirmText="Yes, Proceed"
          cancelText="Cancel"
        />
      </div>
    </div>
  );
}
