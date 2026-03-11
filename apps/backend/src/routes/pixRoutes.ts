import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createPixCharge, getPixChargeStatus, parsePixWebhook } from '../services/PixService';
import { publishEvent, CHANNELS } from '../redis/redisClient';
import { z } from 'zod';

const CreateChargeSchema = z.object({
    value:       z.number().positive(),
    description: z.string().min(1).max(200),
});

export async function pixRoutes(app: FastifyInstance) {
    /**
     * POST /api/pix/charge
     * Creates a new Pix charge and returns the QR code.
     */
    app.post('/api/pix/charge', {
        schema: {
            body: {
                type: 'object',
                required: ['value', 'description'],
                properties: {
                    value:       { type: 'number' },
                    description: { type: 'string' },
                },
            },
        },
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { value, description } = CreateChargeSchema.parse(req.body);
            const charge = await createPixCharge(value, description);
            return reply.send({ success: true, data: charge });
        } catch (err: any) {
            return reply.code(400).send({ success: false, error: err.message });
        }
    });

    /**
     * GET /api/pix/status/:txid
     * Polls the payment status. Mobile app calls this every 3s.
     */
    app.get('/api/pix/status/:txid', async (req: FastifyRequest, reply: FastifyReply) => {
        const { txid } = req.params as { txid: string };
        try {
            const status = await getPixChargeStatus(txid);
            return reply.send({ success: true, data: { txid, status } });
        } catch (err: any) {
            return reply.code(500).send({ success: false, error: err.message });
        }
    });

    /**
     * POST /api/pix/webhook
     * Receives payment confirmation notifications from Efi Pay.
     * Publishes a PIX_CONFIRMED event to Redis so any waiting session can proceed.
     */
    app.post('/api/pix/webhook', {
        config: { rawBody: true },   // we may need raw body for future signature verify
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const payments = parsePixWebhook(req.body);

            for (const payment of payments) {
                console.log(`[Pix] ✅ Payment confirmed — txid=${payment.txid} valor=R$${payment.valor}`);
                publishEvent(CHANNELS.SESSIONS, {
                    type:    'PIX_CONFIRMED',
                    txid:    payment.txid,
                    valor:   payment.valor,
                    horario: payment.horario,
                });
            }

            // Efi expects HTTP 200 to stop retries
            return reply.code(200).send({ ok: true });
        } catch (err: any) {
            console.error('[Pix] Webhook processing error:', err);
            return reply.code(200).send({ ok: true }); // always 200 to stop retries
        }
    });
}
