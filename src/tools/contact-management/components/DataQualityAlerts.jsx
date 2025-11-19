/**
 * DataQualityAlerts Component
 * Displays data quality metrics and housekeeping alerts
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Building2, TrendingDown, Users, XCircle, Route } from 'lucide-react';

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
          `${API_BASE}/api/contacts/data-quality?organization_slug=${organizationSlug}`
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
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-900',
      icon: 'text-red-600',
      hover: 'hover:bg-red-100',
      badge: 'bg-red-600',
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-900',
      icon: 'text-orange-600',
      hover: 'hover:bg-orange-100',
      badge: 'bg-orange-600',
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-900',
      icon: 'text-yellow-600',
      hover: 'hover:bg-yellow-100',
      badge: 'bg-yellow-600',
    },
  };

  return (
    <div className="mb-4">
      {/* Alert Cards */}
      <div className="flex flex-wrap gap-2">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          const styles = colorStyles[alert.color];

          return (
            <button
              key={alert.id}
              onClick={() => onAlertClick && onAlertClick(alert.filterType)}
              className={`${styles.bg} ${styles.border} ${styles.hover} border rounded-lg px-3 py-2 text-left transition-all hover:shadow-sm flex items-center gap-2`}
            >
              <div className={styles.icon}>
                <Icon size={16} />
              </div>
              <span className={`text-sm font-medium ${styles.text}`}>
                {alert.title}
              </span>
              <span className={`${styles.badge} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
                {alert.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
