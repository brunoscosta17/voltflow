import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionService } from '../services/SessionService';
import { ChargePointRepository } from '../repositories/ChargePointRepository';
import { SessionRepository } from '../repositories/SessionRepository';
import { SessionStatus } from '@prisma/client';

// Mock the dependencies
vi.mock('../repositories/ChargePointRepository');
vi.mock('../repositories/SessionRepository');
vi.mock('../services/PaymentService', () => ({
    paymentService: { executeSplit: vi.fn().mockResolvedValue({}) }
}));
vi.mock('../ocpp/ChargerRegistry', () => ({
    chargerRegistry: { sendCommand: vi.fn() }
}));

describe('SessionService', () => {
    let sessionService: SessionService;
    let mockCpRepo: vi.Mocked<ChargePointRepository>;
    let mockSessionRepo: vi.Mocked<SessionRepository>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockCpRepo = new ChargePointRepository() as any;
        mockSessionRepo = new SessionRepository() as any;
        sessionService = new SessionService(mockCpRepo, mockSessionRepo);
    });

    it('should throw if charger does not exist', async () => {
        mockCpRepo.findWithStation.mockResolvedValue(null);

        await expect(sessionService.startCharge({
            chargePointId: 'non-existent',
            userId: 'user-1',
            idTag: 'RFID-123'
        })).rejects.toThrow('Charge point not found');
    });

    it('should calculate cost correctly on stop', async () => {
        const mockCp = {
            id: 'cp-1',
            pricePerKwh: 2.50,
            ocppId: 'CP-001',
            station: {}
        };
        const mockSession = {
            id: 'sess-1',
            kwhConsumed: 10,
            totalCost: 25.0
        };

        mockCpRepo.findById.mockResolvedValue(mockCp as any);
        mockSessionRepo.close.mockResolvedValue(mockSession as any);

        const result = await sessionService.stopCharge('cp-1', 'sess-1', 10);

        expect(result.totalCost).toBe(25.0);
        expect(mockSessionRepo.close).toHaveBeenCalledWith('sess-1', 10, 25.0);
    });
});
