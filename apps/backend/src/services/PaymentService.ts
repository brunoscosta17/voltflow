import { PrismaClient, ChargeSession, Organization } from '@prisma/client';
import { config } from '../config/unifiedConfig';

const prisma = new PrismaClient();

export class PaymentService {
    /**
     * Executes the payment split logic after a charging session finishes.
     * Connects to Stripe Connect or Efí to route the host's earnings minus VoltFlow's fee.
     */
    async executeSplit(params: { session: ChargeSession; organization: Organization }) {
        const { session, organization } = params;

        // 1. Calculate the split
        const splitRate = organization.splitRate ?? config.payments.voltflowSplitRate;
        const voltflowFee = parseFloat((session.totalCost * splitRate).toFixed(2));
        const hostAmount = parseFloat((session.totalCost - voltflowFee).toFixed(2));

        console.log(`[Payment] Splitting ${session.totalCost}: Host gets ${hostAmount}, VoltFlow gets ${voltflowFee}`);

        // 2. HTTP Call to Payment Gateway (Stubbed for MVP)
        let paymentId = 'stub_payment_12345';
        let status = 'PAID';

        if (config.payments.provider === 'stripe') {
            console.log('[Payment] (Mock) Calling Stripe Connect API...');
            paymentId = `pi_${Math.random().toString(36).substring(2, 10)}`;
        } else if (config.payments.provider === 'efi') {
            console.log('[Payment] (Mock) Calling Efí Marketplace API...');
            paymentId = `efi_${Math.random().toString(36).substring(2, 10)}`;
        }

        // 3. Record the transaction split in our DB
        const transaction = await prisma.transaction.create({
            data: {
                sessionId: session.id,
                paymentId,
                amount: session.totalCost,
                voltflowFee,
                hostAmount,
                status,
            },
        });

        return transaction;
    }
}

export const paymentService = new PaymentService();
