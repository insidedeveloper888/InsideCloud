/**
 * PropertyPanel - Edit Selected Section
 *
 * Right panel for editing section properties.
 */
import React from 'react';
import { X } from 'lucide-react';
import { HeaderEditor } from './editors/HeaderEditor';
import { TitleEditor } from './editors/TitleEditor';
import { DocumentDetailsEditor } from './editors/DocumentDetailsEditor';
import { ItemsTableEditor } from './editors/ItemsTableEditor';
import { TotalsEditor } from './editors/TotalsEditor';
import { NotesEditor } from './editors/NotesEditor';
import { SignatureEditor } from './editors/SignatureEditor';
import { FooterEditor } from './editors/FooterEditor';
import { WatermarkEditor } from './editors/WatermarkEditor';

export function PropertyPanel({ section, onUpdateConfig, onClose }) {
  if (!section) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="mb-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
            <span className="text-3xl">✏️</span>
          </div>
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          No Section Selected
        </h3>
        <p className="text-xs text-gray-500">
          Click the edit icon on any section to configure its properties.
        </p>
      </div>
    );
  }

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

  // Render appropriate editor based on section type
  const renderEditor = () => {
    const { type, config } = section;

    const editorProps = {
      config,
      onChange: onUpdateConfig
    };

    switch (type) {
      case 'header':
        return <HeaderEditor {...editorProps} />;
      case 'title':
        return <TitleEditor {...editorProps} />;
      case 'documentDetails':
        return <DocumentDetailsEditor {...editorProps} />;
      case 'itemsTable':
        return <ItemsTableEditor {...editorProps} />;
      case 'totals':
        return <TotalsEditor {...editorProps} />;
      case 'notes':
        return <NotesEditor {...editorProps} />;
      case 'signatures':
        return <SignatureEditor {...editorProps} />;
      case 'footer':
        return <FooterEditor {...editorProps} />;
      case 'watermark':
        return <WatermarkEditor {...editorProps} />;
      default:
        return (
          <div className="text-sm text-gray-500">
            No editor available for this section type.
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-sm font-semibold text-gray-900">
          Edit {getSectionLabel(section.type)}
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-gray-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderEditor()}
      </div>
    </div>
  );
}
