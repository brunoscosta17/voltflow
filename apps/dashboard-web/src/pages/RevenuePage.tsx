import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';

const DAILY_REVENUE_7 = [
    { day: '04/03', gross: 430, hostNet: 387, voltflowFee: 43 },
    { day: '05/03', gross: 390, hostNet: 351, voltflowFee: 39 },
    { day: '06/03', gross: 980, hostNet: 882, voltflowFee: 98 },
    { day: '07/03', gross: 1100, hostNet: 990, voltflowFee: 110 },
    { day: '08/03', gross: 1380, hostNet: 1242, voltflowFee: 138 },
    { day: '09/03', gross: 920, hostNet: 828, voltflowFee: 92 },
    { day: '10/03', gross: 1270, hostNet: 1143, voltflowFee: 127 },
];

const DAILY_REVENUE_14 = [
    { day: '25/02', gross: 420, hostNet: 378, voltflowFee: 42 },
    { day: '26/02', gross: 890, hostNet: 800, voltflowFee: 90 },
    { day: '27/02', gross: 650, hostNet: 585, voltflowFee: 65 },
    { day: '28/02', gross: 1200, hostNet: 1080, voltflowFee: 120 },
    { day: '01/03', gross: 980, hostNet: 882, voltflowFee: 98 },
    { day: '02/03', gross: 1450, hostNet: 1305, voltflowFee: 145 },
    { day: '03/03', gross: 760, hostNet: 684, voltflowFee: 76 },
    ...DAILY_REVENUE_7,
];

const BY_CHARGER = [
    { cp: 'CP-SP-001', revenue: 4_820, sessions: 38 },
    { cp: 'CP-SP-002', revenue: 3_140, sessions: 27 },
    { cp: 'CP-SP-004', revenue: 2_650, sessions: 22 },
    { cp: 'CP-RJ-001', revenue: 2_304, sessions: 19 },
];

const RECENT_TRANSACTIONS = [
    { id: 't001', driver: 'Carlos M.', cp: 'CP-SP-001', gross: 64.48, net: 61.26, fee: 3.22, date: '10/03 09:50', method: 'Pix' },
    { id: 't002', driver: 'Ana P.', cp: 'CP-SP-002', gross: 31.85, net: 30.26, fee: 1.59, date: '10/03 10:26', method: 'Pix' },
    { id: 't003', driver: 'João S.', cp: 'CP-SP-001', gross: 89.55, net: 85.07, fee: 4.48, date: '10/03 12:16', method: 'Pix' },
    { id: 't004', driver: 'Maria L.', cp: 'CP-SP-004', gross: 23.68, net: 22.50, fee: 1.18, date: '10/03 12:21', method: 'Pix' },
    { id: 't005', driver: 'Lia F.', cp: 'CP-SP-001', gross: 99.50, net: 94.52, fee: 4.98, date: '09/03 17:08', method: 'Pix' },
];

const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl px-4 py-3 text-xs shadow-xl">
            <p className="text-slate-300 font-semibold mb-2">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} className="flex items-center gap-2" style={{ color: p.color }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    {p.name}: <strong>R${Number(p.value).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</strong>
                </p>
            ))}
        </div>
    );
};

type Period = 'last7' | 'last14';

export const RevenuePage: React.FC = () => {
    const { t } = useTranslation();
    const [period, setPeriod] = useState<Period>('last14');

    const data = period === 'last7' ? DAILY_REVENUE_7 : DAILY_REVENUE_14;

    const totalGross = data.reduce((s, d) => s + d.gross, 0);
    const totalHost = data.reduce((s, d) => s + d.hostNet, 0);
    const totalFee = data.reduce((s, d) => s + d.voltflowFee, 0);

    const splitData = [
        { name: t('revenue.charts.hostRevenue'), value: totalHost, color: '#0ea5e9' },
        { name: t('revenue.charts.voltflowFee'), value: totalFee, color: '#a3e635' },
    ];

    const feeRate = ((totalFee / totalGross) * 100).toFixed(1);

    const metrics = [
        {
            label: t('revenue.metrics.grossRevenue'),
            value: `R$${totalGross.toLocaleString('pt-BR')}`,
            sub: t('revenue.metrics.growthNote'), icon: '💰', color: 'text-lime-400', ring: 'ring-lime-500/20',
        },
        {
            label: t('revenue.metrics.hostEarnings'),
            value: `R$${totalHost.toLocaleString('pt-BR')}`,
            sub: `${(100 - parseFloat(feeRate)).toFixed(1)}% ${t('revenue.metrics.ofGross')}`, icon: '🏪', color: 'text-sky-400', ring: 'ring-sky-500/20',
        },
        {
            label: t('revenue.metrics.voltflowFee'),
            value: `R$${totalFee.toLocaleString('pt-BR')}`,
            sub: `${feeRate}% ${t('revenue.metrics.platformCommission')}`, icon: '⚡', color: 'text-violet-400', ring: 'ring-violet-500/20',
        },
    ];

    const avatarColors = ['from-sky-500 to-blue-600', 'from-violet-500 to-purple-600', 'from-lime-500 to-green-600', 'from-orange-500 to-amber-600', 'from-rose-500 to-pink-600'];

    return (
        <div className="flex flex-col gap-8 animate-fade-in">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">{t('revenue.title')}</h1>
                    <p className="text-slate-400 text-sm mt-1">{t('revenue.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-800/60 rounded-xl p-1">
                        {(['last7', 'last14'] as Period[]).map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${period === p ? 'bg-volt-500/20 text-volt-400 border border-volt-500/30' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                {t(`revenue.${p}`)}
                            </button>
                        ))}
                    </div>
                    <button className="btn-primary flex items-center gap-2 text-xs">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        {t('revenue.export')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {metrics.map(m => (
                    <div key={m.label} className={`metric-card ring-1 ${m.ring} group`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{m.label}</span>
                            <span className="text-lg">{m.icon}</span>
                        </div>
                        <p className={`text-3xl font-bold ${m.color} mb-0.5`}>{m.value}</p>
                        <p className="text-xs text-slate-500">{m.sub}</p>
                    </div>
                ))}
            </div>

            <div className="card-glass p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">{t('revenue.charts.dailyBreakdown')}</h2>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-sky-500 inline-block" />{t('revenue.charts.hostNet')}</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-lime-400 inline-block" />{t('revenue.charts.voltflowFee')}</span>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barSize={period === 'last14' ? 12 : 20}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                        <Bar dataKey="hostNet" name={t('revenue.charts.hostNet')} fill="#0ea5e9" radius={[3, 3, 0, 0]} stackId="a" />
                        <Bar dataKey="voltflowFee" name={t('revenue.charts.voltflowFee')} fill="#a3e635" radius={[3, 3, 0, 0]} stackId="a" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="card-glass p-6">
                <h2 className="text-lg font-semibold text-white mb-6">{t('revenue.charts.grossTrend')}</h2>
                <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="gross" stroke="#a3e635" strokeWidth={2.5} fill="url(#grossGrad)" name={t('revenue.charts.gross')} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="card-glass p-6">
                    <h2 className="text-lg font-semibold text-white mb-6">{t('revenue.charts.revenueSplit')}</h2>
                    <div className="flex items-center gap-8">
                        <div className="flex-shrink-0">
                            <ResponsiveContainer width={180} height={180}>
                                <PieChart>
                                    <Pie data={splitData} cx="50%" cy="50%" innerRadius={55} outerRadius={82} paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}>
                                        {splitData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} stroke="transparent" />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col gap-4 flex-1">
                            {splitData.map(d => {
                                const pct = ((d.value / totalGross) * 100).toFixed(1);
                                return (
                                    <div key={d.name}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                                                <span className="text-xs text-slate-400">{d.name}</span>
                                            </div>
                                            <span className="text-xs font-bold" style={{ color: d.color }}>{pct}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: d.color }} />
                                        </div>
                                        <p className="text-sm font-bold mt-1" style={{ color: d.color }}>R${d.value.toLocaleString('pt-BR')}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="card-glass p-6 flex flex-col gap-4">
                    <h2 className="text-lg font-semibold text-white">{t('revenue.charts.byCharger')}</h2>
                    <div className="flex flex-col gap-3">
                        {BY_CHARGER.map((c, i) => {
                            const maxRevenue = BY_CHARGER[0].revenue;
                            const pct = (c.revenue / maxRevenue) * 100;
                            const colors = ['bg-sky-500', 'bg-violet-500', 'bg-indigo-500', 'bg-slate-500'];
                            const textColors = ['text-sky-400', 'text-violet-400', 'text-indigo-400', 'text-slate-400'];
                            return (
                                <div key={c.cp} className="group">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2.5">
                                            <span className={`font-mono text-xs font-semibold ${textColors[i]}`}>{c.cp}</span>
                                            <span className="text-xs text-slate-600">{c.sessions} {t('revenue.charts.sessions')}</span>
                                        </div>
                                        <span className={`text-sm font-bold ${textColors[i]} tabular-nums`}>R${c.revenue.toLocaleString('pt-BR')}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${colors[i]} opacity-80 group-hover:opacity-100 transition-all duration-700`} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="card-glass overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <h2 className="text-lg font-semibold text-white">{t('revenue.transactions.title')}</h2>
                    <span className="text-xs text-slate-500">{RECENT_TRANSACTIONS.length} {t('revenue.transactions.latest')}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-800">
                                {[
                                    t('revenue.transactions.driver'), t('revenue.transactions.charger'),
                                    t('revenue.transactions.gross'), t('revenue.transactions.hostNet'),
                                    t('revenue.transactions.fee'), t('revenue.transactions.method'),
                                    t('revenue.transactions.date'),
                                ].map(h => (
                                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {RECENT_TRANSACTIONS.map((tx, i) => (
                                <tr key={tx.id} className="border-b border-slate-800/50 hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                                                {tx.driver[0]}
                                            </div>
                                            <span className="text-slate-200 font-medium whitespace-nowrap">{tx.driver}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 font-mono text-xs text-slate-400">{tx.cp}</td>
                                    <td className="px-6 py-3 text-lime-400 font-bold tabular-nums">R${tx.gross.toFixed(2)}</td>
                                    <td className="px-6 py-3 text-sky-400 font-semibold tabular-nums">R${tx.net.toFixed(2)}</td>
                                    <td className="px-6 py-3 text-violet-400 tabular-nums">R${tx.fee.toFixed(2)}</td>
                                    <td className="px-6 py-3">
                                        <span className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">{tx.method}</span>
                                    </td>
                                    <td className="px-6 py-3 text-slate-500 text-xs whitespace-nowrap">{tx.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
