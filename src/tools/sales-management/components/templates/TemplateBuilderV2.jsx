/**
 * TemplateBuilderV2 - pdfme-style Absolute Positioning Template Builder
 *
 * Features:
 * - Absolute positioning with x, y coordinates
 * - Drag and drop components
 * - Resize handles
 * - Grid snapping
 * - Alignment guides
 * - Data mapping
 */
import React, { useState } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { ComponentLibrary } from './SectionLibrary/ComponentLibrary';
import { AbsoluteCanvas } from './Canvas/AbsoluteCanvas';
import { ComponentPropertyPanel } from './PropertyPanel/ComponentPropertyPanel';
import { FormInput } from './ui/FormInput';
import { ConfirmDialog } from '../../../../components/ui/confirm-dialog';
import { X, Save, Grid, Ruler } from 'lucide-react';

export function TemplateBuilderV2({ template, onSave, onClose, documentType }) {
  // Template metadata
  const [templateName, setTemplateName] = useState(template?.name || '');

  // Components with absolute positioning
  const [components, setComponents] = useState(
    template?.config?.components || []
  );

  // Selected component for editing
  const [selectedComponent, setSelectedComponent] = useState(null);

  // Drag state
  const [activeDragId, setActiveDragId] = useState(null);

  // View options
  const [showGrid, setShowGrid] = useState(true);
  const [showRuler, setShowRuler] = useState(true);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Generate unique component ID
  const generateComponentId = (type) => {
    return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Create default config for component type
  const createDefaultConfig = (type) => {
    const defaults = {
      text: {
        fontSize: 14,
        fontWeight: 'normal',
        textAlign: 'left',
        color: '#000000'
      },
      multiline: {
        fontSize: 12,
        lineHeight: 1.5
      },
      number: {
        fontSize: 14,
        format: 'number', // 'number', 'currency', 'percentage'
        decimals: 2
      },
      date: {
        fontSize: 12,
        format: 'YYYY-MM-DD' // Date format
      },
      image: {
        fit: 'contain', // 'contain', 'cover', 'fill'
        logoUrl: ''
      },
      table: {
        columns: [],
        headerBackgroundColor: '#f8f9fa',
        showBorders: true
      },
      qrcode: {
        size: 100,
        errorCorrection: 'M'
      },
      barcode: {
        format: 'CODE128',
        displayValue: true
      },
      signature: {
        lineColor: '#000000',
        showLabel: true,
        label: 'Signature'
      },
      checkbox: {
        checked: false
      },
      label: {
        text: 'Label Text',
        fontSize: 14,
        fontWeight: 'normal',
        textAlign: 'left',
        color: '#000000'
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
    if (active.id.startsWith('component-')) {
      const componentType = active.id.replace('component-', '');
      const { defaultWidth, defaultHeight } = active.data.current;

      const newComponent = {
        id: generateComponentId(componentType),
        type: componentType,
        x: 50, // Default position
        y: 50 + (components.length * 20), // Stagger components
        width: defaultWidth,
        height: defaultHeight,
        dataKey: '', // Will be set in property panel
        config: createDefaultConfig(componentType)
      };

      setComponents(prev => [...prev, newComponent]);
      setSelectedComponent(newComponent);
    }
  };

  // Handle component update
  const handleUpdateComponent = (componentId, updatedComponent) => {
    setComponents(prev => prev.map(c =>
      c.id === componentId ? updatedComponent : c
    ));

    // Update selected component if it's the one being updated
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(updatedComponent);
    }
  };

  // Handle component delete
  const handleDeleteComponent = (componentId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Component',
      message: 'Are you sure you want to delete this component? This action cannot be undone.',
      onConfirm: () => {
        setComponents(prev => prev.filter(c => c.id !== componentId));
        if (selectedComponent?.id === componentId) {
          setSelectedComponent(null);
        }
      }
    });
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
        components: components.map(c => ({
          id: c.id,
          type: c.type,
          x: c.x,
          y: c.y,
          width: c.width,
          height: c.height,
          dataKey: c.dataKey,
          config: c.config
        }))
      }
    };

    onSave(templateData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-[98vw] max-h-[98vh] flex flex-col">
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
            {/* View Options */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded ${showGrid ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Toggle Grid"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowRuler(!showRuler)}
              className={`p-2 rounded ${showRuler ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Toggle Ruler"
            >
              <Ruler className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2" />

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
            {/* Left Panel - Component Library */}
            <div className="w-64 border-r bg-gray-50 overflow-y-auto">
              <ComponentLibrary />
            </div>

            {/* Center Panel - Canvas */}
            <div className="flex-1 overflow-auto bg-gray-100">
              <AbsoluteCanvas
                components={components}
                onUpdateComponent={handleUpdateComponent}
                onDeleteComponent={handleDeleteComponent}
                onSelectComponent={setSelectedComponent}
                selectedComponent={selectedComponent}
                showGrid={showGrid}
                showRuler={showRuler}
              />
            </div>

            {/* Right Panel - Property Panel */}
            <div className="w-80 border-l bg-white overflow-y-auto">
              <ComponentPropertyPanel
                component={selectedComponent}
                onUpdateComponent={(updated) => {
                  if (selectedComponent) {
                    handleUpdateComponent(selectedComponent.id, updated);
                  }
                }}
                onClose={() => setSelectedComponent(null)}
                documentType={documentType}
              />
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeDragId ? (
                <div className="bg-white border-2 border-blue-500 rounded-lg p-4 shadow-lg">
                  <div className="text-sm font-medium text-gray-900">
                    {activeDragId.replace('component-', '').replace(/([A-Z])/g, ' $1').trim()}
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
