import Redis from 'ioredis';
import { config } from '../config/unifiedConfig';

// Singleton Redis client for publishing
let _publisher: Redis | null = null;

export function getPublisher(): Redis {
    if (!_publisher) {
        _publisher = new Redis(config.redis.url, {
            lazyConnect: true,
            enableReadyCheck: false,
            maxRetriesPerRequest: null,
        });
        _publisher.on('error', (err) => {
            // Gracefully handle Redis being unavailable (e.g. dev without Redis running)
            if ((err as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
                console.warn('[Redis] Connection refused — real-time events disabled. Start Redis to enable.');
            }
        });
    }
    return _publisher;
}

// Create a fresh subscriber client (each subscriber needs its own connection)
export function createSubscriber(): Redis {
    const sub = new Redis(config.redis.url, {
        lazyConnect: true,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
    });
    sub.on('error', () => { }); // swallow — same graceful handling
    return sub;
}

// ─── Channel helpers ──────────────────────────────────────────────────────────
export const CHANNELS = {
    /** Charger status changes (BootNotification, StatusNotification) */
    CHARGER_STATUS: 'voltflow:charger:status',
    /** New MeterValues readings */
    METER_VALUES: 'voltflow:charger:meter',
    /** Session lifecycle events (started, stopped, billed) */
    SESSIONS: 'voltflow:sessions',
} as const;

export type OcppEvent =
    | { type: 'STATUS_CHANGE'; chargerId: string; status: string; timestamp: string }
    | { type: 'METER_VALUE'; chargerId: string; kwh: number; powerKw?: number; timestamp: string }
    | { type: 'SESSION_STARTED'; chargerId: string; sessionId: string; timestamp: string }
    | { type: 'SESSION_STOPPED'; chargerId: string; sessionId: string; kwhConsumed: number; totalCost: number; timestamp: string }
    | { type: 'BOOT'; chargerId: string; vendor: string; model: string; timestamp: string };

/** Publish a typed OCPP event to the appropriate Redis channel */
export async function publishEvent(channel: string, event: OcppEvent): Promise<void> {
    try {
        const pub = getPublisher();
        await pub.publish(channel, JSON.stringify(event));
    } catch {
        // Redis unavailable — fail silently, don't crash the OCPP flow
    }
}
