import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';

// ─── Mock data ────────────────────────────────────────────────────────────────
const SESSIONS = [
    { id: 's001', driver: 'Carlos M.', cp: 'CP-SP-001', connector: 'CCS2', kwh: 32.4, cost: 64.48, duration: '47 min', start: '2026-03-10 09:03', status: 'BILLED' },
    { id: 's002', driver: 'Ana P.', cp: 'CP-SP-002', connector: 'Type 2', kwh: 18.2, cost: 31.85, duration: '28 min', start: '2026-03-10 09:58', status: 'BILLED' },
    { id: 's003', driver: 'João S.', cp: 'CP-SP-001', connector: 'CCS2', kwh: 45.0, cost: 89.55, duration: '62 min', start: '2026-03-10 11:14', status: 'BILLED' },
    { id: 's004', driver: 'Maria L.', cp: 'CP-SP-004', connector: 'Type 2', kwh: 12.8, cost: 23.68, duration: '21 min', start: '2026-03-10 12:00', status: 'BILLED' },
    { id: 's005', driver: 'Pedro A.', cp: 'CP-SP-002', connector: 'Type 2', kwh: 28.6, cost: 50.05, duration: '39 min', start: '2026-03-10 12:41', status: 'CHARGING' },
    { id: 's006', driver: 'Lia F.', cp: 'CP-SP-001', connector: 'CCS2', kwh: 50.0, cost: 99.50, duration: '68 min', start: '2026-03-09 16:00', status: 'BILLED' },
    { id: 's007', driver: 'Carlos M.', cp: 'CP-RJ-001', connector: 'CCS2', kwh: 38.1, cost: 78.10, duration: '51 min', start: '2026-03-09 18:30', status: 'BILLED' },
];

const KWH_CHART = [
    { time: '08h', kwh: 12 }, { time: '09h', kwh: 88 }, { time: '10h', kwh: 54 },
    { time: '11h', kwh: 120 }, { time: '12h', kwh: 145 }, { time: '13h', kwh: 98 },
    { time: '14h', kwh: 76 }, { time: '15h', kwh: 103 }, { time: '16h', kwh: 132 },
    { time: '17h', kwh: 88 }, { time: '18h', kwh: 60 }, { time: '19h', kwh: 30 },
];

const STATUS_BADGE: Record<string, string> = {
    BILLED: 'status-available',
    CHARGING: 'status-charging',
    STOPPED: 'status-unavailable',
};

// Custom tooltip for charts
const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="card-glass px-4 py-3 text-xs">
            <p className="text-slate-300 font-semibold mb-1">{label}</p>
            {payload.map((p: any) => (
                <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
            ))}
        </div>
    );
};

export const SessionsPage: React.FC = () => {
    const totalKwh = SESSIONS.reduce((s, x) => s + x.kwh, 0).toFixed(1);
    const totalSessions = SESSIONS.length;
    const avgKwh = (parseFloat(totalKwh) / totalSessions).toFixed(1);
    const activeSessions = SESSIONS.filter(s => s.status === 'CHARGING').length;

    return (
        <div className="flex flex-col gap-8 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-white">Sessions</h1>
                <p className="text-slate-400 text-sm mt-1">All charge sessions in your network today.</p>
            </div>

            {/* Summary metrics */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                    { label: 'Total Sessions', value: totalSessions, icon: '🔋', color: 'text-volt-400' },
                    { label: 'Active Now', value: activeSessions, icon: '⚡', color: 'text-lime-400' },
                    { label: 'Total kWh', value: `${totalKwh} kWh`, icon: '🔌', color: 'text-blue-400' },
                    { label: 'Avg per Session', value: `${avgKwh} kWh`, icon: '📊', color: 'text-purple-400' },
                ].map(m => (
                    <div key={m.label} className="metric-card">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{m.label}</span>
                            <span className="text-xl">{m.icon}</span>
                        </div>
                        <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
                    </div>
                ))}
            </div>

            {/* kWh area chart */}
            <div className="card-glass p-6">
                <h2 className="text-lg font-semibold text-white mb-6">kWh Delivered — Today</h2>
                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={KWH_CHART} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="kwhGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="kwh" stroke="#0ea5e9" strokeWidth={2} fill="url(#kwhGrad)" name="kWh" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Sessions table */}
            <div className="card-glass overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <h2 className="text-lg font-semibold text-white">Session Log</h2>
                    <span className="text-xs text-slate-500">{totalSessions} sessions today</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-800">
                                {['Driver', 'Charger', 'Connector', 'Start', 'Duration', 'kWh', 'Cost', 'Status'].map(h => (
                                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {SESSIONS.map((s, i) => (
                                <tr key={s.id} className={`border-b border-slate-800/50 hover:bg-white/3 transition-colors ${i % 2 === 0 ? '' : 'bg-surface-900/30'}`}>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-volt-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                {s.driver[0]}
                                            </div>
                                            <span className="text-slate-200 font-medium">{s.driver}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 font-mono text-xs text-slate-400">{s.cp}</td>
                                    <td className="px-6 py-3 text-slate-400">{s.connector}</td>
                                    <td className="px-6 py-3 text-slate-500 text-xs">{s.start}</td>
                                    <td className="px-6 py-3 text-slate-400">{s.duration}</td>
                                    <td className="px-6 py-3 text-volt-400 font-semibold">{s.kwh} kWh</td>
                                    <td className="px-6 py-3 text-lime-400 font-semibold">R${s.cost.toFixed(2)}</td>
                                    <td className="px-6 py-3">
                                        <span className={STATUS_BADGE[s.status] ?? 'status-unavailable'}>{s.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
