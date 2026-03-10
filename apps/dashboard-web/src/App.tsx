import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { OverviewPage } from './pages/OverviewPage';
import { lazy, Suspense } from 'react';
import './index.css';

// Leaflet is browser-only — must be lazy loaded so it never runs during SSR/module init
const StationsPage = lazy(() => import('./pages/StationsPage').then(m => ({ default: m.StationsPage })));
const SessionsPage = lazy(() => import('./pages/SessionsPage').then(m => ({ default: m.SessionsPage })));
const RevenuePage = lazy(() => import('./pages/RevenuePage').then(m => ({ default: m.RevenuePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));


export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-8">
              <span>VoltFlow</span>
              <span>›</span>
              <span className="text-slate-300">Dashboard</span>
            </div>
            <Suspense fallback={<div className="text-slate-500 text-sm animate-pulse">Loading map…</div>}>
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
