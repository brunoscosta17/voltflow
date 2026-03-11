import './config/unifiedConfig';
import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fp from 'fastify-plugin';
import { config } from './config/unifiedConfig';
import authPlugin from './middleware/authMiddleware';
import errorPlugin from './middleware/errorHandler';
import { chargeRoutes, stationRoutes } from './routes/chargeRoutes';
import { eventsRoute } from './routes/eventsRoute';
import { setupWebSocketManager } from './ocpp/websocket-manager';
import { settingsRoutes } from './routes/settingsRoutes';
import { pixRoutes } from './routes/pixRoutes';
import fs from 'fs';

const httpsOptions = (config.server.nodeEnv === 'production' && config.tls.keyPath && config.tls.certPath)
  ? { key: fs.readFileSync(config.tls.keyPath), cert: fs.readFileSync(config.tls.certPath) }
  : null;

const app = Fastify({
  logger: true,
  ...(httpsOptions ? { https: httpsOptions } : {})
});

// ─── Global plugins ─────────────────────────────────────────────────────────
app.register(fastifyWebsocket);
app.register(errorPlugin);
app.register(authPlugin);

// ─── Open routes ─────────────────────────────────────────────────────────────
app.get('/api/health', async () => ({ status: 'ok', service: 'voltflow-backend' }));
app.register(eventsRoute); // SSE stream — no JWT (EventSource can't send headers)


// Demo token endpoint (replace with Clerk/Firebase webhook in production)
app.post('/api/auth/token', async (_req, reply) => {
  // TODO: validate Clerk JWT here, then sign our internal token
  const demoPayload = { id: 'demo-driver-001', role: 'DRIVER' as const };
  const token = (app as any).jwt.sign(demoPayload, { expiresIn: '7d' });
  return reply.send({ token });
});

// ─── Protected routes ─────────────────────────────────────────────────────────
app.register(async function protectedScope(fastify) {
  fastify.addHook('preHandler', (fastify as any).authenticate);
  fastify.register(chargeRoutes);
  fastify.register(stationRoutes);
  fastify.register(settingsRoutes, { prefix: '/settings' });
});

// ─── OCPP WebSocket (auth handled inside manager) ────────────────────────────
app.register(async (fastify) => {
  fastify.get('/ocpp/:chargerId', { websocket: true }, (socket, req) => {
    setupWebSocketManager(socket, req);
  });
});

// ─── CORS (needed for Dashboard on different port) ───────────────────────────
app.addHook('onSend', (_req, reply, _payload, done) => {
  reply.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  done();
});

const start = async () => {
  try {
    await app.listen({ port: config.server.port, host: '0.0.0.0' });
    app.log.info(`VoltFlow backend running on port ${config.server.port} ✅`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
