import { FastifyRequest } from 'fastify';
import { ChargePointRepository } from '../repositories/ChargePointRepository';
import bcrypt from 'bcryptjs';

const cpRepo = new ChargePointRepository();

/**
 * Validates OCPP 1.6 Basic Authentication.
 * Expected header: `Authorization: Basic base64(chargePointId:password)`
 */
export async function validateOcppAuth(req: FastifyRequest): Promise<boolean> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        console.warn('[OCPP Auth] Missing or invalid Authorization header format');
        return false;
    }

    try {
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [username, password] = credentials.split(':');

        // The username in OCPP Basic Auth should match the ChargePoint Identity (ocppId)
        const chargerId = (req.params as { chargerId: string }).chargerId;
        if (username !== chargerId) {
            console.warn(`[OCPP Auth] Username mismatch: expected ${chargerId}, got ${username}`);
            return false;
        }

        const cp = await cpRepo.findByOcppId(chargerId);
        if (!cp) {
            console.warn(`[OCPP Auth] Charger ${chargerId} not found in database`);
            return false;
        }

        // If the charger doesn't have a password set in the DB, we might reject or accept depending on policy.
        // For MVP: if no password is set, we reject to enforce security.
        if (!(cp as any).ocppPassword) {
            console.warn(`[OCPP Auth] Charger ${chargerId} does not have a password configured in DB`);
            return false;
        }

        const isValid = await bcrypt.compare(password, (cp as any).ocppPassword);
        if (!isValid) {
            console.warn(`[OCPP Auth] Invalid password for charger ${chargerId}`);
        }

        return isValid;
    } catch (error) {
        console.error('[OCPP Auth] Error parsing basic auth header:', error);
        return false;
    }
}
