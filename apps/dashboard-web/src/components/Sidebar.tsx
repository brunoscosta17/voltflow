import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/index.ts';

const LANGS = [
    { code: 'en', flag: '🇺🇸', label: 'EN' },
    { code: 'es', flag: '🇪🇸', label: 'ES' },
    { code: 'pt', flag: '🇧🇷', label: 'PT' },
];

const changeLang = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('voltflow-lang', code);
};

export const Sidebar: React.FC = () => {
    const { t, i18n: i18nInstance } = useTranslation();

    const links = [
        { to: '/', icon: '⚡', label: t('nav.overview') },
        { to: '/stations', icon: '📍', label: t('nav.stations') },
        { to: '/sessions', icon: '🔋', label: t('nav.sessions') },
        { to: '/revenue', icon: '💰', label: t('nav.revenue') },
        { to: '/settings', icon: '⚙️', label: t('nav.settings') },
    ];

    return (
        <aside className="w-64 min-h-screen bg-surface-900/80 backdrop-blur-md border-r border-slate-800 flex flex-col py-6 px-3 gap-1 animate-fade-in">
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-4 mb-8">
                <div className="w-9 h-9 rounded-xl bg-volt-gradient flex items-center justify-center shadow-glow-volt text-white font-black text-lg">V</div>
                <div>
                    <p className="font-bold text-white text-sm tracking-wide">VoltFlow</p>
                    <p className="text-xs text-slate-500">CPO Dashboard</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-0.5 flex-1">
                {links.map(({ to, icon, label }) => (
                    <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) =>
                        `nav-item text-sm ${isActive ? 'active' : ''}`
                    }>
                        <span className="text-base w-5 text-center">{icon}</span>
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Language switcher */}
            <div className="px-4 mb-3">
                <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold mb-2">{t('language.label')}</p>
                <div className="flex items-center gap-1.5">
                    {LANGS.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => changeLang(lang.code)}
                            title={lang.label}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${i18nInstance.language === lang.code
                                    ? 'bg-volt-500/15 text-volt-400 border-volt-500/30'
                                    : 'text-slate-500 border-slate-800 hover:border-slate-600 hover:text-slate-300'
                                }`}
                        >
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* User pill */}
            <div className="px-4">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-800 border border-slate-700 text-xs text-slate-400">
                    <div className="w-7 h-7 rounded-full bg-volt-gradient flex items-center justify-center text-white font-bold text-xs">H</div>
                    <div>
                        <p className="text-slate-200 font-medium">Host Owner</p>
                        <p className="text-slate-500">{t('sidebar.plan')}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};
