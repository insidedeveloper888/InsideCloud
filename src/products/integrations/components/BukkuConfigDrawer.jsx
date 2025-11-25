import React, { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';

const BukkuConfigDrawer = ({ isOpen, onClose, onConnect, isConnecting, error }) => {
    const [subdomain, setSubdomain] = useState('');
    const [accessToken, setAccessToken] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConnect({ subdomain, accessToken });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Connect Bukku</h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700">
                            Company Subdomain
                        </label>
                        <div className="flex rounded-md shadow-sm">
                            <input
                                type="text"
                                id="subdomain"
                                value={subdomain}
                                onChange={(e) => setSubdomain(e.target.value)}
                                placeholder="mycompany"
                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                required
                            />
                            <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                .bukku.my
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">
                            Your Bukku URL, e.g., https://<strong>mycompany</strong>.bukku.my
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700">
                            Access Token
                        </label>
                        <input
                            type="password"
                            id="accessToken"
                            value={accessToken}
                            onChange={(e) => setAccessToken(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter your Bukku API Access Token"
                            required
                        />
                        <p className="text-xs text-gray-500">
                            Found in Bukku Settings &gt; Integrations &gt; API
                        </p>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button variant="outline" type="button" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isConnecting || !subdomain || !accessToken}>
                            {isConnecting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                'Connect Bukku'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BukkuConfigDrawer;
