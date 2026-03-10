import { FastifyInstance } from 'fastify';
import { SettingsController } from '../controllers/SettingsController';

export async function settingsRoutes(fastify: FastifyInstance) {
    const controller = new SettingsController();

    // In a prod app, these would be protected by fastify.authenticate middleware
    fastify.get('/organization', controller.getOrganization.bind(controller));
    fastify.put('/organization', controller.updateOrganization.bind(controller));
    fastify.get('/team', controller.getTeam.bind(controller));
    fastify.get('/chargers', controller.getChargers.bind(controller));
}
