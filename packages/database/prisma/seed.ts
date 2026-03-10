import { PrismaClient, CPStatus, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding VoltFlow Database...');

    // Create an Organization
    const org = await prisma.organization.create({
        data: {
            name: 'VoltFlow Sandbox Operations',
            splitRate: 0.05,
        },
    });

    // Create an Admin/Owner
    await prisma.user.create({
        data: {
            externalId: 'auth_dev_001',
            email: 'admin@voltflow.io',
            name: 'Host Owner',
            role: Role.OWNER,
            organizationId: org.id,
        },
    });

    // Create a Driver
    const driver = await prisma.user.create({
        data: {
            externalId: 'demo-driver-001',
            email: 'driver@example.com',
            name: 'Demo Driver',
            role: Role.DRIVER,
        },
    });

    // Create a Station
    const station = await prisma.station.create({
        data: {
            organizationId: org.id,
            name: 'Shopping JK Iguatemi',
            address: 'São Paulo, SP',
            lat: -23.5905,
            lng: -46.6908,
        },
    });

    // Create two ChargePoints
    await prisma.chargePoint.createMany({
        data: [
            {
                stationId: station.id,
                ocppId: 'CP-SP-001',
                ocppPassword: '$2b$10$xdryYiSgVMOTlfs8F22WK.BMRfyuZI5pawb6bACGxAEallvip0nUS',
                status: CPStatus.AVAILABLE,
                pricePerKwh: 2.15,
                connectorType: 'CCS2',
                maxPowerKw: 60,
            },
            {
                stationId: station.id,
                ocppId: 'CP-SP-002',
                ocppPassword: '$2b$10$xdryYiSgVMOTlfs8F22WK.BMRfyuZI5pawb6bACGxAEallvip0nUS',
                status: CPStatus.AVAILABLE,
                pricePerKwh: 1.85,
                connectorType: 'Type 2',
                maxPowerKw: 22,
            },
        ],
    });

    console.log('Seed completed successfully! 🚀');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
