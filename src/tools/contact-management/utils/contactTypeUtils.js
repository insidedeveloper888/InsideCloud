/**
 * Contact Type Utility Functions
 *
 * Helpers for working with the new contact_types array (many-to-many relationship)
 * instead of the deprecated contact_type string field.
 */

/**
 * Check if a contact has a specific type
 * @param {Object} contact - Contact object with contact_types array
 * @param {string} typeCode - Type code to check ('customer', 'supplier', 'coi', 'internal')
 * @returns {boolean}
 */
export function hasContactType(contact, typeCode) {
  return contact?.contact_types?.some(t => t.code === typeCode) || false;
}

/**
 * Check if a contact has any of the specified types
 * @param {Object} contact - Contact object
 * @param {string[]} typeCodes - Array of type codes
 * @returns {boolean}
 */
export function hasAnyContactType(contact, typeCodes) {
  return contact?.contact_types?.some(t => typeCodes.includes(t.code)) || false;
}

/**
 * Get display string for contact types (comma-separated names)
 * @param {Object} contact - Contact object
 * @returns {string} - Comma-separated type names or empty string
 */
export function getContactTypeNames(contact) {
  return contact?.contact_types?.map(t => t.name).join(', ') || '';
}

/**
 * Get the first contact type name for display
 * @param {Object} contact - Contact object
 * @returns {string} - First type name or empty string
 */
export function getFirstContactTypeName(contact) {
  return contact?.contact_types?.[0]?.name || '';
}

/**
 * Get all contact type codes as an array
 * @param {Object} contact - Contact object
 * @returns {string[]} - Array of type codes
 */
export function getContactTypeCodes(contact) {
  return contact?.contact_types?.map(t => t.code) || [];
}

/**
 * Check if contact has Customer type (most common check)
 * @param {Object} contact - Contact object
 * @returns {boolean}
 */
export function isCustomer(contact) {
  return hasContactType(contact, 'customer');
}

/**
 * Check if contact has Supplier type
 * @param {Object} contact - Contact object
 * @returns {boolean}
 */
export function isSupplier(contact) {
  return hasContactType(contact, 'supplier');
}

/**
 * Filter contacts that have a specific type
 * @param {Object[]} contacts - Array of contacts
 * @param {string} typeCode - Type code to filter by
 * @returns {Object[]} - Filtered contacts
 */
export function filterByContactType(contacts, typeCode) {
  return contacts?.filter(c => hasContactType(c, typeCode)) || [];
}

/**
 * Filter contacts that have any of the specified types
 * @param {Object[]} contacts - Array of contacts
 * @param {string[]} typeCodes - Array of type codes
 * @returns {Object[]} - Filtered contacts
 */
export function filterByAnyContactType(contacts, typeCodes) {
  return contacts?.filter(c => hasAnyContactType(c, typeCodes)) || [];
}
