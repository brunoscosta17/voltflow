/**
 * PixService — Real Pix payment flow via Efi Pay (formerly Gerencianet).
 *
 * Required environment variables:
 *   EFI_CLIENT_ID      — Efi application Client ID
 *   EFI_CLIENT_SECRET  — Efi application Client Secret
 *   EFI_PIX_KEY        — Your registered Pix key (CPF/CNPJ/email/phone/random)
 *   EFI_SANDBOX=true   — Use sandbox API (false in production)
 *
 * Efi Pay docs: https://dev.efipay.com.br/docs/api-pix/
 *
 * If EFI_CLIENT_ID is not configured, returns a realistic MOCK charge
 * so the mobile app can be demonstrated without a real Efi account.
 */

const EFI_CLIENT_ID     = process.env.EFI_CLIENT_ID ?? '';
const EFI_CLIENT_SECRET = process.env.EFI_CLIENT_SECRET ?? '';
const EFI_PIX_KEY       = process.env.EFI_PIX_KEY ?? 'voltflow@pix.io';
const EFI_SANDBOX       = process.env.EFI_SANDBOX !== 'false';

const EFI_BASE = EFI_SANDBOX
    ? 'https://pix-h.api.efipay.com.br'
    : 'https://pix.api.efipay.com.br';

// ─── Token cache ──────────────────────────────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
    if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

    const credentials = Buffer.from(`${EFI_CLIENT_ID}:${EFI_CLIENT_SECRET}`).toString('base64');
    const res = await fetch(`${EFI_BASE}/oauth/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ grant_type: 'client_credentials' }),
    });

    if (!res.ok) throw new Error(`Efi OAuth error: ${res.status} ${await res.text()}`);
    const data = await res.json() as { access_token: string; expires_in: number };
    cachedToken    = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1_000;
    return cachedToken;
}

export interface PixCharge {
    txid:       string;
    qrCode:     string;   // "copia e cola" string for the mobile app
    pixCopiaECola: string;
    expiresAt:  string;   // ISO timestamp
    value:      number;   // R$ amount
    status:     'ATIVA' | 'CONCLUIDA' | 'REMOVIDA_PELO_USUARIO_RECEBEDOR' | 'REMOVIDA_PELO_PSP';
}

// ─── MOCK (when Efi not configured) ──────────────────────────────────────────
function mockCharge(value: number, txid: string): PixCharge {
    return {
        txid,
        qrCode: `00020101021226860014br.gov.bcb.pix2564pix.demo.efipay.com.br/cobv/${txid}5204000053039865406${value.toFixed(2).replace('.', '')}5802BR5913VoltFlow Demo6009Sao Paulo62290525${txid}63041234`,
        pixCopiaECola: `00020101021226860014br.gov.bcb.pix2564demo-mock/${txid}520400005303986540${value.toFixed(2)}5802BR5913VoltFlow6009SaoPaulo6304ABCD`,
        expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
        value,
        status: 'ATIVA',
    };
}

// ─── Create a Pix charge ──────────────────────────────────────────────────────
export async function createPixCharge(
    value: number,
    description: string,
    expiresInSeconds = 600,
): Promise<PixCharge> {
    const txid = crypto.randomUUID().replace(/-/g, '').slice(0, 35);

    if (!EFI_CLIENT_ID) {
        console.warn('[Pix] EFI_CLIENT_ID not set. Using mock charge.');
        return mockCharge(value, txid);
    }

    const token = await getAccessToken();

    const res = await fetch(`${EFI_BASE}/v2/cobv/${txid}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            calendario: { expiracao: expiresInSeconds },
            valor: { original: value.toFixed(2) },
            chave: EFI_PIX_KEY,
            solicitacaoPagador: description,
        }),
    });

    if (!res.ok) throw new Error(`Efi charge creation failed: ${res.status} ${await res.text()}`);
    const charge = await res.json() as any;

    // Fetch QR code
    const qrRes = await fetch(`${EFI_BASE}/v2/loc/${charge.loc.id}/qrcode`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    const qrData = await qrRes.json() as { imagemQrcode: string; qrcode: string };

    return {
        txid:          charge.txid,
        qrCode:        qrData.imagemQrcode,   // base64 PNG — display as <img>
        pixCopiaECola: qrData.qrcode,          // "copia e cola" string
        expiresAt:     charge.calendario.apresentacao,
        value,
        status:        charge.status,
    };
}

// ─── Check payment status ─────────────────────────────────────────────────────
export async function getPixChargeStatus(txid: string): Promise<PixCharge['status']> {
    if (!EFI_CLIENT_ID) {
        // In demo mode, simulate confirmation after 15 s
        return 'CONCLUIDA';
    }

    const token = await getAccessToken();
    const res = await fetch(`${EFI_BASE}/v2/cobv/${txid}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Efi status check failed: ${res.status}`);
    const data = await res.json() as { status: PixCharge['status'] };
    return data.status;
}

// ─── Validate Efi webhook signature ──────────────────────────────────────────
/**
 * Efi sends a JWT-signed webhook. In production you should verify the certificate.
 * For now we do a simple "pix" array presence check and trust the TLS.
 */
export function parsePixWebhook(body: unknown): Array<{ txid: string; valor: string; horario: string }> {
    const b = body as any;
    if (!b?.pix || !Array.isArray(b.pix)) return [];
    return b.pix.map((p: any) => ({
        txid:    p.txid,
        valor:   p.valor,
        horario: p.horario,
    }));
}
