import { FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import '@fastify/jwt';
import { config } from '../config/unifiedConfig';

// Extend Fastify types to include the jwt user payload
declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: { id: string; role: 'ADMIN' | 'OWNER' | 'DRIVER'; organizationId?: string };
        user:    { id: string; role: 'ADMIN' | 'OWNER' | 'DRIVER'; organizationId?: string };
    }
}

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? '';

/**
 * Verify a Clerk session token via Clerk's REST API.
 * Requires CLERK_SECRET_KEY to be set.
 * Returns the userId on success, null on failure.
 *
 * For richer Clerk features install @clerk/backend:
 *   npm install @clerk/backend  (apps/backend)
 * Then replace this with: import { verifyToken } from '@clerk/backend';
 */
async function verifyClerkToken(token: string): Promise<{ userId: string } | null> {
    try {
        const res = await fetch('https://api.clerk.com/v1/tokens/verify', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
        });
        if (!res.ok) return null;
        const data = await res.json() as { sub: string };
        return { userId: data.sub };
    } catch {
        return null;
    }
}

export default fp(async function (fastify: FastifyInstance) {
    fastify.register(require('@fastify/jwt'), {
        secret: config.auth.jwtSecret,
    });

    // Add a reusable prehandler for protected routes
    fastify.decorate('authenticate', async function (req: FastifyRequest, reply: FastifyReply) {
        const authHeader = req.headers.authorization;
        const token = authHeader?.replace(/^Bearer\s+/i, '');

        if (!token) {
            return reply.status(401).send({ success: false, error: 'Unauthorized — no token' });
        }

        // 1. Try Clerk verification (when CLERK_SECRET_KEY is configured)
        if (CLERK_SECRET_KEY) {
            const clerkUser = await verifyClerkToken(token);
            if (clerkUser) {
                (req as any).user = { id: clerkUser.userId, role: 'DRIVER' };
                return;
            }
        }

        // 2. Fall back to internal JWT (demo / dev mode)
        try {
            await req.jwtVerify();
        } catch {
            reply.status(401).send({ success: false, error: 'Unauthorized — invalid token' });
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
