import { z } from 'zod';

// POST /api/start-charge
export const startChargeSchema = z.object({
    chargePointId: z.string().uuid({ message: 'chargePointId must be a valid UUID' }),
    connectorId: z.number().int().positive().default(1),
});

// POST /api/stop-charge
export const stopChargeSchema = z.object({
    chargePointId: z.string().uuid(),
    sessionId: z.string().uuid(),
    kwhConsumed: z.number().positive(),
});

// GET /api/stations query params
export const listStationsSchema = z.object({
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
    limit: z.coerce.number().int().max(100).default(50),
});

export type StartChargeInput = z.infer<typeof startChargeSchema>;
export type StopChargeInput = z.infer<typeof stopChargeSchema>;
export type ListStationsQuery = z.infer<typeof listStationsSchema>;
