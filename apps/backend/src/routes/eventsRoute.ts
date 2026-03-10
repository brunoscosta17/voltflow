import type { FastifyInstance } from 'fastify';
import { createSubscriber, CHANNELS } from '../redis/redisClient';

/**
 * Server-Sent Events endpoint: GET /api/events
 *
 * The Dashboard subscribes here with EventSource.
 * We spin up a Redis subscriber that forwards events as SSE messages.
 *
 * Architecture:
 *   OCPP Charger → WebSocket → websocket-manager → Redis PUBLISH
 *   Dashboard    → SSE       → this endpoint      → Redis SUBSCRIBE
 */
export async function eventsRoute(fastify: FastifyInstance) {
    fastify.get('/api/events', async (req, reply) => {
        // Disable Fastify's default response handling — we stream manually
        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': 'http://localhost:5173',
        });

        // Send a heartbeat immediately so the client knows it's connected
        reply.raw.write('event: connected\ndata: {}\n\n');

        // One subscriber per SSE client
        const sub = createSubscriber();
        const channels = [CHANNELS.CHARGER_STATUS, CHANNELS.METER_VALUES, CHANNELS.SESSIONS];

        try {
            await sub.subscribe(...channels);
        } catch {
            reply.raw.write('event: error\ndata: {"message":"Redis unavailable"}\n\n');
            reply.raw.end();
            return reply;
        }

        sub.on('message', (_channel: string, message: string) => {
            if (!reply.raw.writableEnded) {
                reply.raw.write(`data: ${message}\n\n`);
            }
        });

        // Heartbeat every 25 seconds to keep the connection alive through proxies
        const heartbeat = setInterval(() => {
            if (!reply.raw.writableEnded) {
                reply.raw.write(': heartbeat\n\n');
            }
        }, 25_000);

        // Cleanup when client disconnects
        req.raw.on('close', () => {
            clearInterval(heartbeat);
            sub.unsubscribe();
            sub.disconnect();
        });

        // Keep the handler alive (SSE streams don't resolve)
        await new Promise<void>((resolve) => {
            req.raw.on('close', resolve);
        });

        return reply;
    });
}
