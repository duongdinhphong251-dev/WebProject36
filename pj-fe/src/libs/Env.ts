import { createEnv } from '@t3-oss/env-nextjs';
import * as z from 'zod';

export const Env = createEnv({
  server: {
    EXTERNAL_API: z.string().optional(),
    SELT_API: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string(),
    NEXT_PUBLIC_APP_NAME: z.string(),
    NEXT_PUBLIC_API_DOMAIN: z.string().default('http://localhost:3000'),
    NEXT_PUBLIC_GTM_ID: z.string().optional(),
  },
  shared: {
    NODE_ENV: z.enum(['test', 'development', 'production']).optional(),
  },
  runtimeEnv: {
    EXTERNAL_API: process.env.EXTERNAL_API,
    SELT_API: process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : process.env.NEXT_PUBLIC_APP ?? 'https://glowexplore.com/',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_API_DOMAIN: process.env.NEXT_PUBLIC_API_DOMAIN,
    NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
    NODE_ENV: process.env.NODE_ENV,
  },
});
