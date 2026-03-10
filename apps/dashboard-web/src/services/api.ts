// Central API client — all fetches go through here (never raw fetch in components)
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function getToken(): string | null {
    return localStorage.getItem('voltflow_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
    }

    return res.json() as Promise<T>;
}

// ─── API methods ──────────────────────────────────────────────────────────────

export type CPStatus = 'AVAILABLE' | 'PREPARING' | 'CHARGING' | 'FINISHING' | 'FAULTED' | 'UNAVAILABLE';

export interface ChargePoint {
    id: string;
    ocppId: string;
    status: CPStatus;
    pricePerKwh: number;
    connectorType: string;
    maxPowerKw: number;
    lastSeenAt?: string;
    station: { id: string; name: string; lat: number; lng: number; address: string };
}

export interface ChargeSession {
    id: string;
    chargePointId: string;
    userId: string;
    status: string;
    kwhConsumed: number;
    totalCost: number;
    startedAt: string;
    stoppedAt?: string;
}

export const api = {
    auth: {
        getToken: () => request<{ token: string }>('/api/auth/token', { method: 'POST' }),
    },
    stations: {
        list: () => request<{ success: true; data: ChargePoint[] }>('/api/stations'),
    },
    charge: {
        start: (chargePointId: string) =>
            request<{ success: true; data: ChargeSession }>('/api/start-charge', {
                method: 'POST',
                body: JSON.stringify({ chargePointId }),
            }),
        stop: (chargePointId: string, sessionId: string, kwhConsumed: number) =>
            request('/api/stop-charge', {
                method: 'POST',
                body: JSON.stringify({ chargePointId, sessionId, kwhConsumed }),
            }),
    },
    settings: {
        getOrganization: () => request<any>('/api/settings/organization'),
        updateOrganization: (data: { name?: string; splitRate?: number }) =>
            request<any>('/api/settings/organization', { method: 'PUT', body: JSON.stringify(data) }),
        getTeam: () => request<any[]>('/api/settings/team'),
        getChargers: () => request<any[]>('/api/settings/chargers'),
    },
};
