import { useState, useEffect, useCallback } from 'react';

const resolveApiOrigin = () =>
    process.env.REACT_APP_API_ORIGIN || window.location.origin;

// Default statuses for invoices
const DEFAULT_STATUSES = [
    { status_key: 'draft', status_label: 'Draft', status_color: '#6B7280', sort_order: 0 },
    { status_key: 'sent', status_label: 'Sent', status_color: '#3B82F6', sort_order: 1 },
    { status_key: 'viewed', status_label: 'Viewed', status_color: '#8B5CF6', sort_order: 2 },
    { status_key: 'partial', status_label: 'Partially Paid', status_color: '#F59E0B', sort_order: 3 },
    { status_key: 'paid', status_label: 'Paid', status_color: '#10B981', sort_order: 4 },
    { status_key: 'overdue', status_label: 'Overdue', status_color: '#EF4444', sort_order: 5 },
    { status_key: 'cancelled', status_label: 'Cancelled', status_color: '#6B7280', sort_order: 6 },
];

export function useInvoiceStatuses(organizationSlug) {
    const [statuses, setStatuses] = useState(DEFAULT_STATUSES);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStatuses = useCallback(async () => {
        if (!organizationSlug) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${resolveApiOrigin()}/api/invoice_statuses?organization_slug=${organizationSlug}`,
                { credentials: 'include' }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch statuses: ${response.statusText}`);
            }

            const data = await response.json();
            setStatuses(data && data.length > 0 ? data : DEFAULT_STATUSES);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching invoice statuses:', err);
            // On error, keep using defaults
            setStatuses(DEFAULT_STATUSES);
        } finally {
            setLoading(false);
        }
    }, [organizationSlug]);

    const updateStatuses = useCallback(async (newStatuses) => {
        // Validation: All statuses must have labels
        if (newStatuses.some(s => !s.status_label || !s.status_label.trim())) {
            throw new Error('All statuses must have a label');
        }

        try {
            const response = await fetch(
                `${resolveApiOrigin()}/api/invoice_statuses?organization_slug=${organizationSlug}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(newStatuses),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update statuses');
            }

            const data = await response.json();
            setStatuses(data);
            return data;
        } catch (err) {
            console.error('Error updating invoice statuses:', err);
            throw err;
        }
    }, [organizationSlug]);

    useEffect(() => {
        fetchStatuses();
    }, [fetchStatuses]);

    // Helper to get status config by key
    const getStatusByKey = useCallback((statusKey) => {
        return statuses.find(s => s.status_key === statusKey) || null;
    }, [statuses]);

    // Helper to create lookup maps
    const getStatusMaps = useCallback(() => {
        const colorMap = {};
        const labelMap = {};

        statuses.forEach(status => {
            colorMap[status.status_key] = status.status_color;
            labelMap[status.status_key] = status.status_label;
        });

        return { colorMap, labelMap };
    }, [statuses]);

    return {
        statuses,
        loading,
        error,
        refetch: fetchStatuses,
        updateStatuses,
        getStatusByKey,
        getStatusMaps,
    };
}
