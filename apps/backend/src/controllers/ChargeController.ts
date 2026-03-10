import { FastifyRequest, FastifyReply } from 'fastify';
import { BaseController } from './BaseController';
import { SessionService } from '../services/SessionService';
import {
    startChargeSchema,
    stopChargeSchema,
    listStationsSchema,
} from '../validators/charge.schema';

export class ChargeController extends BaseController {
    constructor(private readonly sessionService: SessionService) {
        super();
    }

    async startCharge(req: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const parsed = startChargeSchema.safeParse(req.body);
            if (!parsed.success) {
                return this.handleBadRequest(reply, parsed.error.message);
            }

            // TODO: extract userId from JWT Bearer token (req.headers.authorization)
            const userId = (req as any).user?.id ?? 'demo-driver-id';

            const session = await this.sessionService.startCharge({
                chargePointId: parsed.data.chargePointId,
                userId,
            });

            this.handleSuccess(reply, session, 201);
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            if (msg.includes('not found')) return this.handleNotFound(reply, 'ChargePoint');
            if (msg.includes('not available')) return this.handleBadRequest(reply, msg);
            this.handleError(error, reply, 'ChargeController.startCharge');
        }
    }

    async stopCharge(req: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const parsed = stopChargeSchema.safeParse(req.body);
            if (!parsed.success) {
                return this.handleBadRequest(reply, parsed.error.message);
            }

            const result = await this.sessionService.stopCharge(parsed.data);
            this.handleSuccess(reply, result);
        } catch (error) {
            const msg = error instanceof Error ? error.message : '';
            if (msg.includes('not found')) return this.handleNotFound(reply, 'ChargePoint');
            this.handleError(error, reply, 'ChargeController.stopCharge');
        }
    }

    async listStations(req: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const parsed = listStationsSchema.safeParse(req.query);
            if (!parsed.success) {
                return this.handleBadRequest(reply, parsed.error.message);
            }

            const stations = await this.sessionService.getAvailableStations();
            this.handleSuccess(reply, stations);
        } catch (error) {
            this.handleError(error, reply, 'ChargeController.listStations');
        }
    }
}
