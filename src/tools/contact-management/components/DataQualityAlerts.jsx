/**
 * DataQualityAlerts Component
 * Displays data quality metrics and housekeeping alerts
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Building2, TrendingDown, Users, Route } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8989';

export default function DataQualityAlerts({ organizationSlug, onAlertClick }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!organizationSlug) return;

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE}/api/contacts/data-quality?organization_slug=${organizationSlug}`,
          { credentials: 'include' }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch data quality metrics');
        }

        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching data quality metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [organizationSlug]);

  if (loading) {
    return null; // Don't show loading state for this component
  }

  if (!metrics) {
    return null;
  }

  const totalIssues =
    metrics.companiesWithoutName +
    metrics.companiesWithoutIndustry +
    metrics.companiesWithIncompleteAddress +
    metrics.customersWithoutSalesPerson +
    metrics.customersWithoutCustomerService +
    metrics.customersWithoutTrafficSource;

  // Don't show if no issues
  if (totalIssues === 0) {
    return null;
  }

  if (collapsed) {
    return (
      <div className="mb-4">
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 hover:bg-yellow-100 transition-colors text-sm"
        >
          <AlertTriangle size={14} />
          <span className="font-medium">{totalIssues} data quality {totalIssues === 1 ? 'issue' : 'issues'}</span>
        </button>
      </div>
    );
  }

  const alerts = [
    {
      id: 'companies-no-name',
      count: metrics.companiesWithoutName,
      title: 'Missing Company Name',
      icon: Building2,
      color: 'red',
      filterType: 'companies-no-name',
    },
    {
      id: 'companies-no-industry',
      count: metrics.companiesWithoutIndustry,
      title: 'Missing Industry',
      icon: TrendingDown,
      color: 'orange',
      filterType: 'companies-no-industry',
    },
    {
      id: 'companies-incomplete-address',
      count: metrics.companiesWithIncompleteAddress,
      title: 'Incomplete Address',
      icon: Building2,
      color: 'orange',
      filterType: 'companies-incomplete-address',
    },
    {
      id: 'customers-no-sales',
      count: metrics.customersWithoutSalesPerson,
      title: 'No Sales Person',
      icon: Users,
      color: 'yellow',
      filterType: 'customers-no-sales',
    },
    {
      id: 'customers-no-service',
      count: metrics.customersWithoutCustomerService,
      title: 'No Customer Service',
      icon: Users,
      color: 'yellow',
      filterType: 'customers-no-service',
    },
    {
      id: 'customers-no-channel',
      count: metrics.customersWithoutTrafficSource,
      title: 'No Traffic Channel',
      icon: Route,
      color: 'yellow',
      filterType: 'customers-no-channel',
    },
  ].filter((alert) => alert.count > 0); // Only show alerts with issues

  const colorStyles = {
    red: {
      bg: 'bg-white',
      border: 'border-gray-200 border-l-4 border-l-red-500',
      text: 'text-gray-900',
      icon: 'text-red-500',
      hover: 'hover:bg-gray-50 hover:border-l-red-600',
      badge: 'bg-gray-100 text-gray-700',
    },
    orange: {
      bg: 'bg-white',
      border: 'border-gray-200 border-l-4 border-l-orange-500',
      text: 'text-gray-900',
      icon: 'text-orange-500',
      hover: 'hover:bg-gray-50 hover:border-l-orange-600',
      badge: 'bg-gray-100 text-gray-700',
    },
    yellow: {
      bg: 'bg-white',
      border: 'border-gray-200 border-l-4 border-l-amber-500',
      text: 'text-gray-900',
      icon: 'text-amber-500',
      hover: 'hover:bg-gray-50 hover:border-l-amber-600',
      badge: 'bg-gray-100 text-gray-700',
    },
  };

  return (
    <div className="mb-6">
      {/* Alert Cards - Grid layout for consistent width */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          const styles = colorStyles[alert.color];

          return (
            <button
              key={alert.id}
              onClick={() => onAlertClick && onAlertClick(alert.filterType)}
              className={`${styles.bg} ${styles.border} ${styles.hover} border rounded-lg px-4 py-3 text-left transition-all shadow-sm hover:shadow-md active:shadow-lg flex items-center gap-3 w-full touch-manipulation`}
            >
              <div className={`${styles.icon} shrink-0`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium ${styles.text} block truncate`}>
                  {alert.title}
                </span>
                <span className="text-xs text-gray-500 mt-0.5 block">
                  Click to filter
                </span>
              </div>
              <span className={`${styles.badge} text-xs font-semibold px-2.5 py-1 rounded-md shrink-0 min-w-[32px] text-center`}>
                {alert.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
