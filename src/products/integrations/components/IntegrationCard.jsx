import React from 'react';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '../../../lib/utils'; // Assuming utils exist here, or adjust path

const IntegrationCard = ({
    icon: Icon,
    name,
    description,
    status = 'disconnected', // 'connected', 'disconnected', 'error'
    lastSync,
    onClick
}) => {
    const isConnected = status === 'connected';
    const isError = status === 'error';

    return (
        <div
            onClick={onClick}
            className="group relative bg-white rounded-xl border border-gray-200 p-6 hover:border-primary-200 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col h-full"
        >
            <div className="flex items-start justify-between mb-4">
                <div className={cn(
                    "p-3 rounded-lg transition-colors",
                    isConnected ? "bg-primary-50 text-primary-600" : "bg-gray-100 text-gray-600 group-hover:bg-primary-50 group-hover:text-primary-600"
                )}>
                    <Icon className="w-8 h-8" />
                </div>
                {isConnected && (
                    <div className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Connected
                    </div>
                )}
                {isError && (
                    <div className="flex items-center text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Error
                    </div>
                )}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                {name}
            </h3>

            <p className="text-sm text-gray-500 mb-4 flex-grow line-clamp-2">
                {description}
            </p>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                <span className="text-xs text-gray-400">
                    {isConnected && lastSync ? `Last synced ${lastSync}` : ''}
                </span>

                <span className="text-sm font-medium text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                    Configure <ArrowRight className="w-4 h-4 ml-1" />
                </span>
            </div>
        </div>
    );
};

export default IntegrationCard;
