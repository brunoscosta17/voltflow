import { FastifyReply } from 'fastify';

export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = { success: false; error: string; details?: unknown };

/**
 * All controllers extend this class.
 * It centralises response formatting and error handling so no raw
 * reply.send() calls leak into controller code.
 */
export abstract class BaseController {
    protected handleSuccess<T>(reply: FastifyReply, data: T, statusCode = 200): void {
        reply.status(statusCode).send({ success: true, data } satisfies ApiSuccess<T>);
    }

    protected handleError(error: unknown, reply: FastifyReply, context: string): void {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[${context}]`, error);   // TODO: replace with Sentry.captureException(error)
        reply.status(500).send({ success: false, error: message } satisfies ApiError);
    }

    protected handleBadRequest(reply: FastifyReply, message: string): void {
        reply.status(400).send({ success: false, error: message } satisfies ApiError);
    }

    protected handleUnauthorized(reply: FastifyReply): void {
        reply.status(401).send({ success: false, error: 'Unauthorized' } satisfies ApiError);
    }

    protected handleNotFound(reply: FastifyReply, resource: string): void {
        reply.status(404).send({ success: false, error: `${resource} not found` } satisfies ApiError);
    }
}
