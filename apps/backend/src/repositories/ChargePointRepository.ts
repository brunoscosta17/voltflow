import { PrismaClient, CPStatus } from '@prisma/client';

// Re-use a single Prisma instance across the app
const prisma = new PrismaClient();

export class ChargePointRepository {
    async findByOcppId(ocppId: string) {
        return prisma.chargePoint.findUnique({ where: { ocppId } });
    }

    async updateStatus(ocppId: string, status: CPStatus) {
        return prisma.chargePoint.update({
            where: { ocppId },
            data: { status, lastSeenAt: new Date() },
        });
    }

    async listAvailable(lat?: number, lng?: number, limit = 50) {
        // Geo-filtering is handled application-side for the MVP.
        // In v2, use PostGIS for proper radius queries.
        return prisma.chargePoint.findMany({
            where: { status: CPStatus.AVAILABLE },
            include: { station: { include: { organization: { select: { name: true } } } } },
            take: limit,
        });
    }

    async findWithStation(id: string) {
        return prisma.chargePoint.findUnique({
            where: { id },
            include: { station: { include: { organization: true } } },
        });
    }
}
