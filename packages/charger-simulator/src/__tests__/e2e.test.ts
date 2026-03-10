import WebSocket from 'ws';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

/**
 * Full OCPP 1.6 session lifecycle E2E test.
 *
 * Requires the backend + Redis + DB to be running.
 * Skipped automatically unless VOLTFLOW_E2E=true is set.
 *
 * Run with:
 *   VOLTFLOW_E2E=true npm run e2e   (from packages/charger-simulator)
 */

const BACKEND_WS = process.env.VOLTFLOW_BACKEND_WS ?? 'ws://localhost:3000';
const CHARGER_ID = 'CP-E2E-TEST';
const RUN_E2E = process.env.VOLTFLOW_E2E === 'true';

// Helper: encode Basic auth header
function basicAuth(id: string, password: string) {
    return 'Basic ' + Buffer.from(`${id}:${password}`).toString('base64');
}

// Helper: send an OCPP Call and wait for the matching CallResult
function sendCall(
    ws: WebSocket,
    action: string,
    payload: Record<string, unknown>,
    timeoutMs = 5000,
): Promise<[number, string, Record<string, unknown>]> {
    return new Promise((resolve, reject) => {
        const msgId = Math.random().toString(36).slice(2);
        const frame = JSON.stringify([2, msgId, action, payload]);

        const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${action} response`)), timeoutMs);

        const handler = (raw: WebSocket.RawData) => {
            try {
                const msg = JSON.parse(raw.toString()) as [number, string, Record<string, unknown>];
                if (msg[1] === msgId) {
                    clearTimeout(timer);
                    ws.off('message', handler);
                    resolve(msg);
                }
            } catch { /* ignore non-JSON frames */ }
        };

        ws.on('message', handler);
        ws.send(frame);
    });
}

// Helper: open WS and wait for connect
function connectCharger(chargerId: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(`${BACKEND_WS}/ocpp/${chargerId}`, ['ocpp1.6'], {
            headers: {
                Authorization: basicAuth(chargerId, 'test-password'),
            },
        });
        ws.once('open', () => resolve(ws));
        ws.once('error', reject);
    });
}

describe.skipIf(!RUN_E2E)('Charger Simulator — Full OCPP Lifecycle E2E', () => {
    let ws: WebSocket;
    let transactionId: number;

    beforeAll(async () => {
        ws = await connectCharger(CHARGER_ID);
    }, 10_000);

    afterAll(() => {
        if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    });

    it('BootNotification → Accepted', async () => {
        const [msgType, , payload] = await sendCall(ws, 'BootNotification', {
            chargePointVendor: 'VoltFlow Test',
            chargePointModel: 'E2E-Sim-1',
        });
        expect(msgType).toBe(3); // CallResult
        expect(payload.status).toBe('Accepted');
        expect(payload.currentTime).toBeDefined();
    });

    it('StatusNotification(Available) → empty response', async () => {
        const [msgType, , payload] = await sendCall(ws, 'StatusNotification', {
            connectorId: 1,
            errorCode: 'NoError',
            status: 'Available',
        });
        expect(msgType).toBe(3);
        expect(payload).toEqual({});
    });

    it('Heartbeat → server returns currentTime', async () => {
        const [, , payload] = await sendCall(ws, 'Heartbeat', {});
        expect(payload.currentTime).toBeDefined();
    });

    it('StartTransaction → returns numeric transactionId', async () => {
        const [, , payload] = await sendCall(ws, 'StartTransaction', {
            connectorId: 1,
            idTag: 'RFID-E2E-001',
            meterStart: 0,
            timestamp: new Date().toISOString(),
        });
        expect(payload.idTagInfo).toBeDefined();
        expect((payload.idTagInfo as any).status).toBe('Accepted');
        expect(typeof payload.transactionId).toBe('number');
        transactionId = payload.transactionId as number;
    });

    it('StatusNotification(Charging) → empty response', async () => {
        const [, , payload] = await sendCall(ws, 'StatusNotification', {
            connectorId: 1,
            errorCode: 'NoError',
            status: 'Charging',
        });
        expect(payload).toEqual({});
    });

    it('MeterValues (2×) → acknowledged', async () => {
        for (const kwh of [5.1, 12.4]) {
            const [, , payload] = await sendCall(ws, 'MeterValues', {
                connectorId: 1,
                transactionId,
                meterValue: [{
                    timestamp: new Date().toISOString(),
                    sampledValue: [
                        { value: String(kwh), unit: 'kWh', measurand: 'Energy.Active.Import.Register' },
                        { value: '22000', unit: 'W', measurand: 'Power.Active.Import' },
                    ],
                }],
            });
            expect(payload).toEqual({});
        }
    });

    it('StopTransaction → Accepted', async () => {
        const [, , payload] = await sendCall(ws, 'StopTransaction', {
            transactionId,
            meterStop: 12400, // 12.4 kWh in Wh
            timestamp: new Date().toISOString(),
            reason: 'EVDisconnected',
        });
        expect((payload.idTagInfo as any).status).toBe('Accepted');
    });

    it('StatusNotification(Available) after stop → empty response', async () => {
        const [, , payload] = await sendCall(ws, 'StatusNotification', {
            connectorId: 1,
            errorCode: 'NoError',
            status: 'Available',
        });
        expect(payload).toEqual({});
    });
});

// Unit-level smoke test that always runs (no backend required)
describe('Charger Simulator — Unit Smoke', () => {
    it('OCPP Call frame is correctly formed', () => {
        const msgId = 'test-123';
        const frame = JSON.parse(JSON.stringify([2, msgId, 'BootNotification', { chargePointVendor: 'Test' }]));
        expect(frame[0]).toBe(2);
        expect(frame[1]).toBe(msgId);
        expect(frame[2]).toBe('BootNotification');
        expect(frame[3].chargePointVendor).toBe('Test');
    });

    it('Basic auth header is correctly base64-encoded', () => {
        const header = 'Basic ' + Buffer.from('CP-001:secret').toString('base64');
        expect(header).toBe('Basic Q1AtMDAxOnNlY3JldA==');
    });
});
