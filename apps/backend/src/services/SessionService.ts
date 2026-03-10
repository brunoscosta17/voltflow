import { CPStatus } from '@prisma/client';
import { ChargePointRepository } from '../repositories/ChargePointRepository';
import { SessionRepository } from '../repositories/SessionRepository';
import { chargerRegistry } from '../ocpp/ChargerRegistry';
import { paymentService } from './PaymentService';

type StartChargeInput = {
    chargePointId: string;
    userId: string;
};

type StopChargeInput = {
    chargePointId: string;
    sessionId: string;
    kwhConsumed: number;
};

/**
 * SessionService contains all business logic around charging sessions.
 * It is framework-agnostic and fully unit-testable via dependency injection.
 */
export class SessionService {
    constructor(
        private readonly chargePointRepo: ChargePointRepository,
        private readonly sessionRepo: SessionRepository,
    ) { }

    async startCharge({ chargePointId, userId }: StartChargeInput) {
        const cp = await this.chargePointRepo.findWithStation(chargePointId);

        if (!cp) {
            throw new Error('ChargePoint not found');
        }
        if (cp.status !== CPStatus.AVAILABLE) {
            throw new Error(`ChargePoint is not available. Current status: ${cp.status}`);
        }

        // 1. Create the session record in the DB
        const session = await this.sessionRepo.create(cp.id, userId);

        // 2. Issue RemoteStartTransaction down the WebSocket
        const sent = chargerRegistry.sendCommand(cp.ocppId, 'RemoteStartTransaction', {
            idTag: userId,
            connectorId: 1, // Assumption for MVP: default connector 1
        });

        if (!sent) {
            // Rollback if charger unreachable
            await this.sessionRepo.close(session.id, 0, 0);
            throw new Error(`Cannot start charge: Charger ${cp.ocppId} is offline or unreachable.`);
        }

        // 3. Optimistically update status
        await this.chargePointRepo.updateStatus(cp.ocppId, CPStatus.PREPARING);

        return session;
    }

    async stopCharge({ chargePointId, sessionId, kwhConsumed }: StopChargeInput) {
        const cp = await this.chargePointRepo.findWithStation(chargePointId);

        if (!cp) {
            throw new Error('ChargePoint not found');
        }

        // 1. Calculate cost
        const totalCost = parseFloat((kwhConsumed * cp.pricePerKwh).toFixed(2));

        // 2. Close the session
        const session = await this.sessionRepo.close(sessionId, kwhConsumed, totalCost);

        // 3. Trigger payment split
        if (cp.station.organization) {
            await paymentService.executeSplit({ session, organization: cp.station.organization });
        }

        // 4. Issue RemoteStopTransaction down the WebSocket
        chargerRegistry.sendCommand(cp.ocppId, 'RemoteStopTransaction', {
            transactionId: session.id,
        });

        await this.chargePointRepo.updateStatus(cp.ocppId, CPStatus.FINISHING);

        return { session, totalCost };
    }

    async getAvailableStations() {
        return this.chargePointRepo.listAvailable();
    }
}
