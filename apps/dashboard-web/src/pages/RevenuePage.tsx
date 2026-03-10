import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

// ─── Mock data (last 14 days) ─────────────────────────────────────────────────
const DAILY_REVENUE = [
    { day: '25/02', gross: 420, hostNet: 378, voltflowFee: 42 },
    { day: '26/02', gross: 890, hostNet: 800, voltflowFee: 90 },
    { day: '27/02', gross: 650, hostNet: 585, voltflowFee: 65 },
    { day: '28/02', gross: 1200, hostNet: 1080, voltflowFee: 120 },
    { day: '01/03', gross: 980, hostNet: 882, voltflowFee: 98 },
    { day: '02/03', gross: 1450, hostNet: 1305, voltflowFee: 145 },
    { day: '03/03', gross: 760, hostNet: 684, voltflowFee: 76 },
    { day: '04/03', gross: 430, hostNet: 387, voltflowFee: 43 },
    { day: '05/03', gross: 390, hostNet: 351, voltflowFee: 39 },
    { day: '06/03', gross: 980, hostNet: 882, voltflowFee: 98 },
    { day: '07/03', gross: 1100, hostNet: 990, voltflowFee: 110 },
    { day: '08/03', gross: 1380, hostNet: 1242, voltflowFee: 138 },
    { day: '09/03', gross: 920, hostNet: 828, voltflowFee: 92 },
    { day: '10/03', gross: 1270, hostNet: 1143, voltflowFee: 127 },
];

const SPLIT_DATA = [
    { name: 'Host Revenue', value: 11_631, color: '#0ea5e9' },
    { name: 'VoltFlow Fee', value: 1_283, color: '#a3e635' },
];

const BY_CHARGER = [
    { cp: 'CP-SP-001', revenue: 4_820 },
    { cp: 'CP-SP-002', revenue: 3_140 },
    { cp: 'CP-SP-004', revenue: 2_650 },
    { cp: 'CP-RJ-001', revenue: 2_304 },
];

const TOTAL_GROSS = DAILY_REVENUE.reduce((s, d) => s + d.gross, 0);
const TOTAL_HOST = DAILY_REVENUE.reduce((s, d) => s + d.hostNet, 0);
const TOTAL_FEE = DAILY_REVENUE.reduce((s, d) => s + d.voltflowFee, 0);

const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="card-glass px-4 py-3 text-xs">
            <p className="text-slate-300 font-semibold mb-1">{label}</p>
            {payload.map((p: any) => (
                <p key={p.name} style={{ color: p.color }}>
                    {p.name}: <strong>R${p.value.toLocaleString('pt-BR')}</strong>
                </p>
            ))}
        </div>
    );
};

export const RevenuePage: React.FC = () => (
    <div className="flex flex-col gap-8 animate-fade-in">
        <div>
            <h1 className="text-2xl font-bold text-white">Revenue</h1>
            <p className="text-slate-400 text-sm mt-1">Financial overview — last 14 days.</p>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
                { label: 'Gross Revenue', value: `R$${TOTAL_GROSS.toLocaleString('pt-BR')}`, icon: '💰', color: 'text-lime-400', note: '+12.4% vs prev. period' },
                { label: 'Host Earnings', value: `R$${TOTAL_HOST.toLocaleString('pt-BR')}`, icon: '🏪', color: 'text-volt-400', note: '95% of gross (after fee)' },
                { label: 'VoltFlow Fee', value: `R$${TOTAL_FEE.toLocaleString('pt-BR')}`, icon: '⚡', color: 'text-purple-400', note: '5% platform commission' },
            ].map(m => (
                <div key={m.label} className="metric-card">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{m.label}</span>
                        <span className="text-xl">{m.icon}</span>
                    </div>
                    <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
                    <p className="text-xs text-slate-500">{m.note}</p>
                </div>
            ))}
        </div>

        {/* Revenue bar chart */}
        <div className="card-glass p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Daily Revenue Breakdown</h2>
            <ResponsiveContainer width="100%" height={260}>
                <BarChart data={DAILY_REVENUE} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16, color: '#94a3b8' }} />
                    <Bar dataKey="hostNet" name="Host Net" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="voltflowFee" name="VoltFlow Fee" fill="#a3e635" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>

        {/* Bottom row: Pie + By Charger */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Split donut */}
            <div className="card-glass p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Revenue Split</h2>
                <div className="flex items-center gap-6">
                    <ResponsiveContainer width="50%" height={180}>
                        <PieChart>
                            <Pie
                                data={SPLIT_DATA} cx="50%" cy="50%"
                                innerRadius={50} outerRadius={80}
                                paddingAngle={3} dataKey="value"
                            >
                                {SPLIT_DATA.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} stroke="transparent" />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-3">
                        {SPLIT_DATA.map(d => (
                            <div key={d.name} className="flex items-center gap-2.5">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                                <div>
                                    <p className="text-xs text-slate-400">{d.name}</p>
                                    <p className="text-base font-bold" style={{ color: d.color }}>
                                        R${d.value.toLocaleString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Revenue by charger */}
            <div className="card-glass p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Revenue by Charger</h2>
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={BY_CHARGER} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }} barSize={14}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                        <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="cp" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                        <Bar dataKey="revenue" name="Revenue (R$)" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
);
