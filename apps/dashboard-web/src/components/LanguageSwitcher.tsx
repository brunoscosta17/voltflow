import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/index.ts';

const LANGS = [
    { code: 'pt', flag: '🇧🇷', label: 'PT' },
    { code: 'en', flag: '🇺🇸', label: 'EN' },
    { code: 'es', flag: '🇪🇸', label: 'ES' },
];

export const LanguageSwitcher: React.FC = () => {
    const { i18n: i18nInstance } = useTranslation();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const current = LANGS.find(l => l.code === i18nInstance.language) ?? LANGS[0];

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const changeLang = (code: string) => {
        i18n.changeLanguage(code);
        localStorage.setItem('voltflow-lang', code);
        setOpen(false);
    };

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                title="Change language"
                aria-label="Change language"
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 ${open
                        ? 'bg-volt-500/15 text-volt-400 border-volt-500/30'
                        : 'bg-surface-900/60 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200'
                    }`}
            >
                {/* Globe icon */}
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253M3 12c0 .778.099 1.533.284 2.253" />
                </svg>
                <span>{current.flag} {current.label}</span>
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-[10000] animate-fade-in">
                    <div className="p-1.5 flex flex-col gap-0.5">
                        {LANGS.map(lang => {
                            const isActive = i18nInstance.language === lang.code;
                            return (
                                <button
                                    key={lang.code}
                                    onClick={() => changeLang(lang.code)}
                                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left ${isActive
                                            ? 'bg-volt-500/15 text-volt-400'
                                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <span className="text-base">{lang.flag}</span>
                                    <span className="flex-1">{lang.label}</span>
                                    {isActive && (
                                        <svg className="w-4 h-4 text-volt-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M20.285 2.1L8.098 14.287l-4.383-4.382L2 11.62l6.098 6.098L22 3.815z" />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
