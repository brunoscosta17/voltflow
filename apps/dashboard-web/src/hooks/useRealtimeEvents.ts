import { useEffect, useReducer, useRef } from 'react';

export type OcppEvent =
    | { type: 'STATUS_CHANGE'; chargerId: string; status: string; timestamp: string }
    | { type: 'METER_VALUE'; chargerId: string; kwh: number; powerKw?: number; timestamp: string }
    | { type: 'SESSION_STARTED'; chargerId: string; sessionId: string; timestamp: string }
    | { type: 'SESSION_STOPPED'; chargerId: string; sessionId: string; kwhConsumed: number; totalCost: number; timestamp: string }
    | { type: 'BOOT'; chargerId: string; vendor: string; model: string; timestamp: string };

interface RealtimeState {
    events: OcppEvent[];
    chargerStatuses: Record<string, string>;   // charger ocppId → current status
    connected: boolean;
}

type Action =
    | { kind: 'EVENT'; event: OcppEvent }
    | { kind: 'CONNECTED' }
    | { kind: 'DISCONNECTED' };

function reducer(state: RealtimeState, action: Action): RealtimeState {
    switch (action.kind) {
        case 'CONNECTED':
            return { ...state, connected: true };
        case 'DISCONNECTED':
            return { ...state, connected: false };
        case 'EVENT': {
            const ev = action.event;
            const newStatuses = { ...state.chargerStatuses };
            if (ev.type === 'STATUS_CHANGE') newStatuses[ev.chargerId] = ev.status;
            if (ev.type === 'BOOT') newStatuses[ev.chargerId] = 'AVAILABLE';
            // Keep last 50 events (newest first)
            const newEvents = [ev, ...state.events].slice(0, 50);
            return { ...state, events: newEvents, chargerStatuses: newStatuses };
        }
    }
}

const INITIAL: RealtimeState = { events: [], chargerStatuses: {}, connected: false };
const SSE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000') + '/api/events';

/**
 * Consumes the SSE stream from the backend.
 * Maintains a live map of charger statuses and the last 50 events.
 * Reconnects automatically with exponential backoff.
 */
export function useRealtimeEvents() {
    const [state, dispatch] = useReducer(reducer, INITIAL);
    const retryDelay = useRef(1000);

    useEffect(() => {
        let es: EventSource;
        let retryTimer: ReturnType<typeof setTimeout>;
        let active = true;

        function connect() {
            es = new EventSource(SSE_URL);

            es.addEventListener('connected', () => {
                dispatch({ kind: 'CONNECTED' });
                retryDelay.current = 1000; // reset on success
            });

            es.onmessage = (e) => {
                try {
                    const event = JSON.parse(e.data) as OcppEvent;
                    dispatch({ kind: 'EVENT', event });
                } catch {
                    /* ignore malformed frames */
                }
            };

            es.onerror = () => {
                es.close();
                dispatch({ kind: 'DISCONNECTED' });
                if (!active) return;
                // Exponential backoff, cap at 30s
                retryTimer = setTimeout(() => {
                    retryDelay.current = Math.min(retryDelay.current * 2, 30_000);
                    connect();
                }, retryDelay.current);
            };
        }

        connect();
        return () => {
            active = false;
            clearTimeout(retryTimer);
            es?.close();
        };
    }, []);

    return state;
}
