import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { DateRangePicker, type DateRange } from '../components/DateRangePicker';
import { exportToCsv, today, daysAgo } from '../utils/exportCsv';

const ALL_SESSIONS = [
    { id: 's001', driver: 'Carlos M.', cp: 'CP-SP-001', connector: 'CCS2', kwh: 32.4, cost: 64.48, duration: '47 min', start: '2026-03-10 09:03', status: 'BILLED' },
    { id: 's002', driver: 'Ana P.', cp: 'CP-SP-002', connector: 'Type 2', kwh: 18.2, cost: 31.85, duration: '28 min', start: '2026-03-10 09:58', status: 'BILLED' },
    { id: 's003', driver: 'João S.', cp: 'CP-SP-001', connector: 'CCS2', kwh: 45.0, cost: 89.55, duration: '62 min', start: '2026-03-10 11:14', status: 'BILLED' },
    { id: 's004', driver: 'Maria L.', cp: 'CP-SP-004', connector: 'Type 2', kwh: 12.8, cost: 23.68, duration: '21 min', start: '2026-03-10 12:00', status: 'BILLED' },
    { id: 's005', driver: 'Pedro A.', cp: 'CP-SP-002', connector: 'Type 2', kwh: 28.6, cost: 50.05, duration: '39 min', start: '2026-03-10 12:41', status: 'CHARGING' },
    { id: 's006', driver: 'Lia F.', cp: 'CP-SP-001', connector: 'CCS2', kwh: 50.0, cost: 99.50, duration: '68 min', start: '2026-03-09 16:00', status: 'BILLED' },
    { id: 's007', driver: 'Carlos M.', cp: 'CP-RJ-001', connector: 'CCS2', kwh: 38.1, cost: 78.10, duration: '51 min', start: '2026-03-09 18:30', status: 'BILLED' },
    { id: 's008', driver: 'Beatriz R.', cp: 'CP-SP-004', connector: 'Type 2', kwh: 22.5, cost: 41.63, duration: '33 min', start: '2026-03-09 14:05', status: 'BILLED' },
    { id: 's009', driver: 'Rafael T.', cp: 'CP-RJ-001', connector: 'CCS2', kwh: 60.2, cost: 119.78, duration: '80 min', start: '2026-03-08 10:20', status: 'BILLED' },
    { id: 's010', driver: 'Ana P.', cp: 'CP-SP-001', connector: 'CCS2', kwh: 17.0, cost: 33.81, duration: '24 min', start: '2026-03-08 08:15', status: 'BILLED' },
    { id: 's011', driver: 'Pedro A.', cp: 'CP-SP-002', connector: 'Type 2', kwh: 41.3, cost: 82.15, duration: '58 min', start: '2026-03-08 17:50', status: 'STOPPED' },
    { id: 's012', driver: 'João S.', cp: 'CP-RJ-001', connector: 'CCS2', kwh: 35.7, cost: 70.99, duration: '49 min', start: '2026-03-07 13:00', status: 'BILLED' },
];

const KWH_TODAY = [
    { time: '08h', kwh: 12 }, { time: '09h', kwh: 88 }, { time: '10h', kwh: 54 },
    { time: '11h', kwh: 120 }, { time: '12h', kwh: 145 }, { time: '13h', kwh: 98 },
    { time: '14h', kwh: 76 }, { time: '15h', kwh: 103 }, { time: '16h', kwh: 132 },
    { time: '17h', kwh: 88 }, { time: '18h', kwh: 60 }, { time: '19h', kwh: 30 },
];

const SESSIONS_BY_HOUR = [
    { time: '08h', sessions: 1 }, { time: '09h', sessions: 4 }, { time: '10h', sessions: 2 },
    { time: '11h', sessions: 5 }, { time: '12h', sessions: 6 }, { time: '13h', sessions: 4 },
    { time: '14h', sessions: 3 }, { time: '15h', sessions: 5 }, { time: '16h', sessions: 7 },
    { time: '17h', sessions: 4 }, { time: '18h', sessions: 3 }, { time: '19h', sessions: 1 },
];

const AVATAR_COLORS = [
    'from-sky-500 to-blue-600', 'from-violet-500 to-purple-600',
    'from-lime-500 to-green-600', 'from-orange-500 to-amber-600', 'from-rose-500 to-pink-600',
];

const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl px-4 py-3 text-xs shadow-xl">
            <p className="text-slate-300 font-semibold mb-2">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} className="flex items-center gap-2" style={{ color: p.color }}>
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
                    {p.name}: <strong>{p.value}</strong>
                </p>
            ))}
        </div>
    );
};

const CHARGERS = ['All Chargers', 'CP-SP-001', 'CP-SP-002', 'CP-SP-004', 'CP-RJ-001'];

export const SessionsPage: React.FC = () => {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [chargerFilter, setChargerFilter] = useState('All Chargers');
    const [activeChart, setActiveChart] = useState<'kwh' | 'sessions'>('kwh');
    const [dateRange, setDateRange] = useState<DateRange>({ from: daysAgo(6), to: today() });

    const STATUSES = [
        { key: 'All', label: t('sessions.table.allStatuses') },
        { key: 'BILLED', label: t('sessions.status.BILLED') },
        { key: 'CHARGING', label: t('sessions.status.CHARGING') },
        { key: 'STOPPED', label: t('sessions.status.STOPPED') },
    ];

    const BADGE: Record<string, { cls: string; dot: string; label: string }> = {
        BILLED:   { cls: 'bg-lime-500/10 text-lime-400 border border-lime-500/25', dot: 'bg-lime-400', label: t('sessions.status.BILLED') },
        CHARGING: { cls: 'bg-sky-500/10 text-sky-400 border border-sky-500/25 animate-pulse', dot: 'bg-sky-400', label: t('sessions.status.CHARGING') },
        STOPPED:  { cls: 'bg-slate-500/10 text-slate-400 border border-slate-500/25', dot: 'bg-slate-400', label: t('sessions.status.STOPPED') },
    };

    const filtered = useMemo(() => {
        return ALL_SESSIONS.filter(s => {
            const sessionDate = s.start.slice(0, 10);
            const matchDate   = sessionDate >= dateRange.from && sessionDate <= dateRange.to;
            const matchSearch  = !search || s.driver.toLowerCase().includes(search.toLowerCase()) || s.cp.toLowerCase().includes(search.toLowerCase());
            const matchStatus  = statusFilter === 'All' || s.status === statusFilter;
            const matchCharger = chargerFilter === 'All Chargers' || s.cp === chargerFilter;
            return matchDate && matchSearch && matchStatus && matchCharger;
        });
    }, [search, statusFilter, chargerFilter, dateRange]);

    const handleExportCsv = () => {
        exportToCsv(`sessions-${dateRange.from}-to-${dateRange.to}.csv`, filtered.map(s => ({
            ID: s.id, Driver: s.driver, Charger: s.cp, Connector: s.connector,
            Start: s.start, Duration: s.duration, kWh: s.kwh,
            'Cost (R$)': s.cost.toFixed(2), Status: s.status,
        })));
    };

    const totalKwh = filtered.reduce((s, x) => s + x.kwh, 0);
    const totalRevenue = filtered.reduce((s, x) => s + x.cost, 0);
    const activeSessions = ALL_SESSIONS.filter(s => s.status === 'CHARGING').length;
    const avgKwh = filtered.length ? totalKwh / filtered.length : 0;

    const metrics = [
        { label: t('sessions.metrics.totalSessions'), value: filtered.length.toString(), sub: `${activeSessions} ${t('sessions.metrics.activeNow')}`, icon: '🔋', color: 'text-sky-400', bar: 'bg-sky-500' },
        { label: t('sessions.metrics.kwhDelivered'), value: `${totalKwh.toFixed(1)}`, sub: t('sessions.metrics.kwhToday'), icon: '⚡', color: 'text-volt-400', bar: 'bg-yellow-400' },
        { label: t('sessions.metrics.avgPerSession'), value: `${avgKwh.toFixed(1)} kWh`, sub: t('sessions.metrics.avgEnergy'), icon: '📊', color: 'text-violet-400', bar: 'bg-violet-500' },
        { label: t('sessions.metrics.revenue'), value: `R$${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, sub: t('sessions.metrics.fromFiltered'), icon: '💰', color: 'text-lime-400', bar: 'bg-lime-500' },
    ];

    const TABLE_HEADERS = [
        t('sessions.table.driver'), t('sessions.table.charger'), t('sessions.table.connector'),
        t('sessions.table.start'), t('sessions.table.duration'), t('sessions.table.kwh'),
        t('sessions.table.cost'), t('sessions.table.status'),
    ];

    return (
        <div className="flex flex-col gap-8 animate-fade-in">
            <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{t('sessions.title')}</h1>
                        <p className="text-slate-400 text-sm mt-1">{t('sessions.subtitle')}</p>
                    </div>
                    <button onClick={handleExportCsv} className="btn-primary flex items-center gap-2 text-xs">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        {t('sessions.exportCsv')} ({filtered.length})
                    </button>
                </div>
                <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {metrics.map(m => (
                    <div key={m.label} className="metric-card group">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{m.label}</span>
                            <span className="text-lg">{m.icon}</span>
                        </div>
                        <p className={`text-3xl font-bold ${m.color} mb-0.5`}>{m.value}</p>
                        <p className="text-xs text-slate-500">{m.sub}</p>
                        <div className="mt-3 h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${m.bar} w-3/4 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="card-glass p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">{t('sessions.chart.title')}</h2>
                    <div className="flex items-center gap-1 bg-slate-800/60 rounded-xl p-1">
                        {(['kwh', 'sessions'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveChart(tab)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${activeChart === tab ? 'bg-volt-500/20 text-volt-400 border border-volt-500/30' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                {tab === 'kwh' ? t('sessions.chart.kwhTab') : t('sessions.chart.sessionsTab')}
                            </button>
                        ))}
                    </div>
                </div>

                {activeChart === 'kwh' ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={KWH_TODAY} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="kwhGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<ChartTooltip />} />
                            <Area type="monotone" dataKey="kwh" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#kwhGrad)" name="kWh" dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: '#0ea5e9' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={SESSIONS_BY_HOUR} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={14}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                            <Bar dataKey="sessions" name={t('sessions.chart.sessionsTab')} fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="card-glass overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-slate-800">
                    <div className="relative flex-1 min-w-[200px]">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" /></svg>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={t('sessions.table.search')}
                            className="input-field pl-9 text-xs"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {STATUSES.map(s => (
                            <button
                                key={s.key}
                                onClick={() => setStatusFilter(s.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${statusFilter === s.key ? 'bg-volt-500/15 text-volt-400 border-volt-500/30' : 'text-slate-400 border-slate-700 hover:border-slate-500'}`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                    <select
                        value={chargerFilter}
                        onChange={e => setChargerFilter(e.target.value)}
                        className="input-field w-auto text-xs"
                    >
                        {CHARGERS.map(c => <option key={c} value={c}>{c === 'All Chargers' ? t('sessions.table.allChargers') : c}</option>)}
                    </select>
                    <span className="text-xs text-slate-500 ml-auto whitespace-nowrap">
                        {filtered.length} {filtered.length !== 1 ? t('sessions.table.results_plural') : t('sessions.table.results')}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-800">
                                {TABLE_HEADERS.map(h => (
                                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-16 text-slate-600 text-sm">{t('sessions.table.noResults')}</td></tr>
                            ) : filtered.map((s, i) => {
                                const badge = BADGE[s.status] ?? BADGE.STOPPED;
                                const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
                                return (
                                    <tr key={s.id} className="border-b border-slate-800/50 hover:bg-white/[0.02] transition-colors duration-150">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md`}>
                                                    {s.driver[0]}
                                                </div>
                                                <span className="text-slate-200 font-medium whitespace-nowrap">{s.driver}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">{s.cp}</td>
                                        <td className="px-6 py-3">
                                            <span className="text-xs px-2 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">{s.connector}</span>
                                        </td>
                                        <td className="px-6 py-3 text-slate-500 text-xs whitespace-nowrap">{s.start}</td>
                                        <td className="px-6 py-3 text-slate-400 whitespace-nowrap">{s.duration}</td>
                                        <td className="px-6 py-3">
                                            <span className="text-sky-400 font-bold tabular-nums">{s.kwh}</span>
                                            <span className="text-slate-500 text-xs ml-1">kWh</span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="text-lime-400 font-bold tabular-nums">R${s.cost.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                                {badge.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between">
                    <p className="text-xs text-slate-600">{t('sessions.table.showing', { count: filtered.length, total: ALL_SESSIONS.length })}</p>
                    <p className="text-xs text-slate-500">
                        {t('sessions.table.total')}: <span className="text-sky-400 font-semibold">{totalKwh.toFixed(1)} kWh</span>
                        {' · '}
                        <span className="text-lime-400 font-semibold">R${totalRevenue.toFixed(2)}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};
