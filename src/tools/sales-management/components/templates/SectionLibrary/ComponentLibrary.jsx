/**
 * ComponentLibrary - All available component types for drag-and-drop
 *
 * Component types with data mapping support
 */
import React from 'react';
import { ComponentCard } from './ComponentCard';
import {
  Type,
  AlignLeft,
  Hash,
  Calendar,
  Image as ImageIcon,
  Table,
  QrCode,
  Barcode,
  PenTool,
  CheckSquare,
  Tag
} from 'lucide-react';

export function ComponentLibrary() {
  const components = [
    {
      type: 'label',
      label: 'Label',
      icon: <Tag className="w-5 h-5" />,
      description: 'Fixed text label',
      defaultWidth: 200,
      defaultHeight: 30
    },
    {
      type: 'text',
      label: 'Text',
      icon: <Type className="w-5 h-5" />,
      description: 'Single-line text field',
      defaultWidth: 200,
      defaultHeight: 30
    },
    {
      type: 'multiline',
      label: 'Multiline Text',
      icon: <AlignLeft className="w-5 h-5" />,
      description: 'Multi-line text area',
      defaultWidth: 300,
      defaultHeight: 100
    },
    {
      type: 'number',
      label: 'Number',
      icon: <Hash className="w-5 h-5" />,
      description: 'Formatted numbers (currency, etc.)',
      defaultWidth: 150,
      defaultHeight: 30
    },
    {
      type: 'date',
      label: 'Date',
      icon: <Calendar className="w-5 h-5" />,
      description: 'Date with formatting',
      defaultWidth: 150,
      defaultHeight: 30
    },
    {
      type: 'image',
      label: 'Image',
      icon: <ImageIcon className="w-5 h-5" />,
      description: 'Logo, photo, or graphic',
      defaultWidth: 150,
      defaultHeight: 150
    },
    {
      type: 'table',
      label: 'Table',
      icon: <Table className="w-5 h-5" />,
      description: 'Dynamic table with rows',
      defaultWidth: 500,
      defaultHeight: 200
    },
    {
      type: 'qrcode',
      label: 'QR Code',
      icon: <QrCode className="w-5 h-5" />,
      description: 'Auto-generated QR code',
      defaultWidth: 100,
      defaultHeight: 100
    },
    {
      type: 'barcode',
      label: 'Barcode',
      icon: <Barcode className="w-5 h-5" />,
      description: 'Auto-generated barcode',
      defaultWidth: 200,
      defaultHeight: 60
    },
    {
      type: 'signature',
      label: 'Signature',
      icon: <PenTool className="w-5 h-5" />,
      description: 'E-signature field',
      defaultWidth: 200,
      defaultHeight: 60
    },
    {
      type: 'checkbox',
      label: 'Checkbox',
      icon: <CheckSquare className="w-5 h-5" />,
      description: 'True/False checkbox',
      defaultWidth: 30,
      defaultHeight: 30
    }
  ];

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">
        Component Library
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Drag components to canvas
      </p>

      <div className="space-y-2">
        {components.map((component) => (
          <ComponentCard
            key={component.type}
            {...component}
          />
        ))}
      </div>
    </div>
  );
}
