import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, MessageCircle, ShoppingBag, Loader2 } from 'lucide-react';
import IntegrationCard from './components/IntegrationCard';
import BukkuConfigDrawer from './components/BukkuConfigDrawer';

const IntegrationsDashboard = ({ organizationSlug }) => {
    const [integrations, setIntegrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isBukkuDrawerOpen, setIsBukkuDrawerOpen] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [connectError, setConnectError] = useState(null);

    // Mock data for available integrations (in a real app, this might come from a registry API)
    const availableIntegrations = [
        {
            key: 'bukku',
            name: 'Bukku Accounting',
            description: 'Sync invoices, payments, and customers automatically.',
            category: 'accounting',
            icon: FileText,
        },
        {
            key: 'whatsapp',
            name: 'WhatsApp',
            description: 'Connect your business number to sync contacts and messages.',
            category: 'social_media',
            icon: MessageCircle,
        },
        {
            key: 'tiktok',
            name: 'TikTok Shop',
            description: 'Sync orders and inventory from your TikTok Shop.',
            category: 'ecommerce',
            icon: ShoppingBag,
        }
    ];

    useEffect(() => {
        console.log('🧩 IntegrationsDashboard mounted');
        fetchIntegrations();
    }, []);

    const fetchIntegrations = async () => {
        try {
            const response = await axios.get(`/api/integrations?organization_slug=${organizationSlug}`);
            setIntegrations(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch integrations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectBukku = async (config) => {
        setConnecting(true);
        setConnectError(null);
        try {
            await axios.post('/api/integrations/connect', {
                organization_slug: organizationSlug, // TODO: Get from context/session
                integration_key: 'bukku',
                category: 'accounting',
                config
            });

            await fetchIntegrations(); // Refresh list
            setIsBukkuDrawerOpen(false);
        } catch (error) {
            console.error('Failed to connect Bukku:', error);
            setConnectError(error.response?.data?.msg || 'Failed to connect. Please check your credentials.');
        } finally {
            setConnecting(false);
        }
    };

    const getIntegrationStatus = (key) => {
        const integration = integrations.find(i => i.integration_key === key);
        return integration ? (integration.is_active ? 'connected' : 'disconnected') : 'disconnected';
    };

    const getLastSync = (key) => {
        const integration = integrations.find(i => i.integration_key === key);
        return integration?.updated_at ? new Date(integration.updated_at).toLocaleDateString() : null;
    };

    const handleCardClick = (key) => {
        if (key === 'bukku') {
            setIsBukkuDrawerOpen(true);
        } else {
            // Placeholder for other integrations
            alert(`Configuration for ${key} is coming soon!`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    // Group integrations by category
    const categories = {
        accounting: 'Accounting & Finance',
        social_media: 'Social Media & Messaging',
        ecommerce: 'E-Commerce'
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
                    <p className="text-gray-500 mt-1">Connect your favorite tools to streamline your workflow.</p>
                </div>
                {/* Optional: Add a back button if needed, though usually handled by parent nav */}
            </div>

            <div className="space-y-10">
                {Object.entries(categories).map(([catKey, catTitle]) => {
                    const categoryIntegrations = availableIntegrations.filter(i => i.category === catKey);

                    if (categoryIntegrations.length === 0) return null;

                    return (
                        <div key={catKey}>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                {catTitle}
                                <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                    {categoryIntegrations.length}
                                </span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {categoryIntegrations.map((integration) => (
                                    <IntegrationCard
                                        key={integration.key}
                                        icon={integration.icon}
                                        name={integration.name}
                                        description={integration.description}
                                        status={getIntegrationStatus(integration.key)}
                                        lastSync={getLastSync(integration.key)}
                                        onClick={() => handleCardClick(integration.key)}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <BukkuConfigDrawer
                isOpen={isBukkuDrawerOpen}
                onClose={() => setIsBukkuDrawerOpen(false)}
                onConnect={handleConnectBukku}
                isConnecting={connecting}
                error={connectError}
            />
        </div>
    );
};

export default IntegrationsDashboard;
