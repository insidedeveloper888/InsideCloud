/**
 * SectionRenderer - Sortable Section on Canvas
 *
 * Renders a section with drag handle, edit, and delete buttons.
 */
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2, ArrowDown } from 'lucide-react';

export function SectionRenderer({ section, onEdit, onDelete, isActive, onMoveToNewRow, showLayoutControls }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: section.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  // Get section label
  const getSectionLabel = (type) => {
    const labels = {
      header: 'Header',
      title: 'Title',
      documentDetails: 'Document Details',
      itemsTable: 'Items Table',
      totals: 'Totals',
      notes: 'Notes',
      signatures: 'Signatures',
      footer: 'Footer',
      watermark: 'Watermark'
    };
    return labels[type] || type;
  };

  // Get section preview
  const getSectionPreview = (section) => {
    const { type, config } = section;

    switch (type) {
      case 'header':
        return (
          <div
            className="p-4 rounded"
            style={{ backgroundColor: config.backgroundColor || '#f8f9fa' }}
          >
            <div className="text-sm font-medium text-gray-700">
              {config.showLogo && config.logoUrl && <span>🖼️ Logo | </span>}
              {config.showCompanyName && (config.companyName || 'Company Name')}
            </div>
          </div>
        );

      case 'title':
        return (
          <div
            className="p-4 rounded"
            style={{
              textAlign: config.textAlign || 'center',
              fontSize: `${config.fontSize || 24}px`,
              fontWeight: config.fontWeight || 'bold',
              color: config.color || '#000000'
            }}
          >
            {config.text || 'DOCUMENT TITLE'}
          </div>
        );

      case 'documentDetails':
        return (
          <div className="p-4 rounded bg-gray-50">
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
              {config.fields?.map((field, i) => (
                <div key={i}>
                  <span className="font-medium">{field}:</span> Value
                </div>
              ))}
            </div>
          </div>
        );

      case 'itemsTable':
        return (
          <div className="p-4 rounded bg-gray-50">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: config.headerBackgroundColor || '#f8f9fa' }}>
                <tr>
                  {config.columns?.map((col, i) => (
                    <th key={i} className="text-left p-2 border">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {config.columns?.map((col, i) => (
                    <td key={i} className="p-2 border text-gray-600">Sample</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'totals':
        return (
          <div className="p-4 rounded bg-gray-50">
            <div className="space-y-1 text-sm text-right max-w-xs ml-auto">
              {config.showSubtotal && <div>Subtotal: $0.00</div>}
              {config.showTax && <div>Tax ({config.taxRate || 0}%): $0.00</div>}
              {config.showDiscount && <div>Discount ({config.discountRate || 0}%): $0.00</div>}
              {config.showTotal && <div className="font-bold border-t pt-1">Total: $0.00</div>}
            </div>
          </div>
        );

      case 'notes':
        return (
          <div className="p-4 rounded bg-gray-50">
            <div className="text-sm">
              <div className="font-medium mb-1">{config.title || 'Notes'}</div>
              <div className="text-gray-600" style={{ fontSize: `${config.fontSize || 12}px` }}>
                {config.content || 'Note content...'}
              </div>
            </div>
          </div>
        );

      case 'signatures':
        return (
          <div className="p-4 rounded bg-gray-50">
            <div className={`flex ${config.layout === 'horizontal' ? 'gap-6' : 'flex-col gap-4'}`}>
              {Array.from({ length: config.signatureCount || 1 }).map((_, i) => (
                <div key={i} className="flex-1">
                  <div
                    className="border-b-2"
                    style={{
                      borderColor: config.lineColor || '#000000',
                      height: `${config.lineHeight || 60}px`
                    }}
                  />
                  <div className="mt-2 text-sm text-gray-600">
                    {config.signatures?.[i]?.label || 'Signature'}
                    {config.signatures?.[i]?.includeDate && <span className="ml-4">Date: _____</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'footer':
        return (
          <div
            className="p-4 rounded"
            style={{
              backgroundColor: config.backgroundColor || '#f8f9fa',
              textAlign: config.textAlign || 'center',
              fontSize: `${config.fontSize || 10}px`
            }}
          >
            {config.text || 'Footer Text'}
          </div>
        );

      case 'watermark':
        return (
          <div className="p-4 rounded bg-gray-50 relative">
            <div
              className="text-gray-400"
              style={{
                opacity: config.opacity || 0.1,
                fontSize: `${config.fontSize || 72}px`,
                transform: `rotate(${config.rotation || -45}deg)`,
                textAlign: 'center'
              }}
            >
              {config.text || 'WATERMARK'}
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 rounded bg-gray-50 text-sm text-gray-500">
            {getSectionLabel(type)} Section
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white border-2 rounded-lg overflow-hidden
        ${isActive ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 p-2 bg-gray-50 border-b">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>

        <div className="flex-1 text-sm font-medium text-gray-900">
          {getSectionLabel(section.type)}
        </div>

        <button
          onClick={onEdit}
          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
          title="Edit Section"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <button
          onClick={onDelete}
          className="p-1 text-red-600 hover:bg-red-50 rounded"
          title="Delete Section"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {showLayoutControls && onMoveToNewRow && !section.newRow && (
          <button
            onClick={onMoveToNewRow}
            className="p-1 text-purple-600 hover:bg-purple-50 rounded"
            title="Move to New Row"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Section Preview */}
      <div className="p-2">
        {getSectionPreview(section)}
      </div>
    </div>
  );
}
