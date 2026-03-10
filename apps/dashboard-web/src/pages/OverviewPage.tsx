import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChargePointCard } from '../components/ChargePointCard';
import { useRealtimeEvents } from '../hooks/useRealtimeEvents';

const MOCK_CHARGERS = [
    { id: '1', ocppId: 'CP-001', connectorType: 'CCS2', pricePerKwh: 1.99, status: 'AVAILABLE' as const, lastSeenAt: new Date().toISOString() },
    { id: '2', ocppId: 'CP-002', connectorType: 'Type 2', pricePerKwh: 1.75, status: 'CHARGING' as const, lastSeenAt: new Date().toISOString() },
    { id: '3', ocppId: 'CP-003', connectorType: 'CCS2', pricePerKwh: 2.10, status: 'FAULTED' as const, lastSeenAt: new Date(Date.now() - 60_000 * 5).toISOString() },
    { id: '4', ocppId: 'CP-004', connectorType: 'Type 2', pricePerKwh: 1.99, status: 'UNAVAILABLE' as const },
];

export const OverviewPage: React.FC = () => {
    const { t } = useTranslation();
    const { chargerStatuses, connected, events } = useRealtimeEvents();

    const METRICS = [
        { label: t('overview.metrics.totalRevenue'), value: 'R$12,840', change: '+8.2%', icon: '💰', color: 'text-lime-400' },
        { label: t('overview.metrics.activeSessions'), value: '7', change: 'Live', icon: '⚡', color: 'text-volt-400' },
        { label: t('overview.metrics.chargersOnline'), value: '18 / 24', change: '75%', icon: '📡', color: 'text-blue-400' },
        { label: t('overview.metrics.kwhDelivered'), value: '4,231 kWh', change: '+12.5%', icon: '🔋', color: 'text-purple-400' },
    ];

    const displayChargers = useMemo(() => MOCK_CHARGERS.map(cp => ({
        ...cp,
        status: chargerStatuses[cp.ocppId] ?? cp.status,
    })), [chargerStatuses]);

    return (
        <div className="flex flex-col gap-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">{t('overview.title')}</h1>
                    <p className="text-slate-400 text-sm mt-1">{t('overview.subtitle')}</p>
                </div>
                {connected && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></span>
                        {t('overview.liveConnection')}
                    </div>
                )}
            </div>

            <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {METRICS.map(m => (
                    <div key={m.label} className="metric-card">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{m.label}</span>
                            <span className="text-xl">{m.icon}</span>
                        </div>
                        <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                            <span className="text-lime-400 font-semibold">{m.change}</span>
                            <span>{t('overview.vsLastMonth')}</span>
                        </div>
                    </div>
                ))}
            </section>

            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">{t('overview.chargePoints')}</h2>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></span>
                        {t('overview.liveStatus')}
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {displayChargers.map(cp => (
                        <ChargePointCard key={cp.id} {...cp} />
                    ))}
                </div>
            </section>

            <section className="card-glass p-6">
                <h2 className="text-lg font-semibold text-white mb-4">{t('overview.recentSessions')}</h2>
                <div className="space-y-3">
                    {events.length > 0 ? events.slice(0, 5).map((ev, i) => (
                        <div key={i} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 text-xs font-bold">⚡</div>
                                <div>
                                    <p className="text-sm font-medium text-slate-200">{ev.chargerId}</p>
                                    <p className="text-xs text-slate-500">Event: {ev.type}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-lime-400">{ev.status ?? (ev.kwh ? `${ev.kwh} kWh` : '')}</p>
                                <p className="text-xs text-slate-500">{new Date(ev.timestamp).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    )) : [
                        { driver: 'Carlos M.', kwh: 32.4, cost: 'R$64.68', duration: '47 min', cp: 'CP-002', when: '10 min ago' },
                        { driver: 'Ana P.', kwh: 18.2, cost: 'R$36.22', duration: '28 min', cp: 'CP-001', when: '1h ago' },
                        { driver: 'João S.', kwh: 45.0, cost: 'R$89.55', duration: '62 min', cp: 'CP-004', when: '3h ago' },
                    ].map((s, i) => (
                        <div key={`mock-${i}`} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-volt-gradient flex items-center justify-center text-white text-xs font-bold">
                                    {s.driver[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-200">{s.driver}</p>
                                    <p className="text-xs text-slate-500">{s.cp} · {s.duration}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-lime-400">{s.cost}</p>
                                <p className="text-xs text-slate-500">{s.kwh} kWh · {s.when}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};
