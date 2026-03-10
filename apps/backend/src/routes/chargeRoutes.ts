import { FastifyInstance } from 'fastify';
import { ChargeController } from '../controllers/ChargeController';
import { SessionService } from '../services/SessionService';
import { ChargePointRepository } from '../repositories/ChargePointRepository';
import { SessionRepository } from '../repositories/SessionRepository';

// Compose the dependency graph
const chargePointRepo = new ChargePointRepository();
const sessionRepo = new SessionRepository();
const sessionService = new SessionService(chargePointRepo, sessionRepo);
const controller = new ChargeController(sessionService);

export async function chargeRoutes(fastify: FastifyInstance) {
    fastify.post('/api/start-charge', (req, reply) => controller.startCharge(req, reply));
    fastify.post('/api/stop-charge', (req, reply) => controller.stopCharge(req, reply));
}

export async function stationRoutes(fastify: FastifyInstance) {
    fastify.get('/api/stations', (req, reply) => controller.listStations(req, reply));
}
