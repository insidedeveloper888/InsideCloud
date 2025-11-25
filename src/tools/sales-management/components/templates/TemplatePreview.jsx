import React from 'react';

/**
 * TemplatePreview - Live preview of template configuration
 * Simplified visual representation scaled to fit preview pane
 */
export default function TemplatePreview({ config, documentType }) {
  // Scale factor for preview (A4 aspect ratio)
  const scale = 0.25; // 25% of actual size

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden shadow-lg">
      {/* A4 Aspect Ratio Container */}
      <div
        className="relative bg-white"
        style={{
          width: '100%',
          paddingBottom: '141.4%', // A4 aspect ratio (297/210)
          overflow: 'hidden'
        }}
      >
        <div className="absolute inset-0 flex flex-col text-xs">
          {/* Header */}
          {config.header?.enabled && (
            <div
              className="flex-shrink-0"
              style={{
                height: `${(config.header.height || 100) * scale}px`,
                backgroundColor: config.header.backgroundColor || '#3B82F6',
                color: config.header.companyInfo?.fontColor || '#FFFFFF',
                padding: '8px'
              }}
            >
              <div className="flex justify-between items-center h-full">
                {/* Logo */}
                {config.header.logo?.enabled && (
                  <div
                    className="bg-white bg-opacity-20 rounded flex items-center justify-center"
                    style={{
                      width: `${(config.header.logo.width || 80) * scale}px`,
                      height: `${(config.header.logo.height || 80) * scale}px`
                    }}
                  >
                    <span className="text-white text-xs">Logo</span>
                  </div>
                )}

                {/* Company Info */}
                {config.header.companyInfo?.enabled && (
                  <div
                    className="text-right flex-1"
                    style={{
                      fontSize: `${(config.header.companyInfo.fontSize || 10) * scale}px`,
                      marginLeft: '8px'
                    }}
                  >
                    <div>Company Name</div>
                    <div>Address Line</div>
                    <div>Contact Info</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 p-4 overflow-hidden">
            {/* Title */}
            {config.title?.enabled && (
              <div
                className="mb-3"
                style={{
                  textAlign: config.title.alignment || 'center',
                  fontSize: `${(config.title.fontSize || 24) * scale}px`,
                  fontWeight: config.title.fontWeight || 'bold',
                  color: config.title.fontColor || '#1F2937',
                  backgroundColor: config.title.backgroundColor || 'transparent',
                  padding: `${(config.title.padding || 20) * scale}px`
                }}
              >
                {config.title.text || 'DOCUMENT'}
              </div>
            )}

            {/* Document Details */}
            {config.documentDetails?.enabled && (
              <div className="mb-3 text-gray-700" style={{ fontSize: '8px' }}>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="font-semibold">Customer Name</div>
                    <div>Customer Address</div>
                  </div>
                  <div className="text-right">
                    <div><span className="font-semibold">Doc #:</span> 12345</div>
                    <div><span className="font-semibold">Date:</span> 2024-11-24</div>
                  </div>
                </div>
              </div>
            )}

            {/* Items Table */}
            {config.itemsTable?.enabled && (
              <div className="mb-3">
                <table className="w-full text-[7px]" style={{
                  borderCollapse: config.itemsTable.showBorders ? 'collapse' : 'separate'
                }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: config.itemsTable.headerBackgroundColor || '#3B82F6',
                        color: config.itemsTable.headerTextColor || '#FFFFFF'
                      }}
                    >
                      <th className="p-1 text-left" style={{ border: config.itemsTable.showBorders ? `${config.itemsTable.borderWidth || 1}px solid ${config.itemsTable.borderColor || '#E5E7EB'}` : 'none' }}>
                        Description
                      </th>
                      <th className="p-1 text-center" style={{ border: config.itemsTable.showBorders ? `${config.itemsTable.borderWidth || 1}px solid ${config.itemsTable.borderColor || '#E5E7EB'}` : 'none' }}>
                        Qty
                      </th>
                      <th className="p-1 text-right" style={{ border: config.itemsTable.showBorders ? `${config.itemsTable.borderWidth || 1}px solid ${config.itemsTable.borderColor || '#E5E7EB'}` : 'none' }}>
                        Price
                      </th>
                      <th className="p-1 text-right" style={{ border: config.itemsTable.showBorders ? `${config.itemsTable.borderWidth || 1}px solid ${config.itemsTable.borderColor || '#E5E7EB'}` : 'none' }}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map((i) => (
                      <tr
                        key={i}
                        style={{
                          backgroundColor: i % 2 === 0 ? config.itemsTable.alternateRowColor || '#F9FAFB' : config.itemsTable.rowBackgroundColor || '#FFFFFF'
                        }}
                      >
                        <td className="p-1" style={{ border: config.itemsTable.showBorders ? `${config.itemsTable.borderWidth || 1}px solid ${config.itemsTable.borderColor || '#E5E7EB'}` : 'none' }}>
                          Product {i}
                        </td>
                        <td className="p-1 text-center" style={{ border: config.itemsTable.showBorders ? `${config.itemsTable.borderWidth || 1}px solid ${config.itemsTable.borderColor || '#E5E7EB'}` : 'none' }}>
                          {i}
                        </td>
                        <td className="p-1 text-right" style={{ border: config.itemsTable.showBorders ? `${config.itemsTable.borderWidth || 1}px solid ${config.itemsTable.borderColor || '#E5E7EB'}` : 'none' }}>
                          ${i}00.00
                        </td>
                        <td className="p-1 text-right" style={{ border: config.itemsTable.showBorders ? `${config.itemsTable.borderWidth || 1}px solid ${config.itemsTable.borderColor || '#E5E7EB'}` : 'none' }}>
                          ${i}00.00
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals */}
            {config.totals?.enabled && (
              <div
                className="mb-3"
                style={{
                  textAlign: config.totals.position || 'right',
                  fontSize: '8px'
                }}
              >
                <div className="inline-block min-w-[120px]">
                  <div className="flex justify-between p-1" style={{ backgroundColor: config.totals.backgroundColor || '#F9FAFB' }}>
                    <span>Subtotal:</span>
                    <span>$600.00</span>
                  </div>
                  <div className="flex justify-between p-1" style={{ backgroundColor: config.totals.backgroundColor || '#F9FAFB' }}>
                    <span>Tax (6%):</span>
                    <span>$36.00</span>
                  </div>
                  <div
                    className="flex justify-between p-1 font-bold"
                    style={{
                      backgroundColor: config.totals.grandTotalBackgroundColor || '#3B82F6',
                      color: '#FFFFFF'
                    }}
                  >
                    <span>Total:</span>
                    <span>$636.00</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {config.notes?.enabled && (
              <div className="text-[7px] text-gray-600">
                <div className="font-semibold mb-1">{config.notes.label || 'Notes'}:</div>
                <div>Sample notes text goes here...</div>
              </div>
            )}
          </div>

          {/* Footer */}
          {config.footer?.enabled && (
            <div
              className="flex-shrink-0 p-2"
              style={{
                height: `${(config.footer.height || 50) * scale}px`,
                backgroundColor: config.footer.backgroundColor || '#F3F4F6',
                color: config.footer.fontColor || '#6B7280',
                fontSize: '7px',
                textAlign: config.footer.alignment || 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {config.footer.text || 'Footer text'}
              {config.footer.showPageNumbers && ' • Page 1 of 1'}
            </div>
          )}

          {/* Watermark */}
          {config.watermark?.enabled && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                opacity: config.watermark.opacity || 0.1,
                transform: `rotate(${config.watermark.rotation || -45}deg)`
              }}
            >
              <div
                className="font-bold"
                style={{
                  fontSize: `${(config.watermark.fontSize || 72) * scale}px`,
                  color: config.watermark.color || '#9CA3AF'
                }}
              >
                {config.watermark.text || 'DRAFT'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
