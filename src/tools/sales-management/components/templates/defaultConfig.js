/**
 * Default template configuration
 * Returns a base configuration for new templates
 */

export const getDefaultConfig = (documentType = 'quotation') => {
  const colors = {
    quotation: { primary: '#3B82F6', header: '#3B82F6' },
    sales_order: { primary: '#3B82F6', header: '#3B82F6' },
    delivery_order: { primary: '#10B981', header: '#10B981' },
    invoice: { primary: '#EF4444', header: '#EF4444' },
  };

  const color = colors[documentType] || colors.quotation;

  return {
    page: {
      size: 'A4',
      orientation: 'portrait',
      margins: { top: 50, right: 50, bottom: 50, left: 50 }
    },
    header: {
      enabled: true,
      height: 100,
      backgroundColor: color.header,
      logo: {
        enabled: true,
        position: 'left',
        url: '',
        width: 80,
        height: 80
      },
      companyInfo: {
        enabled: true,
        position: 'right',
        fields: ['name', 'address', 'phone', 'email'],
        fontSize: 10,
        fontColor: '#FFFFFF',
        fontFamily: 'Helvetica',
        alignment: 'right'
      }
    },
    title: {
      enabled: true,
      text: documentType.toUpperCase().replace('_', ' '),
      fontSize: 24,
      fontColor: '#1F2937',
      fontFamily: 'Helvetica',
      fontWeight: 'bold',
      alignment: 'center',
      backgroundColor: '',
      padding: 20
    },
    documentDetails: {
      enabled: true,
      layout: 'two-column',
      fields: {
        left: [
          { key: 'customer_name', label: 'Customer', enabled: true },
          { key: 'customer_address', label: 'Address', enabled: true }
        ],
        right: [
          { key: 'document_code', label: 'Document #', enabled: true },
          { key: 'date', label: 'Date', enabled: true, format: 'YYYY-MM-DD' }
        ]
      },
      fontSize: 10,
      fontColor: '#374151',
      labelColor: '#6B7280',
      labelWeight: 'bold'
    },
    itemsTable: {
      enabled: true,
      columns: [
        { key: 'product_name', label: 'Description', enabled: true, width: 40, alignment: 'left' },
        { key: 'quantity', label: 'Qty', enabled: true, width: 15, alignment: 'center' },
        { key: 'unit_price', label: 'Unit Price', enabled: true, width: 20, alignment: 'right', format: 'currency' },
        { key: 'total', label: 'Total', enabled: true, width: 25, alignment: 'right', format: 'currency' }
      ],
      headerBackgroundColor: color.primary,
      headerTextColor: '#FFFFFF',
      headerFontWeight: 'bold',
      rowBackgroundColor: '#FFFFFF',
      alternateRowColor: '#F9FAFB',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      fontSize: 10,
      showBorders: true
    },
    totals: {
      enabled: documentType !== 'delivery_order',
      position: 'right',
      fields: [
        { key: 'subtotal', label: 'Subtotal', enabled: true, format: 'currency' },
        { key: 'tax', label: 'Tax (6%)', enabled: true, format: 'currency' },
        { key: 'total', label: 'Total', enabled: true, format: 'currency' }
      ],
      fontSize: 11,
      fontColor: '#374151',
      labelColor: '#6B7280',
      backgroundColor: '#F9FAFB',
      grandTotalBackgroundColor: color.primary,
      grandTotalFontWeight: 'bold',
      grandTotalFontSize: 14
    },
    notes: {
      enabled: true,
      label: documentType === 'delivery_order' ? 'Delivery Notes' : 'Terms & Conditions',
      fontSize: 9,
      fontColor: '#6B7280'
    },
    footer: {
      enabled: true,
      height: 50,
      backgroundColor: '#F3F4F6',
      text: documentType === 'delivery_order'
        ? 'Received by: ________________  Signature: ________________  Date: ________________'
        : 'Thank you for your business!',
      fontSize: 10,
      fontColor: '#6B7280',
      alignment: documentType === 'delivery_order' ? 'left' : 'center',
      showPageNumbers: true,
      pageNumberFormat: 'Page {current} of {total}'
    },
    colors: {
      primary: color.primary,
      secondary: '#6B7280',
      accent: '#10B981',
      text: '#1F2937',
      textLight: '#6B7280'
    },
    fonts: {
      primary: 'Helvetica',
      secondary: 'Helvetica'
    },
    watermark: {
      enabled: false,
      text: 'DRAFT',
      opacity: 0.1,
      fontSize: 72,
      color: '#9CA3AF',
      rotation: -45
    },
    customCSS: ''
  };
};
