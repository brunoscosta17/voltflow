import React from 'react';

type CPStatus = 'AVAILABLE' | 'CHARGING' | 'FAULTED' | 'UNAVAILABLE' | 'PREPARING' | 'FINISHING';

interface ChargePointCardProps {
    ocppId: string;
    connectorType: string;
    pricePerKwh: number;
    status: CPStatus;
    lastSeenAt?: string;
}

const statusConfig: Record<CPStatus, { label: string; cls: string; pulse: string }> = {
    AVAILABLE: { label: 'Available', cls: 'status-available', pulse: 'bg-lime-400' },
    CHARGING: { label: 'Charging', cls: 'status-charging', pulse: 'bg-volt-400' },
    PREPARING: { label: 'Preparing', cls: 'status-charging', pulse: 'bg-volt-400' },
    FINISHING: { label: 'Finishing', cls: 'status-charging', pulse: 'bg-volt-400' },
    FAULTED: { label: 'Faulted', cls: 'status-faulted', pulse: 'bg-red-400' },
    UNAVAILABLE: { label: 'Unavailable', cls: 'status-unavailable', pulse: 'bg-slate-500' },
};

export const ChargePointCard: React.FC<ChargePointCardProps> = ({
    ocppId, connectorType, pricePerKwh, status, lastSeenAt,
}) => {
    const cfg = statusConfig[status];

    return (
        <div className="card-glass p-5 flex flex-col gap-4 hover:border-slate-600 transition-all duration-300 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <p className="font-mono text-xs text-slate-500 mb-0.5">ID</p>
                    <p className="font-semibold text-slate-100 text-sm">{ocppId}</p>
                </div>
                <span className={cfg.cls}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.pulse} animate-pulse-slow`} />
                    {cfg.label}
                </span>
            </div>

            {/* Connector & Price */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🔌</span>
                    <span className="text-sm text-slate-300">{connectorType}</span>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500">Price</p>
                    <p className="font-semibold text-volt-400 text-sm">R${pricePerKwh.toFixed(2)}/kWh</p>
                </div>
            </div>

            {/* Last seen */}
            {lastSeenAt && (
                <p className="text-xs text-slate-600 border-t border-slate-800 pt-3">
                    Last heartbeat: {new Date(lastSeenAt).toLocaleTimeString()}
                </p>
            )}
        </div>
    );
};
