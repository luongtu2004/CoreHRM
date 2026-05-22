import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000'),
  NODE_ENV: z.string().default('development'),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('1d')
});

export const env = envSchema.parse(process.env);
