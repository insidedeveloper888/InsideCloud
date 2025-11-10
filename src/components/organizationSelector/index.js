import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Building2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import clientConfig from '../../config/client_config.js';
import './index.css';

const ORGANIZATION_SLUG_KEY = 'lark_organization_slug';

function getOrigin(apiPort) {
  const configuredOrigin = clientConfig.apiOrigin;
  if (configuredOrigin && configuredOrigin.length > 0) {
    return configuredOrigin;
  }
  return window.location.origin;
}

const OrganizationSelector = ({ onOrganizationSelected }) => {
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [isValid, setIsValid] = useState(false);
  const [orgInfo, setOrgInfo] = useState(null);

  // Check if organization is already selected
  React.useEffect(() => {
    const savedOrgSlug = localStorage.getItem(ORGANIZATION_SLUG_KEY);
    if (savedOrgSlug) {
      setOrganizationSlug(savedOrgSlug);
      validateOrganization(savedOrgSlug);
    }
  }, []);

  const validateOrganization = async (slug) => {
    if (!slug || slug.trim().length === 0) {
      setValidationError(null);
      setIsValid(false);
      setOrgInfo(null);
      return;
    }

    setIsValidating(true);
    setValidationError(null);
    setIsValid(false);

    try {
      const response = await axios.get(
        `${getOrigin(clientConfig.apiPort)}/api/get_organization_config?organization_slug=${encodeURIComponent(slug)}`,
        { withCredentials: true, headers: { 'ngrok-skip-browser-warning': 'true' } }
      );

      if (response.data && response.data.code === 0 && response.data.data) {
        setIsValid(true);
        setOrgInfo(response.data.data);
        setValidationError(null);
      } else {
        setIsValid(false);
        setValidationError(response.data?.msg || 'Organization not found');
        setOrgInfo(null);
      }
    } catch (error) {
      setIsValid(false);
      const errorMsg = error.response?.data?.msg || error.message || 'Failed to validate organization';
      setValidationError(errorMsg);
      setOrgInfo(null);
      console.error('Organization validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSlugChange = (e) => {
    const value = e.target.value.trim();
    setOrganizationSlug(value);
    if (value.length > 0) {
      validateOrganization(value);
    } else {
      setIsValid(false);
      setValidationError(null);
      setOrgInfo(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid && organizationSlug) {
      localStorage.setItem(ORGANIZATION_SLUG_KEY, organizationSlug);
      onOrganizationSelected(organizationSlug, orgInfo);
    }
  };

  const handleSkip = () => {
    // Allow skipping for backward compatibility (single-tenant mode)
    localStorage.removeItem(ORGANIZATION_SLUG_KEY);
    onOrganizationSelected(null, null);
  };

  return (
    <div className="organization-selector-container">
      <motion.div
        className="organization-selector-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="organization-selector-header">
          <Building2 className="organization-icon" />
          <h2>Select Organization</h2>
          <p>Enter your organization identifier to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="organization-selector-form">
          <div className="input-group">
            <label htmlFor="org-slug">Organization Slug</label>
            <div className="input-wrapper">
              <input
                id="org-slug"
                type="text"
                value={organizationSlug}
                onChange={handleSlugChange}
                placeholder="e.g., testing, org-002"
                className={`org-input ${isValidating ? 'validating' : ''} ${isValid ? 'valid' : ''} ${validationError ? 'error' : ''}`}
                disabled={isValidating}
                autoFocus
              />
              {isValidating && (
                <Loader2 className="input-icon loading" />
              )}
              {!isValidating && isValid && (
                <CheckCircle className="input-icon success" />
              )}
              {!isValidating && validationError && (
                <XCircle className="input-icon error" />
              )}
            </div>
            
            {validationError && (
              <motion.div
                className="error-message"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {validationError}
              </motion.div>
            )}

            {isValid && orgInfo && (
              <motion.div
                className="success-message"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <strong>{orgInfo.organization_name}</strong> is ready
              </motion.div>
            )}
          </div>

          <div className="button-group">
            <button
              type="submit"
              className="btn-primary"
              disabled={!isValid || isValidating}
            >
              Continue
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleSkip}
            >
              Skip (Single Tenant)
            </button>
          </div>
        </form>

        <div className="organization-selector-help">
          <p><strong>Available organizations:</strong></p>
          <ul>
            <li><code>testing</code> - Testing Organization</li>
            <li><code>org-002</code> - Organization 2</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default OrganizationSelector;
export { ORGANIZATION_SLUG_KEY };

