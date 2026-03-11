/**
 * AlertService — sends e-mail alerts when a charger enters a fault/critical state.
 *
 * Uses the Resend API (https://resend.com).
 * Set RESEND_API_KEY in apps/backend/.env to enable.
 * Set ALERT_EMAIL_TO to the recipient address (e.g. your operations team inbox).
 *
 * If RESEND_API_KEY is not set, alerts are logged to console only (safe for dev).
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? '';
const FROM_EMAIL     = process.env.ALERT_EMAIL_FROM ?? 'alerts@voltflow.io';
const TO_EMAIL       = process.env.ALERT_EMAIL_TO   ?? 'ops@voltflow.io';
const DASHBOARD_URL  = process.env.DASHBOARD_URL    ?? 'http://localhost:5173';

// Track recent alerts per charger to avoid spam (debounce: 10 min)
const lastAlertSent = new Map<string, number>();
const DEBOUNCE_MS   = 10 * 60 * 1_000;

function shouldSend(chargerId: string): boolean {
    const last = lastAlertSent.get(chargerId) ?? 0;
    return Date.now() - last > DEBOUNCE_MS;
}

function markSent(chargerId: string) {
    lastAlertSent.set(chargerId, Date.now());
}

const STATUS_LABELS: Record<string, string> = {
    Faulted:     '🔴 Falha detectada',
    Unavailable: '⚠️  Indisponível',
};

/**
 * Send a fault alert for a charger.
 * Silently no-ops if:
 *   - RESEND_API_KEY is not set (logs to console instead)
 *   - The same charger sent an alert within the last 10 minutes
 */
export async function sendFaultAlert(chargerId: string, status: string): Promise<void> {
    const label = STATUS_LABELS[status] ?? `🔴 ${status}`;

    if (!shouldSend(chargerId)) {
        console.log(`[Alert] Debounced — skipping alert for ${chargerId} (${status})`);
        return;
    }
    markSent(chargerId);

    if (!RESEND_API_KEY) {
        console.warn(`[Alert] RESEND_API_KEY not set. Would have sent fault alert for ${chargerId} (${status})`);
        return;
    }

    const subject = `VoltFlow Alert — ${label} em ${chargerId}`;
    const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const dashboardLink = `${DASHBOARD_URL}/stations`;

    const html = `
        <div style="font-family: sans-serif; background: #0a0f1e; color: #e2e8f0; padding: 32px; border-radius: 12px; max-width: 480px;">
            <h2 style="color: #ef4444; margin-top: 0;">⚡ VoltFlow — Alerta de Carregador</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #64748b; width: 130px;">Carregador</td><td style="font-family: monospace; color: #f1f5f9;">${chargerId}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;">Status</td><td style="color: #ef4444; font-weight: bold;">${label}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;">Ocorrência</td><td style="color: #f1f5f9;">${timestamp}</td></tr>
            </table>
            <div style="margin-top: 24px;">
                <a href="${dashboardLink}" style="background: #0ea5e9; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold;">
                    Ver no Dashboard →
                </a>
            </div>
            <p style="color: #475569; font-size: 12px; margin-top: 24px;">
                Alertas repetidos do mesmo carregador são enviados com intervalo mínimo de 10 minutos.
            </p>
        </div>
    `;

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ from: FROM_EMAIL, to: TO_EMAIL, subject, html }),
        });

        if (!res.ok) {
            const err = await res.text().catch(() => res.statusText);
            console.error(`[Alert] Resend API error for ${chargerId}: ${err}`);
        } else {
            console.log(`[Alert] ✅ Fault alert sent for ${chargerId} (${status}) → ${TO_EMAIL}`);
        }
    } catch (err) {
        console.error(`[Alert] Network error sending fault alert for ${chargerId}:`, err);
    }
}
