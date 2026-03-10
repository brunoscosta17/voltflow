import { z } from 'zod';

const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().default('redis://localhost:6379'),
    PORT: z.coerce.number().default(3000),
    JWT_SECRET: z.string().min(32).default('CHANGE_ME_IN_PRODUCTION_AT_LEAST_32_CHARS!!'),
    VOLTFLOW_SPLIT_RATE: z.coerce.number().default(0.05), // 5% default platform fee
    PAYMENT_PROVIDER: z.enum(['stub', 'stripe', 'efi']).default('stub'),
    STRIPE_SECRET_KEY: z.string().optional(),
    EFI_CLIENT_ID: z.string().optional(),
    EFI_CLIENT_SECRET: z.string().optional(),
    TLS_KEY_PATH: z.string().optional(),
    TLS_CERT_PATH: z.string().optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Parse env once at startup – throws a clear error if anything is missing
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌  Invalid environment variables:\n', parsed.error.format());
    process.exit(1);
}

export const config = {
    db: { url: parsed.data.DATABASE_URL },
    redis: { url: parsed.data.REDIS_URL },
    server: { port: parsed.data.PORT, nodeEnv: parsed.data.NODE_ENV },
    auth: { jwtSecret: parsed.data.JWT_SECRET },
    payments: {
        voltflowSplitRate: parsed.data.VOLTFLOW_SPLIT_RATE,
        provider: parsed.data.PAYMENT_PROVIDER,
        stripe: { secretKey: parsed.data.STRIPE_SECRET_KEY },
        efi: { clientId: parsed.data.EFI_CLIENT_ID, clientSecret: parsed.data.EFI_CLIENT_SECRET }
    },
    tls: {
        keyPath: parsed.data.TLS_KEY_PATH,
        certPath: parsed.data.TLS_CERT_PATH,
    }
} as const;
