import dotenv from "dotenv";
import { z } from 'zod';
dotenv.config();



const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test'])
        .default('development'),

    PORT: z.string().default('3000'),
    DATABASE_URL: z.string({
        required_error: "DATABASE_URL zorunludur.",

    }),

    JWT_ACCESS_SECRET: z.string({
        required_error: 'JWT_ACCESS_SECRET zorunludur'
    }),

    JWT_REFRESH_SECRET: z.string({
        required_error: 'JWT_REFRESH_SECRET zorunludur'
    }),

    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    OPENAI_API_KEY: z.string().optional(),
    GOOGLE_SPEECH_API_KEY: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GEMINI_API_KEY : z.string({
        required_error : 'GEMINI API KEY zorunludur'
    }),

    FRONTEND_URL: z.string().default("http://localhost:3001"),
    
    COLLECT_API_KEY: z.string().optional(),
    COINGECKO_URL: z.string().default("https://api.coingecko.com/api/v3"),
    ALPHAVANTAGE_KEY: z.string().optional(),
    
    })


const parsed = envSchema.safeParse(process.env);


if (!parsed.success) {
    console.error("Geçersiz environment değişkenleri:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);

}


export const config = {
    env: parsed.data.NODE_ENV,
    port: parseInt(parsed.data.PORT, 10),
    db: {
        url: parsed.data.DATABASE_URL,
    },
    jwt: {
        accessSecret: parsed.data.JWT_ACCESS_SECRET,
        refreshSecret: parsed.data.JWT_REFRESH_SECRET,
        accessExpiresIn: parsed.data.JWT_ACCESS_EXPIRES_IN,
        refreshExpiresIn: parsed.data.JWT_REFRESH_EXPIRES_IN,
    },
    ai: {
        openaiKey: parsed.data.OPENAI_API_KEY,
        googleSpeechKey: parsed.data.GOOGLE_SPEECH_API_KEY,
        geminiKey : parsed.data.GEMINI_API_KEY
    },
    googleClientId: parsed.data.GOOGLE_CLIENT_ID,
    frontendUrl: parsed.data.FRONTEND_URL,
    finans: {
    collectApiKey: parsed.data.COLLECT_API_KEY,
    coinGeckoUrl: parsed.data.COINGECKO_URL,
    alphaVantageKey: parsed.data.ALPHAVANTAGE_KEY,
    },
    } as const;