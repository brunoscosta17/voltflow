import React from 'react';
import { today, daysAgo } from '../utils/exportCsv';

export interface DateRange {
    from: string; // YYYY-MM-DD
    to:   string; // YYYY-MM-DD
}

interface Props {
    value: DateRange;
    onChange: (range: DateRange) => void;
}

const PRESETS = [
    { label: 'Hoje',        from: () => today(),      to: () => today() },
    { label: '7 dias',      from: () => daysAgo(6),   to: () => today() },
    { label: '30 dias',     from: () => daysAgo(29),  to: () => today() },
    { label: 'Este mês',    from: () => new Date().toISOString().slice(0, 7) + '-01', to: () => today() },
];

export const DateRangePicker: React.FC<Props> = ({ value, onChange }) => {
    const isPreset = (p: typeof PRESETS[0]) => p.from() === value.from && p.to() === value.to;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Presets */}
            {PRESETS.map(p => (
                <button
                    key={p.label}
                    onClick={() => onChange({ from: p.from(), to: p.to() })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isPreset(p)
                            ? 'bg-volt-500 text-black'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                >
                    {p.label}
                </button>
            ))}

            {/* Custom date inputs */}
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1">
                <input
                    type="date"
                    value={value.from}
                    max={value.to}
                    onChange={e => onChange({ ...value, from: e.target.value })}
                    className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
                />
                <span className="text-slate-600">→</span>
                <input
                    type="date"
                    value={value.to}
                    min={value.from}
                    max={today()}
                    onChange={e => onChange({ ...value, to: e.target.value })}
                    className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
                />
            </div>
        </div>
    );
};
