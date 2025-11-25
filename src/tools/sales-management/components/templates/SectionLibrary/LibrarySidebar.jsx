/**
 * SectionLibrary - Draggable Section Cards
 *
 * Displays available template sections that can be dragged to the canvas.
 */
import React from 'react';
import { SectionCard } from './SectionCard';
import {
  FileText,
  Type,
  FileSignature,
  Table,
  DollarSign,
  MessageSquare,
  PenTool,
  AlignCenter,
  Droplet
} from 'lucide-react';

export function SectionLibrary() {
  const sections = [
    {
      type: 'header',
      label: 'Header',
      icon: <FileText className="w-5 h-5" />,
      description: 'Logo, company name, contact info'
    },
    {
      type: 'title',
      label: 'Title',
      icon: <Type className="w-5 h-5" />,
      description: 'Document title (e.g., QUOTATION)'
    },
    {
      type: 'documentDetails',
      label: 'Document Details',
      icon: <FileSignature className="w-5 h-5" />,
      description: 'Doc number, date, customer, etc.'
    },
    {
      type: 'itemsTable',
      label: 'Items Table',
      icon: <Table className="w-5 h-5" />,
      description: 'Line items with quantities and prices'
    },
    {
      type: 'totals',
      label: 'Totals',
      icon: <DollarSign className="w-5 h-5" />,
      description: 'Subtotal, tax, discount, grand total'
    },
    {
      type: 'notes',
      label: 'Notes',
      icon: <MessageSquare className="w-5 h-5" />,
      description: 'Terms, conditions, or remarks'
    },
    {
      type: 'signatures',
      label: 'Signatures',
      icon: <PenTool className="w-5 h-5" />,
      description: 'Signature lines with names and dates'
    },
    {
      type: 'footer',
      label: 'Footer',
      icon: <AlignCenter className="w-5 h-5" />,
      description: 'Footer text or page numbers'
    },
    {
      type: 'watermark',
      label: 'Watermark',
      icon: <Droplet className="w-5 h-5" />,
      description: 'Background text (DRAFT, CONFIDENTIAL)'
    }
  ];

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">
        Section Library
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Drag sections to the canvas
      </p>

      <div className="space-y-2">
        {sections.map((section) => (
          <SectionCard
            key={section.type}
            type={section.type}
            label={section.label}
            icon={section.icon}
            description={section.description}
          />
        ))}
      </div>
    </div>
  );
}
