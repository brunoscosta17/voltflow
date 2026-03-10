import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MeterValueRepository {
    /**
     * Inserts a new MeterValue record.
     * @param chargePointId the internal UUID of the Charger (not the ocppId)
     * @param kwh Cumulative energy consumption
     * @param timestamp Timestamp from the charger
     * @param powerKw Instantaneous power
     */
    async create(chargePointId: string, kwh: number, timestamp: Date, powerKw?: number) {
        return prisma.meterValue.create({
            data: {
                chargePointId,
                kwh,
                timestamp,
                powerKw,
            },
        });
    }
}

// Export singleton to avoid instantiating it repeatedly
export const meterValueRepo = new MeterValueRepository();
