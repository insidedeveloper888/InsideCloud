/**
 * PDF Generation API Handler
 *
 * GET /api/documents/pdf/generate?type=quotation&id=xxx&template_id=xxx&organization_slug=xxx
 *
 * Generates PDF from template and returns download link
 */

const { generatePDF, uploadPDFToStorage } = require('../pdf_generator');
const organizationHelper = require('../organization_helper');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  try {
    const { type: documentType, id: documentId, template_id: templateId, organization_slug } = req.query;

    // Validate parameters
    if (!documentType) {
      return res.status(400).json({
        code: -1,
        message: 'Missing document type parameter'
      });
    }

    if (!documentId) {
      return res.status(400).json({
        code: -1,
        message: 'Missing document ID parameter'
      });
    }

    if (!templateId) {
      return res.status(400).json({
        code: -1,
        message: 'Missing template ID parameter'
      });
    }

    if (!organization_slug) {
      return res.status(400).json({
        code: -1,
        message: 'Missing organization_slug parameter'
      });
    }

    // Get organization
    const organization = await organizationHelper.getOrganizationInfo(organization_slug);
    if (!organization) {
      return res.status(404).json({
        code: -1,
        message: 'Organization not found'
      });
    }

    console.log(`[PDF API] Generating PDF for ${documentType} ${documentId} using template ${templateId}`);

    // If template_id is 'auto', find the default template
    let finalTemplateId = templateId;
    if (templateId === 'auto') {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data: defaultTemplate, error: templateError } = await supabase
        .from('document_templates')
        .select('id')
        .eq('document_type', documentType)
        .eq('organization_id', organization.id)
        .eq('is_default', true)
        .single();

      if (templateError || !defaultTemplate) {
        console.error('[PDF API] No default template found:', templateError);
        return res.status(404).json({
          code: -1,
          message: `No default template found for ${documentType}. Please create one in Settings → Templates.`
        });
      }

      finalTemplateId = defaultTemplate.id;
      console.log(`[PDF API] Using default template: ${finalTemplateId}`);
    }

    // Generate PDF
    const pdfBuffer = await generatePDF(finalTemplateId, documentType, documentId, organization.id);

    // Get document number from the generated PDF data for better filename
    const { data: docData } = await supabase
      .from(documentType === 'quotation' ? 'sales_quotations' :
            documentType === 'sales_order' ? 'sales_orders' :
            documentType === 'delivery_order' ? 'delivery_orders' : 'invoices')
      .select(documentType === 'quotation' ? 'quotation_code' :
              documentType === 'sales_order' ? 'order_number' :
              documentType === 'delivery_order' ? 'delivery_number' : 'invoice_number')
      .eq('id', documentId)
      .single();

    const docNumber = docData?.[documentType === 'quotation' ? 'quotation_code' :
                                 documentType === 'sales_order' ? 'order_number' :
                                 documentType === 'delivery_order' ? 'delivery_number' : 'invoice_number'] || documentId;

    // Set response headers for PDF preview (inline instead of attachment)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${docNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.status(200).send(pdfBuffer);

  } catch (error) {
    console.error('[PDF API] Error:', error);

    res.status(500).json({
      code: -1,
      message: error.message || 'Failed to generate PDF',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
