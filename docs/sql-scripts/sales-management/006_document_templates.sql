-- Migration 006: Document Templates System
-- Description: PDF template customization system for sales documents
-- Date: 2025-11-24

-- Create document_templates table
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template identification
  name TEXT NOT NULL, -- e.g., "Modern Blue", "Classic", "Minimalist"
  document_type TEXT NOT NULL CHECK (document_type IN ('quotation', 'sales_order', 'delivery_order', 'invoice')),

  -- Template configuration (JSON)
  config JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Status
  is_default BOOLEAN DEFAULT FALSE, -- One default template per document type per organization
  is_active BOOLEAN DEFAULT TRUE,

  -- Preview
  preview_image_url TEXT, -- Optional: stored thumbnail of template

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
  updated_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_document_templates_org ON document_templates(organization_id);
CREATE INDEX idx_document_templates_type ON document_templates(document_type);
CREATE INDEX idx_document_templates_default ON document_templates(organization_id, document_type, is_default);

-- Create partial unique index to ensure only one default template per document type per organization
CREATE UNIQUE INDEX unique_default_template
ON document_templates(organization_id, document_type)
WHERE is_default = TRUE;

-- Add comments for documentation
COMMENT ON TABLE document_templates IS 'Stores customizable PDF templates for sales documents with JSONB configuration';
COMMENT ON COLUMN document_templates.config IS 'JSONB configuration for template (page settings, header, footer, line items styling, etc.)';
COMMENT ON COLUMN document_templates.is_default IS 'Only one default template per document type per organization';
COMMENT ON COLUMN document_templates.preview_image_url IS 'Optional thumbnail preview of the template';

-- Create default templates for each document type
-- This function will be called when an organization first accesses sales management
CREATE OR REPLACE FUNCTION create_default_document_templates(p_organization_id UUID, p_created_by_individual_id UUID)
RETURNS void AS $$
BEGIN
  -- Classic Blue Template for Quotation
  INSERT INTO document_templates (
    organization_id,
    name,
    document_type,
    is_default,
    created_by_individual_id,
    config
  ) VALUES (
    p_organization_id,
    'Classic Blue',
    'quotation',
    TRUE,
    p_created_by_individual_id,
    '{
      "page": {
        "size": "A4",
        "orientation": "portrait",
        "margins": {"top": 50, "right": 50, "bottom": 50, "left": 50}
      },
      "header": {
        "enabled": true,
        "height": 100,
        "backgroundColor": "#3B82F6",
        "logo": {
          "enabled": true,
          "position": "left",
          "url": "",
          "width": 80,
          "height": 80
        },
        "companyInfo": {
          "enabled": true,
          "position": "right",
          "fields": ["name", "address", "phone", "email"],
          "fontSize": 10,
          "fontColor": "#FFFFFF",
          "fontFamily": "Helvetica",
          "alignment": "right"
        }
      },
      "title": {
        "enabled": true,
        "text": "QUOTATION",
        "fontSize": 24,
        "fontColor": "#1F2937",
        "fontFamily": "Helvetica",
        "fontWeight": "bold",
        "alignment": "center",
        "backgroundColor": "",
        "padding": 20
      },
      "documentDetails": {
        "enabled": true,
        "layout": "two-column",
        "fields": {
          "left": [
            {"key": "customer_name", "label": "Customer", "enabled": true},
            {"key": "customer_address", "label": "Address", "enabled": true}
          ],
          "right": [
            {"key": "quotation_code", "label": "Quotation #", "enabled": true},
            {"key": "date", "label": "Date", "enabled": true, "format": "YYYY-MM-DD"},
            {"key": "valid_until", "label": "Valid Until", "enabled": true, "format": "YYYY-MM-DD"}
          ]
        },
        "fontSize": 10,
        "fontColor": "#374151",
        "labelColor": "#6B7280",
        "labelWeight": "bold"
      },
      "itemsTable": {
        "enabled": true,
        "columns": [
          {"key": "product_name", "label": "Description", "enabled": true, "width": 40, "alignment": "left"},
          {"key": "quantity", "label": "Qty", "enabled": true, "width": 15, "alignment": "center"},
          {"key": "unit_price", "label": "Unit Price", "enabled": true, "width": 20, "alignment": "right", "format": "currency"},
          {"key": "total", "label": "Total", "enabled": true, "width": 25, "alignment": "right", "format": "currency"}
        ],
        "headerBackgroundColor": "#3B82F6",
        "headerTextColor": "#FFFFFF",
        "headerFontWeight": "bold",
        "rowBackgroundColor": "#FFFFFF",
        "alternateRowColor": "#F9FAFB",
        "borderColor": "#E5E7EB",
        "borderWidth": 1,
        "fontSize": 10,
        "showBorders": true
      },
      "totals": {
        "enabled": true,
        "position": "right",
        "fields": [
          {"key": "subtotal", "label": "Subtotal", "enabled": true, "format": "currency"},
          {"key": "tax", "label": "Tax (6%)", "enabled": true, "format": "currency"},
          {"key": "total", "label": "Total", "enabled": true, "format": "currency"}
        ],
        "fontSize": 11,
        "fontColor": "#374151",
        "labelColor": "#6B7280",
        "backgroundColor": "#F9FAFB",
        "grandTotalBackgroundColor": "#3B82F6",
        "grandTotalFontWeight": "bold",
        "grandTotalFontSize": 14
      },
      "notes": {
        "enabled": true,
        "label": "Terms & Conditions",
        "fontSize": 9,
        "fontColor": "#6B7280"
      },
      "footer": {
        "enabled": true,
        "height": 50,
        "backgroundColor": "#F3F4F6",
        "text": "Thank you for your business!",
        "fontSize": 10,
        "fontColor": "#6B7280",
        "alignment": "center",
        "showPageNumbers": true,
        "pageNumberFormat": "Page {current} of {total}"
      },
      "colors": {
        "primary": "#3B82F6",
        "secondary": "#6B7280",
        "accent": "#10B981",
        "text": "#1F2937",
        "textLight": "#6B7280"
      },
      "fonts": {
        "primary": "Helvetica",
        "secondary": "Helvetica"
      },
      "watermark": {
        "enabled": false,
        "text": "DRAFT",
        "opacity": 0.1,
        "fontSize": 72,
        "color": "#9CA3AF",
        "rotation": -45
      },
      "customCSS": ""
    }'::jsonb
  );

  -- Classic Blue Template for Sales Order
  INSERT INTO document_templates (
    organization_id,
    name,
    document_type,
    is_default,
    created_by_individual_id,
    config
  ) VALUES (
    p_organization_id,
    'Classic Blue',
    'sales_order',
    TRUE,
    p_created_by_individual_id,
    '{
      "page": {
        "size": "A4",
        "orientation": "portrait",
        "margins": {"top": 50, "right": 50, "bottom": 50, "left": 50}
      },
      "header": {
        "enabled": true,
        "height": 100,
        "backgroundColor": "#3B82F6",
        "logo": {
          "enabled": true,
          "position": "left",
          "url": "",
          "width": 80,
          "height": 80
        },
        "companyInfo": {
          "enabled": true,
          "position": "right",
          "fields": ["name", "address", "phone", "email"],
          "fontSize": 10,
          "fontColor": "#FFFFFF",
          "fontFamily": "Helvetica",
          "alignment": "right"
        }
      },
      "title": {
        "enabled": true,
        "text": "SALES ORDER",
        "fontSize": 24,
        "fontColor": "#1F2937",
        "fontFamily": "Helvetica",
        "fontWeight": "bold",
        "alignment": "center",
        "backgroundColor": "",
        "padding": 20
      },
      "documentDetails": {
        "enabled": true,
        "layout": "two-column",
        "fields": {
          "left": [
            {"key": "customer_name", "label": "Customer", "enabled": true},
            {"key": "customer_address", "label": "Address", "enabled": true}
          ],
          "right": [
            {"key": "order_code", "label": "Order #", "enabled": true},
            {"key": "order_date", "label": "Order Date", "enabled": true, "format": "YYYY-MM-DD"},
            {"key": "delivery_date", "label": "Expected Delivery", "enabled": true, "format": "YYYY-MM-DD"}
          ]
        },
        "fontSize": 10,
        "fontColor": "#374151",
        "labelColor": "#6B7280",
        "labelWeight": "bold"
      },
      "itemsTable": {
        "enabled": true,
        "columns": [
          {"key": "product_name", "label": "Description", "enabled": true, "width": 40, "alignment": "left"},
          {"key": "quantity", "label": "Qty", "enabled": true, "width": 15, "alignment": "center"},
          {"key": "unit_price", "label": "Unit Price", "enabled": true, "width": 20, "alignment": "right", "format": "currency"},
          {"key": "total", "label": "Total", "enabled": true, "width": 25, "alignment": "right", "format": "currency"}
        ],
        "headerBackgroundColor": "#3B82F6",
        "headerTextColor": "#FFFFFF",
        "headerFontWeight": "bold",
        "rowBackgroundColor": "#FFFFFF",
        "alternateRowColor": "#F9FAFB",
        "borderColor": "#E5E7EB",
        "borderWidth": 1,
        "fontSize": 10,
        "showBorders": true
      },
      "totals": {
        "enabled": true,
        "position": "right",
        "fields": [
          {"key": "subtotal", "label": "Subtotal", "enabled": true, "format": "currency"},
          {"key": "tax", "label": "Tax (6%)", "enabled": true, "format": "currency"},
          {"key": "total", "label": "Total", "enabled": true, "format": "currency"}
        ],
        "fontSize": 11,
        "fontColor": "#374151",
        "labelColor": "#6B7280",
        "backgroundColor": "#F9FAFB",
        "grandTotalBackgroundColor": "#3B82F6",
        "grandTotalFontWeight": "bold",
        "grandTotalFontSize": 14
      },
      "notes": {
        "enabled": true,
        "label": "Notes",
        "fontSize": 9,
        "fontColor": "#6B7280"
      },
      "footer": {
        "enabled": true,
        "height": 50,
        "backgroundColor": "#F3F4F6",
        "text": "Thank you for your business!",
        "fontSize": 10,
        "fontColor": "#6B7280",
        "alignment": "center",
        "showPageNumbers": true,
        "pageNumberFormat": "Page {current} of {total}"
      },
      "colors": {
        "primary": "#3B82F6",
        "secondary": "#6B7280",
        "accent": "#10B981",
        "text": "#1F2937",
        "textLight": "#6B7280"
      },
      "fonts": {
        "primary": "Helvetica",
        "secondary": "Helvetica"
      },
      "watermark": {
        "enabled": false,
        "text": "DRAFT",
        "opacity": 0.1,
        "fontSize": 72,
        "color": "#9CA3AF",
        "rotation": -45
      },
      "customCSS": ""
    }'::jsonb
  );

  -- Classic Blue Template for Delivery Order
  INSERT INTO document_templates (
    organization_id,
    name,
    document_type,
    is_default,
    created_by_individual_id,
    config
  ) VALUES (
    p_organization_id,
    'Classic Blue',
    'delivery_order',
    TRUE,
    p_created_by_individual_id,
    '{
      "page": {
        "size": "A4",
        "orientation": "portrait",
        "margins": {"top": 50, "right": 50, "bottom": 50, "left": 50}
      },
      "header": {
        "enabled": true,
        "height": 100,
        "backgroundColor": "#10B981",
        "logo": {
          "enabled": true,
          "position": "left",
          "url": "",
          "width": 80,
          "height": 80
        },
        "companyInfo": {
          "enabled": true,
          "position": "right",
          "fields": ["name", "address", "phone", "email"],
          "fontSize": 10,
          "fontColor": "#FFFFFF",
          "fontFamily": "Helvetica",
          "alignment": "right"
        }
      },
      "title": {
        "enabled": true,
        "text": "DELIVERY ORDER",
        "fontSize": 24,
        "fontColor": "#1F2937",
        "fontFamily": "Helvetica",
        "fontWeight": "bold",
        "alignment": "center",
        "backgroundColor": "",
        "padding": 20
      },
      "documentDetails": {
        "enabled": true,
        "layout": "two-column",
        "fields": {
          "left": [
            {"key": "customer_name", "label": "Deliver To", "enabled": true},
            {"key": "customer_address", "label": "Address", "enabled": true},
            {"key": "technician_name", "label": "Technician", "enabled": true}
          ],
          "right": [
            {"key": "do_code", "label": "DO #", "enabled": true},
            {"key": "delivery_date", "label": "Delivery Date", "enabled": true, "format": "YYYY-MM-DD"},
            {"key": "sales_order_code", "label": "Related SO", "enabled": true}
          ]
        },
        "fontSize": 10,
        "fontColor": "#374151",
        "labelColor": "#6B7280",
        "labelWeight": "bold"
      },
      "itemsTable": {
        "enabled": true,
        "columns": [
          {"key": "product_name", "label": "Description", "enabled": true, "width": 50, "alignment": "left"},
          {"key": "quantity", "label": "Quantity", "enabled": true, "width": 25, "alignment": "center"},
          {"key": "uom", "label": "Unit", "enabled": true, "width": 25, "alignment": "center"}
        ],
        "headerBackgroundColor": "#10B981",
        "headerTextColor": "#FFFFFF",
        "headerFontWeight": "bold",
        "rowBackgroundColor": "#FFFFFF",
        "alternateRowColor": "#F9FAFB",
        "borderColor": "#E5E7EB",
        "borderWidth": 1,
        "fontSize": 10,
        "showBorders": true
      },
      "totals": {
        "enabled": false,
        "position": "right",
        "fields": [],
        "fontSize": 11,
        "fontColor": "#374151",
        "labelColor": "#6B7280",
        "backgroundColor": "#F9FAFB",
        "grandTotalBackgroundColor": "#10B981",
        "grandTotalFontWeight": "bold",
        "grandTotalFontSize": 14
      },
      "notes": {
        "enabled": true,
        "label": "Delivery Notes",
        "fontSize": 9,
        "fontColor": "#6B7280"
      },
      "footer": {
        "enabled": true,
        "height": 80,
        "backgroundColor": "#F3F4F6",
        "text": "Received by: ________________  Signature: ________________  Date: ________________",
        "fontSize": 10,
        "fontColor": "#6B7280",
        "alignment": "left",
        "showPageNumbers": true,
        "pageNumberFormat": "Page {current} of {total}"
      },
      "colors": {
        "primary": "#10B981",
        "secondary": "#6B7280",
        "accent": "#3B82F6",
        "text": "#1F2937",
        "textLight": "#6B7280"
      },
      "fonts": {
        "primary": "Helvetica",
        "secondary": "Helvetica"
      },
      "watermark": {
        "enabled": false,
        "text": "DELIVERED",
        "opacity": 0.1,
        "fontSize": 72,
        "color": "#9CA3AF",
        "rotation": -45
      },
      "customCSS": ""
    }'::jsonb
  );

  -- Classic Blue Template for Invoice
  INSERT INTO document_templates (
    organization_id,
    name,
    document_type,
    is_default,
    created_by_individual_id,
    config
  ) VALUES (
    p_organization_id,
    'Classic Blue',
    'invoice',
    TRUE,
    p_created_by_individual_id,
    '{
      "page": {
        "size": "A4",
        "orientation": "portrait",
        "margins": {"top": 50, "right": 50, "bottom": 50, "left": 50}
      },
      "header": {
        "enabled": true,
        "height": 100,
        "backgroundColor": "#EF4444",
        "logo": {
          "enabled": true,
          "position": "left",
          "url": "",
          "width": 80,
          "height": 80
        },
        "companyInfo": {
          "enabled": true,
          "position": "right",
          "fields": ["name", "address", "phone", "email", "tax_id"],
          "fontSize": 10,
          "fontColor": "#FFFFFF",
          "fontFamily": "Helvetica",
          "alignment": "right"
        }
      },
      "title": {
        "enabled": true,
        "text": "INVOICE",
        "fontSize": 24,
        "fontColor": "#1F2937",
        "fontFamily": "Helvetica",
        "fontWeight": "bold",
        "alignment": "center",
        "backgroundColor": "",
        "padding": 20
      },
      "documentDetails": {
        "enabled": true,
        "layout": "two-column",
        "fields": {
          "left": [
            {"key": "customer_name", "label": "Bill To", "enabled": true},
            {"key": "customer_address", "label": "Address", "enabled": true},
            {"key": "customer_tax_id", "label": "Tax ID", "enabled": true}
          ],
          "right": [
            {"key": "invoice_code", "label": "Invoice #", "enabled": true},
            {"key": "invoice_date", "label": "Invoice Date", "enabled": true, "format": "YYYY-MM-DD"},
            {"key": "due_date", "label": "Due Date", "enabled": true, "format": "YYYY-MM-DD"},
            {"key": "payment_terms", "label": "Payment Terms", "enabled": true}
          ]
        },
        "fontSize": 10,
        "fontColor": "#374151",
        "labelColor": "#6B7280",
        "labelWeight": "bold"
      },
      "itemsTable": {
        "enabled": true,
        "columns": [
          {"key": "product_name", "label": "Description", "enabled": true, "width": 40, "alignment": "left"},
          {"key": "quantity", "label": "Qty", "enabled": true, "width": 15, "alignment": "center"},
          {"key": "unit_price", "label": "Unit Price", "enabled": true, "width": 20, "alignment": "right", "format": "currency"},
          {"key": "total", "label": "Total", "enabled": true, "width": 25, "alignment": "right", "format": "currency"}
        ],
        "headerBackgroundColor": "#EF4444",
        "headerTextColor": "#FFFFFF",
        "headerFontWeight": "bold",
        "rowBackgroundColor": "#FFFFFF",
        "alternateRowColor": "#F9FAFB",
        "borderColor": "#E5E7EB",
        "borderWidth": 1,
        "fontSize": 10,
        "showBorders": true
      },
      "totals": {
        "enabled": true,
        "position": "right",
        "fields": [
          {"key": "subtotal", "label": "Subtotal", "enabled": true, "format": "currency"},
          {"key": "discount", "label": "Discount", "enabled": true, "format": "currency"},
          {"key": "tax", "label": "Tax (6%)", "enabled": true, "format": "currency"},
          {"key": "total", "label": "Total Amount Due", "enabled": true, "format": "currency"}
        ],
        "fontSize": 11,
        "fontColor": "#374151",
        "labelColor": "#6B7280",
        "backgroundColor": "#F9FAFB",
        "grandTotalBackgroundColor": "#EF4444",
        "grandTotalFontWeight": "bold",
        "grandTotalFontSize": 14
      },
      "notes": {
        "enabled": true,
        "label": "Payment Instructions",
        "fontSize": 9,
        "fontColor": "#6B7280"
      },
      "footer": {
        "enabled": true,
        "height": 50,
        "backgroundColor": "#F3F4F6",
        "text": "Thank you for your business! Payment is due within 30 days.",
        "fontSize": 10,
        "fontColor": "#6B7280",
        "alignment": "center",
        "showPageNumbers": true,
        "pageNumberFormat": "Page {current} of {total}"
      },
      "colors": {
        "primary": "#EF4444",
        "secondary": "#6B7280",
        "accent": "#10B981",
        "text": "#1F2937",
        "textLight": "#6B7280"
      },
      "fonts": {
        "primary": "Helvetica",
        "secondary": "Helvetica"
      },
      "watermark": {
        "enabled": false,
        "text": "PAID",
        "opacity": 0.1,
        "fontSize": 72,
        "color": "#9CA3AF",
        "rotation": -45
      },
      "customCSS": ""
    }'::jsonb
  );
END;
$$ LANGUAGE plpgsql;

-- Add comment for the function
COMMENT ON FUNCTION create_default_document_templates IS 'Creates default "Classic Blue" templates for all document types when an organization first accesses sales management';
