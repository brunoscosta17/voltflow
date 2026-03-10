import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

/**
 * Wraps async route handlers to forward unhandled promise rejections
 * to Fastify's error handler — required by backend-dev-guidelines.
 */
export function asyncWrapper(
    fn: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
) {
    return (req: FastifyRequest, reply: FastifyReply) =>
        Promise.resolve(fn(req, reply)).catch(err => reply.send(err));
}

/**
 * Global error handler plugin — installed once on the Fastify instance.
 * Maps known error classes to HTTP status codes.
 */
export default fp(async function (fastify: FastifyInstance) {
    fastify.setErrorHandler((error, _req, reply) => {
        const status = (error as any).statusCode ?? 500;
        const message = (error as any).message ?? 'Internal Server Error';
        console.error('[UNHANDLED]', error); // TODO: Sentry.captureException(error)
        reply.status(status).send({ success: false, error: message });
    });
});
