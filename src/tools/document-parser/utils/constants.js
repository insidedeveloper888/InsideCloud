/**
 * Constants for Document Parser
 */

export const SOFTWARE_TYPES = {
  SQL_ACCOUNTING: 'sql-accounting',
  AUTOCOUNT: 'autocount',
};

export const SOFTWARE_LABELS = {
  [SOFTWARE_TYPES.SQL_ACCOUNTING]: 'SQL Accounting Software',
  [SOFTWARE_TYPES.AUTOCOUNT]: 'Autocount Accounting Software',
};

export const DOCUMENT_TYPES = {
  SQL_ACCOUNTING: {
    INVOICE_WITH_ITEM: 'invoice-with-item',
    SUPPLIER_INVOICE: 'supplier-invoice',
    GL_DOCUMENT_OR: 'gl-document-or',
    GL_DOCUMENT_PV: 'gl-document-pv',
  },
  AUTOCOUNT: {
    INVOICE: 'invoice',
    // Add more as needed
  },
};

export const DOCUMENT_LABELS = {
  [DOCUMENT_TYPES.SQL_ACCOUNTING.INVOICE_WITH_ITEM]: 'Customer Document Listing - Invoice with Item',
  [DOCUMENT_TYPES.SQL_ACCOUNTING.SUPPLIER_INVOICE]: 'Supplier Document Listing',
  [DOCUMENT_TYPES.SQL_ACCOUNTING.GL_DOCUMENT_OR]: 'GL Document Listing - OR',
  [DOCUMENT_TYPES.SQL_ACCOUNTING.GL_DOCUMENT_PV]: 'GL Document Listing - PV',
};

export const ACCEPTED_FILE_TYPES = ['.xlsx', '.xls', '.csv'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
