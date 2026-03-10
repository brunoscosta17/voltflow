import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { OverviewPage } from './pages/OverviewPage';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import './index.css';

const StationsPage = lazy(() => import('./pages/StationsPage').then(m => ({ default: m.StationsPage })));
const SessionsPage = lazy(() => import('./pages/SessionsPage').then(m => ({ default: m.SessionsPage })));
const RevenuePage = lazy(() => import('./pages/RevenuePage').then(m => ({ default: m.RevenuePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

const PAGE_NAMES: Record<string, string> = {
    '/': 'nav.overview',
    '/stations': 'nav.stations',
    '/sessions': 'nav.sessions',
    '/revenue': 'nav.revenue',
    '/settings': 'nav.settings',
};

function Header() {
    const location = useLocation();
    const { t } = useTranslation();
    const pageName = t(PAGE_NAMES[location.pathname] ?? 'nav.overview');

    return (
        <div className="flex items-center justify-between text-xs text-slate-500 mb-8">
            <div className="flex items-center gap-2">
                <span>VoltFlow</span>
                <span>›</span>
                <span className="text-slate-300">{pageName}</span>
            </div>
            <LanguageSwitcher />
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            {/* Full-height flex row — sidebar is fixed height, main scrolls */}
            <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-7xl mx-auto">
                        <Header />
                        <Suspense fallback={<div className="text-slate-500 text-sm animate-pulse">Loading…</div>}>
                            <Routes>
                                <Route path="/" element={<OverviewPage />} />
                                <Route path="/stations" element={<StationsPage />} />
                                <Route path="/sessions" element={<SessionsPage />} />
                                <Route path="/revenue" element={<RevenuePage />} />
                                <Route path="/settings" element={<SettingsPage />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Suspense>
                    </div>
                </main>
            </div>
        </BrowserRouter>
    );
}
