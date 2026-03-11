import React from 'react';
import { ClerkProvider, RedirectToSignIn, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/**
 * Wraps the app in ClerkProvider.
 *
 * Setup:
 *   1. npm install @clerk/clerk-react      (in apps/dashboard-web)
 *   2. Add VITE_CLERK_PUBLISHABLE_KEY=pk_... to apps/dashboard-web/.env
 *   3. Replace the <AppContent> in main.tsx with:
 *        <ClerkAuthProvider><App /></ClerkAuthProvider>
 *
 * When VITE_CLERK_PUBLISHABLE_KEY is not set, renders children directly (dev mode).
 */
export const ClerkAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!PUBLISHABLE_KEY) {
        // Dev fallback — skip auth when key is not configured
        console.warn('[Clerk] VITE_CLERK_PUBLISHABLE_KEY not set. Running without authentication.');
        return <>{children}</>;
    }

    return (
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
            <SignedIn>{children}</SignedIn>
            <SignedOut><RedirectToSignIn /></SignedOut>
        </ClerkProvider>
    );
};

/**
 * Drop-in replacement for the user avatar in Sidebar.tsx.
 * Shows the Clerk UserButton when auth is enabled, a static avatar otherwise.
 */
export const AuthUserButton: React.FC<{ name?: string; subtitle?: string }> = ({ name = 'Host Owner', subtitle = 'Plano Pro' }) => {
    if (!PUBLISHABLE_KEY) {
        return (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-900 border border-slate-800 cursor-default">
                <div className="w-8 h-8 rounded-full bg-volt-500/20 border border-volt-500/40 flex items-center justify-center">
                    <span className="text-volt-400 font-bold text-sm">{name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{name}</p>
                    <p className="text-xs text-slate-400 truncate">{subtitle}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-900 border border-slate-800">
            <UserButton
                appearance={{
                    elements: {
                        avatarBox: 'w-8 h-8',
                        userButtonPopoverCard: 'bg-slate-900 border border-slate-700',
                    },
                }}
            />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{name}</p>
                <p className="text-xs text-slate-400 truncate">{subtitle}</p>
            </div>
        </div>
    );
};
