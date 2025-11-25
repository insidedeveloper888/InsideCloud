/**
 * PDF Generator - Generate PDFs from templates with data mapping
 *
 * Features:
 * - Load template from database
 * - Fetch document data (quotation, sales order, delivery order, invoice)
 * - Merge template components with data
 * - Render components with absolute positioning
 * - Support all component types (text, number, date, image, table, QR code, etc.)
 * - Format numbers (currency, percentage)
 * - Format dates
 * - Generate QR codes
 * - Upload PDF to Supabase Storage
 */

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get template from database
 */
async function getTemplate(templateId, organizationId) {
  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .eq('id', templateId)
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch template: ${error.message}`);
  }

  return data;
}

/**
 * Get document data for PDF generation
 */
async function getDocumentDataForPDF(documentType, documentId, organizationId) {
  let documentData = {};

  switch (documentType) {
    case 'quotation':
      // Fetch quotation
      const { data: quotation, error: quotationError } = await supabase
        .from('sales_quotations')
        .select('*')
        .eq('id', documentId)
        .eq('organization_id', organizationId)
        .single();

      if (quotationError) {
        throw new Error(`Failed to fetch quotation: ${quotationError.message}`);
      }

      // Fetch customer separately
      let customer = null;
      if (quotation.customer_contact_id) {
        const { data: customerData } = await supabase
          .from('contacts')
          .select('first_name, last_name, email, phone_1, address_line_1, address_line_2, city, state, postal_code, company_name')
          .eq('id', quotation.customer_contact_id)
          .single();
        customer = customerData;
      }

      // Fetch salesperson separately
      let salesperson = null;
      if (quotation.sales_person_individual_id) {
        const { data: salespersonData } = await supabase
          .from('individuals')
          .select('display_name')
          .eq('id', quotation.sales_person_individual_id)
          .single();
        salesperson = salespersonData;
      }

      // Fetch items
      const { data: items } = await supabase
        .from('sales_quotation_items')
        .select('*')
        .eq('sales_quotation_id', documentId)
        .order('line_order', { ascending: true });

      // Fetch products for items
      const itemsWithProducts = await Promise.all((items || []).map(async (item) => {
        let productName = item.product_name || '';
        if (item.product_id) {
          const { data: productData } = await supabase
            .from('inventory_products')
            .select('name')
            .eq('id', item.product_id)
            .single();
          if (productData) productName = productData.name;
        }
        return {
          product_name: productName,
          description: item.description || '',
          quantity: item.quantity || 0,
          unit_price: item.unit_price || 0,
          subtotal: item.line_total || 0,
          unit: item.unit || ''
        };
      }));

      documentData = {
        document_number: quotation.quotation_code,
        document_date: quotation.quotation_date,
        customer_name: customer?.company_name || `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() || '',
        customer_address: [
          customer?.address_line_1,
          customer?.address_line_2,
          [customer?.postal_code, customer?.city].filter(Boolean).join(' '),
          customer?.state
        ].filter(Boolean).join('\n') || '',
        customer_email: customer?.email || '',
        customer_phone: customer?.phone_1 || '',
        salesperson_name: salesperson?.display_name || '',
        valid_until: quotation.expiry_date || '',
        items: itemsWithProducts,
        subtotal: quotation.subtotal || 0,
        tax: quotation.tax_amount || 0,
        tax_rate: quotation.tax_rate || 0,
        discount: quotation.discount_amount || 0,
        total: quotation.total_amount || 0,
        notes: quotation.notes || '',
        terms_and_conditions: quotation.terms_and_conditions || '',
        qr_code_url: `${process.env.PUBLIC_URL || 'https://app.example.com'}/verify/quotation/${documentId}`
      };
      break;

    case 'sales_order':
      const { data: salesOrder, error: salesOrderError } = await supabase
        .from('sales_orders')
        .select(`
          *,
          customer:customers!inner(name, email, phone, address),
          salesperson:individuals!sales_orders_salesperson_id_fkey(display_name),
          items:sales_order_items!inner(*, product:products(name))
        `)
        .eq('id', documentId)
        .eq('organization_id', organizationId)
        .single();

      if (salesOrderError) {
        throw new Error(`Failed to fetch sales order: ${salesOrderError.message}`);
      }

      documentData = {
        document_number: salesOrder.order_number,
        document_date: salesOrder.order_date,
        customer_name: salesOrder.customer?.name || '',
        customer_address: salesOrder.customer?.address || '',
        customer_email: salesOrder.customer?.email || '',
        customer_phone: salesOrder.customer?.phone || '',
        salesperson_name: salesOrder.salesperson?.display_name || '',
        delivery_date: salesOrder.delivery_date || '',
        payment_terms: salesOrder.payment_terms || '',
        items: (salesOrder.items || []).map(item => ({
          product_name: item.product?.name || item.product_name || '',
          description: item.description || '',
          quantity: item.quantity || 0,
          unit_price: item.unit_price || 0,
          amount: item.amount || 0
        })),
        subtotal: salesOrder.subtotal || 0,
        tax: salesOrder.tax_amount || 0,
        discount: salesOrder.discount_amount || 0,
        total: salesOrder.total_amount || 0,
        notes: salesOrder.notes || '',
        qr_code_url: `${process.env.PUBLIC_URL || 'https://app.example.com'}/verify/sales_order/${documentId}`
      };
      break;

    case 'delivery_order':
      const { data: deliveryOrder, error: deliveryOrderError } = await supabase
        .from('delivery_orders')
        .select(`
          *,
          customer:customers!inner(name, email, phone, address),
          technician:individuals!delivery_orders_technician_id_fkey(display_name),
          items:delivery_order_items!inner(*, product:products(name))
        `)
        .eq('id', documentId)
        .eq('organization_id', organizationId)
        .single();

      if (deliveryOrderError) {
        throw new Error(`Failed to fetch delivery order: ${deliveryOrderError.message}`);
      }

      documentData = {
        document_number: deliveryOrder.delivery_number,
        document_date: deliveryOrder.delivery_date,
        customer_name: deliveryOrder.customer?.name || '',
        customer_address: deliveryOrder.customer?.address || '',
        customer_email: deliveryOrder.customer?.email || '',
        customer_phone: deliveryOrder.customer?.phone || '',
        technician_name: deliveryOrder.technician?.display_name || '',
        delivery_address: deliveryOrder.delivery_address || '',
        items: (deliveryOrder.items || []).map(item => ({
          product_name: item.product?.name || item.product_name || '',
          description: item.description || '',
          quantity: item.quantity || 0
        })),
        notes: deliveryOrder.notes || '',
        qr_code_url: `${process.env.PUBLIC_URL || 'https://app.example.com'}/verify/delivery_order/${documentId}`
      };
      break;

    case 'invoice':
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers!inner(name, email, phone, address),
          salesperson:individuals!invoices_salesperson_id_fkey(display_name),
          items:invoice_items!inner(*, product:products(name))
        `)
        .eq('id', documentId)
        .eq('organization_id', organizationId)
        .single();

      if (invoiceError) {
        throw new Error(`Failed to fetch invoice: ${invoiceError.message}`);
      }

      documentData = {
        document_number: invoice.invoice_number,
        document_date: invoice.invoice_date,
        customer_name: invoice.customer?.name || '',
        customer_address: invoice.customer?.address || '',
        customer_email: invoice.customer?.email || '',
        customer_phone: invoice.customer?.phone || '',
        salesperson_name: invoice.salesperson?.display_name || '',
        due_date: invoice.due_date || '',
        payment_status: invoice.payment_status || 'unpaid',
        items: (invoice.items || []).map(item => ({
          product_name: item.product?.name || item.product_name || '',
          description: item.description || '',
          quantity: item.quantity || 0,
          unit_price: item.unit_price || 0,
          amount: item.amount || 0
        })),
        subtotal: invoice.subtotal || 0,
        tax: invoice.tax_amount || 0,
        discount: invoice.discount_amount || 0,
        total: invoice.total_amount || 0,
        amount_paid: invoice.amount_paid || 0,
        balance_due: (invoice.total_amount || 0) - (invoice.amount_paid || 0),
        notes: invoice.notes || '',
        qr_code_url: `${process.env.PUBLIC_URL || 'https://app.example.com'}/verify/invoice/${documentId}`
      };
      break;

    default:
      throw new Error(`Unknown document type: ${documentType}`);
  }

  return documentData;
}

/**
 * Format number with thousand separators
 */
function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined) return '0';
  const num = parseFloat(value);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Format currency with thousand separators
 */
function formatCurrency(value, decimals = 2, currency = 'RM') {
  if (value === null || value === undefined) return `${currency} 0.00`;
  const num = parseFloat(value);
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  return `${currency} ${formatted}`;
}

/**
 * Format percentage
 */
function formatPercentage(value, decimals = 2) {
  if (value === null || value === undefined) return '0%';
  const num = parseFloat(value);
  return `${num.toFixed(decimals)}%`;
}

/**
 * Format date
 */
function formatDate(value, format = 'YYYY-MM-DD') {
  if (!value) return '';

  const date = new Date(value);
  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * Get image buffer from URL or base64
 */
async function getImageBuffer(imageData) {
  if (!imageData) return null;

  // Base64 data URL
  if (imageData.startsWith('data:image/')) {
    const base64Data = imageData.split(',')[1];
    return Buffer.from(base64Data, 'base64');
  }

  // TODO: Handle remote URLs if needed
  return null;
}

/**
 * Render table component
 */
function renderTable(doc, component, items, scaleX, scaleY) {
  if (!items || !Array.isArray(items) || items.length === 0) return;

  let { columns } = component.config || {};

  // Auto-generate columns if not configured in template
  if (!columns || columns.length === 0) {
    console.log('[PDF Generator] Auto-generating table columns from data');
    const firstItem = items[0];
    columns = Object.keys(firstItem).map(field => {
      // Determine format based on field name
      let format = null;
      let align = 'left';
      let width = '25%';

      if (field === 'product_name') {
        width = '40%';
      } else if (field === 'quantity') {
        align = 'center';
        width = '10%';
      } else if (field.includes('price') || field.includes('subtotal') || field.includes('amount') || field.includes('total')) {
        format = 'currency';
        align = 'right';
        width = '15%';
      } else if (field === 'unit') {
        align = 'center';
        width = '10%';
      }

      // Convert snake_case to Title Case for label
      const label = field.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      return { field, label, width, align, format };
    });
  }

  const startX = component.x * scaleX;
  const startY = component.y * scaleY;
  const tableWidth = component.width * scaleX;
  let currentY = startY;

  // Header row
  let currentX = startX;
  columns.forEach(col => {
    const colWidth = (tableWidth * parseFloat(col.width || 100 / columns.length)) / 100;

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text(col.label || col.field, currentX, currentY, {
         width: colWidth - 5,
         align: col.align || 'left'
       });

    currentX += colWidth;
  });
  currentY += 20;

  // Data rows
  items.forEach(item => {
    currentX = startX;

    columns.forEach(col => {
      const colWidth = (tableWidth * parseFloat(col.width || 100 / columns.length)) / 100;
      let value = item[col.field] || '';

      // Format value based on column format
      if (col.format === 'currency') {
        value = formatCurrency(value);
      } else if (col.format === 'percentage') {
        value = formatPercentage(value);
      } else if (col.format === 'date') {
        value = formatDate(value);
      }

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#000000')
         .text(String(value), currentX, currentY, {
           width: colWidth - 5,
           align: col.align || 'left'
         });

      currentX += colWidth;
    });

    currentY += 18;
  });
}

/**
 * Generate PDF from template and document data
 */
async function generatePDF(templateId, documentType, documentId, organizationId) {
  try {
    console.log(`[PDF Generator] Generating PDF for ${documentType} ${documentId}`);

    // 1. Get template
    const template = await getTemplate(templateId, organizationId);
    console.log(`[PDF Generator] Loaded template: ${template.name}`);

    // 2. Get document data
    const documentData = await getDocumentDataForPDF(documentType, documentId, organizationId);
    console.log(`[PDF Generator] Loaded document data: ${documentData.document_number}`);

    // 3. Create PDF document (A4 size)
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    // A4 dimensions: pdfkit uses 595.28 x 841.89 points
    // Template builder uses 794 x 1123 pixels
    // Calculate scale factor to convert template coordinates to PDF coordinates
    const TEMPLATE_WIDTH = 794;
    const TEMPLATE_HEIGHT = 1123;
    const PDF_WIDTH = 595.28;
    const PDF_HEIGHT = 841.89;
    const scaleX = PDF_WIDTH / TEMPLATE_WIDTH;
    const scaleY = PDF_HEIGHT / TEMPLATE_HEIGHT;

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    // 4. Render each component
    const components = template.config?.components || [];
    console.log(`[PDF Generator] Rendering ${components.length} components`);

    for (const component of components) {
      console.log(`[PDF Generator] Processing component:`, {
        id: component.id,
        type: component.type,
        dataKey: component.dataKey,
        position: { x: component.x, y: component.y },
        size: { width: component.width, height: component.height }
      });

      let value = null;

      // Get value from document data if dataKey exists
      if (component.dataKey) {
        value = documentData[component.dataKey];
        console.log(`[PDF Generator] Mapped value for "${component.dataKey}":`,
                    typeof value === 'object' ? JSON.stringify(value).substring(0, 200) : value);
      }

      // Render based on component type
      switch (component.type) {
        case 'label':
          // Label is static text without data binding
          {
            const scaledX = component.x * scaleX;
            const scaledY = component.y * scaleY;
            const scaledWidth = component.width * scaleX;
            const scaledHeight = component.height * scaleY;
            const labelText = component.config?.text || '';
            console.log(`[PDF Generator] ✅ Rendering label at (${scaledX.toFixed(2)}, ${scaledY.toFixed(2)})`);
            doc.fontSize(component.config?.fontSize || 14)
               .font(component.config?.fontWeight === 'bold' ? 'Helvetica-Bold' : 'Helvetica')
               .fillColor(component.config?.color || '#000000')
               .text(labelText, scaledX, scaledY, {
                 width: scaledWidth,
                 height: scaledHeight,
                 align: component.config?.textAlign || 'left'
               });
          }
          break;

        case 'text':
        case 'multiline':
          if (value !== null && value !== undefined) {
            const scaledX = component.x * scaleX;
            const scaledY = component.y * scaleY;
            const scaledWidth = component.width * scaleX;
            const scaledHeight = component.height * scaleY;
            console.log(`[PDF Generator] ✅ Rendering ${component.type} at (${scaledX.toFixed(2)}, ${scaledY.toFixed(2)})`);
            doc.fontSize(component.config?.fontSize || 14)
               .font(component.config?.fontWeight === 'bold' ? 'Helvetica-Bold' : 'Helvetica')
               .fillColor(component.config?.color || '#000000')
               .text(String(value), scaledX, scaledY, {
                 width: scaledWidth,
                 height: scaledHeight,
                 align: component.config?.textAlign || 'left',
                 lineGap: component.type === 'multiline' ? (component.config?.lineHeight || 1.5) * 2 : 0
               });
          } else {
            console.log(`[PDF Generator] ❌ Skipping ${component.type} - value is null/undefined`);
          }
          break;

        case 'number':
          if (value !== null && value !== undefined) {
            let formatted = value;

            if (component.config?.format === 'currency') {
              formatted = formatCurrency(value, component.config?.decimals || 2, component.config?.currency || 'RM');
            } else if (component.config?.format === 'percentage') {
              formatted = formatPercentage(value, component.config?.decimals || 2);
            } else if (component.config?.format === 'number') {
              formatted = formatNumber(value, component.config?.decimals || 2);
            } else {
              // Default: number with thousand separators
              formatted = formatNumber(value, component.config?.decimals || 2);
            }

            const scaledX = component.x * scaleX;
            const scaledY = component.y * scaleY;
            const scaledWidth = component.width * scaleX;

            doc.fontSize(component.config?.fontSize || 14)
               .font('Helvetica')
               .fillColor('#000000')
               .text(formatted, scaledX, scaledY, {
                 width: scaledWidth,
                 align: 'right'
               });
          }
          break;

        case 'date':
          if (value) {
            const formatted = formatDate(value, component.config?.format || 'YYYY-MM-DD');
            const scaledX = component.x * scaleX;
            const scaledY = component.y * scaleY;
            const scaledWidth = component.width * scaleX;

            doc.fontSize(component.config?.fontSize || 12)
               .font('Helvetica')
               .fillColor('#000000')
               .text(formatted, scaledX, scaledY, {
                 width: scaledWidth
               });
          }
          break;

        case 'image':
          if (value || component.config?.logoUrl) {
            const imageBuffer = await getImageBuffer(value || component.config?.logoUrl);

            if (imageBuffer) {
              const scaledX = component.x * scaleX;
              const scaledY = component.y * scaleY;
              const scaledWidth = component.width * scaleX;
              const scaledHeight = component.height * scaleY;

              doc.image(imageBuffer, scaledX, scaledY, {
                fit: [scaledWidth, scaledHeight],
                align: 'center',
                valign: 'center'
              });
            }
          }
          break;

        case 'qrcode':
          if (value) {
            try {
              const scaledWidth = component.width * scaleX;
              const scaledHeight = component.height * scaleY;

              // Generate QR code as data URL
              const qrCodeDataUrl = await QRCode.toDataURL(String(value), {
                width: scaledWidth,
                margin: 1,
                errorCorrectionLevel: component.config?.errorCorrection || 'M'
              });

              const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
              const scaledX = component.x * scaleX;
              const scaledY = component.y * scaleY;

              doc.image(qrBuffer, scaledX, scaledY, {
                width: scaledWidth,
                height: scaledHeight
              });
            } catch (qrError) {
              console.error('[PDF Generator] QR Code generation error:', qrError);
            }
          }
          break;

        case 'table':
          if (value && Array.isArray(value)) {
            const scaledX = component.x * scaleX;
            const scaledY = component.y * scaleY;
            console.log(`[PDF Generator] ✅ Rendering table with ${value.length} rows at (${scaledX.toFixed(2)}, ${scaledY.toFixed(2)})`);
            renderTable(doc, component, value, scaleX, scaleY);
          } else {
            console.log(`[PDF Generator] ❌ Skipping table - value is not an array:`, typeof value, value);
          }
          break;

        case 'signature':
          {
            const scaledX = component.x * scaleX;
            const scaledY = component.y * scaleY;
            const scaledWidth = component.width * scaleX;
            const scaledHeight = component.height * scaleY;

            // Draw signature line
            doc.moveTo(scaledX, scaledY + scaledHeight - 5)
               .lineTo(scaledX + scaledWidth, scaledY + scaledHeight - 5)
               .stroke(component.config?.lineColor || '#000000');

            // Draw label
            if (component.config?.showLabel !== false) {
              doc.fontSize(10)
                 .font('Helvetica')
                 .fillColor('#666666')
                 .text(component.config?.label || 'Signature', scaledX, scaledY + scaledHeight + 5, {
                   width: scaledWidth,
                   align: 'center'
                 });
            }
          }
          break;

        case 'checkbox':
          {
            const scaledX = component.x * scaleX;
            const scaledY = component.y * scaleY;
            const boxSize = 20 * scaleX;

            // Draw checkbox
            doc.rect(scaledX, scaledY, boxSize, boxSize)
               .stroke('#000000');

            // Draw checkmark if checked
            if (component.config?.checked) {
              doc.moveTo(scaledX + 4 * scaleX, scaledY + 10 * scaleY)
                 .lineTo(scaledX + 8 * scaleX, scaledY + 16 * scaleY)
                 .lineTo(scaledX + 16 * scaleX, scaledY + 4 * scaleY)
                 .stroke('#000000');
            }
          }
          break;

        default:
          console.warn(`[PDF Generator] Unknown component type: ${component.type}`);
      }
    }

    // 5. Finalize PDF
    doc.end();

    // Wait for PDF to finish
    const pdfBuffer = await new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
    });

    console.log(`[PDF Generator] PDF generated successfully (${pdfBuffer.length} bytes)`);

    return pdfBuffer;

  } catch (error) {
    console.error('[PDF Generator] Error:', error);
    throw error;
  }
}

/**
 * Upload PDF to Supabase Storage
 */
async function uploadPDFToStorage(pdfBuffer, documentType, documentNumber, organizationId) {
  try {
    const fileName = `${documentType}/${organizationId}/${documentNumber}_${Date.now()}.pdf`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (error) {
      throw new Error(`Failed to upload PDF: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    return {
      fileName,
      publicUrl: urlData.publicUrl
    };

  } catch (error) {
    console.error('[PDF Generator] Upload error:', error);
    throw error;
  }
}

module.exports = {
  generatePDF,
  uploadPDFToStorage,
  getTemplate,
  getDocumentDataForPDF
};
