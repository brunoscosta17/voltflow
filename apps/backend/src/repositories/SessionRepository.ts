import { PrismaClient, SessionStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class SessionRepository {
    async create(chargePointId: string, userId: string) {
        return prisma.chargeSession.create({
            data: { chargePointId, userId, status: SessionStatus.STARTED },
        });
    }

    async findActive(chargePointId: string) {
        return prisma.chargeSession.findFirst({
            where: { chargePointId, status: SessionStatus.STARTED },
        });
    }

    async close(sessionId: string, kwhConsumed: number, totalCost: number) {
        return prisma.chargeSession.update({
            where: { id: sessionId },
            data: {
                status: SessionStatus.STOPPED,
                kwhConsumed,
                totalCost,
                stoppedAt: new Date(),
            },
        });
    }
}
