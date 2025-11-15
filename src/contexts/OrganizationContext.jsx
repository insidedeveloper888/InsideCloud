import React, { createContext, useContext, useState, useEffect } from 'react';

const OrganizationContext = createContext();

export const ORGANIZATION_SLUG_KEY = 'organization_slug';

/**
 * OrganizationProvider Component
 *
 * Provides organization context to all child components
 * Manages organization selection and persistence via localStorage
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export const OrganizationProvider = ({ children }) => {
  const [organization, setOrganization] = useState(null);
  const [organizationSlug, setOrganizationSlugState] = useState(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ORGANIZATION_SLUG_KEY) || null;
    }
    return null;
  });

  /**
   * Update organization slug and persist to localStorage
   * @param {string} slug - Organization slug
   */
  const setOrganizationSlug = (slug) => {
    setOrganizationSlugState(slug);
    if (typeof window !== 'undefined') {
      if (slug) {
        localStorage.setItem(ORGANIZATION_SLUG_KEY, slug);
      } else {
        localStorage.removeItem(ORGANIZATION_SLUG_KEY);
      }
    }
  };

  /**
   * Clear organization context
   */
  const clearOrganization = () => {
    setOrganization(null);
    setOrganizationSlug(null);
  };

  const contextValue = {
    organization,
    organizationSlug,
    setOrganization,
    setOrganizationSlug,
    clearOrganization,
  };

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
};

/**
 * Hook to access organization context
 *
 * @returns {Object} Organization context
 * @returns {Object} return.organization - Organization object
 * @returns {string} return.organizationSlug - Organization slug
 * @returns {Function} return.setOrganization - Set organization object
 * @returns {Function} return.setOrganizationSlug - Set organization slug
 * @returns {Function} return.clearOrganization - Clear organization context
 *
 * @example
 * const { organizationSlug, setOrganizationSlug } = useOrganization();
 */
export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};
