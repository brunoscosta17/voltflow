import { FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { config } from '../config/unifiedConfig';

// Extend Fastify types to include the jwt user payload
declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: { id: string; role: 'ADMIN' | 'OWNER' | 'DRIVER'; organizationId?: string };
        user: { id: string; role: 'ADMIN' | 'OWNER' | 'DRIVER'; organizationId?: string };
    }
}

export default fp(async function (fastify: FastifyInstance) {
    fastify.register(require('@fastify/jwt'), {
        secret: config.auth.jwtSecret,
    });

    // Add a reusable prehandler for protected routes
    fastify.decorate('authenticate', async function (req: FastifyRequest, reply: FastifyReply) {
        try {
            await req.jwtVerify();
        } catch {
            reply.status(401).send({ success: false, error: 'Unauthorized' });
        }
    });

    // Role-based guard — use as a second prehandler after authenticate
    fastify.decorate('requireRole', function (allowedRoles: string[]) {
        return async function (req: FastifyRequest, reply: FastifyReply) {
            if (!allowedRoles.includes(req.user.role)) {
                reply.status(403).send({ success: false, error: 'Forbidden — insufficient role' });
            }
        };
    });
});
