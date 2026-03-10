import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Sidebar: React.FC = () => {
    const { t } = useTranslation();

    const links = [
        { to: '/', icon: '⚡', label: t('nav.overview') },
        { to: '/stations', icon: '📍', label: t('nav.stations') },
        { to: '/sessions', icon: '🔋', label: t('nav.sessions') },
        { to: '/revenue', icon: '💰', label: t('nav.revenue') },
        { to: '/settings', icon: '⚙️', label: t('nav.settings') },
    ];

    return (
        <aside className="w-64 h-screen flex-shrink-0 bg-surface-900/80 backdrop-blur-md border-r border-slate-800 flex flex-col py-6 px-3 gap-1">
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

            {/* User pill */}
            <div className="px-4 mt-auto">
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
