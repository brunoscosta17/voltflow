import WebSocket from 'ws';

const CHARGER_ID = process.argv[2] || 'SIM-001';
const BACKEND_URL = `ws://localhost:3000/ocpp/${CHARGER_ID}`;

console.log(`Starting simulator for charger ${CHARGER_ID}...`);

// Basic Auth header simulation
const ws = new WebSocket(BACKEND_URL, {
    headers: {
        Authorization: `Basic ${Buffer.from(`${CHARGER_ID}:secret_password`).toString('base64')}`
    }
});

let messageIdCounter = 1;

function sendMessage(action: string, payload: any) {
    const messageId = (messageIdCounter++).toString();
    const message = [2, messageId, action, payload];
    console.log(`[>>] Sending ${action}:`, JSON.stringify(payload));
    ws.send(JSON.stringify(message));
}

ws.on('open', () => {
    console.log('Connected to VoltFlow Backend!');

    // 1. Send Boot Notification
    sendMessage('BootNotification', {
        chargePointVendor: 'VoltFlow Simulator',
        chargePointModel: 'V1',
    });

    // 2. Send Available Status
    setTimeout(() => {
        sendMessage('StatusNotification', {
            connectorId: 1,
            errorCode: 'NoError',
            status: 'Available',
        });
    }, 2000);

    // 3. Simulate a charging session starts
    setTimeout(() => {
        sendMessage('StatusNotification', {
            connectorId: 1,
            errorCode: 'NoError',
            status: 'Charging',
        });
        console.log('--- Charging started ---');

        let kwh = 0;
        const interval = setInterval(() => {
            kwh += 0.5;
            sendMessage('MeterValues', {
                connectorId: 1,
                meterValue: [{ timestamp: new Date().toISOString(), sampledValue: [{ value: kwh.toString(), unit: 'kWh' }] }]
            });

            if (kwh >= 5) {
                clearInterval(interval);
                console.log('--- Charging finished ---');
                sendMessage('StatusNotification', {
                    connectorId: 1,
                    errorCode: 'NoError',
                    status: 'Available',
                });
            }
        }, 5000); // send meter values every 5 seconds
    }, 6000);
});

ws.on('message', (data) => {
    console.log('[<<] Received:', data.toString());
});

ws.on('error', (error) => {
    console.error('WebSocket Error:', error);
});

ws.on('close', () => {
    console.log('Disconnected from backend.');
});
