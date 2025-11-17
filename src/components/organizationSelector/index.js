import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Building2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import clientConfig from '../../config/client_config.js';
import { cn } from '../../lib/utils';

const ORGANIZATION_SLUG_KEY = 'lark_organization_slug';

function getOrigin(apiPort) {
  const configuredOrigin = clientConfig.apiOrigin;
  if (configuredOrigin && configuredOrigin.length > 0) {
    return configuredOrigin;
  }
  return window.location.origin;
}

/**
 * OrganizationSelector Component
 *
 * Allows users to select their organization by entering organization slug
 * Validates organization existence and displays organization info
 * Migrated from custom CSS to Tailwind CSS (ADR-002)
 *
 * @param {Object} props
 * @param {Function} props.onOrganizationSelected - Callback when organization is selected
 */
const OrganizationSelector = ({ onOrganizationSelected }) => {
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [isValid, setIsValid] = useState(false);
  const [orgInfo, setOrgInfo] = useState(null);
  const debounceTimerRef = useRef(null);

  // Check if organization is already selected
  useEffect(() => {
    const savedOrgSlug = localStorage.getItem(ORGANIZATION_SLUG_KEY);
    if (savedOrgSlug) {
      setOrganizationSlug(savedOrgSlug);
      validateOrganization(savedOrgSlug);
    }
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const validateOrganization = async (slug) => {
    if (!slug || slug.trim().length === 0) {
      setValidationError(null);
      setIsValid(false);
      setOrgInfo(null);
      setIsValidating(false);
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
    const value = e.target.value; // Don't trim while typing
    console.log('Input changed:', value); // Debug log
    setOrganizationSlug(value);
    
    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Clear validation state while typing
    setValidationError(null);
    setIsValid(false);
    setIsValidating(false);

    // Only validate if there's content and after user stops typing (500ms delay)
    if (value.trim().length > 0) {
      debounceTimerRef.current = setTimeout(() => {
        console.log('Validating:', value.trim()); // Debug log
        validateOrganization(value.trim());
      }, 500); // Wait 500ms after user stops typing
    } else {
      // Clear everything if input is empty
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

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] p-5">
      <motion.div
        className="bg-white/95 backdrop-blur-md rounded-2xl p-10 max-w-[500px] w-full shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Building2 className="w-16 h-16 text-[#667eea] mx-auto mb-4" />
          <h2 className="text-[28px] font-bold text-gray-900 mb-2">
            Select Organization
          </h2>
          <p className="text-gray-600 text-sm">
            Enter your organization to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-6">
            <label
              htmlFor="org-slug"
              className="block font-semibold text-gray-800 mb-2 text-sm"
            >
              Organization
            </label>

            {/* Input wrapper with icon */}
            <div className="relative">
              <input
                id="org-slug"
                type="text"
                value={organizationSlug || ''}
                onChange={handleSlugChange}
                className={cn(
                  "w-full px-4 pr-12 py-3 border-2 rounded-lg text-base text-gray-900 bg-white transition-all",
                  "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#667eea]/20",
                  isValidating && "border-yellow-400",
                  isValid && "border-green-500",
                  validationError && organizationSlug.trim().length > 0 && !isValidating && "border-red-500",
                  !isValidating && !isValid && !validationError && "border-gray-300 focus:border-[#667eea]"
                )}
                autoFocus
                autoComplete="off"
                spellCheck="false"
              />

              {/* Status icons */}
              {isValidating && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400 animate-spin" />
              )}
              {!isValidating && isValid && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
              )}
              {!isValidating && validationError && organizationSlug.trim().length > 0 && (
                <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
              )}
            </div>

            {/* Error message */}
            {validationError && organizationSlug.trim().length > 0 && !isValidating && (
              <motion.div
                className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {validationError}
              </motion.div>
            )}

            {/* Success message */}
            {isValid && orgInfo && (
              <motion.div
                className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <strong>{orgInfo.organization_name}</strong> is ready
              </motion.div>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={!isValid || isValidating}
            className={cn(
              "w-full px-6 py-3 rounded-lg text-base font-semibold text-white transition-all",
              "bg-gradient-to-r from-[#667eea] to-[#764ba2]",
              "hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            )}
          >
            Continue
          </button>
        </form>

        {/* Help section */}
        {/* <div className="mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-[#667eea]">
          <p className="text-sm text-gray-700 font-medium mb-2">
            <strong>Available organizations:</strong>
          </p>
          <ul className="ml-5 space-y-1">
            <li className="text-sm text-gray-600">
              <code className="bg-gray-200 px-2 py-0.5 rounded text-[13px] font-mono text-[#667eea]">
                cloud
              </code>{' '}
              - Cloud Organization
            </li>
            <li className="text-sm text-gray-600">
              <code className="bg-gray-200 px-2 py-0.5 rounded text-[13px] font-mono text-[#667eea]">
                inside
              </code>{' '}
              - Inside Organization
            </li>
          </ul>
        </div> */}
      </motion.div>
    </div>
  );
};

export default OrganizationSelector;
export { ORGANIZATION_SLUG_KEY };

