import { WebSocket } from '@fastify/websocket';
import { FastifyRequest } from 'fastify';
import { publishEvent, CHANNELS } from '../redis/redisClient';
import { chargerRegistry } from './ChargerRegistry';
import { ChargePointRepository } from '../repositories/ChargePointRepository';
import { meterValueRepo } from '../repositories/MeterValueRepository';
import { CPStatus } from '@prisma/client';
import { validateOcppAuth } from './ocppAuth';
import { sendFaultAlert } from '../services/AlertService';

const cpRepo = new ChargePointRepository();


/**
 * Handles incoming WebSocket connections from EV Chargers.
 * Compatible with @fastify/websocket v11 — handler receives (socket, request) directly.
 * All OCPP events are published to Redis Pub/Sub for real-time propagation to the Dashboard.
 */
export async function setupWebSocketManager(socket: WebSocket, req: FastifyRequest) {
    const params = req.params as { chargerId: string };
    const chargerId = params.chargerId;

    const isAuthenticated = await validateOcppAuth(req);
    if (!isAuthenticated) {
        console.warn(`[OCPP] Charger ${chargerId} failed authentication. Closing connection.`);
        socket.close(1008, 'Policy Violation - Invalid Credentials');
        return;
    }

    console.log(`[OCPP] Charger ${chargerId} connected and authenticated.`);
    chargerRegistry.register(chargerId, socket);

    socket.on('message', async (message) => {
        try {
            const parsed = JSON.parse(message.toString());
            const [_typeId, messageId, action, payload] = parsed;

            console.log(`[OCPP] ← ${chargerId} / ${action}`);

            let responsePayload: Record<string, unknown> = {};

            switch (action) {
                case 'BootNotification': {
                    responsePayload = {
                        currentTime: new Date().toISOString(),
                        interval: 300,
                        status: 'Accepted',
                    };
                    // Publish to Redis
                    publishEvent(CHANNELS.CHARGER_STATUS, {
                        type: 'BOOT',
                        chargerId,
                        vendor: payload?.chargePointVendor ?? 'Unknown',
                        model: payload?.chargePointModel ?? 'Unknown',
                        timestamp: new Date().toISOString(),
                    });
                    break;
                }

                case 'StatusNotification': {
                    responsePayload = {};
                    const statusStr = payload?.status ?? 'Unknown';
                    publishEvent(CHANNELS.CHARGER_STATUS, {
                        type: 'STATUS_CHANGE',
                        chargerId,
                        status: statusStr,
                        timestamp: new Date().toISOString(),
                    });

                    // Save to DB
                    if (Object.values(CPStatus).includes(statusStr as CPStatus)) {
                        await cpRepo.updateStatus(chargerId, statusStr as CPStatus).catch(err =>
                            console.error('[OCPP DB] Failed to update status:', err)
                        );
                    }

                    // Send fault alert if charger entered a critical state
                    if (statusStr === 'Faulted' || statusStr === 'Unavailable') {
                        sendFaultAlert(chargerId, statusStr).catch(err =>
                            console.error('[Alert] Failed to send fault alert:', err)
                        );
                    }
                    break;
                }

                case 'MeterValues': {
                    responsePayload = {};
                    const samples = payload?.meterValue?.[0]?.sampledValue ?? [];
                    const kwhSample = samples.find((s: any) => s.unit === 'kWh');
                    const powerSample = samples.find((s: any) => s.unit === 'W' || s.unit === 'kW');

                    const kwh = parseFloat(kwhSample?.value ?? '0');
                    const powerKw = powerSample ? parseFloat(powerSample.value) : undefined;

                    publishEvent(CHANNELS.METER_VALUES, {
                        type: 'METER_VALUE',
                        chargerId,
                        kwh,
                        powerKw,
                        timestamp: new Date().toISOString(),
                    });

                    // Save to DB
                    const cp = await cpRepo.findByOcppId(chargerId);
                    if (cp) {
                        await meterValueRepo.create(cp.id, kwh, new Date(), powerKw).catch(err =>
                            console.error('[OCPP DB] Failed to save MeterValue:', err)
                        );
                    }
                    break;
                }

                case 'Heartbeat': {
                    responsePayload = { currentTime: new Date().toISOString() };
                    break;
                }

                case 'StartTransaction': {
                    const txId = Math.floor(Math.random() * 100_000);
                    responsePayload = {
                        transactionId: txId,
                        idTagInfo: { status: 'Accepted' },
                    };
                    publishEvent(CHANNELS.SESSIONS, {
                        type: 'SESSION_STARTED',
                        chargerId,
                        sessionId: String(txId),
                        timestamp: new Date().toISOString(),
                    });
                    // Update charger status to CHARGING
                    publishEvent(CHANNELS.CHARGER_STATUS, {
                        type: 'STATUS_CHANGE',
                        chargerId,
                        status: 'CHARGING',
                        timestamp: new Date().toISOString(),
                    });
                    break;
                }

                case 'StopTransaction': {
                    responsePayload = { idTagInfo: { status: 'Accepted' } };
                    const kwhConsumed = parseFloat(payload?.meterStop ?? '0') / 1000 || 0;
                    const duration = payload?.timestamp
                        ? (new Date().getTime() - new Date(payload.timestamp).getTime()) / 1000
                        : 0;
                    // Estimate cost: kWh * R$1.99 (mock rate)
                    const totalCost = parseFloat((kwhConsumed * 1.99).toFixed(2));
                    publishEvent(CHANNELS.SESSIONS, {
                        type: 'SESSION_STOPPED',
                        chargerId,
                        sessionId: String(payload?.transactionId ?? 0),
                        kwhConsumed,
                        totalCost,
                        timestamp: new Date().toISOString(),
                    });
                    // Update charger status back to AVAILABLE
                    publishEvent(CHANNELS.CHARGER_STATUS, {
                        type: 'STATUS_CHANGE',
                        chargerId,
                        status: 'AVAILABLE',
                        timestamp: new Date().toISOString(),
                    });
                    break;
                }

                default:
                    console.log(`[OCPP] Unhandled action: ${action}`);
            }

            // CallResult: [3, MessageId, Payload]
            socket.send(JSON.stringify([3, messageId, responsePayload]));
        } catch (err) {
            console.error('[OCPP] Parse error from', chargerId, err);
        }
    });

    socket.on('close', async () => {
        console.log(`[OCPP] Charger ${chargerId} disconnected.`);
        chargerRegistry.unregister(chargerId);

        publishEvent(CHANNELS.CHARGER_STATUS, {
            type: 'STATUS_CHANGE',
            chargerId,
            status: 'UNAVAILABLE',
            timestamp: new Date().toISOString(),
        });

        await cpRepo.updateStatus(chargerId, CPStatus.UNAVAILABLE).catch(() => { });
    });

    socket.on('error', (err) => {
        console.error(`[OCPP] Socket error from ${chargerId}:`, err.message);
    });
}
