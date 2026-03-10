import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SettingsController {
    // Mock user context extractor to simulate an authenticated OWNER
    private async getUserId(req: FastifyRequest) {
        const user = await prisma.user.findFirst({ where: { role: 'OWNER' } });
        return user?.id;
    }

    async getOrganization(req: FastifyRequest, reply: FastifyReply) {
        const userId = await this.getUserId(req);
        const user = await prisma.user.findUnique({ where: { id: userId }, include: { organization: true } });
        if (!user || !user.organization) {
            return reply.status(404).send({ error: 'Organization not found' });
        }
        return reply.send(user.organization);
    }

    async updateOrganization(req: FastifyRequest, reply: FastifyReply) {
        const userId = await this.getUserId(req);
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.organizationId) return reply.status(403).send({ error: 'No organization linked' });

        const body = req.body as { name?: string; splitRate?: number };
        const updated = await prisma.organization.update({
            where: { id: user.organizationId },
            data: {
                name: body.name,
                splitRate: body.splitRate
            }
        });
        return reply.send(updated);
    }

    async getTeam(req: FastifyRequest, reply: FastifyReply) {
        const userId = await this.getUserId(req);
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.organizationId) return reply.send([]);

        const team = await prisma.user.findMany({
            where: { organizationId: user.organizationId },
            select: { id: true, name: true, email: true, role: true, createdAt: true }
        });
        return reply.send(team);
    }

    async getChargers(req: FastifyRequest, reply: FastifyReply) {
        const userId = await this.getUserId(req);
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.organizationId) return reply.send([]);

        // Find chargers linked to any station of this organization
        const chargers = await prisma.chargePoint.findMany({
            where: { station: { organizationId: user.organizationId } }
        });

        // Map it so we never send the raw password hash to the frontend
        return reply.send(chargers.map(c => ({
            id: c.id,
            ocppId: c.ocppId,
            status: c.status,
            hasPassword: !!(c as any).ocppPassword
        })));
    }
}
